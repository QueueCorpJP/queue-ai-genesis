import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, MousePointer, Users, BarChart3, Calendar, ExternalLink, Target } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import CTAConversionAnalytics from '@/components/CTAConversionAnalytics';

interface CTAClickStat {
  article_id: string;
  article_title: string;
  published_at: string | null;
  total_clicks: number;
  unique_clicks: number;
  consultation_clicks: number;
  total_views: number;
  click_rate_percentage: number;
}

interface CTAOverallStats {
  totalClicks: number;
  totalViews: number;
  averageClickRate: number;
  consultationClicks: number;
  contactClicks: number;
}

const CTAAnalytics: React.FC = () => {
  const [ctaStats, setCtaStats] = useState<CTAClickStat[]>([]);
  const [overallStats, setOverallStats] = useState<CTAOverallStats>({
    totalClicks: 0,
    totalViews: 0,
    averageClickRate: 0,
    consultationClicks: 0,
    contactClicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCTAStats = async () => {
    try {
      
      // 記事ごとのCTAクリック統計を取得（修正されたビューから）
      const { data: stats, error: statsError } = await getSupabaseAdmin()
        .from('cta_click_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (statsError) {
        console.error('CTA stats fetch error:', statsError);
        toast.error('CTA統計の取得に失敗しました');
        return;
      }

      setCtaStats(stats || []);

      // 全体統計の計算（より正確に）
      if (stats && stats.length > 0) {
        const totalClicks = stats.reduce((sum, stat) => sum + (stat.total_clicks || 0), 0);
        const totalViews = stats.reduce((sum, stat) => sum + (stat.total_views || 0), 0);
        const consultationClicks = stats.reduce((sum, stat) => sum + (stat.consultation_clicks || 0), 0);
        
        // CTAタイプ別統計を正確に取得
        const { count: contactClicks } = await getSupabaseAdmin()
          .from('cta_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('cta_type', 'contact');
        const averageClickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

        const calculatedStats = {
          totalClicks,
          totalViews,
          averageClickRate: Math.round(averageClickRate * 100) / 100,
          consultationClicks,
          contactClicks: contactClicks || 0,
        };

        setOverallStats(calculatedStats);

      } else {
        setOverallStats({
          totalClicks: 0,
          totalViews: 0,
          averageClickRate: 0,
          consultationClicks: 0,
          contactClicks: 0,
        });
      }

    } catch (error) {
      console.error('Failed to fetch CTA analytics:', error);
      toast.error('CTA分析データの取得に失敗しました');
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchCTAStats();
    setRefreshing(false);
    toast.success('CTA統計を更新しました');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // CTA統計を取得
        const { data: stats, error } = await getSupabaseAdmin()
          .from('cta_click_stats')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('CTAデータ取得エラー:', error);
          return;
        }

        if (stats && stats.length > 0) {
          setCtaStats(stats);
          
          // 全体統計を計算
          const totalClicks = stats.reduce((sum, stat) => sum + stat.total_clicks, 0);
          const totalViews = stats.reduce((sum, stat) => sum + stat.total_views, 0);
          const avgClickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
          
          const calculatedStats = {
            totalClicks,
            totalViews,
            averageClickRate: avgClickRate,
            consultationClicks: stats.reduce((sum, stat) => sum + (stat.consultation_clicks || 0), 0),
            contactClicks: 0 // This will be fetched separately
          };
          
          setOverallStats(calculatedStats);
        } else {
          setCtaStats([]);
          setOverallStats({
            totalClicks: 0,
            totalViews: 0,
            averageClickRate: 0,
            consultationClicks: 0,
            contactClicks: 0
          });
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getClickRateColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600';
    if (rate >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getClickRateBadgeVariant = (rate: number) => {
    if (rate >= 5) return 'default';
    if (rate >= 2) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CTA分析ダッシュボード</h2>
          <p className="text-gray-600">記事内のCTAクリック率とコンバージョンを総合分析</p>
        </div>
        <Button 
          onClick={refreshStats} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? '更新中...' : '統計を更新'}
        </Button>
      </div>

      {/* Tabs for different analysis views */}
      <Tabs defaultValue="click-analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="click-analysis" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>クリック分析</span>
          </TabsTrigger>
          <TabsTrigger value="conversion-analysis" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>コンバージョン分析</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="click-analysis" className="space-y-6">

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総CTA\n          クリック数</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalClicks.toLocaleString()}</p>
              </div>
              <MousePointer className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">記事総閲覧数</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalViews.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均CTA\nクリック率</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.averageClickRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">無料相談\nクリック数</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.consultationClicks.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>記事別CTAクリック統計</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ctaStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>CTAクリック統計がありません</p>
              <p className="text-sm">記事が公開されてCTAがクリックされると統計が表示されます</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>記事タイトル</TableHead>
                    <TableHead>公開日</TableHead>
                    <TableHead className="text-center">総閲覧数</TableHead>
                    <TableHead className="text-center">CTAクリック数</TableHead>
                    <TableHead className="text-center">ユニーククリック</TableHead>
                    <TableHead className="text-center">無料相談クリック</TableHead>
                    <TableHead className="text-center">クリック率</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ctaStats.map((stat) => (
                    <TableRow key={stat.article_id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{stat.article_title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(stat.published_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stat.total_views.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stat.total_clicks.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stat.unique_clicks.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stat.consultation_clicks.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Badge variant={getClickRateBadgeVariant(stat.click_rate_percentage)}>
                            {stat.click_rate_percentage}%
                          </Badge>
                          <Progress 
                            value={Math.min(stat.click_rate_percentage, 10)} 
                            max={10} 
                            className="w-16 h-2" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={`/blog/${stat.article_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>パフォーマンス分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">最適化のヒント</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• クリック率5%以上が優秀とされています</li>
                  <li>• クリック率2%未満の記事はCTA配置を見直しましょう</li>
                  <li>• 記事内容とCTAの関連性を高めると効果的です</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">統計の活用法</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 高いクリック率の記事パターンを分析</li>
                  <li>• 時期や内容による変動を確認</li>
                  <li>• A/BテストでCTA文言を最適化</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="conversion-analysis">
          <CTAConversionAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CTAAnalytics; 