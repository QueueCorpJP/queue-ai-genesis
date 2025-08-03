import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  MousePointer, 
  CheckCircle, 
  Calendar, 
  Target,
  Zap
} from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';

interface CTAConversionData {
  period: string;
  ctaClicks: number;
  consultationRequests: number;
  conversionRate: number;
  avgTimeToConvert: number;
}

interface ConversionStats {
  totalCTAClicks: number;
  totalConsultations: number;
  overallConversionRate: number;
  last30DaysConversionRate: number;
  bestPerformingDay: string;
  avgTimeToConvert: number;
}

const CTAConversionAnalytics: React.FC = () => {
  const [conversionData, setConversionData] = useState<CTAConversionData[]>([]);
  const [conversionStats, setConversionStats] = useState<ConversionStats>({
    totalCTAClicks: 0,
    totalConsultations: 0,
    overallConversionRate: 0,
    last30DaysConversionRate: 0,
    bestPerformingDay: '',
    avgTimeToConvert: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversionAnalytics = async () => {
    try {
      // 1. 日別コンバージョン統計を取得
      const { data: dailyStats, error: dailyStatsError } = await getSupabaseAdmin()
        .from('daily_conversion_stats')
        .select('*')
        .limit(30);

      if (dailyStatsError) {
        console.error('Daily conversion stats fetch error:', dailyStatsError);
        toast.error('日別統計の取得に失敗しました');
        return;
      }

      // 2. コンバージョン分析ファンクションを実行
      const { data: conversionAnalysis, error: conversionError } = await getSupabaseAdmin()
        .rpc('analyze_cta_conversions');

      if (conversionError) {
        console.warn('Conversion analysis function error:', conversionError.message);
      }

      // 3. コンバージョンインサイトを取得
      const { data: insights, error: insightsError } = await getSupabaseAdmin()
        .rpc('get_conversion_insights');

      if (insightsError) {
        console.warn('Conversion insights fetch error:', insightsError.message);
      }

      // 4. データ処理
      await processConversionData(
        dailyStats || [], 
        conversionAnalysis || [], 
        insights || []
      );

    } catch (error) {
      console.error('Failed to fetch conversion analytics:', error);
      toast.error('コンバージョン分析データの取得に失敗しました');
    }
  };

  const processConversionData = async (
    dailyStats: any[], 
    conversionAnalysis: any[], 
    insights: any[]
  ) => {
    // 日別統計データの処理
    const conversionArray: CTAConversionData[] = dailyStats.map(stat => ({
      period: stat.date,
      ctaClicks: stat.cta_clicks || 0,
      consultationRequests: stat.consultation_requests || 0,
      conversionRate: stat.conversion_rate || 0,
      avgTimeToConvert: 0, // 詳細分析から取得予定
    }));

    // 最新の30日分のデータのみ表示
    const sortedData = conversionArray
      .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
      .slice(0, 30);

    setConversionData(sortedData);

    // インサイトからの統計情報処理
    const insightMap = new Map<string, number>();
    insights.forEach(insight => {
      insightMap.set(insight.metric_name, insight.metric_value || 0);
    });

    // 全体統計の設定
    const totalClicks = insightMap.get('total_cta_clicks') || 0;
    const totalConsultations = insightMap.get('total_consultations') || 0;
    const overallConversionRate = insightMap.get('overall_conversion_rate') || 0;
    const avgDailyConversionRate = insightMap.get('avg_daily_conversion_rate') || 0;

    // 最高パフォーマンス日の特定
    const bestDay = sortedData.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best, 
      sortedData[0] || { period: '', conversionRate: 0 }
    );

    setConversionStats({
      totalCTAClicks: totalClicks,
      totalConsultations: totalConsultations,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      last30DaysConversionRate: Math.round(avgDailyConversionRate * 100) / 100,
      bestPerformingDay: bestDay?.period || '',
      avgTimeToConvert: 0,
    });
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await fetchConversionAnalytics();
    setRefreshing(false);
    toast.success('コンバージョン分析を更新しました');
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchConversionAnalytics();
      setLoading(false);
    };
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getConversionRateColor = (rate: number) => {
    if (rate >= 10) return 'text-green-600';
    if (rate >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConversionRateBadgeVariant = (rate: number) => {
    if (rate >= 10) return 'default';
    if (rate >= 5) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-600" />
            <span>CTAコンバージョン分析</span>
          </h2>
          <p className="text-gray-600">
            CTAクリックから実際の相談申し込みまでのコンバージョン率を分析
          </p>
        </div>
        <Button 
          onClick={refreshAnalytics} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? '更新中...' : '分析を更新'}
        </Button>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総CTAクリック数</p>
                <p className="text-2xl font-bold text-gray-900">{conversionStats.totalCTAClicks.toLocaleString()}</p>
              </div>
              <MousePointer className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総相談申し込み数</p>
                <p className="text-2xl font-bold text-gray-900">{conversionStats.totalConsultations.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">全体コンバージョン率</p>
                <p className={`text-2xl font-bold ${getConversionRateColor(conversionStats.overallConversionRate)}`}>
                  {conversionStats.overallConversionRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">過去30日\nコンバージョン率</p>
                <p className={`text-2xl font-bold ${getConversionRateColor(conversionStats.last30DaysConversionRate)}`}>
                  {conversionStats.last30DaysConversionRate}%
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Conversion Rate Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>日別コンバージョン率</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversionData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>コンバージョンデータがありません</p>
              <p className="text-sm">CTAクリックと相談申し込みがあると分析が表示されます</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead className="text-center">CTAクリック数</TableHead>
                    <TableHead className="text-center">相談申し込み数</TableHead>
                    <TableHead className="text-center">コンバージョン率</TableHead>
                    <TableHead className="text-center">パフォーマンス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversionData.map((data) => (
                    <TableRow key={data.period}>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(data.period)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{data.ctaClicks.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{data.consultationRequests.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getConversionRateBadgeVariant(data.conversionRate)}>
                          {data.conversionRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Progress 
                            value={Math.min(data.conversionRate, 20)} 
                            max={20} 
                            className="w-16 h-2" 
                          />
                          {data.conversionRate >= 10 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
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

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>コンバージョン分析インサイト</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📈 コンバージョン最適化</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• コンバージョン率10%以上が優秀な水準です</li>
                  <li>• 5%未満の場合はCTA文言や配置を見直しましょう</li>
                  <li>• 記事内容とCTAの関連性を高めると効果的です</li>
                  {conversionStats.bestPerformingDay && (
                    <li>• 最高パフォーマンス: {formatDate(conversionStats.bestPerformingDay)}</li>
                  )}
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">🎯 改善アクション</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 高コンバージョン記事の特徴を分析</li>
                  <li>• A/Bテストでより効果的なCTA文言を発見</li>
                  <li>• ユーザー行動を詳細分析してUX改善</li>
                  <li>• フォロー施策でリードナーチャリング強化</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CTAConversionAnalytics; 