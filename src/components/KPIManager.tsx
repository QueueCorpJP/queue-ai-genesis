import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { useToast } from './ui/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import PersonalKPICreator from './PersonalKPICreator';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  User,
  LineChart,
  Calculator
} from 'lucide-react';

// 型定義
interface KPIIndicator {
  id: string;
  indicator_name: string;
  indicator_type: 'personal_kpi' | 'team_kpi' | 'kgi';
  description: string;
  measurement_unit: string; // 後方互換性のため残す
  measurement_method: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project-based';
  target_type: 'increase' | 'decrease' | 'maintain';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 複数測定単位対応の新しい型定義
interface MeasurementUnit {
  unit_id: string;
  unit_name: string;
  unit_symbol: string;
  unit_type: 'count' | 'amount' | 'percentage' | 'ratio' | 'time' | 'score';
  is_primary: boolean;
  display_order: number;
  conversion_factor: number;
  description: string;
}

interface KPIIndicatorWithUnits {
  indicator_id: string;
  indicator_name: string;
  indicator_type: 'personal_kpi' | 'team_kpi' | 'kgi';
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project-based';
  target_type: 'increase' | 'decrease' | 'maintain';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  measurement_units: MeasurementUnit[];
  unit_count: number;
}

interface MultiUnitTarget {
  target_id: string;
  indicator_id: string;
  indicator_name: string;
  indicator_type: string;
  category: string;
  frequency: string;
  measurement_unit_id: string;
  unit_name: string;
  unit_symbol: string;
  unit_type: string;
  is_primary: boolean;
  target_period: string;
  assigned_member_id: string;
  assigned_member_name: string;
  assigned_member_email: string;
  assigned_team: string;
  target_value: number;
  baseline_value: number;
  current_value: number;
  achievement_rate: number;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface KPITarget {
  id: string;
  target_id: string; // Added to match the database view
  indicator_id: string;
  indicator_name: string;
  indicator_type: string;
  frequency?: string; // 測定頻度
  target_period: string;
  assigned_member_id?: string;
  assigned_member_name?: string;
  assigned_team?: string;
  target_value: number;
  baseline_value: number;
  current_value: number;
  achievement_rate: number;
  status: 'active' | 'achieved' | 'failed' | 'cancelled' | 'suspended';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  end_date: string;
  notes: string;
  performance_status: 'achieved' | 'on_track' | 'needs_attention' | 'at_risk';
  timeline_status: 'overdue' | 'due_soon' | 'on_schedule';
  days_remaining: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface KPIProgressRecord {
  id: string;
  target_id: string;
  record_date: string;
  recorded_value: number;
  previous_value?: number;
  change_amount?: number;
  change_rate?: number;
  achievement_rate: number;
  comments: string;
  evidence_url: string;
  recorded_by: string;
  created_at: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: string;
}

interface DashboardStats {
  total_kpis: number;
  achieved_kpis: number;
  on_track_kpis: number;
  needs_attention_kpis: number;
  at_risk_kpis: number;
  current_month_avg_rate: number;
  previous_month_avg_rate: number;
  rate_change_from_previous: number;
  personal_kpis: number;
  team_kpis: number;
  kgis: number;
  critical_at_risk: number;
  due_soon_count: number;
  overdue_count: number;
}

interface KPIPrediction {
  target_id: string;
  indicator_name: string;
  current_progress_rate: number;
  monthly_progress_rate: number;
  predicted_completion_percentage: number;
  months_to_completion: number;
  predicted_completion_date: string;
  trend_status: 'improving' | 'declining' | 'stable';
  required_monthly_rate: number;
  on_track: boolean;
  prediction_confidence: 'high' | 'medium' | 'low';
}

interface ProgressTrend {
  month: string;
  value: number;
  achievement_rate: number;
}

const KPIManager: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAdmin();

  // 権限チェック（役員は全機能、メンバーは自分のKPIのみ）
  const isExecutive = user?.role && ['executive', 'ceo', 'admin'].includes(user.role);
  const isMember = user?.role && ['member', 'employee'].includes(user.role);
  
  if (!user?.role || (!isExecutive && !isMember)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">アクセス権限がありません</h3>
            <p className="text-gray-600 max-w-md">
              KPI/KGI管理機能へのアクセス権限がありません。<br />
              適切なアカウントでログインしてください。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State管理
  const [activeTab, setActiveTab] = useState(isExecutive ? 'overview' : 'personal');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [indicators, setIndicators] = useState<KPIIndicator[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [progressRecords, setProgressRecords] = useState<KPIProgressRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_kpis: 0,
    achieved_kpis: 0,
    on_track_kpis: 0,
    needs_attention_kpis: 0,
    at_risk_kpis: 0,
    current_month_avg_rate: 0,
    previous_month_avg_rate: 0,
    rate_change_from_previous: 0,
    personal_kpis: 0,
    team_kpis: 0,
    kgis: 0,
    critical_at_risk: 0,
    due_soon_count: 0,
    overdue_count: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateTargetDialog, setShowCreateTargetDialog] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [currentMemberInfo, setCurrentMemberInfo] = useState<{ department?: string } | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedTargetForProgress, setSelectedTargetForProgress] = useState<KPITarget | null>(null);

  // 複数測定単位対応のstate
  const [indicatorsWithUnits, setIndicatorsWithUnits] = useState<KPIIndicatorWithUnits[]>([]);
  const [multiUnitTargets, setMultiUnitTargets] = useState<MultiUnitTarget[]>([]);
  const [showMultiUnitMode, setShowMultiUnitMode] = useState(false);

  // フォーム状態
  const [newIndicator, setNewIndicator] = useState({
    indicator_name: '',
    indicator_type: 'personal_kpi' as 'personal_kpi' | 'team_kpi' | 'kgi',
    description: '',
    measurement_unit: '',
    measurement_method: '',
    category: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project-based',
    target_type: 'increase' as 'increase' | 'decrease' | 'maintain',
  });

  // 複数測定単位フォーム
  const [newMeasurementUnits, setNewMeasurementUnits] = useState<Array<{
    unit_name: string;
    unit_symbol: string;
    unit_type: 'count' | 'amount' | 'percentage' | 'ratio' | 'time' | 'score';
    is_primary: boolean;
    description: string;
  }>>([
    { unit_name: '', unit_symbol: '', unit_type: 'count', is_primary: true, description: '' }
  ]);

  const [newTarget, setNewTarget] = useState({
    indicator_id: '',
    target_period: selectedPeriod,
    assigned_member_id: '',
    assigned_team: '',
    target_value: 0,
    baseline_value: 0,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [newProgress, setNewProgress] = useState({
    recorded_value: 0,
    comments: '',
    evidence_url: '',
    project_case_id: '', // 案件ID
  });

  // 案件データ管理
  const [projectCases, setProjectCases] = useState<Array<{
    id: string;
    case_name: string;
    status: string;
  }>>([]);

  const [recordedValueInput, setRecordedValueInput] = useState('');
  const [predictions, setPredictions] = useState<KPIPrediction[]>([]);
  const [showPredictionDialog, setShowPredictionDialog] = useState(false);
  const [selectedTargetForPrediction, setSelectedTargetForPrediction] = useState<KPITarget | null>(null);

  // 進捗予測計算関数
  const calculateKPIPrediction = async (target: KPITarget): Promise<KPIPrediction | null> => {
    try {
      // 進捗記録を取得（過去6ヶ月分）
      const { data: progressRecords, error } = await supabase
        .from('kpi_progress_records')
        .select('*')
        .eq('target_id', target.target_id || target.id)
        .gte('record_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('record_date', { ascending: true });

      if (error) throw error;

      if (!progressRecords || progressRecords.length < 2) {
        // データが不足している場合はnullを返す
        return null;
      }

      // 月次進捗率を計算
      const monthlyTrends = calculateMonthlyTrends(progressRecords, target);
      
      if (monthlyTrends.length === 0) {
        return null;
      }

      // 平均月次進捗率を計算（月間の進捗増加量）
      let monthlyProgressRate = 0;
      
      if (monthlyTrends.length >= 2) {
        const progressIncreases = [];
        for (let i = 1; i < monthlyTrends.length; i++) {
          const increase = monthlyTrends[i].achievement_rate - monthlyTrends[i - 1].achievement_rate;
          progressIncreases.push(Math.max(0, increase)); // 負の値は0とする
        }
        monthlyProgressRate = progressIncreases.length > 0 ? 
          progressIncreases.reduce((sum, inc) => sum + inc, 0) / progressIncreases.length : 0;
      } else if (monthlyTrends.length === 1) {
        // データが1つしかない場合は、現在の達成率を元に直近の進捗を推定
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysIntoMonth = Math.max(1, Math.ceil((currentDate.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)));
        
        // 今月の進捗を日割りで月次進捗率に換算
        const monthlyEstimate = (target.achievement_rate || 0) * (30 / daysIntoMonth);
        monthlyProgressRate = Math.min(monthlyEstimate, 100); // 最大100%に制限
      }

      // トレンド状況の判定（月次進捗率計算の後に移動）
      const recentTrends = monthlyTrends.slice(-3);
      let trendStatus: 'improving' | 'declining' | 'stable' = 'stable';
      
      if (recentTrends.length >= 2) {
        const firstHalf = recentTrends.slice(0, Math.floor(recentTrends.length / 2));
        const secondHalf = recentTrends.slice(Math.floor(recentTrends.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, t) => sum + t.achievement_rate, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, t) => sum + t.achievement_rate, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 5) {
          trendStatus = 'improving';
        } else if (secondAvg < firstAvg - 5) {
          trendStatus = 'declining';
        }
      }

      // 予測信頼度
      const predictionConfidence: 'high' | 'medium' | 'low' = 
        progressRecords.length >= 6 ? 'high' :
        progressRecords.length >= 3 ? 'medium' : 'low';

      // 期限までの残り日数を正確に計算
      const endDate = new Date(target.end_date + 'T23:59:59'); // 期限日の最後の時刻に設定
      const currentDate = new Date();
      
      const timeDiff = endDate.getTime() - currentDate.getTime();
      const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      const monthsRemaining = daysRemaining / 30; // 30日 = 1ヶ月として概算

      // 現在の達成率
      const currentAchievementRate = target.achievement_rate || 0;
      
      // 既に100%達成している場合の処理
      if (currentAchievementRate >= 100) {
        return {
          target_id: target.target_id || target.id,
          indicator_name: target.indicator_name,
          current_progress_rate: currentAchievementRate,
          monthly_progress_rate: monthlyProgressRate,
          predicted_completion_percentage: 100,
          months_to_completion: 0,
          predicted_completion_date: currentDate.toISOString().split('T')[0],
          trend_status: trendStatus,
          required_monthly_rate: 0,
          on_track: true,
          prediction_confidence: predictionConfidence
        };
      }

      // 期限切れの場合の処理
      if (daysRemaining <= 0) {
        return {
          target_id: target.target_id || target.id,
          indicator_name: target.indicator_name,
          current_progress_rate: currentAchievementRate,
          monthly_progress_rate: monthlyProgressRate,
          predicted_completion_percentage: currentAchievementRate, // 現在の達成率で固定
          months_to_completion: Infinity, // 期限切れなので達成困難
          predicted_completion_date: target.end_date, // 期限日
          trend_status: trendStatus,
          required_monthly_rate: Infinity, // 期限切れなので計算不可
          on_track: false,
          prediction_confidence: predictionConfidence
        };
      }

      // 現在のペースでの予測達成率
      const predictedCompletionPercentage = Math.min(100, currentAchievementRate + (monthlyProgressRate * monthsRemaining));

      // 目標達成に必要な月次進捗率
      const remainingProgress = 100 - currentAchievementRate;
      const requiredMonthlyRate = monthsRemaining > 0 ? remainingProgress / monthsRemaining : Infinity;

      // 完了予測期間の計算を修正
      let monthsToCompletion = Infinity;
      
      // 期限内に達成可能かを判定
      if (monthlyProgressRate > 0) {
        const theoreticalMonthsToCompletion = remainingProgress / monthlyProgressRate;
        
        // 期限内に達成可能な場合は期限までの期間、不可能な場合は理論値
        if (theoreticalMonthsToCompletion <= monthsRemaining) {
          monthsToCompletion = monthsRemaining; // 期限までの実際の期間
        } else {
          monthsToCompletion = theoreticalMonthsToCompletion; // 現在ペースでの予測期間
        }
      }
      


      // 予測完了日
      const predictedCompletionDate = monthlyProgressRate > 0 ? 
        new Date(currentDate.getTime() + monthsToCompletion * 30 * 24 * 60 * 60 * 1000) : 
        new Date('9999-12-31');

      // 達成可能性の判定
      const onTrack = predictedCompletionPercentage >= 90 && monthsToCompletion <= monthsRemaining + 1;

      return {
        target_id: target.target_id || target.id,
        indicator_name: target.indicator_name,
        current_progress_rate: currentAchievementRate,
        monthly_progress_rate: monthlyProgressRate,
        predicted_completion_percentage: predictedCompletionPercentage,
        months_to_completion: monthsToCompletion,
        predicted_completion_date: predictedCompletionDate.toISOString().split('T')[0],
        trend_status: trendStatus,
        required_monthly_rate: requiredMonthlyRate,
        on_track: onTrack,
        prediction_confidence: predictionConfidence
      };
    } catch (error) {
      console.error('Error calculating KPI prediction:', error);
      return null;
    }
  };

  // 頻度ラベルの取得
  const getFrequencyLabel = (frequency: string) => {
    const labels: { [key: string]: string } = {
      'daily': '日次',
      'weekly': '週次', 
      'monthly': '月次',
      'quarterly': '四半期',
      'yearly': '年次',
      'project-based': '案件ごと'
    };
    return labels[frequency] || frequency;
  };

  // 月次トレンドの計算
  const calculateMonthlyTrends = (records: any[], target: KPITarget): ProgressTrend[] => {
    const trends: ProgressTrend[] = [];
    const monthlyData: { [key: string]: any[] } = {};

    // 月別にレコードをグループ化
    records.forEach(record => {
      const month = record.record_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(record);
    });

    // 各月の平均値と達成率を計算
    Object.keys(monthlyData).sort().forEach(month => {
      const monthRecords = monthlyData[month];
      const avgValue = monthRecords.reduce((sum, r) => sum + r.recorded_value, 0) / monthRecords.length;
      const achievementRate = target.target_value > 0 ? (avgValue / target.target_value) * 100 : 0;

      trends.push({
        month,
        value: avgValue,
        achievement_rate: achievementRate
      });
    });

    return trends;
  };

  // 全ターゲットの予測を計算
  const calculateAllPredictions = async () => {
    const calculatedPredictions: KPIPrediction[] = [];

    for (const target of targets) {
      const prediction = await calculateKPIPrediction(target);
      if (prediction) {
        calculatedPredictions.push(prediction);
      }
    }

    setPredictions(calculatedPredictions);
  };

  // データ取得関数
  const fetchIndicators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_indicators')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIndicators(data || []);
    } catch (error) {
      console.error('Error fetching indicators:', error);
      toast({
        title: 'エラー',
        description: 'KPI指標の取得に失敗しました。',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchTargets = useCallback(async () => {
    try {
      let query = supabase
        .from('kpi_management_view')
        .select('*')
        .eq('target_period', selectedPeriod);

      // メンバーの場合は自分に関連するKPIのみ取得
      if (isMember && !isExecutive && currentMemberId) {
        const teamFilter = currentMemberInfo?.department ? `,assigned_team.eq.${currentMemberInfo.department}` : '';
        query = query.or(`assigned_member_id.eq.${currentMemberId}${teamFilter}`);
      }

      const { data, error } = await query.order('priority', { ascending: false });

      if (error) throw error;
      setTargets(data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast({
        title: 'エラー',
        description: 'KPI目標の取得に失敗しました。',
        variant: 'destructive',
      });
    }
  }, [selectedPeriod, isMember, isExecutive, currentMemberId, currentMemberInfo?.department, toast]);

  // 案件データ取得
  const fetchProjectCases = async () => {
    try {
      const { data, error } = await supabase
        .from('project_cases')
        .select('id, case_name, status')
        .in('status', ['in_progress', 'planning', 'pending'])
        .order('case_name', { ascending: true });

      if (error) throw error;
      setProjectCases(data || []);
    } catch (error) {
      console.error('Error fetching project cases:', error);
    }
  };

  // 複数測定単位対応のKPI指標取得
  const fetchIndicatorsWithUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_indicators_with_units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIndicatorsWithUnits(data || []);
    } catch (error) {
      console.error('Error fetching indicators with units:', error);
    }
  };

  // 複数測定単位対応のKPI目標取得
  const fetchMultiUnitTargets = async () => {
    try {
      let query = supabase
        .from('kpi_multi_unit_targets_detail')
        .select('*')
        .eq('target_period', selectedPeriod);

      // メンバーの場合は自分に関連するKPIのみ取得
      if (isMember && !isExecutive && currentMemberId) {
        const teamFilter = currentMemberInfo?.department ? `,assigned_team.eq.${currentMemberInfo.department}` : '';
        query = query.or(`assigned_member_id.eq.${currentMemberId}${teamFilter}`);
      }

      const { data, error } = await query.order('priority', { ascending: false });

      if (error) throw error;
      setMultiUnitTargets(data || []);
    } catch (error) {
      console.error('Error fetching multi-unit targets:', error);
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_kpi_overview')
        .select('*')
        .single();

      if (error) throw error;
      setDashboardStats(data || {
        total_kpis: 0,
        achieved_kpis: 0,
        on_track_kpis: 0,
        needs_attention_kpis: 0,
        at_risk_kpis: 0,
        current_month_avg_rate: 0,
        previous_month_avg_rate: 0,
        rate_change_from_previous: 0,
        personal_kpis: 0,
        team_kpis: 0,
        kgis: 0,
        critical_at_risk: 0,
        due_soon_count: 0,
        overdue_count: 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, department, position, role')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, []);

  // 新しい指標作成
  const handleCreateIndicator = async () => {
    // バリデーション
    if (showMultiUnitMode) {
      // 複数測定単位モードの場合
      if (!newIndicator.indicator_name.trim() || !newIndicator.category.trim()) {
        toast({
          title: 'エラー',
          description: '指標名とカテゴリは必須です。',
          variant: 'destructive',
        });
        return;
      }

      const validUnits = newMeasurementUnits.filter(unit => 
        unit.unit_name.trim() && unit.unit_symbol.trim()
      );

      if (validUnits.length === 0) {
        toast({
          title: 'エラー',
          description: '少なくとも1つの測定単位（単位名・記号）を入力してください。',
          variant: 'destructive',
        });
        return;
      }

      const primaryUnits = validUnits.filter(unit => unit.is_primary);
      if (primaryUnits.length === 0) {
        toast({
          title: 'エラー',
          description: '主要単位を1つ選択してください。',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // 標準モードの場合
      if (!newIndicator.indicator_name.trim() || !newIndicator.category.trim() || !newIndicator.measurement_unit.trim()) {
        toast({
          title: 'エラー',
          description: '指標名、カテゴリ、測定単位は必須です。',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsLoading(true);

      if (showMultiUnitMode) {
        // 複数測定単位での指標作成
        const validUnits = newMeasurementUnits.filter(unit => 
          unit.unit_name.trim() && unit.unit_symbol.trim()
        );

        // 指標作成
        const { data: indicatorData, error: indicatorError } = await supabase
          .from('kpi_indicators')
          .insert([{
            indicator_name: newIndicator.indicator_name,
            indicator_type: newIndicator.indicator_type,
            description: newIndicator.description,
            measurement_unit: validUnits.find(u => u.is_primary)?.unit_symbol || validUnits[0].unit_symbol, // 後方互換性
            measurement_method: newIndicator.measurement_method,
            category: newIndicator.category,
            frequency: newIndicator.frequency,
            target_type: newIndicator.target_type,
            created_by: user?.id,
          }])
          .select()
          .single();

        if (indicatorError) throw indicatorError;

        // 測定単位を作成
        const unitsToInsert = validUnits.map((unit, index) => ({
          indicator_id: indicatorData.id,
          unit_name: unit.unit_name,
          unit_symbol: unit.unit_symbol,
          unit_type: unit.unit_type,
          is_primary: unit.is_primary,
          display_order: index + 1,
          conversion_factor: 1,
          description: unit.description,
        }));

        const { error: unitsError } = await supabase
          .from('kpi_measurement_units')
          .insert(unitsToInsert);

        if (unitsError) throw unitsError;

        toast({
          title: '成功',
          description: `KPI/KGI指標が${validUnits.length}つの測定単位で作成されました。`,
        });

        // 複数測定単位のフォームをリセット
        setNewMeasurementUnits([
          { unit_name: '', unit_symbol: '', unit_type: 'count', is_primary: true, description: '' }
        ]);
      } else {
        // 標準モードでの指標作成
        const { error } = await supabase
          .from('kpi_indicators')
          .insert([{
            ...newIndicator,
            created_by: user?.id,
          }]);

        if (error) throw error;

        toast({
          title: '成功',
          description: 'KPI指標を作成しました。',
        });
      }

      setShowCreateDialog(false);
      setNewIndicator({
        indicator_name: '',
        indicator_type: 'personal_kpi',
        description: '',
        measurement_unit: '',
        measurement_method: '',
        category: '',
        frequency: 'monthly',
        target_type: 'increase',
      });
      
      // データを再取得
      fetchIndicators();
      if (showMultiUnitMode) {
        fetchIndicatorsWithUnits();
      }
    } catch (error) {
      console.error('Error creating indicator:', error);
      toast({
        title: 'エラー',
        description: 'KPI指標の作成に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 新しい目標作成
  const handleCreateTarget = async () => {
    if (!newTarget.indicator_id || newTarget.target_value <= 0) {
      toast({
        title: 'エラー',
        description: '指標と目標値は必須です。',
        variant: 'destructive',
      });
      return;
    }

    const selectedIndicator = indicators.find(i => i.id === newTarget.indicator_id);
    if (!selectedIndicator) {
      toast({
        title: 'エラー',
        description: '選択された指標が見つかりません。',
        variant: 'destructive',
      });
      return;
    }

    // 個人KPIの場合はメンバー指定必須、チームKPIの場合はチーム指定必須
    if (selectedIndicator.indicator_type === 'personal_kpi' && !newTarget.assigned_member_id) {
      toast({
        title: 'エラー',
        description: '個人KPIには担当者の指定が必要です。',
        variant: 'destructive',
      });
      return;
    }

    if (selectedIndicator.indicator_type === 'team_kpi' && !newTarget.assigned_team.trim()) {
      toast({
        title: 'エラー',
        description: 'チームKPIには担当チームの指定が必要です。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      const targetData = {
        ...newTarget,
        assigned_member_id: selectedIndicator.indicator_type === 'personal_kpi' ? newTarget.assigned_member_id : null,
        assigned_team: selectedIndicator.indicator_type === 'team_kpi' ? newTarget.assigned_team : null,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('kpi_targets')
        .insert([targetData]);

      if (error) throw error;

      toast({
        title: '成功',
        description: 'KPI目標を設定しました。',
      });

      setShowCreateTargetDialog(false);
      setNewTarget({
        indicator_id: '',
        target_period: selectedPeriod,
        assigned_member_id: '',
        assigned_team: '',
        target_value: 0,
        baseline_value: 0,
        priority: 'medium',
        start_date: '',
        end_date: '',
        notes: '',
      });
      fetchTargets();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error creating target:', error);
      toast({
        title: 'エラー',
        description: 'KPI目標の設定に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 進捗記録
  const handleRecordProgress = async () => {
    if (!selectedTargetForProgress || (!selectedTargetForProgress.target_id && !selectedTargetForProgress.id) || newProgress.recorded_value < 0 || !currentMemberId) {
      toast({
        title: 'エラー',
        description: '有効な記録値を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // 進捗記録データの検証とログ
      const progressData = {
        target_id: selectedTargetForProgress.target_id || selectedTargetForProgress.id,
        record_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        recorded_value: newProgress.recorded_value,
        previous_value: selectedTargetForProgress.current_value,
        comments: newProgress.comments || '',
        evidence_url: newProgress.evidence_url || '',
        recorded_by: currentMemberId,
        project_case_id: newProgress.project_case_id || null, // 案件ID
      };
      
      console.log('Progress data to insert:', progressData);

      // 進捗記録を挿入
      const { error: progressError } = await supabase
        .from('kpi_progress_records')
        .insert([progressData]);

      if (progressError) throw progressError;

      // 目標の現在値を更新
      const { error: updateError } = await supabase
        .from('kpi_targets')
        .update({ current_value: newProgress.recorded_value })
        .eq('id', selectedTargetForProgress.target_id || selectedTargetForProgress.id);

      if (updateError) throw updateError;

      toast({
        title: '成功',
        description: '進捗を記録しました。',
      });

      setShowProgressDialog(false);
      setSelectedTargetForProgress(null);
      setNewProgress({
        recorded_value: 0,
        comments: '',
        evidence_url: '',
        project_case_id: '',
      });
      setRecordedValueInput('');
      await fetchTargets();
      await fetchDashboardStats();
      // 進捗記録後に予測を再計算
      await calculateAllPredictions();
    } catch (error) {
      console.error('Error recording progress:', error);
      toast({
        title: 'エラー',
        description: '進捗記録に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // KPI指標削除
  const handleDeleteIndicator = async (indicatorId: string, indicatorName: string) => {
    if (!window.confirm(`指標「${indicatorName}」を削除しますか？\n\n注意: この指標に関連する目標・進捗記録もすべて削除されます。`)) {
      return;
    }

    try {
      setIsLoading(true);

      // まず関連する進捗記録を削除
      const { error: progressError } = await supabase
        .from('kpi_progress_records')
        .delete()
        .in('target_id', 
          supabase
            .from('kpi_targets')
            .select('id')
            .eq('indicator_id', indicatorId)
        );

      if (progressError) throw progressError;

      // 次に関連する目標を削除
      const { error: targetsError } = await supabase
        .from('kpi_targets')
        .delete()
        .eq('indicator_id', indicatorId);

      if (targetsError) throw targetsError;

      // 最後に指標を削除
      const { error: indicatorError } = await supabase
        .from('kpi_indicators')
        .delete()
        .eq('id', indicatorId);

      if (indicatorError) throw indicatorError;

      toast({
        title: '成功',
        description: `指標「${indicatorName}」を削除しました。`,
      });

      // データを再取得
      fetchIndicators();
      fetchTargets();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting indicator:', error);
      toast({
        title: 'エラー',
        description: '指標の削除に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // KPI目標削除
  const handleDeleteTarget = async (targetId: string, indicatorName: string) => {
    if (!window.confirm(`目標「${indicatorName}」を削除しますか？\n\n注意: この目標に関連する進捗記録もすべて削除されます。`)) {
      return;
    }

    try {
      setIsLoading(true);

      // まず関連する進捗記録を削除
      const { error: progressError } = await supabase
        .from('kpi_progress_records')
        .delete()
        .eq('target_id', targetId);

      if (progressError) throw progressError;

      // 次に目標を削除
      const { error: targetError } = await supabase
        .from('kpi_targets')
        .delete()
        .eq('id', targetId);

      if (targetError) throw targetError;

      toast({
        title: '成功',
        description: `目標「${indicatorName}」を削除しました。`,
      });

      // データを再取得
      fetchTargets();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting target:', error);
      toast({
        title: 'エラー',
        description: '目標の削除に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // メールアドレスからメンバーIDを取得
  const fetchMemberId = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, role, department')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching member ID:', error);
        return;
      }

      if (data) {
        setCurrentMemberId(data.id);
        setCurrentMemberInfo({ department: data.department });
        console.log('KPI Manager - Member ID found:', data.id);
      }
    } catch (error) {
      console.error('Error fetching member ID:', error);
    }
  };

  // useEffect
  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.role && (isExecutive || isMember) && currentMemberId) {
      const loadData = async () => {
        await fetchIndicators();
        await fetchTargets();
        // 複数測定単位対応データも取得
        if (showMultiUnitMode) {
          await fetchIndicatorsWithUnits();
          await fetchMultiUnitTargets();
        }
        if (isExecutive) {
          await fetchDashboardStats();
        }
        await fetchMembers();
        await fetchProjectCases();
        // 予測計算も実行
        if (targets.length > 0) {
          await calculateAllPredictions();
        }
      };
      loadData();
    }
  }, [selectedPeriod, user, isExecutive, isMember, currentMemberId, fetchIndicators, fetchTargets, fetchDashboardStats, fetchMembers]);

  // targetsが更新されたときに予測を再計算
  useEffect(() => {
    if (targets.length > 0) {
      calculateAllPredictions();
    }
  }, [targets]);

  // ヘルパー関数
  const getPerformanceIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'on_track':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'needs_attention':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'at_risk':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPerformanceColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'on_track':
        return 'bg-blue-100 text-blue-800';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personal_kpi':
        return <Target className="w-4 h-4" />;
      case 'team_kpi':
        return <Users className="w-4 h-4" />;
      case 'kgi':
        return <Building className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  // 進捗予測ヘルパー関数
  const getTrendIcon = (trendStatus: string) => {
    switch (trendStatus) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <LineChart className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trendStatus: string) => {
    switch (trendStatus) {
      case 'improving':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      case 'stable':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPredictionForTarget = (targetId: string): KPIPrediction | undefined => {
    return predictions.find(p => p.target_id === targetId);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPI/KGI管理</h2>
          <p className="text-gray-600 mt-1">
            個人KPI・チームKPI・KGIの設定と進捗管理
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={showMultiUnitMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowMultiUnitMode(!showMultiUnitMode);
                if (!showMultiUnitMode) {
                  fetchIndicatorsWithUnits();
                  fetchMultiUnitTargets();
                }
              }}
            >
              <Calculator className="w-4 h-4 mr-2" />
              {showMultiUnitMode ? "標準モード" : "複数単位モード"}
            </Button>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新しい指標作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新しいKPI/KGI指標を作成</DialogTitle>
                <DialogDescription>
                  個人KPI、チームKPI、またはKGI指標を新規作成します。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="indicator_name">指標名 *</Label>
                    <Input
                      id="indicator_name"
                      value={newIndicator.indicator_name}
                      onChange={(e) => setNewIndicator({ ...newIndicator, indicator_name: e.target.value })}
                      placeholder="例: 月次売上目標"
                    />
                  </div>
                  <div>
                    <Label htmlFor="indicator_type">指標タイプ *</Label>
                    <Select
                      value={newIndicator.indicator_type}
                      onValueChange={(value: 'personal_kpi' | 'team_kpi' | 'kgi') => 
                        setNewIndicator({ ...newIndicator, indicator_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal_kpi">個人KPI</SelectItem>
                        <SelectItem value="team_kpi">チームKPI</SelectItem>
                        <SelectItem value="kgi">KGI（重要目標達成指標）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 測定単位セクション - 複数対応時は独立した行として配置 */}
                {showMultiUnitMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">測定単位設定（複数対応）*</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewMeasurementUnits([
                          ...newMeasurementUnits,
                          { unit_name: '', unit_symbol: '', unit_type: 'count', is_primary: false, description: '' }
                        ])}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        単位追加
                      </Button>
                    </div>
                    <div className="grid gap-4 max-h-60 overflow-y-auto">
                      {newMeasurementUnits.map((unit, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium bg-blue-100 px-2 py-1 rounded">
                                単位 {index + 1}
                              </span>
                              {unit.is_primary && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  主要
                                </span>
                              )}
                            </div>
                            {newMeasurementUnits.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewMeasurementUnits(newMeasurementUnits.filter((_, i) => i !== index))}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-600">単位名</Label>
                              <Input
                                placeholder="例: 売上金額"
                                value={unit.unit_name}
                                onChange={(e) => {
                                  const updated = [...newMeasurementUnits];
                                  updated[index].unit_name = e.target.value;
                                  setNewMeasurementUnits(updated);
                                }}
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">記号</Label>
                              <Input
                                placeholder="例: 万円"
                                value={unit.unit_symbol}
                                onChange={(e) => {
                                  const updated = [...newMeasurementUnits];
                                  updated[index].unit_symbol = e.target.value;
                                  setNewMeasurementUnits(updated);
                                }}
                                className="h-9"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between space-x-3">
                            <div className="flex-1">
                              <Label className="text-xs text-gray-600">単位タイプ</Label>
                              <Select
                                value={unit.unit_type}
                                onValueChange={(value: 'count' | 'amount' | 'percentage' | 'ratio' | 'time' | 'score') => {
                                  const updated = [...newMeasurementUnits];
                                  updated[index].unit_type = value;
                                  setNewMeasurementUnits(updated);
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="count">数量</SelectItem>
                                  <SelectItem value="amount">金額</SelectItem>
                                  <SelectItem value="percentage">割合</SelectItem>
                                  <SelectItem value="ratio">比率</SelectItem>
                                  <SelectItem value="time">時間</SelectItem>
                                  <SelectItem value="score">スコア</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-5">
                              <input
                                type="checkbox"
                                id={`primary-${index}`}
                                checked={unit.is_primary}
                                onChange={(e) => {
                                  const updated = [...newMeasurementUnits];
                                  // 主要単位は1つだけ
                                  if (e.target.checked) {
                                    updated.forEach((u, i) => u.is_primary = i === index);
                                  } else {
                                    updated[index].is_primary = false;
                                  }
                                  setNewMeasurementUnits(updated);
                                }}
                                className="rounded"
                              />
                              <Label htmlFor={`primary-${index}`} className="text-sm cursor-pointer">
                                主要単位
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-3 gap-4">
                  {!showMultiUnitMode && (
                    <div>
                      <Label htmlFor="measurement_unit">測定単位 *</Label>
                      <Input
                        id="measurement_unit"
                        value={newIndicator.measurement_unit}
                        onChange={(e) => setNewIndicator({ ...newIndicator, measurement_unit: e.target.value })}
                        placeholder="例: 万円、件、%"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="category">カテゴリ *</Label>
                    <Select
                      value={newIndicator.category}
                      onValueChange={(value) => setNewIndicator({ ...newIndicator, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="売上">売上</SelectItem>
                        <SelectItem value="営業">営業</SelectItem>
                        <SelectItem value="マーケティング">マーケティング</SelectItem>
                        <SelectItem value="顧客満足度">顧客満足度</SelectItem>
                        <SelectItem value="品質">品質</SelectItem>
                        <SelectItem value="効率性">効率性</SelectItem>
                        <SelectItem value="財務">財務</SelectItem>
                        <SelectItem value="人材">人材</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frequency">測定頻度</Label>
                    <Select
                      value={newIndicator.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project-based') => 
                        setNewIndicator({ ...newIndicator, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">日次</SelectItem>
                        <SelectItem value="weekly">週次</SelectItem>
                        <SelectItem value="monthly">月次</SelectItem>
                        <SelectItem value="quarterly">四半期</SelectItem>
                        <SelectItem value="yearly">年次</SelectItem>
                        <SelectItem value="project-based">案件ごと</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={newIndicator.description}
                    onChange={(e) => setNewIndicator({ ...newIndicator, description: e.target.value })}
                    placeholder="指標の詳細説明"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="measurement_method">測定方法</Label>
                  <Textarea
                    id="measurement_method"
                    value={newIndicator.measurement_method}
                    onChange={(e) => setNewIndicator({ ...newIndicator, measurement_method: e.target.value })}
                    placeholder="どのように測定するかの説明"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateIndicator} disabled={isLoading}>
                    {isLoading ? '作成中...' : '作成'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {isExecutive ? (
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="personal">個人KPI</TabsTrigger>
            <TabsTrigger value="team">チームKPI</TabsTrigger>
            <TabsTrigger value="kgi">KGI</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">個人KPI</TabsTrigger>
            <TabsTrigger value="team">チームKPI</TabsTrigger>
          </TabsList>
        )}

        {/* 概要タブ */}
        {isExecutive && (
          <TabsContent value="overview" className="space-y-6">
            {/* ダッシュボード統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">総KPI数</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_kpis}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">平均達成率</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-gray-900">
                          {(dashboardStats.current_month_avg_rate || 0).toFixed(1)}%
                        </p>
                        {dashboardStats.rate_change_from_previous !== 0 && (
                          <Badge variant={dashboardStats.rate_change_from_previous > 0 ? "default" : "destructive"}>
                            {dashboardStats.rate_change_from_previous > 0 ? '+' : ''}
                            {(dashboardStats.rate_change_from_previous || 0).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">達成済み</p>
                      <p className="text-2xl font-bold text-green-600">{dashboardStats.achieved_kpis}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">要注意</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dashboardStats.at_risk_kpis + dashboardStats.critical_at_risk}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPI分類別統計 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    個人KPI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{dashboardStats.personal_kpis}</p>
                    <p className="text-sm text-gray-600 mt-1">設定済み</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    チームKPI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{dashboardStats.team_kpis}</p>
                    <p className="text-sm text-gray-600 mt-1">設定済み</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Building className="w-5 h-5 mr-2 text-purple-600" />
                    KGI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{dashboardStats.kgis}</p>
                    <p className="text-sm text-gray-600 mt-1">設定済み</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 期限・パフォーマンス アラート */}
            {(dashboardStats.overdue_count > 0 || dashboardStats.due_soon_count > 0 || dashboardStats.critical_at_risk > 0) && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    アラート
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboardStats.overdue_count > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="font-semibold text-red-800">期限切れ</p>
                        <p className="text-2xl font-bold text-red-600">{dashboardStats.overdue_count}</p>
                        <p className="text-sm text-red-600">件のKPIが期限切れです</p>
                      </div>
                    )}
                    {dashboardStats.due_soon_count > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="font-semibold text-yellow-800">期限間近</p>
                        <p className="text-2xl font-bold text-yellow-600">{dashboardStats.due_soon_count}</p>
                        <p className="text-sm text-yellow-600">件のKPIが期限間近です</p>
                      </div>
                    )}
                    {dashboardStats.critical_at_risk > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="font-semibold text-red-800">緊急対応必要</p>
                        <p className="text-2xl font-bold text-red-600">{dashboardStats.critical_at_risk}</p>
                        <p className="text-sm text-red-600">件の重要KPIがリスク状態です</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 指標管理セクション */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>指標管理</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新しい指標作成
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指標名</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>測定単位</TableHead>
                      <TableHead>頻度</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicators.map((indicator) => (
                      <TableRow key={indicator.id}>
                        <TableCell className="font-medium">{indicator.indicator_name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            indicator.indicator_type === 'personal_kpi' ? 'default' :
                            indicator.indicator_type === 'team_kpi' ? 'secondary' : 'destructive'
                          }>
                            {indicator.indicator_type === 'personal_kpi' ? '個人KPI' :
                             indicator.indicator_type === 'team_kpi' ? 'チームKPI' : 'KGI'}
                          </Badge>
                        </TableCell>
                        <TableCell>{indicator.category}</TableCell>
                        <TableCell>{indicator.measurement_unit}</TableCell>
                        <TableCell>{getFrequencyLabel(indicator.frequency)}</TableCell>
                        <TableCell>{new Date(indicator.created_at).toLocaleDateString('ja-JP')}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteIndicator(indicator.id, indicator.indicator_name)}
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {indicators.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          指標が作成されていません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 個人KPIタブ */}
        <TabsContent value="personal" className="space-y-6">
          {/* 普通の社員向け簡単な個人KPI作成・管理 */}
          {isMember && !isExecutive ? (
            <PersonalKPICreator />
          ) : (
            <div>
              <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">個人KPI管理</h3>
            {isExecutive && (
              <Dialog open={showCreateTargetDialog} onOpenChange={setShowCreateTargetDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新しい目標設定
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {activeTab === 'personal' ? '個人KPI目標を設定' :
                       activeTab === 'team' ? 'チームKPI目標を設定' :
                       'KGI目標を設定'}
                    </DialogTitle>
                    <DialogDescription>
                      {activeTab === 'personal' ? '作成済みの個人KPI指標に対して具体的な目標値と期限を設定します。' :
                       activeTab === 'team' ? '作成済みのチームKPI指標に対して具体的な目標値と期限を設定します。' :
                       '作成済みのKGI指標に対して具体的な目標値と期限を設定します。'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target_indicator">
                          {activeTab === 'personal' ? 'KPI指標' :
                           activeTab === 'team' ? 'チームKPI指標' :
                           'KGI指標'} *
                        </Label>
                        <Select
                          value={newTarget.indicator_id}
                          onValueChange={(value) => setNewTarget({ ...newTarget, indicator_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="指標を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {indicators
                              .filter(i => i.indicator_type === (activeTab === 'personal' ? 'personal_kpi' : activeTab === 'team' ? 'team_kpi' : 'kgi'))
                              .map((indicator) => (
                                <SelectItem key={indicator.id} value={indicator.id}>
                                  {indicator.indicator_name} ({indicator.measurement_unit})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        {activeTab === 'personal' ? (
                          <>
                            <Label htmlFor="target_member">担当者 *</Label>
                            <Select
                              value={newTarget.assigned_member_id}
                              onValueChange={(value) => setNewTarget({ ...newTarget, assigned_member_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="担当者を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} ({member.department})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        ) : activeTab === 'team' ? (
                          <>
                            <Label htmlFor="target_team">担当チーム *</Label>
                            <Select
                              value={newTarget.assigned_team}
                              onValueChange={(value) => setNewTarget({ ...newTarget, assigned_team: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="チームを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="営業部">営業部</SelectItem>
                                <SelectItem value="開発部">開発部</SelectItem>
                                <SelectItem value="マーケティング部">マーケティング部</SelectItem>
                                <SelectItem value="管理部">管理部</SelectItem>
                                <SelectItem value="人事部">人事部</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <div>
                            <Label>対象範囲</Label>
                            <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                              全社目標
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="target_value">目標値 *</Label>
                        <Input
                          id="target_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newTarget.target_value === 0 ? '' : newTarget.target_value}
                          placeholder="目標値を入力"
                          onChange={(e) => setNewTarget({ ...newTarget, target_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="baseline_value">ベースライン値</Label>
                        <Input
                          id="baseline_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newTarget.baseline_value === 0 ? '' : newTarget.baseline_value}
                          placeholder="基準値を入力"
                          onChange={(e) => setNewTarget({ ...newTarget, baseline_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">優先度</Label>
                        <Select
                          value={newTarget.priority}
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                            setNewTarget({ ...newTarget, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="critical">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">開始日 *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={newTarget.start_date}
                          onChange={(e) => setNewTarget({ ...newTarget, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">終了日 *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newTarget.end_date}
                          onChange={(e) => setNewTarget({ ...newTarget, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">備考</Label>
                      <Textarea
                        id="notes"
                        value={newTarget.notes}
                        onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                        placeholder="目標に関する備考"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateTargetDialog(false)}>
                        キャンセル
                      </Button>
                      <Button onClick={handleCreateTarget} disabled={isLoading}>
                        {isLoading ? '設定中...' : '設定'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* 個人KPI一覧テーブル */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>指標名</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>目標値</TableHead>
                    <TableHead>現在値</TableHead>
                    <TableHead>達成率</TableHead>
                    <TableHead>予測達成率</TableHead>
                    <TableHead>完了予測</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>期限</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets
                    .filter(t => t.indicator_type === 'personal_kpi')
                    .map((target) => (
                      <TableRow key={target.target_id || target.id}>
                        <TableCell className="font-medium">{target.indicator_name}</TableCell>
                        <TableCell>{target.assigned_member_name}</TableCell>
                        <TableCell>{target.target_value}</TableCell>
                        <TableCell>{target.current_value}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.min(target.achievement_rate || 0, 100)} className="w-16" />
                            <span className="text-sm">{(target.achievement_rate || 0).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const prediction = getPredictionForTarget(target.target_id || target.id);
                            return prediction ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Progress value={Math.min(prediction.predicted_completion_percentage, 100)} className="w-16" />
                                  <span className="text-sm font-medium">
                                    {prediction.predicted_completion_percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getTrendIcon(prediction.trend_status)}
                                  <Badge className={`text-xs ${getTrendColor(prediction.trend_status)}`}>
                                    {prediction.trend_status === 'improving' ? '改善' :
                                     prediction.trend_status === 'declining' ? '悪化' : '安定'}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">データ不足</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const prediction = getPredictionForTarget(target.target_id || target.id);
                            return prediction ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {(() => {
                                    // 期限までの残り日数を計算
                                    const endDate = new Date(target.end_date + 'T23:59:59');
                                    const currentDate = new Date();
                                    const daysUntilDeadline = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
                                    
                                    if (prediction.months_to_completion === Infinity) {
                                      return <span className="text-red-600">達成困難</span>;
                                    }
                                    
                                    // 期限内に達成可能かチェック
                                    const theoreticalDays = Math.ceil(prediction.months_to_completion * 30);
                                    const canAchieveByDeadline = theoreticalDays <= daysUntilDeadline;
                                    
                                    if (daysUntilDeadline <= 30) {
                                      // 期限が1ヶ月以内の場合は日数で表示
                                      return (
                                        <div>
                                          <span className={canAchieveByDeadline ? 'text-green-600' : 'text-red-600'}>
                                            期限まで{daysUntilDeadline}日
                                          </span>
                                          {!canAchieveByDeadline && (
                                            <div className="text-xs text-red-500">
                                              (現ペース: {theoreticalDays}日必要)
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // 期限が1ヶ月以上先の場合は月数で表示
                                      return (
                                        <span className={prediction.on_track ? 'text-green-600' : 'text-yellow-600'}>
                                          あと{Math.round(prediction.months_to_completion * 10) / 10}ヶ月
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  必要進捗: {
                                    prediction.required_monthly_rate === Infinity ? '計算不可' :
                                    prediction.required_monthly_rate.toFixed(1) + '%/月'
                                  }
                                </div>
                                <Badge className={`text-xs ${getConfidenceColor(prediction.prediction_confidence)}`}>
                                  信頼度: {prediction.prediction_confidence === 'high' ? '高' :
                                           prediction.prediction_confidence === 'medium' ? '中' : '低'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPerformanceColor(target.performance_status)} flex items-center space-x-1`}>
                            {getPerformanceIcon(target.performance_status)}
                            <span>{target.performance_status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(target.priority)}>
                            {target.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(target.end_date).toLocaleDateString('ja-JP')}</p>
                            {target.timeline_status === 'overdue' && (
                              <Badge variant="destructive" className="text-xs">期限切れ</Badge>
                            )}
                            {target.timeline_status === 'due_soon' && (
                              <Badge variant="outline" className="text-xs">期限間近</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTargetForProgress(target);
                                setNewProgress({ recorded_value: 0, comments: '', evidence_url: '', project_case_id: '' });
                                setRecordedValueInput('');
                                setShowProgressDialog(true);
                              }}
                            >
                              進捗記録
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTargetForPrediction(target);
                                setShowPredictionDialog(true);
                              }}
                              title="予測詳細"
                            >
                              <Calculator className="w-4 h-4" />
                            </Button>
                            {isExecutive && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTarget(target.target_id || target.id, target.indicator_name)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {targets.filter(t => t.indicator_type === 'personal_kpi').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        個人KPIが設定されていません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </div>
          )}
        </TabsContent>

        {/* チームKPIタブ */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">チームKPI管理</h3>
            {isExecutive && (
              <Dialog open={showCreateTargetDialog} onOpenChange={setShowCreateTargetDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新しい目標設定
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>チームKPI目標を設定</DialogTitle>
                    <DialogDescription>
                      作成済みのチームKPI指標に対して具体的な目標値と期限を設定します。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target_indicator">チームKPI指標 *</Label>
                        <Select
                          value={newTarget.indicator_id}
                          onValueChange={(value) => setNewTarget({ ...newTarget, indicator_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="指標を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {indicators
                              .filter(i => i.indicator_type === 'team_kpi')
                              .map((indicator) => (
                                <SelectItem key={indicator.id} value={indicator.id}>
                                  {indicator.indicator_name} ({indicator.measurement_unit})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="target_team">担当チーム *</Label>
                        <Select
                          value={newTarget.assigned_team}
                          onValueChange={(value) => setNewTarget({ ...newTarget, assigned_team: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="チームを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="営業部">営業部</SelectItem>
                            <SelectItem value="開発部">開発部</SelectItem>
                            <SelectItem value="マーケティング部">マーケティング部</SelectItem>
                            <SelectItem value="管理部">管理部</SelectItem>
                            <SelectItem value="人事部">人事部</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="target_value">目標値 *</Label>
                        <Input
                          id="target_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newTarget.target_value === 0 ? '' : newTarget.target_value}
                          placeholder="目標値を入力"
                          onChange={(e) => setNewTarget({ ...newTarget, target_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="baseline_value">ベースライン値</Label>
                        <Input
                          id="baseline_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newTarget.baseline_value === 0 ? '' : newTarget.baseline_value}
                          placeholder="基準値を入力"
                          onChange={(e) => setNewTarget({ ...newTarget, baseline_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">優先度</Label>
                        <Select
                          value={newTarget.priority}
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                            setNewTarget({ ...newTarget, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="critical">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">開始日 *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={newTarget.start_date}
                          onChange={(e) => setNewTarget({ ...newTarget, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">終了日 *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newTarget.end_date}
                          onChange={(e) => setNewTarget({ ...newTarget, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">備考</Label>
                      <Textarea
                        id="notes"
                        value={newTarget.notes}
                        onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                        placeholder="目標に関する備考"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateTargetDialog(false)}>
                        キャンセル
                      </Button>
                      <Button onClick={handleCreateTarget} disabled={isLoading}>
                        {isLoading ? '設定中...' : '設定'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

                      <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>指標名</TableHead>
                    <TableHead>担当チーム</TableHead>
                    <TableHead>目標値</TableHead>
                    <TableHead>現在値</TableHead>
                    <TableHead>達成率</TableHead>
                    <TableHead>予測達成率</TableHead>
                    <TableHead>完了予測</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>期限</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets
                    .filter(t => t.indicator_type === 'team_kpi')
                    .map((target) => (
                      <TableRow key={target.target_id || target.id}>
                        <TableCell className="font-medium">{target.indicator_name}</TableCell>
                        <TableCell>{target.assigned_team}</TableCell>
                        <TableCell>{target.target_value}</TableCell>
                        <TableCell>{target.current_value}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.min(target.achievement_rate || 0, 100)} className="w-16" />
                            <span className="text-sm">{(target.achievement_rate || 0).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const prediction = getPredictionForTarget(target.target_id || target.id);
                            return prediction ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Progress value={Math.min(prediction.predicted_completion_percentage, 100)} className="w-16" />
                                  <span className="text-sm font-medium">
                                    {prediction.predicted_completion_percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getTrendIcon(prediction.trend_status)}
                                  <Badge className={`text-xs ${getTrendColor(prediction.trend_status)}`}>
                                    {prediction.trend_status === 'improving' ? '改善' :
                                     prediction.trend_status === 'declining' ? '悪化' : '安定'}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">データ不足</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const prediction = getPredictionForTarget(target.target_id || target.id);
                            return prediction ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {(() => {
                                    // 期限までの残り日数を計算
                                    const endDate = new Date(target.end_date + 'T23:59:59');
                                    const currentDate = new Date();
                                    const daysUntilDeadline = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
                                    
                                    if (prediction.months_to_completion === Infinity) {
                                      return <span className="text-red-600">達成困難</span>;
                                    }
                                    
                                    // 期限内に達成可能かチェック
                                    const theoreticalDays = Math.ceil(prediction.months_to_completion * 30);
                                    const canAchieveByDeadline = theoreticalDays <= daysUntilDeadline;
                                    
                                    if (daysUntilDeadline <= 30) {
                                      // 期限が1ヶ月以内の場合は日数で表示
                                      return (
                                        <div>
                                          <span className={canAchieveByDeadline ? 'text-green-600' : 'text-red-600'}>
                                            期限まで{daysUntilDeadline}日
                                          </span>
                                          {!canAchieveByDeadline && (
                                            <div className="text-xs text-red-500">
                                              (現ペース: {theoreticalDays}日必要)
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } else {
                                      // 期限が1ヶ月以上先の場合は月数で表示
                                      return (
                                        <span className={prediction.on_track ? 'text-green-600' : 'text-yellow-600'}>
                                          あと{Math.round(prediction.months_to_completion * 10) / 10}ヶ月
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  必要進捗: {
                                    prediction.required_monthly_rate === Infinity ? '計算不可' :
                                    prediction.required_monthly_rate.toFixed(1) + '%/月'
                                  }
                                </div>
                                <Badge className={`text-xs ${getConfidenceColor(prediction.prediction_confidence)}`}>
                                  信頼度: {prediction.prediction_confidence === 'high' ? '高' :
                                           prediction.prediction_confidence === 'medium' ? '中' : '低'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPerformanceColor(target.performance_status)} flex items-center space-x-1`}>
                            {getPerformanceIcon(target.performance_status)}
                            <span>{target.performance_status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(target.priority)}>
                            {target.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(target.end_date).toLocaleDateString('ja-JP')}</p>
                            {target.timeline_status === 'overdue' && (
                              <Badge variant="destructive" className="text-xs">期限切れ</Badge>
                            )}
                            {target.timeline_status === 'due_soon' && (
                              <Badge variant="outline" className="text-xs">期限間近</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTargetForProgress(target);
                                setNewProgress({ recorded_value: 0, comments: '', evidence_url: '', project_case_id: '' });
                                setRecordedValueInput('');
                                setShowProgressDialog(true);
                              }}
                            >
                              進捗記録
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTargetForPrediction(target);
                                setShowPredictionDialog(true);
                              }}
                              title="予測詳細"
                            >
                              <Calculator className="w-4 h-4" />
                            </Button>
                            {isExecutive && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTarget(target.target_id || target.id, target.indicator_name)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {targets.filter(t => t.indicator_type === 'team_kpi').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        チームKPIが設定されていません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KGIタブ */}
        {isExecutive && (
          <TabsContent value="kgi" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">KGI（重要目標達成指標）管理</h3>
              <Dialog open={showCreateTargetDialog} onOpenChange={setShowCreateTargetDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新しい目標設定
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>KGI目標を設定</DialogTitle>
                    <DialogDescription>
                      作成済みのKGI指標に対して具体的な目標値と期限を設定します。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target_indicator">KGI指標 *</Label>
                        <Select
                          value={newTarget.indicator_id}
                          onValueChange={(value) => setNewTarget({ ...newTarget, indicator_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="指標を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {indicators
                              .filter(i => i.indicator_type === 'kgi')
                              .map((indicator) => (
                                <SelectItem key={indicator.id} value={indicator.id}>
                                  {indicator.indicator_name} ({indicator.measurement_unit})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>対象範囲</Label>
                        <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                          全社目標
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="target_value">目標値 *</Label>
                        <Input
                          id="target_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newTarget.target_value === 0 ? '' : newTarget.target_value}
                          placeholder="目標値を入力"
                          onChange={(e) => setNewTarget({ ...newTarget, target_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="baseline_value">ベースライン値</Label>
                        <Input
                          id="baseline_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newTarget.baseline_value === 0 ? '' : newTarget.baseline_value}
                          placeholder="基準値を入力"
                          onChange={(e) => setNewTarget({ ...newTarget, baseline_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">優先度</Label>
                        <Select
                          value={newTarget.priority}
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                            setNewTarget({ ...newTarget, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="critical">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">開始日 *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={newTarget.start_date}
                          onChange={(e) => setNewTarget({ ...newTarget, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">終了日 *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newTarget.end_date}
                          onChange={(e) => setNewTarget({ ...newTarget, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">備考</Label>
                      <Textarea
                        id="notes"
                        value={newTarget.notes}
                        onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                        placeholder="目標に関する備考"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateTargetDialog(false)}>
                        キャンセル
                      </Button>
                      <Button onClick={handleCreateTarget} disabled={isLoading}>
                        {isLoading ? '設定中...' : '設定'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指標名</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>目標値</TableHead>
                      <TableHead>現在値</TableHead>
                      <TableHead>達成率</TableHead>
                      <TableHead>予測達成率</TableHead>
                      <TableHead>完了予測</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>優先度</TableHead>
                      <TableHead>期限</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targets
                      .filter(t => t.indicator_type === 'kgi')
                      .map((target) => (
                        <TableRow key={target.target_id || target.id}>
                          <TableCell className="font-medium">{target.indicator_name}</TableCell>
                          <TableCell>
                            {indicators.find(i => i.id === target.indicator_id)?.category || 'N/A'}
                          </TableCell>
                          <TableCell>{target.target_value}</TableCell>
                          <TableCell>{target.current_value}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={Math.min(target.achievement_rate || 0, 100)} className="w-16" />
                              <span className="text-sm">{(target.achievement_rate || 0).toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const prediction = getPredictionForTarget(target.target_id || target.id);
                              return prediction ? (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Progress value={Math.min(prediction.predicted_completion_percentage, 100)} className="w-16" />
                                    <span className="text-sm font-medium">
                                      {prediction.predicted_completion_percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {getTrendIcon(prediction.trend_status)}
                                    <Badge className={`text-xs ${getTrendColor(prediction.trend_status)}`}>
                                      {prediction.trend_status === 'improving' ? '改善' :
                                       prediction.trend_status === 'declining' ? '悪化' : '安定'}
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">データ不足</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const prediction = getPredictionForTarget(target.target_id || target.id);
                              return prediction ? (
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    {prediction.months_to_completion === Infinity ? (
                                      <span className="text-red-600">達成困難</span>
                                    ) : (
                                      <span className={prediction.on_track ? 'text-green-600' : 'text-yellow-600'}>
                                        あと{prediction.months_to_completion}ヶ月
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    必要進捗: {prediction.required_monthly_rate.toFixed(1)}%/月
                                  </div>
                                  <Badge className={`text-xs ${getConfidenceColor(prediction.prediction_confidence)}`}>
                                    信頼度: {prediction.prediction_confidence === 'high' ? '高' :
                                             prediction.prediction_confidence === 'medium' ? '中' : '低'}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">-</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPerformanceColor(target.performance_status)} flex items-center space-x-1`}>
                              {getPerformanceIcon(target.performance_status)}
                              <span>{target.performance_status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(target.priority)}>
                              {target.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(target.end_date).toLocaleDateString('ja-JP')}</p>
                              {target.timeline_status === 'overdue' && (
                                <Badge variant="destructive" className="text-xs">期限切れ</Badge>
                              )}
                              {target.timeline_status === 'due_soon' && (
                                <Badge variant="outline" className="text-xs">期限間近</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTargetForProgress(target);
                                  setNewProgress({ recorded_value: 0, comments: '', evidence_url: '', project_case_id: '' });
                                  setRecordedValueInput('');
                                  setShowProgressDialog(true);
                                }}
                              >
                                進捗記録
                              </Button>
                              {isExecutive && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteTarget(target.target_id || target.id, target.indicator_name)}
                                  disabled={isLoading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {targets.filter(t => t.indicator_type === 'kgi').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                          KGIが設定されていません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* 進捗記録ダイアログ */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>進捗記録</DialogTitle>
            <DialogDescription>
              KPI目標に対する最新の実績値を記録して進捗を更新します。
            </DialogDescription>
          </DialogHeader>
          {selectedTargetForProgress && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold">{selectedTargetForProgress.indicator_name}</h4>
                <p className="text-sm text-gray-600">
                  目標値: {selectedTargetForProgress.target_value} | 
                  現在値: {selectedTargetForProgress.current_value} | 
                  達成率: {(selectedTargetForProgress.achievement_rate || 0).toFixed(1)}%
                </p>
              </div>

              <div>
                <Label htmlFor="recorded_value">記録値 *</Label>
                <Input
                  id="recorded_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={recordedValueInput}
                  placeholder="実績値を入力"
                  onChange={(e) => {
                    setRecordedValueInput(e.target.value);
                    setNewProgress({ ...newProgress, recorded_value: parseFloat(e.target.value) || 0 });
                  }}
                />
              </div>

              <div>
                <Label htmlFor="comments">コメント</Label>
                <Textarea
                  id="comments"
                  value={newProgress.comments}
                  onChange={(e) => setNewProgress({ ...newProgress, comments: e.target.value })}
                  placeholder="進捗に関するコメント"
                  rows={3}
                />
              </div>

              {/* 案件ごと測定の場合の案件選択 */}
              {selectedTargetForProgress?.frequency === 'project-based' && (
                <div>
                  <Label htmlFor="project_case">関連案件</Label>
                  <Select
                    value={newProgress.project_case_id}
                    onValueChange={(value) => setNewProgress({ ...newProgress, project_case_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="案件を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectCases.map((projectCase) => (
                        <SelectItem key={projectCase.id} value={projectCase.id}>
                          {projectCase.case_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="evidence_url">根拠資料URL</Label>
                <Input
                  id="evidence_url"
                  type="url"
                  value={newProgress.evidence_url}
                  onChange={(e) => setNewProgress({ ...newProgress, evidence_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleRecordProgress} disabled={isLoading}>
                  {isLoading ? '記録中...' : '記録'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 進捗予測詳細ダイアログ */}
      <Dialog open={showPredictionDialog} onOpenChange={setShowPredictionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>進捗予測詳細</DialogTitle>
            <DialogDescription>
              現在の進捗データを基に、目標達成見込みと必要な対策を分析します。
            </DialogDescription>
          </DialogHeader>
          {selectedTargetForPrediction && (() => {
            const prediction = getPredictionForTarget(selectedTargetForPrediction.target_id || selectedTargetForPrediction.id);
            return (
              <div className="space-y-6">
                {/* KPI基本情報 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedTargetForPrediction.indicator_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">目標値</Label>
                        <p className="text-xl font-bold">{selectedTargetForPrediction.target_value}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">現在値</Label>
                        <p className="text-xl font-bold">{selectedTargetForPrediction.current_value}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">現在の達成率</Label>
                        <p className="text-xl font-bold text-blue-600">
                          {(selectedTargetForPrediction.achievement_rate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">期限</Label>
                        <p className="text-lg font-semibold">
                          {new Date(selectedTargetForPrediction.end_date).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {prediction ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 予測結果 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <LineChart className="w-5 h-5 mr-2" />
                          予測結果
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">予測達成率</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={Math.min(prediction.predicted_completion_percentage, 100)} className="flex-1" />
                            <span className="text-lg font-bold">
                              {prediction.predicted_completion_percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-600">完了予測</Label>
                          <p className="text-lg font-semibold">
                            {(() => {
                              // 期限までの残り日数を計算
                              const endDate = new Date(selectedTargetForPrediction.end_date + 'T23:59:59');
                              const currentDate = new Date();
                              const daysUntilDeadline = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
                              
                              if (prediction.months_to_completion === Infinity) {
                                return <span className="text-red-600">現在のペースでは達成困難</span>;
                              }
                              
                              // 期限内に達成可能かチェック
                              const theoreticalDays = Math.ceil(prediction.months_to_completion * 30);
                              const canAchieveByDeadline = theoreticalDays <= daysUntilDeadline;
                              
                              if (daysUntilDeadline <= 30) {
                                // 期限が1ヶ月以内の場合
                                return (
                                  <div>
                                    <span className={canAchieveByDeadline ? 'text-green-600' : 'text-red-600'}>
                                      期限まで{daysUntilDeadline}日
                                    </span>
                                    {!canAchieveByDeadline && (
                                      <div className="text-sm text-red-500 mt-1">
                                        現在のペースでは{theoreticalDays}日必要（期限オーバー）
                                      </div>
                                    )}
                                  </div>
                                );
                              } else {
                                // 期限が1ヶ月以上先の場合
                                return (
                                  <span className={prediction.on_track ? 'text-green-600' : 'text-yellow-600'}>
                                    あと{Math.round(prediction.months_to_completion * 10) / 10}ヶ月で100%達成
                                  </span>
                                );
                              }
                            })()}
                          </p>
                          {prediction.months_to_completion !== Infinity && (
                            <p className="text-sm text-gray-600">
                              予測完了日: {new Date(prediction.predicted_completion_date).toLocaleDateString('ja-JP')}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm text-gray-600">トレンド状況</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            {getTrendIcon(prediction.trend_status)}
                            <Badge className={getTrendColor(prediction.trend_status)}>
                              {prediction.trend_status === 'improving' ? '改善傾向' :
                               prediction.trend_status === 'declining' ? '悪化傾向' : '安定'}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-600">予測信頼度</Label>
                          <Badge className={getConfidenceColor(prediction.prediction_confidence)}>
                            {prediction.prediction_confidence === 'high' ? '高信頼度' :
                             prediction.prediction_confidence === 'medium' ? '中信頼度' : '低信頼度'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 必要な対策 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Target className="w-5 h-5 mr-2" />
                          必要な対策
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">現在の月次進捗率</Label>
                          <p className="text-lg font-semibold">
                            {prediction.monthly_progress_rate.toFixed(1)}% / 月
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-600">目標達成に必要な月次進捗率</Label>
                          <p className="text-lg font-bold text-blue-600">
                            {prediction.required_monthly_rate === Infinity ? '計算不可（期限切れ）' : 
                             `${prediction.required_monthly_rate.toFixed(1)}% / 月`}
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-600">進捗改善の必要性</Label>
                          {prediction.required_monthly_rate === Infinity ? (
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-red-800 font-semibold">
                                🚨 期限切れ
                              </p>
                              <p className="text-red-600 text-sm mt-1">
                                設定期限を既に過ぎています。期限の見直しまたは緊急対応が必要です。
                              </p>
                            </div>
                          ) : prediction.required_monthly_rate > prediction.monthly_progress_rate ? (
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-red-800 font-semibold">
                                進捗加速が必要
                              </p>
                              <p className="text-red-600 text-sm mt-1">
                                月次進捗率を{(prediction.required_monthly_rate - prediction.monthly_progress_rate).toFixed(1)}%向上させる必要があります
                              </p>
                            </div>
                          ) : prediction.on_track ? (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-green-800 font-semibold">
                                順調に進捗中
                              </p>
                              <p className="text-green-600 text-sm mt-1">
                                現在のペースで目標達成可能です
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <p className="text-yellow-800 font-semibold">
                                注意が必要
                              </p>
                              <p className="text-yellow-600 text-sm mt-1">
                                進捗状況の監視と改善策の検討が推奨されます
                              </p>
                            </div>
                          )}
                        </div>

                        {prediction.trend_status === 'declining' && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-red-800 font-semibold">
                              📉 悪化傾向への対策
                            </p>
                            <p className="text-red-600 text-sm mt-1">
                              最近の進捗が悪化しています。原因分析と改善施策の実施を推奨します。
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">予測データが不足しています</h3>
                        <p className="text-gray-600 max-w-md">
                          進捗予測を行うには、最低2回以上の進捗記録が必要です。<br />
                          定期的に進捗を記録して予測精度を向上させてください。
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowPredictionDialog(false)}>
                    閉じる
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KPIManager; 