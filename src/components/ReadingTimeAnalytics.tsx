import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Eye, Users, TrendingUp, BarChart3, Calendar, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// データ型定義
interface ReadingStats {
  article_id: string;
  article_title: string;
  published_at: string;
  total_views: number;
  unique_visitors: number;
  avg_reading_time_seconds: number;
  avg_reading_time_minutes: number;
  max_reading_time_seconds: number;
  min_reading_time_seconds: number;
  avg_scroll_depth_percentage: number;
  bounce_count: number;
  bounce_rate_percentage: number;
  views_0_30_seconds: number;
  views_31_60_seconds: number;
  views_1_3_minutes: number;
  views_3_5_minutes: number;
  views_over_5_minutes: number;
}

interface DailyStats {
  date: string;
  total_views: number;
  unique_visitors: number;
  avg_reading_time_seconds: number;
  avg_reading_time_minutes: number;
  avg_scroll_depth_percentage: number;
  bounce_rate_percentage: number;
}

interface UserHistory {
  ip_address: string;
  user_agent: string;
  articles_read: number;
  total_page_views: number;
  avg_reading_time_seconds: number;
  total_reading_time_seconds: number;
  avg_scroll_depth_percentage: number;
  first_visit: string;
  last_visit: string;
  bounce_count: number;
  bounce_rate_percentage: number;
}

interface DetailedSession {
  id: string;
  session_id: string;
  article_id: string;
  article_title: string;
  ip_address: string;
  view_start_time: string;
  view_end_time: string;
  reading_duration_seconds: number;
  reading_category: string;
  scroll_depth_percentage: number;
  is_bounce: boolean;
  referrer_url: string;
  exit_url: string;
  user_agent: string;
}

const ReadingTimeAnalytics: React.FC = () => {
  const [readingStats, setReadingStats] = useState<ReadingStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userHistory, setUserHistory] = useState<UserHistory[]>([]);
  const [detailedSessions, setDetailedSessions] = useState<DetailedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedArticle, setSelectedArticle] = useState<string>('all');
  const [articles, setArticles] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    loadAllData();
    loadArticles();
  }, [selectedPeriod, selectedArticle]);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('id, title')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('記事一覧取得エラー:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadReadingStats(),
        loadDailyStats(),
        loadUserHistory(),
        loadDetailedSessions()
      ]);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadReadingStats = async () => {
    try {
      let query = supabase.from('reading_time_stats').select('*');
      
      if (selectedArticle !== 'all') {
        query = query.eq('article_id', selectedArticle);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setReadingStats(data || []);
    } catch (error) {
      console.error('閲覧統計取得エラー:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reading_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(parseInt(selectedPeriod));
      
      if (error) throw error;
      setDailyStats(data || []);
    } catch (error) {
      console.error('日別統計取得エラー:', error);
    }
  };

  const loadUserHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reading_history')
        .select('*')
        .order('total_reading_time_seconds', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setUserHistory(data || []);
    } catch (error) {
      console.error('ユーザー履歴取得エラー:', error);
    }
  };

  const loadDetailedSessions = async () => {
    try {
      let query = supabase.from('detailed_reading_sessions').select('*');
      
      if (selectedArticle !== 'all') {
        query = query.eq('article_id', selectedArticle);
      }
      
      const { data, error } = await query
        .order('view_start_time', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setDetailedSessions(data || []);
    } catch (error) {
      console.error('詳細セッション取得エラー:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0秒';
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEngagementColor = (category: string): string => {
    switch (category) {
      case '短時間閲覧（30秒以下）': return 'bg-red-100 text-red-800';
      case '通常閲覧（1分以下）': return 'bg-yellow-100 text-yellow-800';
      case '中程度閲覧（3分以下）': return 'bg-blue-100 text-blue-800';
      case '長時間閲覧（5分以下）': return 'bg-green-100 text-green-800';
      case '詳細閲覧（5分超）': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルターコントロール */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>フィルター設定</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">期間</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">過去7日間</SelectItem>
                  <SelectItem value="30">過去30日間</SelectItem>
                  <SelectItem value="90">過去90日間</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">記事</label>
              <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての記事</SelectItem>
                  {articles.map(article => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAllData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="articles">記事別分析</TabsTrigger>
          <TabsTrigger value="users">ユーザー分析</TabsTrigger>
          <TabsTrigger value="sessions">詳細セッション</TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Eye className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {dailyStats.reduce((sum, stat) => sum + stat.total_views, 0)}
                    </p>
                    <p className="text-sm text-gray-600">総閲覧数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {dailyStats.reduce((sum, stat) => sum + stat.unique_visitors, 0)}
                    </p>
                    <p className="text-sm text-gray-600">ユニーク訪問者</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        dailyStats.reduce((sum, stat) => sum + (stat.avg_reading_time_seconds || 0), 0) /
                        Math.max(dailyStats.length, 1)
                      )}秒
                    </p>
                    <p className="text-sm text-gray-600">平均閲覧時間</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        dailyStats.reduce((sum, stat) => sum + (stat.bounce_rate_percentage || 0), 0) /
                        Math.max(dailyStats.length, 1)
                      )}%
                    </p>
                    <p className="text-sm text-gray-600">平均直帰率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 日別統計テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>日別統計</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">日付</th>
                      <th className="text-left p-2">閲覧数</th>
                      <th className="text-left p-2">ユニーク訪問者</th>
                      <th className="text-left p-2">平均閲覧時間</th>
                      <th className="text-left p-2">スクロール深度</th>
                      <th className="text-left p-2">直帰率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map((stat) => (
                      <tr key={stat.date} className="border-b hover:bg-gray-50">
                        <td className="p-2">{stat.date}</td>
                        <td className="p-2">{stat.total_views}</td>
                        <td className="p-2">{stat.unique_visitors}</td>
                        <td className="p-2">{formatDuration(stat.avg_reading_time_seconds)}</td>
                        <td className="p-2">{Math.round(stat.avg_scroll_depth_percentage)}%</td>
                        <td className="p-2">{Math.round(stat.bounce_rate_percentage)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 記事別分析タブ */}
        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>記事別閲覧統計</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">記事タイトル</th>
                      <th className="text-left p-2">総閲覧数</th>
                      <th className="text-left p-2">ユニーク訪問者</th>
                      <th className="text-left p-2">平均閲覧時間</th>
                      <th className="text-left p-2">最長閲覧時間</th>
                      <th className="text-left p-2">スクロール深度</th>
                      <th className="text-left p-2">直帰率</th>
                      <th className="text-left p-2">エンゲージメント分布</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingStats.map((stat) => (
                      <tr key={stat.article_id} className="border-b hover:bg-gray-50">
                        <td className="p-2 max-w-xs truncate">{stat.article_title}</td>
                        <td className="p-2">{stat.total_views}</td>
                        <td className="p-2">{stat.unique_visitors}</td>
                        <td className="p-2">{formatDuration(stat.avg_reading_time_seconds)}</td>
                        <td className="p-2">{formatDuration(stat.max_reading_time_seconds)}</td>
                        <td className="p-2">{Math.round(stat.avg_scroll_depth_percentage)}%</td>
                        <td className="p-2">{Math.round(stat.bounce_rate_percentage)}%</td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <Badge variant="outline" className="text-xs">
                              0-30s: {stat.views_0_30_seconds}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              1-3m: {stat.views_1_3_minutes}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              5m+: {stat.views_over_5_minutes}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ユーザー分析タブ */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>ユーザー別閲覧履歴</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">IPアドレス</th>
                      <th className="text-left p-2">記事数</th>
                      <th className="text-left p-2">総ページビュー</th>
                      <th className="text-left p-2">平均閲覧時間</th>
                      <th className="text-left p-2">総閲覧時間</th>
                      <th className="text-left p-2">スクロール深度</th>
                      <th className="text-left p-2">初回訪問</th>
                      <th className="text-left p-2">最終訪問</th>
                      <th className="text-left p-2">直帰率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userHistory.map((user, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs">{user.ip_address}</td>
                        <td className="p-2">{user.articles_read}</td>
                        <td className="p-2">{user.total_page_views}</td>
                        <td className="p-2">{formatDuration(user.avg_reading_time_seconds)}</td>
                        <td className="p-2">{formatDuration(user.total_reading_time_seconds)}</td>
                        <td className="p-2">{Math.round(user.avg_scroll_depth_percentage)}%</td>
                        <td className="p-2">{formatDate(user.first_visit)}</td>
                        <td className="p-2">{formatDate(user.last_visit)}</td>
                        <td className="p-2">{Math.round(user.bounce_rate_percentage)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 詳細セッションタブ */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>詳細閲覧セッション</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">セッションID</th>
                      <th className="text-left p-2">記事タイトル</th>
                      <th className="text-left p-2">IPアドレス</th>
                      <th className="text-left p-2">開始時刻</th>
                      <th className="text-left p-2">閲覧時間</th>
                      <th className="text-left p-2">分類</th>
                      <th className="text-left p-2">スクロール</th>
                      <th className="text-left p-2">直帰</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedSessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs">{session.session_id ? session.session_id.slice(-8) : 'N/A'}</td>
                        <td className="p-2 max-w-xs truncate">{session.article_title || 'タイトルなし'}</td>
                        <td className="p-2 font-mono text-xs">{session.ip_address || 'N/A'}</td>
                        <td className="p-2">{formatDate(session.view_start_time)}</td>
                        <td className="p-2">{formatDuration(session.reading_duration_seconds)}</td>
                        <td className="p-2">
                          <Badge className={getEngagementColor(session.reading_category)}>
                            {session.reading_category}
                          </Badge>
                        </td>
                        <td className="p-2">{session.scroll_depth_percentage}%</td>
                        <td className="p-2">
                          {session.is_bounce ? (
                            <Badge variant="destructive">直帰</Badge>
                          ) : (
                            <Badge variant="secondary">継続</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReadingTimeAnalytics; 