import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  Eye, 
  MessageSquare, 
  Calendar, 
  Newspaper,
  RefreshCw,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AnalyticsData {
  weeklyContacts: number;
  monthlyContacts: number;
  monthlyNewsPublished: number;
  totalArticleViews: number;
}

interface ArticleViewStats {
  id: string;
  title: string;
  published_at: string;
  view_count: number;
  status: string;
}

interface ContactStats {
  date: string;
  count: number;
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    weeklyContacts: 0,
    monthlyContacts: 0,
    monthlyNewsPublished: 0,
    totalArticleViews: 0
  });
  const [articleViews, setArticleViews] = useState<ArticleViewStats[]>([]);
  const [recentContacts, setRecentContacts] = useState<ContactStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMainStats(),
        fetchArticleViewStats(),
        fetchContactTrends()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('分析データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchMainStats = async () => {
    const now = new Date();
    
    // 今週の開始日（月曜日）
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    
    // 今月の開始日
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 今週のお問い合わせ件数（consultation + contact）
    const { count: weeklyConsultations } = await supabase
      .from('consultation_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    const { count: weeklyContacts } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    // 今月のお問い合わせ件数
    const { count: monthlyConsultations } = await supabase
      .from('consultation_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    const { count: monthlyContactsCount } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    // 今月公開されたニュース記事数
    const { count: monthlyNewsPublished } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', monthStart.toISOString());

    // 総記事閲覧数
    const { count: totalArticleViews } = await supabase
      .from('news_article_views')
      .select('*', { count: 'exact', head: true });

    setAnalytics({
      weeklyContacts: (weeklyConsultations || 0) + (weeklyContacts || 0),
      monthlyContacts: (monthlyConsultations || 0) + (monthlyContactsCount || 0),
      monthlyNewsPublished: monthlyNewsPublished || 0,
      totalArticleViews: totalArticleViews || 0
    });
  };

  const fetchArticleViewStats = async () => {
    try {
      // 記事ごとの閲覧数を取得
      const { data: viewStats, error } = await supabase
        .from('news_articles')
        .select(`
          id,
          title,
          published_at,
          status,
          news_article_views(count)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      const articleStats: ArticleViewStats[] = viewStats?.map(article => ({
        id: article.id,
        title: article.title,
        published_at: article.published_at,
        status: article.status,
        view_count: article.news_article_views?.length || 0
      })) || [];

      setArticleViews(articleStats);
    } catch (error) {
      console.error('Error fetching article view stats:', error);
    }
  };

  const fetchContactTrends = async () => {
    try {
      // 過去7日間の日別お問い合わせ数を取得
      const past7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const contactTrends: ContactStats[] = [];

      for (const date of past7Days) {
        const startDate = `${date}T00:00:00`;
        const endDate = `${date}T23:59:59`;

        const { count: consultations } = await supabase
          .from('consultation_requests')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const { count: contacts } = await supabase
          .from('contact_requests')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        contactTrends.push({
          date,
          count: (consultations || 0) + (contacts || 0)
        });
      }

      setRecentContacts(contactTrends);
    } catch (error) {
      console.error('Error fetching contact trends:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const analyticsCards = [
    {
      title: "今週のお問い合わせ",
      value: analytics.weeklyContacts,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "今週（月曜日から）の相談申込 + お問い合わせ"
    },
    {
      title: "今月のお問い合わせ",
      value: analytics.monthlyContacts,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "今月の相談申込 + お問い合わせ"
    },
    {
      title: "今月公開記事数",
      value: analytics.monthlyNewsPublished,
      icon: Newspaper,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "今月公開されたニュース記事"
    },
    {
      title: "総記事閲覧数",
      value: analytics.totalArticleViews,
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "全記事の累計閲覧数"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">アナリティクス</h2>
          <p className="text-gray-600">サイトの利用状況と反響を分析します</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAnalyticsData}
          disabled={loading}
          className="text-gray-600 border-gray-200 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      {/* メインステータスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : card.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 記事別閲覧数 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              記事別閲覧数
            </CardTitle>
            <CardDescription>
              公開済み記事の閲覧数ランキング
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : articleViews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">閲覧データがありません</p>
            ) : (
              <div className="space-y-4">
                {articleViews.slice(0, 10).map((article, index) => (
                  <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <h4 className="font-medium text-gray-900 truncate">{article.title}</h4>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(article.published_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        <Eye className="w-3 h-3 mr-1" />
                        {article.view_count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 日別お問い合わせ推移 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              過去7日間のお問い合わせ推移
            </CardTitle>
            <CardDescription>
              日別のお問い合わせ件数の推移
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContacts.map((stat, index) => {
                  const maxCount = Math.max(...recentContacts.map(s => s.count), 1);
                  const percentage = (stat.count / maxCount) * 100;
                  
                  return (
                    <div key={stat.date} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{formatDateShort(stat.date)}</span>
                        <span className="font-medium">{stat.count}件</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 詳細データテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>詳細データ</CardTitle>
          <CardDescription>
            全記事の詳細な閲覧統計
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>記事タイトル</TableHead>
                    <TableHead>公開日</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">閲覧数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articleViews.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium max-w-md truncate">
                        {article.title}
                      </TableCell>
                      <TableCell>{formatDate(article.published_at)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          公開
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{article.view_count}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics; 