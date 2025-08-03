import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Clock, 
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Filter,
  Search,
  Target,
  TrendingUp,
  ListTodo
} from 'lucide-react';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  member_id: string;
  assigned_by_name?: string;
  is_overdue: boolean;
  is_due_soon: boolean;
  days_until_due: number | null;
}

interface TodoStats {
  total_todos: number;
  pending_todos: number;
  in_progress_todos: number;
  completed_todos: number;
  overdue_todos: number;
  completion_rate_percentage: number;
}

interface CreateTodoForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date: Date | undefined;
}

const TodoManager: React.FC = () => {
  const { user, session } = useAdmin();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formData, setFormData] = useState<CreateTodoForm>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: undefined
  });
  
  // フィルター状態
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 現在のユーザーのメンバーIDを取得
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isExecutive, setIsExecutive] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (currentMemberId) {
      fetchTodos();
      fetchStats();
    }
  }, [currentMemberId]);

  // メールアドレスからメンバーIDを取得
  const fetchMemberId = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching member ID:', error);
        
        // エラー時：開発環境での queue@queue-tech.jp の場合、初期役員アカウントのIDを取得を試行
        if (user.email === 'queue@queue-tech.jp') {
          try {
            const { data: adminMember, error: adminError } = await getSupabaseAdmin()
              .from('members')
              .select('id')
              .eq('email', 'queue@queue-tech.jp')
              .single();
            
            if (adminMember && !adminError) {
              setCurrentMemberId(adminMember.id);
              console.log('Using admin member ID:', adminMember.id);
              return;
            }
          } catch (adminErr) {
            console.error('Error fetching admin member:', adminErr);
          }
        }
        
        toast.error('メンバー情報の取得に失敗しました');
        return;
      }

      if (data) {
        setCurrentMemberId(data.id);
        console.log('Member ID found:', data.id);
      } else {
        toast.error('有効なメンバーアカウントが見つかりません');
      }
    } catch (error) {
      console.error('Error fetching member ID:', error);
      toast.error('メンバー情報の取得に失敗しました');
    }
  };

  // ログインしていない場合のフォールバック
  if (!user || !session) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-gray-600">ログインが必要です</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fetchTodos = async () => {
    if (!currentMemberId) return;
    
    try {
      // todosテーブルから現在のメンバーのデータを取得（admin client使用）
      const { data, error } = await getSupabaseAdmin()
        .from('todos')
        .select('*')
        .eq('member_id', currentMemberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // データを適切な形式に変換
      const formattedTodos = (data || []).map(todo => ({
        ...todo,
        is_overdue: todo.due_date ? new Date(todo.due_date) < new Date() && todo.status !== 'completed' : false,
        is_due_soon: todo.due_date ? 
          new Date(todo.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && 
          todo.status !== 'completed' : false,
        days_until_due: todo.due_date ? 
          Math.ceil((new Date(todo.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
      }));
      
      setTodos(formattedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Todoの取得に失敗しました');
      setTodos([]); // エラー時は空配列を設定
    }
  };

  const fetchStats = async () => {
    if (!currentMemberId) return;
    
    try {
      // 直接todosテーブルから統計を計算（admin client使用）
      const { data, error } = await getSupabaseAdmin()
        .from('todos')
        .select('*')
        .eq('member_id', currentMemberId);

      if (error) throw error;
      
      const todos = data || [];
      const now = new Date();
      
      const stats = {
        total_todos: todos.length,
        pending_todos: todos.filter(t => t.status === 'pending').length,
        in_progress_todos: todos.filter(t => t.status === 'in_progress').length,
        completed_todos: todos.filter(t => t.status === 'completed').length,
        overdue_todos: todos.filter(t => 
          t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
        ).length,
        completion_rate_percentage: todos.length > 0 ? 
          Math.round((todos.filter(t => t.status === 'completed').length / todos.length) * 100) : 0
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // エラー時はデフォルト統計を設定
      setStats({
        total_todos: 0,
        pending_todos: 0,
        in_progress_todos: 0,
        completed_todos: 0,
        overdue_todos: 0,
        completion_rate_percentage: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: undefined
    });
    setEditingTodo(null);
  };

  const handleCreateTodo = async () => {
    if (!currentMemberId || !formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    try {
      const { error } = await getSupabaseAdmin()
        .from('todos')
        .insert({
          member_id: currentMemberId,
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          due_date: formData.due_date ? formData.due_date.toISOString() : null
        });

      if (error) throw error;

      toast.success('Todoを作成しました');
      setCreateDialogOpen(false);
      resetForm();
      await Promise.all([fetchTodos(), fetchStats()]);
    } catch (error) {
      console.error('Error creating todo:', error);
      toast.error('Todoの作成に失敗しました');
    }
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    try {
      const { error } = await getSupabaseAdmin()
        .from('todos')
        .update({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          due_date: formData.due_date ? formData.due_date.toISOString() : null
        })
        .eq('id', editingTodo.id);

      if (error) throw error;

      toast.success('Todoを更新しました');
      setEditingTodo(null);
      resetForm();
      await Promise.all([fetchTodos(), fetchStats()]);
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Todoの更新に失敗しました');
    }
  };

  const handleStatusChange = async (todo: Todo, newStatus: Todo['status']) => {
    try {
      // ステータス更新（admin client使用）
      const { error: updateError } = await getSupabaseAdmin()
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todo.id);

      if (updateError) throw updateError;

      // 進捗ログ記録（admin client使用）
      const { error: logError } = await getSupabaseAdmin()
        .from('todo_progress_logs')
        .insert({
          todo_id: todo.id,
          previous_status: todo.status,
          new_status: newStatus,
          changed_by: currentMemberId
        });

      if (logError) console.warn('Progress log error:', logError);

      toast.success(`Todoのステータスを「${getStatusLabel(newStatus)}」に更新しました`);
      await Promise.all([fetchTodos(), fetchStats()]);
    } catch (error) {
      console.error('Error updating todo status:', error);
      toast.error('ステータスの更新に失敗しました');
    }
  };

  const handleDeleteTodo = async (todo: Todo) => {
    try {
      const { error } = await getSupabaseAdmin()
        .from('todos')
        .delete()
        .eq('id', todo.id);

      if (error) throw error;

      toast.success('Todoを削除しました');
      await Promise.all([fetchTodos(), fetchStats()]);
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Todoの削除に失敗しました');
    }
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date ? new Date(todo.due_date) : undefined
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '期限なし';
    return format(new Date(dateString), 'yyyy年MM月dd日', { locale: ja });
  };

  const getStatusLabel = (status: Todo['status']) => {
    const labels = {
      pending: '未開始',
      in_progress: '進行中',
      completed: '完了',
      cancelled: 'キャンセル'
    };
    return labels[status];
  };

  const getStatusBadge = (todo: Todo) => {
    if (todo.is_overdue && todo.status !== 'completed') {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">期限切れ</Badge>;
    }
    
    switch (todo.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">未開始</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">進行中</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">キャンセル</Badge>;
      default:
        return <Badge variant="outline">{todo.status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">高</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">中</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">低</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: Todo['status']) => {
    switch (status) {
      case 'pending':
        return <PauseCircle className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // フィルタリング
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (todo.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'overdue' && todo.is_overdue && todo.status !== 'completed') ||
                         (statusFilter !== 'overdue' && todo.status === statusFilter);
    
    const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <ListTodo className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総Todo数</p>
                  <div className="text-2xl font-bold">{stats.total_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <PauseCircle className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">未開始</p>
                  <div className="text-2xl font-bold">{stats.pending_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <PlayCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">進行中</p>
                  <div className="text-2xl font-bold">{stats.in_progress_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">完了</p>
                  <div className="text-2xl font-bold">{stats.completed_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">期限切れ</p>
                  <div className="text-2xl font-bold">{stats.overdue_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Todo管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Todo管理
              </CardTitle>
              <CardDescription>
                あなたのタスクを管理します
              </CardDescription>
            </div>
            
            <Dialog open={createDialogOpen || !!editingTodo} onOpenChange={(open) => {
              if (!open) {
                setCreateDialogOpen(false);
                setEditingTodo(null);
                resetForm();
              } else if (!editingTodo) {
                setCreateDialogOpen(true);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Todo作成
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTodo ? 'Todoを編集' : '新しいTodoを作成'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTodo ? 'Todoの内容を更新します' : '新しいタスクを追加します'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="タスクのタイトルを入力"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="タスクの詳細説明（オプション）"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">優先度</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>期限日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.due_date ? format(formData.due_date, 'yyyy年MM月dd日', { locale: ja }) : '期限を選択'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.due_date}
                          onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formData.due_date && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData(prev => ({ ...prev, due_date: undefined }))}
                      >
                        期限をクリア
                      </Button>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setCreateDialogOpen(false);
                    setEditingTodo(null);
                    resetForm();
                  }}>
                    キャンセル
                  </Button>
                  <Button onClick={editingTodo ? handleUpdateTodo : handleCreateTodo}>
                    {editingTodo ? '更新' : '作成'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="タイトルや説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのステータス</SelectItem>
                <SelectItem value="pending">未開始</SelectItem>
                <SelectItem value="in_progress">進行中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="overdue">期限切れ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての優先度</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Todoテーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>優先度</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>期限</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodos.map((todo) => (
                  <TableRow key={todo.id} className={todo.is_overdue && todo.status !== 'completed' ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{todo.title}</div>
                        {todo.description && (
                          <div className="text-sm text-gray-500 mt-1">{todo.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(todo.priority)}</TableCell>
                    <TableCell>{getStatusBadge(todo)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(todo.due_date)}</div>
                        {todo.days_until_due !== null && todo.status !== 'completed' && (
                          <div className={`text-xs ${todo.is_overdue ? 'text-red-600' : todo.is_due_soon ? 'text-yellow-600' : 'text-gray-500'}`}>
                            {todo.is_overdue ? `${Math.abs(todo.days_until_due)}日遅れ` : 
                             todo.is_due_soon ? `あと${todo.days_until_due}日` : 
                             `あと${todo.days_until_due}日`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(todo.created_at), 'MM/dd', { locale: ja })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* ステータス変更ボタン */}
                        {todo.status !== 'completed' && (
                          <Select value={todo.status} onValueChange={(value) => handleStatusChange(todo, value as Todo['status'])}>
                            <SelectTrigger className="w-[100px] h-8">
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(todo.status)}
                                <span className="sr-only">{getStatusLabel(todo.status)}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">未開始</SelectItem>
                              <SelectItem value="in_progress">進行中</SelectItem>
                              <SelectItem value="completed">完了</SelectItem>
                              <SelectItem value="cancelled">キャンセル</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(todo)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Todoを削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{todo.title}」を削除します。この操作は取り消すことができません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTodo(todo)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTodos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? '条件に一致するTodoが見つかりません' 
                : 'Todoがありません。新しいタスクを作成してください。'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TodoManager; 