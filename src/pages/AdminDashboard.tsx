import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Settings, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Newspaper,
  BarChart3,
  RefreshCw,
  LogOut,
  Menu,
  X,
  MousePointer,
  Users,
  ChevronDown,
  TrendingUp,
  UserCheck,
  Target,
  ClipboardList,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  CalendarDays,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, useNavigate } from 'react-router-dom';
import ConsultationManager from '@/components/ConsultationManager';
import ContactManager from '@/components/ContactManager';
import NewsManager from '@/components/NewsManager';
import Analytics from '@/components/Analytics';
import ChatbotManager from '@/components/ChatbotManager';
import CTAAnalytics from '@/components/CTAAnalytics';
import ReadingTimeAnalytics from '@/components/ReadingTimeAnalytics';
import MemberManager from '@/components/MemberManager';
import TodoManager from '@/components/TodoManager';
import TodoProgress from '@/components/TodoProgress';
import AttendanceManager from '@/components/AttendanceManager';
import PayrollManager from '@/components/PayrollManager';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardStats {
  todayContacts: number;
  todayConsultations: number;
  pendingConsultations: number;
  pendingContacts: number;
  monthlyContacts: number;
  monthlyConsultations: number;
  publishedNews: number;
}

interface RecentActivity {
  id: string;
  type: 'consultation' | 'contact' | 'news';
  title: string;
  description: string;
  time: string;
  status: string;
}

interface TodayTodo {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  created_at: string;
  is_overdue: boolean;
  is_due_soon: boolean;
}

const AdminDashboard: React.FC = () => {
  const { user, session, logout, isLoading } = useAdmin();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayContacts: 0,
    todayConsultations: 0,
    pendingConsultations: 0,
    pendingContacts: 0,
    monthlyContacts: 0,
    monthlyConsultations: 0,
    publishedNews: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 今日やることTodo関連の状態
  const [todayTodos, setTodayTodos] = useState<TodayTodo[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [todosLoading, setTodosLoading] = useState(true);

  // 認証チェック（自動ログイン対応）
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user?.isAuthenticated) {
      navigate('/admin');
      return;
    }

    loadDashboardData();
  }, [user?.isAuthenticated, isLoading, navigate]);

  // メンバーID取得
  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  // 今日のTodo取得
  useEffect(() => {
    if (currentMemberId) {
      fetchTodayTodos();
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
            const { data: adminMember, error: adminError } = await supabase
              .from('members')
              .select('id')
              .eq('email', 'queue@queue-tech.jp')
              .single();
            
            if (adminMember && !adminError) {
              setCurrentMemberId(adminMember.id);
              return;
            }
          } catch (adminErr) {
            console.error('Error fetching admin member:', adminErr);
          }
        }
        return;
      }

      if (data) {
        setCurrentMemberId(data.id);
      }
    } catch (error) {
      console.error('Error fetching member ID:', error);
    }
  };

  // 今日やることTodoを取得
  const fetchTodayTodos = async () => {
    if (!currentMemberId) return;
    
    setTodosLoading(true);
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // 今日の終わりまで
      const todayString = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('member_id', currentMemberId)
        .in('status', ['pending', 'in_progress'])
        .or(`due_date.lte.${todayString},due_date.is.null`)
        .order('due_date', { ascending: true, nullsLast: true });

      if (error) throw error;
      
      // データを適切な形式に変換し、今日やるべきTodoのみをフィルタリング
      const now = new Date();
      const formattedTodos = (data || []).map(todo => ({
        ...todo,
        is_overdue: todo.due_date ? new Date(todo.due_date) < now && todo.status !== 'completed' : false,
        is_due_soon: todo.due_date ? 
          new Date(todo.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && 
          todo.status !== 'completed' : false
      }))
      // 期限が今日以前か、期限なしで重要度が高いもの、または進行中のものを表示
      .filter(todo => {
        if (todo.due_date) {
          return new Date(todo.due_date) <= today;
        }
        // 期限なしの場合は、高優先度か進行中のもののみ表示
        return todo.priority === 'high' || todo.status === 'in_progress';
      })
      .slice(0, 5); // 最大5件まで
      
      setTodayTodos(formattedTodos);
    } catch (error) {
      console.error('Error fetching today todos:', error);
      setTodayTodos([]);
    } finally {
      setTodosLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 今日の件数
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const monthStart = thisMonth.toISOString();

      // 今日の件数
      const [
        { count: todayContacts },
        { count: todayConsultations },
        { count: pendingConsultations },
        { count: pendingContacts },
        { count: monthlyContacts },
        { count: monthlyConsultations },
        { count: publishedNews }
      ] = await Promise.all([
        supabase.from('contact_requests').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('consultation_requests').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('consultation_requests').select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('contact_requests').select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('contact_requests').select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        supabase.from('consultation_requests').select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        supabase.from('news_articles').select('*', { count: 'exact', head: true })
          .eq('status', 'published')
      ]);

      const newStats = {
        todayContacts: todayContacts || 0,
        todayConsultations: todayConsultations || 0,
        pendingConsultations: pendingConsultations || 0,
        pendingContacts: pendingContacts || 0,
        monthlyContacts: monthlyContacts || 0,
        monthlyConsultations: monthlyConsultations || 0,
        publishedNews: publishedNews || 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('統計データの取得に失敗しました');
      // エラー時もデフォルト値を設定
      setStats({
        todayContacts: 0,
        todayConsultations: 0,
        pendingConsultations: 0,
        pendingContacts: 0,
        monthlyContacts: 0,
        monthlyConsultations: 0,
        publishedNews: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities: RecentActivity[] = [];

      // 最新の相談申込を取得
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // 最新のお問い合わせを取得
      const { data: contacts, error: contactsError } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // 最新のブログ記事を取得
      const { data: news, error: newsError } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // エラーチェック
      if (consultationsError) {
        console.error('Error fetching consultations:', consultationsError);
      }
      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
      }
      if (newsError) {
        console.error('Error fetching news:', newsError);
      }

      // 相談申込をアクティビティに変換
      consultations?.forEach(item => {
        activities.push({
          id: `consultation-${item.id}`,
          type: 'consultation',
          title: `${item.name}様からの相談申込`,
          description: `${item.service} - ${item.company}`,
          time: item.created_at,
          status: item.status
        });
      });

      // お問い合わせをアクティビティに変換
      contacts?.forEach(item => {
        activities.push({
          id: `contact-${item.id}`,
          type: 'contact',
          title: `${item.name}様からのお問い合わせ`,
          description: `${item.company}`,
          time: item.created_at,
          status: item.status
        });
      });

      // ブログ記事をアクティビティに変換
      news?.forEach(item => {
        activities.push({
          id: `news-${item.id}`,
          type: 'news',
          title: `記事「${item.title}」`,
          description: item.status === 'published' ? '公開済み' : '下書き',
          time: item.created_at,
          status: item.status
        });
      });

      // 時間順でソート
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      toast.error('アクティビティの取得に失敗しました');
      setActivities([]);
    }
  };

  const loadDashboardData = async () => {
    if (!user?.isAuthenticated) {
      return;
    }

    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // データリフレッシュ
  const refreshData = useCallback(async () => {
    if (!user?.isAuthenticated) return;
    
    setRefreshing(true);
    try {
      const promises = [
        fetchStats(),
        fetchRecentActivities()
      ];
      
      // 今日のTodoも更新（メンバーIDが存在する場合）
      if (currentMemberId) {
        promises.push(fetchTodayTodos());
      }
      
      await Promise.all(promises);
      toast.success('データを更新しました');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('データの更新に失敗しました');
    } finally {
      setRefreshing(false);
    }
  }, [user?.isAuthenticated, currentMemberId]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('ログアウトしました');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('ログアウトに失敗しました');
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}分前`;
    } else if (hours < 24) {
      return `${hours}時間前`;
    } else if (days < 30) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">未対応</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">対応中</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">完了</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">キャンセル</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-green-100 text-green-800">公開</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">下書き</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'contact':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const statsCards = [
    {
      title: "今日の新規お問い合わせ",
      value: stats.todayContacts,
      icon: Phone,
      color: "text-green-600"
    },
    {
      title: "今日の新規相談申込",
      value: stats.todayConsultations,
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: "未対応の相談申込",
      value: stats.pendingConsultations,
      icon: AlertCircle,
      color: "text-yellow-600"
    },
    {
      title: "未対応のお問い合わせ",
      value: stats.pendingContacts,
      icon: AlertCircle,
      color: "text-yellow-600"
    },
    {
      title: "今月のお問い合わせ",
      value: stats.monthlyContacts,
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "今月の相談申込",
      value: stats.monthlyConsultations,
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "公開済みブログ記事",
      value: stats.publishedNews,
      icon: Newspaper,
      color: "text-purple-600"
    }
  ];

  // ローディング中またはログイン状態確認中（自動ログイン対応）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-navy-800 mb-4">管理者ダッシュボード</h1>
          <p className="text-gray-600">自動ログイン処理中...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="text-gray-600 text-sm md:text-base">Queue株式会社 - 管理システム</p>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                onClick={refreshData} 
                disabled={refreshing}
                variant="outline"
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                更新
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">{user.email}</span>
                  {session && (
                    <span className="text-xs text-green-600">セッション有効</span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">{user.email}</span>
                  {session && (
                    <span className="text-xs text-green-600">セッション有効</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={refreshData} 
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          {/* Desktop Tabs */}
          <div className="hidden md:block">
            <div className="bg-white border border-gray-200 rounded-lg p-1">
              <div className="flex space-x-1 items-center overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 flex-shrink-0">
                  <TabsTrigger 
                    value="overview" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    <Home className="w-4 h-4" />
                    <span>概要</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="todos" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    <Target className="w-4 h-4" />
                    <span>Todo</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="attendance" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>勤怠</span>
                  </TabsTrigger>
                  {user?.email === 'queue@queue-tech.jp' && (
                    <TabsTrigger 
                      value="payroll" 
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>人件費</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger 
                    value="news" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>ブログ</span>
                  </TabsTrigger>
                  {user?.email === 'queue@queue-tech.jp' && (
                    <TabsTrigger 
                      value="members" 
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                    >
                      <Users className="w-4 h-4" />
                      <span>メンバー</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger 
                    value="settings" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>設定</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Analytics Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={activeTab.includes('analytics') ? 'default' : 'ghost'} 
                      className="flex items-center space-x-2 px-3 py-2 h-auto text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>分析</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setActiveTab('analytics')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      基本分析
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('cta-analytics')}>
                      <MousePointer className="w-4 h-4 mr-2" />
                      CTA分析
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('reading-analytics')}>
                      <Clock className="w-4 h-4 mr-2" />
                      閲覧時間分析
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Management Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={['consultations', 'contacts', 'chatbot', 'todo-progress'].includes(activeTab) ? 'default' : 'ghost'} 
                      className="flex items-center space-x-2 px-3 py-2 h-auto text-sm font-medium whitespace-nowrap flex-shrink-0"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>顧客管理</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setActiveTab('consultations')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      相談申込
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('contacts')}>
                      <Phone className="w-4 h-4 mr-2" />
                      お問い合わせ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('chatbot')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      チャットボット
                    </DropdownMenuItem>
                    {user?.email === 'queue@queue-tech.jp' && (
                      <DropdownMenuItem onClick={() => setActiveTab('todo-progress')}>
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Todo進捗
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile Tab Selector */}
          <div className="md:hidden">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="flex items-center space-x-2">
                {getTabIcon(activeTab)}
                <span>{getTabLabel(activeTab)}</span>
              </span>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            
            {mobileMenuOpen && (
              <div className="mt-2 bg-white rounded-lg shadow-lg border overflow-hidden">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 ${
                    activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>概要</span>
                </button>
                
                {/* Analytics Submenu */}
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">分析・レポート</div>
                  {[
                    { value: 'analytics', icon: BarChart3, label: '基本分析' },
                    { value: 'cta-analytics', icon: MousePointer, label: 'CTA分析' },
                    { value: 'reading-analytics', icon: Clock, label: '閲覧時間分析' }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-6 py-3 text-left hover:bg-gray-50 ${
                        activeTab === tab.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Management Submenu */}
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">顧客管理</div>
                  {[
                    { value: 'consultations', icon: MessageSquare, label: '相談申込' },
                    { value: 'contacts', icon: Phone, label: 'お問い合わせ' },
                    { value: 'chatbot', icon: MessageSquare, label: 'チャットボット' },
                    ...(user?.email === 'queue@queue-tech.jp' ? [{ value: 'todo-progress', icon: ClipboardList, label: 'Todo進捗' }] : [])
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-6 py-3 text-left hover:bg-gray-50 ${
                        activeTab === tab.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="border-t border-gray-100">
                  {[
                    { value: 'todos', icon: Target, label: 'Todo' },
                    { value: 'attendance', icon: CalendarDays, label: '勤怠管理' },
                    ...(user?.email === 'queue@queue-tech.jp' ? [{ value: 'payroll', icon: DollarSign, label: '人件費管理' }] : []),
                    { value: 'news', icon: Newspaper, label: 'ブログ管理' },
                    ...(user?.email === 'queue@queue-tech.jp' ? [{ value: 'members', icon: Users, label: 'メンバー' }] : []),
                    { value: 'settings', icon: Settings, label: '設定' }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 ${
                        activeTab === tab.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <TabsContent value="todos">
            <TodoManager />
          </TabsContent>

          <TabsContent value="todo-progress">
            <TodoProgress />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceManager />
          </TabsContent>

          {user?.email === 'queue@queue-tech.jp' && (
            <TabsContent value="payroll">
              <PayrollManager />
            </TabsContent>
          )}

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {statsCards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900">
                          {loading ? '...' : card.value}
                        </p>
                      </div>
                      <card.icon className={`w-6 h-6 md:w-8 md:h-8 ${card.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 今日やること */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg md:text-xl">
                  <Target className="w-5 h-5 mr-2" />
                  今日やること
                </CardTitle>
                <CardDescription>
                  期限が今日かそれ以前の未完了タスク
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todosLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
                    </div>
                  ) : todayTodos.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">今日やることはありません</p>
                      <p className="text-sm text-gray-400">すべてのタスクが完了済みです！</p>
                    </div>
                  ) : (
                    todayTodos.map((todo) => (
                      <div key={todo.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        todo.is_overdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="mt-1">
                          {todo.status === 'pending' ? (
                            <PauseCircle className="w-5 h-5 text-gray-500" />
                          ) : (
                            <PlayCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {todo.title}
                              </p>
                              {todo.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {todo.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                {/* 優先度バッジ */}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    todo.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                    todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-blue-100 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                                </Badge>
                                
                                {/* 期限表示 */}
                                {todo.due_date && (
                                  <div className={`flex items-center text-xs ${
                                    todo.is_overdue ? 'text-red-600' : 'text-gray-500'
                                  }`}>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {todo.is_overdue ? '期限切れ' : '今日まで'}
                                  </div>
                                )}
                                
                                {/* ステータス */}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    todo.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                    'bg-blue-100 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {todo.status === 'pending' ? '未開始' : '進行中'}
                                </Badge>
                              </div>
                            </div>
                            {todo.is_overdue && (
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Todo管理ページへのリンク */}
                {todayTodos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('todos')}
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      全てのTodoを管理
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="cta-analytics">
            <CTAAnalytics />
          </TabsContent>

          <TabsContent value="reading-analytics">
            <ReadingTimeAnalytics />
          </TabsContent>

          <TabsContent value="consultations">
            <ConsultationManager />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactManager />
          </TabsContent>

          <TabsContent value="chatbot">
            <ChatbotManager />
          </TabsContent>

          <TabsContent value="news">
            <NewsManager />
          </TabsContent>

          {user?.email === 'queue@queue-tech.jp' && (
            <TabsContent value="members">
              <MemberManager />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">システム設定</CardTitle>
                <CardDescription>
                  管理システムの設定を変更できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-medium mb-4">アカウント情報</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">管理者:</span> Queue株式会社
                      </p>
                      <p className="text-sm break-all">
                        <span className="font-medium">メール:</span> {user.email}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">セッションID:</span> {session?.user?.id?.substring(0, 8)}...
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">最終ログイン:</span> {new Date().toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base md:text-lg font-medium mb-4">システム情報</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">バージョン:</span> 1.3.0 (Analytics対応)
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">データベース:</span> 接続済み
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">ストレージ:</span> 利用可能
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">セッション管理:</span> 有効
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper functions for mobile tab selector
const getTabIcon = (tab: string) => {
  const icons = {
    overview: <Home className="w-4 h-4" />,
    todos: <Target className="w-4 h-4" />,
    'todo-progress': <ClipboardList className="w-4 h-4" />,
    attendance: <CalendarDays className="w-4 h-4" />,
    payroll: <DollarSign className="w-4 h-4" />,
    analytics: <BarChart3 className="w-4 h-4" />,
    'cta-analytics': <MousePointer className="w-4 h-4" />,
    'reading-analytics': <Clock className="w-4 h-4" />,
    consultations: <MessageSquare className="w-4 h-4" />,
    contacts: <Phone className="w-4 h-4" />,
    chatbot: <MessageSquare className="w-4 h-4" />,
    news: <Newspaper className="w-4 h-4" />,
    members: <Users className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />
  };
  return icons[tab as keyof typeof icons] || <Home className="w-4 h-4" />;
};

const getTabLabel = (tab: string) => {
  const labels = {
    overview: '概要',
    todos: 'Todo',
    'todo-progress': 'Todo進捗',
    attendance: '勤怠管理',
    payroll: '人件費管理',
    analytics: '基本分析',
    'cta-analytics': 'CTA分析',
    'reading-analytics': '閲覧時間分析',
    consultations: '相談申込',
    contacts: 'お問い合わせ',
    chatbot: 'チャットボット',
    news: 'ブログ',
    members: 'メンバー',
    settings: '設定'
  };
  return labels[tab as keyof typeof labels] || '概要';
};

export default AdminDashboard; 