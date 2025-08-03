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
  member_name?: string;
  member_email?: string;
  member_role?: string;
  member_department?: string;
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
  due_time: string; // 時間入力用
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
    due_date: undefined,
    due_time: ''
  });
  
  // フィルター状態
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 今日やることリスト用の状態
  const [todayTasks, setTodayTasks] = useState<Todo[]>([]);

  // 現在のユーザーのメンバーIDを取得
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isExecutive, setIsExecutive] = useState(false);
  
  // 役員用の追加状態
  const [allMembers, setAllMembers] = useState<{id: string, name: string, email: string}[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');

  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (currentMemberId) {
      fetchTodos();
      fetchStats();
      if (isExecutive) {
        fetchAllMembers();
      }
    }
  }, [currentMemberId, selectedMemberId, viewMode]);

  useEffect(() => {
    if (isExecutive && viewMode === 'all') {
      setSelectedMemberId(null);
    } else if (isExecutive && viewMode === 'personal') {
      setSelectedMemberId(currentMemberId);
    } else if (!isExecutive) {
      // 一般メンバーは常に自分のIDを設定
      setSelectedMemberId(currentMemberId);
    }
  }, [viewMode, currentMemberId, isExecutive]);

  // 全メンバーを取得（役員用）
  const fetchAllMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const members = data || [];
      setAllMembers(members);
      
      // 初期選択：役員の場合は自分を選択
      if (isExecutive && currentMemberId && viewMode === 'personal') {
        const currentMember = members.find(m => m.id === currentMemberId);
        if (currentMember && !selectedMemberId) {
          setSelectedMemberId(currentMemberId);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('メンバー一覧の取得に失敗しました');
    }
  };

  // メールアドレスからメンバーIDを取得
  const fetchMemberId = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, role')
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
              .select('id, role')
              .eq('email', 'queue@queue-tech.jp')
              .single();
            
            if (adminMember && !adminError) {
              setCurrentMemberId(adminMember.id);
              setIsExecutive(true); // 管理者は常に役員扱い
              setSelectedMemberId(adminMember.id); // 初期選択を設定
              console.log('Using admin member ID:', adminMember.id, 'IsExecutive: true');
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
        const isExec = data.role === 'executive' || user.email === 'queue@queue-tech.jp';
        setIsExecutive(isExec);
        console.log('Member ID found:', data.id, 'Role:', data.role, 'IsExecutive:', isExec);
        
        // 初期選択を設定
        if (isExec) {
          setSelectedMemberId(data.id); // 役員は最初に自分を選択
        } else {
          setSelectedMemberId(data.id); // 一般メンバーも自分を選択
        }
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
    
    console.log('fetchTodos called:', { currentMemberId, isExecutive, viewMode, selectedMemberId });
    
    try {
      // 常にadmin clientを使用してRLS制限を回避（一時的な措置）
      const client = getSupabaseAdmin();
      
      let todosQuery = client
        .from('todos')
        .select('*');

      // 役員の場合の条件分岐
      if (isExecutive && viewMode === 'all') {
        console.log('Fetching all member todos (executive mode)');
        // 全メンバーのTodoを取得
        todosQuery = todosQuery.order('created_at', { ascending: false });
      } else if (selectedMemberId) {
        console.log('Fetching specific member todos:', selectedMemberId);
        // 特定のメンバーのTodoを取得
        todosQuery = todosQuery.eq('member_id', selectedMemberId).order('created_at', { ascending: false });
      } else {
        console.log('Fetching personal todos:', currentMemberId);
        // 通常のメンバーは自分のTodoのみ
        todosQuery = todosQuery.eq('member_id', currentMemberId).order('created_at', { ascending: false });
      }

      const { data: todosData, error: todosError } = await todosQuery;
      
      console.log('📝 Todo Query Details:', {
        isExecutive,
        viewMode,
        selectedMemberId,
        currentMemberId,
        query: todosQuery,
        error: todosError,
        dataLength: todosData?.length || 0
      });
      
      if (todosError) {
        console.error('📝 Todo Query Error:', todosError);
        throw todosError;
      }

      console.log('📝 Raw Todos Data:', todosData);
      console.log('Todos fetched:', todosData?.length || 0, 'todos');

      // メンバー情報を取得（役員または全体表示の場合）
      let membersData = [];
      if (isExecutive && (viewMode === 'all' || selectedMemberId !== currentMemberId)) {
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('id, name, email, role, department')
          .eq('is_active', true);
        
        if (membersError) {
          console.warn('Error fetching members:', membersError);
        } else {
          membersData = members || [];
        }
      }

      // データを適切な形式に変換（メンバー情報を結合）
      const formattedTodos = (todosData || []).map(todo => {
        const member = membersData.find(m => m.id === todo.member_id);
        
        return {
          ...todo,
          member_name: member?.name || undefined,
          member_email: member?.email || undefined,
          member_role: member?.role || undefined,
          member_department: member?.department || undefined,
          is_overdue: todo.due_date ? new Date(todo.due_date) < new Date() && todo.status !== 'completed' : false,
          is_due_soon: todo.due_date ? 
            new Date(todo.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && 
            todo.status !== 'completed' : false,
          days_until_due: todo.due_date ? 
            Math.ceil((new Date(todo.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
        };
      });
      
      setTodos(formattedTodos);
      
      // 今日やることリストも更新
      updateTodayTasks(formattedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Todoの取得に失敗しました');
      setTodos([]); // エラー時は空配列を設定
      setTodayTasks([]);
    }
  };

  // 今日やることリストを更新する関数
  const updateTodayTasks = (allTodos: Todo[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 未完了のタスクのみを対象とする
    const incompleteTasks = allTodos.filter(todo => 
      todo.status !== 'completed' && todo.status !== 'cancelled'
    );
    
    // 期限でソート（期限なしは最後）
    const sortedTasks = incompleteTasks.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // 上位5件を今日やることとして設定
    setTodayTasks(sortedTasks.slice(0, 5));
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
      due_date: undefined,
      due_time: ''
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
          due_date: formData.due_date && formData.due_time ? 
            new Date(`${format(formData.due_date, 'yyyy-MM-dd')}T${formData.due_time}:00`).toISOString() :
            formData.due_date ? formData.due_date.toISOString() : null
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
          due_date: formData.due_date && formData.due_time ? 
            new Date(`${format(formData.due_date, 'yyyy-MM-dd')}T${formData.due_time}:00`).toISOString() :
            formData.due_date ? formData.due_date.toISOString() : null
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
    const dueDate = todo.due_date ? new Date(todo.due_date) : undefined;
    const dueTime = dueDate ? format(dueDate, 'HH:mm') : '';
    
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: dueDate,
      due_time: dueTime
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '期限なし';
    
    try {
      const date = new Date(dateString);
      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
      
      if (hasTime) {
        return format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja });
      } else {
        return format(date, 'yyyy年MM月dd日', { locale: ja });
      }
    } catch (error) {
      return '無効な日付';
    }
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
                {isExecutive ? (
                  viewMode === 'all' ? '全メンバーのタスクを管理します' : 
                  selectedMemberId === currentMemberId ? 'あなたのタスクを管理します' : 
                  selectedMemberId ? '選択されたメンバーのタスクを管理します' : 'メンバーを選択してください'
                ) : 'あなたのタスクを管理します'}
              </CardDescription>
              
              {/* 役員用のコントロール */}
              {isExecutive && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label>表示モード:</Label>
                      <Select 
                        value={viewMode} 
                        onValueChange={(value: 'personal' | 'all') => setViewMode(value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">個人</SelectItem>
                          <SelectItem value="all">全体</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {viewMode === 'personal' && (
                      <div className="flex items-center space-x-2">
                        <Label>メンバー:</Label>
                        <Select 
                          value={selectedMemberId || ''} 
                          onValueChange={setSelectedMemberId}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="メンバーを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {allMembers.map(member => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name} ({member.email})
                                {member.id === currentMemberId && ' [自分]'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    
                    {/* 時間入力フィールド */}
                    {formData.due_date && (
                      <div className="space-y-2">
                        <Label htmlFor="due_time">期限時刻</Label>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <Input
                            id="due_time"
                            type="time"
                            value={formData.due_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
                            className="w-32"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setFormData(prev => ({ ...prev, due_time: '' }))}
                          >
                            時刻クリア
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {formData.due_date && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData(prev => ({ ...prev, due_date: undefined, due_time: '' }))}
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
          {/* 今日やることセクション */}
          {todayTasks.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">今日やること</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  期限順
                </Badge>
              </div>
              <div className="grid gap-3">
                {todayTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      index === 0 ? 'border-l-red-500 bg-red-50' :
                      index === 1 ? 'border-l-orange-500 bg-orange-50' :
                      index === 2 ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            index === 0 ? 'bg-red-600 text-white' :
                            index === 1 ? 'bg-orange-600 text-white' :
                            index === 2 ? 'bg-yellow-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            #{index + 1}
                          </span>
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task)}
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                          {task.days_until_due !== null && (
                            <div className={`flex items-center space-x-1 ${
                              task.is_overdue ? 'text-red-600' : 
                              task.is_due_soon ? 'text-orange-600' : 
                              'text-gray-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {task.is_overdue ? `${Math.abs(task.days_until_due)}日遅れ` :
                                 task.days_until_due === 0 ? '今日が期限' :
                                 `あと${task.days_until_due}日`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {task.status !== 'completed' && (
                          <Select 
                            value={task.status} 
                            onValueChange={(value) => handleStatusChange(task, value as Todo['status'])}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(task.status)}
                                <span className="sr-only">{getStatusLabel(task.status)}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">未開始</SelectItem>
                              <SelectItem value="in_progress">進行中</SelectItem>
                              <SelectItem value="completed">完了</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 期限が近い順に表示されています。完了したタスクは自動的にリストから除外されます。
                </p>
              </div>
            </div>
          )}

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

          {/* 全てのTodoテーブル */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">全てのTodo</h3>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  {isExecutive && viewMode === 'all' && <TableHead>メンバー</TableHead>}
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
                    {isExecutive && viewMode === 'all' && (
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{todo.member_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{todo.member_email || ''}</div>
                        </div>
                      </TableCell>
                    )}
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