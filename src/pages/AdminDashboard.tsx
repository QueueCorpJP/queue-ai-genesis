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
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, useNavigate } from 'react-router-dom';
import ConsultationManager from '@/components/ConsultationManager';
import ContactManager from '@/components/ContactManager';
import NewsManager from '@/components/NewsManager';
import Analytics from '@/components/Analytics';
import ChatbotManager from '@/components/ChatbotManager';

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

const AdminDashboard: React.FC = () => {
  const { user, session, logout, isLoading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayContacts: 0,
    todayConsultations: 0,
    pendingConsultations: 0,
    pendingContacts: 0,
    monthlyContacts: 0,
    monthlyConsultations: 0,
    publishedNews: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 認証チェック - 依存関係を明確にする
  useEffect(() => {
    if (!isLoading && !user?.isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/admin/login', { replace: true });
    }
  }, [user?.isAuthenticated, isLoading, navigate]);

  // データフェッチ関数をuseCallbackでメモ化
  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const monthStart = thisMonth.toISOString();

      console.log('Fetching dashboard stats...');

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

      console.log('Stats fetched:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('統計データの取得に失敗しました');
    }
  }, []);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const activities: RecentActivity[] = [];

      console.log('Fetching recent activities...');

      // 最新の相談申込を取得
      const { data: consultations } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // 最新のお問い合わせを取得
      const { data: contacts } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // 最新のニュース記事を取得
      const { data: news } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

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

      // ニュース記事をアクティビティに変換
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
      
      console.log('Activities fetched:', activities.length);
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      toast.error('アクティビティの取得に失敗しました');
    }
  }, []);

  // データフェッチ関数をメモ化
  const fetchDashboardData = useCallback(async () => {
    if (!user?.isAuthenticated) {
      console.log('User not authenticated, skipping data fetch');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      await Promise.all([
        fetchStats(),
        fetchRecentActivities()
      ]);
      console.log('Dashboard data fetched successfully');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('ダッシュボードデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.isAuthenticated, fetchStats, fetchRecentActivities]);

  // 初回データフェッチ - 依存関係を明確にする
  useEffect(() => {
    if (user?.isAuthenticated && !loading) {
      fetchDashboardData();
    }
  }, [user?.isAuthenticated]); // fetchDashboardDataは依存関係から除外

  // データリフレッシュ
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('データを更新しました');
  }, [fetchDashboardData]);

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
      title: "公開済みニュース記事",
      value: stats.publishedNews,
      icon: Newspaper,
      color: "text-purple-600"
    }
  ];

  // ローディング中またはログイン状態確認中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合
  if (!user?.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="text-gray-600">Queue株式会社 - 管理システム</p>
            </div>
            <div className="flex items-center space-x-4">
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
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>概要</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>分析</span>
            </TabsTrigger>
            <TabsTrigger value="consultations" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>相談申込</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>お問い合わせ</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>チャットボット</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center space-x-2">
              <Newspaper className="w-4 h-4" />
              <span>ニュース</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>設定</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {loading ? '...' : card.value}
                        </p>
                      </div>
                      <card.icon className={`w-8 h-8 ${card.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 最近のアクティビティ */}
            <Card>
              <CardHeader>
                <CardTitle>最近のアクティビティ</CardTitle>
                <CardDescription>
                  最新のお問い合わせ、相談申込、ニュース記事の活動履歴
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">読み込み中...</p>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">アクティビティがありません</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(activity.status, activity.type)}
                          <span className="text-sm text-gray-500">{formatRelativeTime(activity.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>システム設定</CardTitle>
                <CardDescription>
                  管理システムの設定を変更できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">アカウント情報</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">管理者:</span> Queue株式会社
                      </p>
                      <p className="text-sm">
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
                    <h3 className="text-lg font-medium mb-4">システム情報</h3>
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

                  <div>
                    <h3 className="text-lg font-medium mb-4">セッション管理</h3>
                    <div className="space-y-4">
                      <Button
                        onClick={refreshData}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        データを更新
                      </Button>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                      </Button>
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

export default AdminDashboard; 