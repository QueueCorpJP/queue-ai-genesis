import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, TrendingUp, Users, ArrowUpDown, MousePointer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReadingTimeData {
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

interface UserSession {
  session_id: string;
  article_id: string;
  article_title: string;
  ip_address: string;
  view_start_time: string;
  view_end_time: string | null;
  reading_duration_seconds: number | null;
  scroll_depth_percentage: number;
  is_bounce: boolean;
  referrer_url: string | null;
  exit_url: string | null;
}

const ReadingTimeAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [readingTimeData, setReadingTimeData] = useState<ReadingTimeData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [sortBy, setSortBy] = useState<keyof ReadingTimeData>('total_views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Reading time stats for articles
      const { data: readingStats, error: readingError } = await supabase
        .from('reading_time_stats')
        .select('*')
        .order('total_views', { ascending: false });

      if (readingError) {
        console.error('Error loading reading time stats:', readingError);
      } else {
        setReadingTimeData(readingStats || []);
      }

      // Daily stats for the last 30 days
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_reading_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (dailyError) {
        console.error('Error loading daily stats:', dailyError);
      } else {
        setDailyStats(dailyData || []);
      }

      // Recent user sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('detailed_reading_sessions')
        .select('*')
        .order('view_start_time', { ascending: false })
        .limit(50);
      
      if (sessionError) {
        console.error('Error loading user sessions:', sessionError);
      } else {
        setUserSessions(sessionData || []);
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (column: keyof ReadingTimeData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedData = [...readingTimeData].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const SortButton = ({ column, children }: { column: keyof ReadingTimeData; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(column)}
      className="h-auto p-1 font-medium"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">閲覧時間データを読み込み中...</span>
      </div>
    );
  }

  const totalViews = readingTimeData.reduce((sum, item) => sum + item.total_views, 0);
  const totalUniqueVisitors = readingTimeData.reduce((sum, item) => sum + item.unique_visitors, 0);
  const avgReadingTime = readingTimeData.length > 0 
    ? readingTimeData.reduce((sum, item) => sum + item.avg_reading_time_seconds, 0) / readingTimeData.length 
    : 0;
  const avgBounceRate = readingTimeData.length > 0 
    ? readingTimeData.reduce((sum, item) => sum + item.bounce_rate_percentage, 0) / readingTimeData.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総閲覧数</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ユニーク訪問者</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueVisitors.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均閲覧時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(avgReadingTime)}</div>
              </CardContent>
            </Card>

            <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均直帰率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgBounceRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

      {/* Article-wise Reading Time Statistics */}
          <Card>
            <CardHeader>
          <CardTitle>記事別閲覧時間統計</CardTitle>
          <CardDescription>
            各記事の詳細な閲覧時間分析
          </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                  <th className="text-left p-2 font-medium">
                    <SortButton column="article_title">記事タイトル</SortButton>
                  </th>
                  <th className="text-left p-2 font-medium">
                    <SortButton column="total_views">閲覧数</SortButton>
                  </th>
                  <th className="text-left p-2 font-medium">
                    <SortButton column="unique_visitors">ユニーク</SortButton>
                  </th>
                  <th className="text-left p-2 font-medium">
                    <SortButton column="avg_reading_time_minutes">平均時間</SortButton>
                  </th>
                  <th className="text-left p-2 font-medium">
                    <SortButton column="avg_scroll_depth_percentage">スクロール</SortButton>
                  </th>
                  <th className="text-left p-2 font-medium">
                    <SortButton column="bounce_rate_percentage">直帰率</SortButton>
                  </th>
                  <th className="text-left p-2 font-medium">時間分布</th>
                    </tr>
                  </thead>
                  <tbody>
                {sortedData.map((article) => (
                  <tr key={article.article_id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{article.article_title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(article.published_at).toLocaleDateString('ja-JP')}
                        </div>
              </div>
                    </td>
                    <td className="p-2 font-medium">{article.total_views}</td>
                    <td className="p-2">{article.unique_visitors}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formatTime(article.avg_reading_time_seconds)}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant="outline" 
                        className={
                          article.avg_scroll_depth_percentage > 70 
                            ? "bg-green-50 text-green-700" 
                            : article.avg_scroll_depth_percentage > 40 
                            ? "bg-yellow-50 text-yellow-700" 
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {article.avg_scroll_depth_percentage?.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant="outline" 
                        className={
                          article.bounce_rate_percentage < 30 
                            ? "bg-green-50 text-green-700" 
                            : article.bounce_rate_percentage < 60 
                            ? "bg-yellow-50 text-yellow-700" 
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {article.bounce_rate_percentage?.toFixed(1)}%
                      </Badge>
                    </td>
                        <td className="p-2">
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs px-1">
                          0-30s: {article.views_0_30_seconds}
                            </Badge>
                        <Badge variant="outline" className="text-xs px-1">
                          1-3m: {article.views_1_3_minutes}
                            </Badge>
                        <Badge variant="outline" className="text-xs px-1">
                          5m+: {article.views_over_5_minutes}
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

      {/* Daily Statistics */}
          <Card>
            <CardHeader>
          <CardTitle>日別統計（過去30日）</CardTitle>
          <CardDescription>
            日次の閲覧パフォーマンス推移
          </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                  <th className="text-left p-2 font-medium">日付</th>
                  <th className="text-left p-2 font-medium">閲覧数</th>
                  <th className="text-left p-2 font-medium">ユニーク訪問者</th>
                  <th className="text-left p-2 font-medium">平均閲覧時間</th>
                  <th className="text-left p-2 font-medium">平均スクロール深度</th>
                  <th className="text-left p-2 font-medium">直帰率</th>
                    </tr>
                  </thead>
                  <tbody>
                {dailyStats.map((day) => (
                  <tr key={day.date} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{new Date(day.date).toLocaleDateString('ja-JP')}</td>
                    <td className="p-2">{day.total_views}</td>
                    <td className="p-2">{day.unique_visitors}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formatTime(day.avg_reading_time_seconds)}
                      </Badge>
                    </td>
                    <td className="p-2">{day.avg_scroll_depth_percentage?.toFixed(1)}%</td>
                    <td className="p-2">
                      <Badge 
                        variant="outline" 
                        className={
                          day.bounce_rate_percentage < 30 
                            ? "bg-green-50 text-green-700" 
                            : day.bounce_rate_percentage < 60 
                            ? "bg-yellow-50 text-yellow-700" 
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {day.bounce_rate_percentage?.toFixed(1)}%
                      </Badge>
                    </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

      {/* Recent User Sessions */}
          <Card>
            <CardHeader>
          <CardTitle>最近のユーザーセッション</CardTitle>
          <CardDescription>
            個別ユーザーの閲覧セッション詳細（最新50件）
          </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                  <th className="text-left p-2 font-medium">セッションID</th>
                  <th className="text-left p-2 font-medium">記事</th>
                  <th className="text-left p-2 font-medium">開始時刻</th>
                  <th className="text-left p-2 font-medium">閲覧時間</th>
                  <th className="text-left p-2 font-medium">スクロール深度</th>
                  <th className="text-left p-2 font-medium">直帰</th>
                    </tr>
                  </thead>
                  <tbody>
                {userSessions.map((session, index) => (
                  <tr key={`${session.session_id}-${index}`} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{session.session_id ? session.session_id.slice(-8) : 'N/A'}</td>
                    <td className="p-2">
                      <div className="max-w-xs truncate" title={session.article_title}>
                        {session.article_title}
                      </div>
                    </td>
                    <td className="p-2 text-xs">{formatDate(session.view_start_time)}</td>
                    <td className="p-2">
                      {session.reading_duration_seconds ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {formatTime(session.reading_duration_seconds)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">
                          進行中
                        </Badge>
                      )}
                    </td>
                        <td className="p-2">
                      <Badge 
                        variant="outline" 
                        className={
                          session.scroll_depth_percentage > 70 
                            ? "bg-green-50 text-green-700" 
                            : session.scroll_depth_percentage > 40 
                            ? "bg-yellow-50 text-yellow-700" 
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {session.scroll_depth_percentage}%
                          </Badge>
                        </td>
                        <td className="p-2">
                          {session.is_bounce ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          <MousePointer className="w-3 h-3 mr-1" />
                          直帰
                        </Badge>
                          ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          エンゲージ
                        </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
    </div>
  );
};

export default ReadingTimeAnalytics; 