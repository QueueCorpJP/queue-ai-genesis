import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  UserCheck,
  Calendar,
  Award,
  Zap,
  Activity,
  PieChart,
  PlayCircle,
  PauseCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MemberTodoStats {
  member_id: string;
  member_name: string;
  member_email: string;
  member_role: string;
  member_department: string | null;
  total_todos: number;
  pending_todos: number;
  in_progress_todos: number;
  completed_todos: number;
  cancelled_todos: number;
  high_priority_pending: number;
  medium_priority_pending: number;
  low_priority_pending: number;
  overdue_todos: number;
  due_soon_todos: number;
  completion_rate_percentage: number;
  avg_completion_hours: number | null;
  last_todo_activity: string | null;
  todos_this_month: number;
  completed_this_month: number;
}

interface TodoWithMember {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  member_id: string;
  member_name: string;
  member_email: string;
  member_role: string;
  member_department: string | null;
  assigned_by_name: string | null;
  is_overdue: boolean;
  is_due_soon: boolean;
  days_until_due: number | null;
}

interface TodoInsights {
  total_todos: number;
  completed_todos: number;
  overdue_todos: number;
  high_priority_pending: number;
  completion_rate: number;
  avg_completion_time_hours: number;
  most_productive_member: string;
  department_with_most_overdue: string;
}

const TodoProgress: React.FC = () => {
  const { user } = useAdmin();
  const [memberStats, setMemberStats] = useState<MemberTodoStats[]>([]);
  const [allTodos, setAllTodos] = useState<TodoWithMember[]>([]);
  const [insights, setInsights] = useState<TodoInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // フィルター状態
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 役員権限チェック
  const isExecutive = user?.email === 'queue@queue-tech.jp';

  useEffect(() => {
    if (isExecutive) {
      fetchAllData();
    }
  }, [isExecutive]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMemberStats(),
        fetchAllTodos(),
        fetchInsights()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberStats = async () => {
    try {
      // membersテーブルとtodosテーブルを組み合わせて統計を計算
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true);

      if (membersError) throw membersError;

      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*');

      if (todosError) throw todosError;

      const members = membersData || [];
      const todos = todosData || [];
      const now = new Date();

      const stats = members.map(member => {
        const memberTodos = todos.filter(t => t.member_id === member.id);
        
        return {
          member_id: member.id,
          member_name: member.name,
          member_email: member.email,
          member_role: member.role,
          member_department: member.department,
          total_todos: memberTodos.length,
          pending_todos: memberTodos.filter(t => t.status === 'pending').length,
          in_progress_todos: memberTodos.filter(t => t.status === 'in_progress').length,
          completed_todos: memberTodos.filter(t => t.status === 'completed').length,
          cancelled_todos: memberTodos.filter(t => t.status === 'cancelled').length,
          high_priority_pending: memberTodos.filter(t => t.priority === 'high' && t.status !== 'completed').length,
          medium_priority_pending: memberTodos.filter(t => t.priority === 'medium' && t.status !== 'completed').length,
          low_priority_pending: memberTodos.filter(t => t.priority === 'low' && t.status !== 'completed').length,
          overdue_todos: memberTodos.filter(t => 
            t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
          ).length,
          due_soon_todos: memberTodos.filter(t => 
            t.due_date && new Date(t.due_date) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) && t.status !== 'completed'
          ).length,
          completion_rate_percentage: memberTodos.length > 0 ? 
            Math.round((memberTodos.filter(t => t.status === 'completed').length / memberTodos.length) * 100) : 0,
          avg_completion_hours: null, // 計算複雑なので一旦null
          last_todo_activity: memberTodos.length > 0 ? 
            new Date(Math.max(...memberTodos.map(t => new Date(t.updated_at).getTime()))).toISOString() : null,
          todos_this_month: memberTodos.filter(t => 
            new Date(t.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1)
          ).length,
          completed_this_month: memberTodos.filter(t => 
            t.status === 'completed' && new Date(t.updated_at) >= new Date(now.getFullYear(), now.getMonth(), 1)
          ).length
        };
      });

      setMemberStats(stats);
    } catch (error) {
      console.error('Error fetching member stats:', error);
      setMemberStats([]);
    }
  };

  const fetchAllTodos = async () => {
    try {
      // todosテーブルとmembersテーブルを結合してデータを取得
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (todosError) throw todosError;

      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*');

      if (membersError) throw membersError;

      const todos = todosData || [];
      const members = membersData || [];
      const now = new Date();

      // TodoWithMember形式に変換
      const enrichedTodos = todos.map(todo => {
        const member = members.find(m => m.id === todo.member_id);
        
        return {
          ...todo,
          member_name: member?.name || 'Unknown',
          member_email: member?.email || '',
          member_role: member?.role || 'employee',
          member_department: member?.department || null,
          assigned_by_name: null, // 一時的にnull
          is_overdue: todo.due_date ? new Date(todo.due_date) < now && todo.status !== 'completed' : false,
          is_due_soon: todo.due_date ? 
            new Date(todo.due_date) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) && 
            todo.status !== 'completed' : false,
          days_until_due: todo.due_date ? 
            Math.ceil((new Date(todo.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
        };
      });

      setAllTodos(enrichedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setAllTodos([]);
    }
  };

  const fetchInsights = async () => {
    try {
      // 一時的にファンクション呼び出しをスキップし、基本統計を手動計算
      const { data: allTodosData, error: todosError } = await supabase
        .from('todos')
        .select('*');

      if (todosError) throw todosError;

      const todos = allTodosData || [];
      const completedTodos = todos.filter(t => t.status === 'completed').length;
      const overdueTodos = todos.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      ).length;
      const highPriorityPending = todos.filter(t => 
        t.priority === 'high' && t.status !== 'completed'
      ).length;

      const completionRate = todos.length > 0 ? 
        Math.round((completedTodos / todos.length) * 100) : 0;

      // 基本的な統計情報を設定
      setInsights({
        total_todos: todos.length,
        completed_todos: completedTodos,
        overdue_todos: overdueTodos,
        high_priority_pending: highPriorityPending,
        completion_rate: completionRate,
        avg_completion_time_hours: 24, // 仮の値
        most_productive_member: '計算中...',
        department_with_most_overdue: '計算中...'
      });
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '期限なし';
    return format(new Date(dateString), 'MM/dd', { locale: ja });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">未開始</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">進行中</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">キャンセル</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
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

  const getRoleBadge = (role: string) => {
    return role === 'executive' ? (
      <Badge variant="default" className="bg-purple-100 text-purple-800">役員</Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">社員</Badge>
    );
  };

  // フィルタリング - メンバー統計
  const filteredMemberStats = memberStats.filter(member => {
    const matchesSearch = member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.member_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || member.member_department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // フィルタリング - Todo一覧
  const filteredTodos = allTodos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (todo.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.member_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMember = memberFilter === 'all' || todo.member_id === memberFilter;
    const matchesDepartment = departmentFilter === 'all' || todo.member_department === departmentFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'overdue' && todo.is_overdue && todo.status !== 'completed') ||
                         (statusFilter !== 'overdue' && todo.status === statusFilter);
    
    const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    return matchesSearch && matchesMember && matchesDepartment && matchesStatus && matchesPriority;
  });

  // ユニークな部署一覧
  const departments = Array.from(new Set(
    memberStats.map(m => m.member_department).filter(Boolean)
  )).sort();

  if (!isExecutive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            アクセス権限エラー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            この機能は役員アカウントでのみご利用いただけます。
          </p>
        </CardContent>
      </Card>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todo進捗管理</h1>
          <p className="text-gray-600">全メンバーのTodo進捗状況を管理</p>
        </div>
        <Button onClick={fetchAllData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          更新
        </Button>
      </div>

      {/* 統計カード */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総Todo数</p>
                  <div className="text-2xl font-bold">{insights.total_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">完了率</p>
                  <div className="text-2xl font-bold">{insights.completion_rate}%</div>
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
                  <div className="text-2xl font-bold">{insights.overdue_todos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均完了時間</p>
                  <div className="text-2xl font-bold">{insights.avg_completion_time_hours.toFixed(1)}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>概要</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>メンバー別</span>
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Todo一覧</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    パフォーマンス指標
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">最も生産的なメンバー</span>
                    <span className="text-sm text-blue-600 font-medium">{insights.most_productive_member}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">遅れが目立つ部署</span>
                    <span className="text-sm text-red-600 font-medium">{insights.department_with_most_overdue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">高優先度の未完了</span>
                    <span className="text-sm text-orange-600 font-medium">{insights.high_priority_pending}件</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    全体統計
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">総Todo数</span>
                    <span className="text-sm font-bold">{insights.total_todos}件</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">完了数</span>
                    <span className="text-sm text-green-600 font-medium">{insights.completed_todos}件</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">平均完了時間</span>
                    <span className="text-sm text-purple-600 font-medium">{insights.avg_completion_time_hours.toFixed(1)}時間</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="メンバー名やメールで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="部署" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての部署</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* メンバー統計テーブル */}
          <Card>
            <CardHeader>
              <CardTitle>メンバー別進捗状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>メンバー</TableHead>
                      <TableHead>部署</TableHead>
                      <TableHead>総Todo数</TableHead>
                      <TableHead>完了率</TableHead>
                      <TableHead>期限切れ</TableHead>
                      <TableHead>今月の完了</TableHead>
                      <TableHead>最終活動</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMemberStats.map((member) => (
                      <TableRow key={member.member_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.member_name}</div>
                            <div className="text-sm text-gray-500">{member.member_email}</div>
                            <div className="mt-1">{getRoleBadge(member.member_role)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.member_department || '-'}</TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-bold">{member.total_todos}</div>
                            <div className="text-xs text-gray-500">
                              進行中: {member.in_progress_todos}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className={`font-medium ${member.completion_rate_percentage >= 80 ? 'text-green-600' : 
                                                          member.completion_rate_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {member.completion_rate_percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.completed_todos}/{member.total_todos}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {member.overdue_todos > 0 ? (
                              <Badge variant="destructive" className="bg-red-100 text-red-800">
                                {member.overdue_todos}件
                              </Badge>
                            ) : (
                              <span className="text-gray-500">なし</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{member.completed_this_month}</div>
                            <div className="text-xs text-gray-500">
                              作成: {member.todos_this_month}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {member.last_todo_activity ? 
                              format(new Date(member.last_todo_activity), 'MM/dd HH:mm', { locale: ja }) : 
                              '活動なし'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos" className="space-y-6">
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Todo、メンバー名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="メンバー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのメンバー</SelectItem>
                {memberStats.map(member => (
                  <SelectItem key={member.member_id} value={member.member_id}>
                    {member.member_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのステータス</SelectItem>
                <SelectItem value="pending">未開始</SelectItem>
                <SelectItem value="in_progress">進行中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="overdue">期限切れ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての優先度</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Todo一覧テーブル */}
          <Card>
            <CardHeader>
              <CardTitle>Todo一覧</CardTitle>
              <CardDescription>
                全メンバーのTodo状況（{filteredTodos.length}件表示）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Todo</TableHead>
                      <TableHead>メンバー</TableHead>
                      <TableHead>優先度</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>期限</TableHead>
                      <TableHead>作成日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTodos.map((todo) => (
                      <TableRow key={todo.id} className={todo.is_overdue && todo.status !== 'completed' ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{todo.title}</div>
                            {todo.description && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                {todo.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{todo.member_name}</div>
                            <div className="text-sm text-gray-500">{todo.member_department}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(todo.priority)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(todo.status)}
                            {todo.is_overdue && todo.status !== 'completed' && (
                              <div className="text-xs text-red-600">期限切れ</div>
                            )}
                          </div>
                        </TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredTodos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  条件に一致するTodoが見つかりません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TodoProgress; 