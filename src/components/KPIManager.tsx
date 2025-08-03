import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { useToast } from './ui/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
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
  Activity
} from 'lucide-react';

// 型定義
interface KPIIndicator {
  id: string;
  indicator_name: string;
  indicator_type: 'personal_kpi' | 'team_kpi' | 'kgi';
  description: string;
  measurement_unit: string;
  measurement_method: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  target_type: 'increase' | 'decrease' | 'maintain';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface KPITarget {
  id: string;
  indicator_id: string;
  indicator_name: string;
  indicator_type: string;
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
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedTargetForProgress, setSelectedTargetForProgress] = useState<KPITarget | null>(null);

  // フォーム状態
  const [newIndicator, setNewIndicator] = useState({
    indicator_name: '',
    indicator_type: 'personal_kpi' as 'personal_kpi' | 'team_kpi' | 'kgi',
    description: '',
    measurement_unit: '',
    measurement_method: '',
    category: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    target_type: 'increase' as 'increase' | 'decrease' | 'maintain',
  });

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
  });

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
      if (isMember && !isExecutive) {
        query = query.or(`assigned_member_id.eq.${user?.id},assigned_team.eq.${user?.department}`);
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
  }, [selectedPeriod, isMember, isExecutive, user?.id, user?.department, toast]);

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
    if (!newIndicator.indicator_name.trim() || !newIndicator.category.trim() || !newIndicator.measurement_unit.trim()) {
      toast({
        title: 'エラー',
        description: '指標名、カテゴリ、測定単位は必須です。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

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
      fetchIndicators();
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
    if (!selectedTargetForProgress || newProgress.recorded_value < 0) {
      toast({
        title: 'エラー',
        description: '有効な記録値を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // 進捗記録を挿入
      const { error: progressError } = await supabase
        .from('kpi_progress_records')
        .insert([{
          target_id: selectedTargetForProgress.id,
          recorded_value: newProgress.recorded_value,
          previous_value: selectedTargetForProgress.current_value,
          comments: newProgress.comments,
          evidence_url: newProgress.evidence_url,
          recorded_by: user?.id,
        }]);

      if (progressError) throw progressError;

      // 目標の現在値を更新
      const { error: updateError } = await supabase
        .from('kpi_targets')
        .update({ current_value: newProgress.recorded_value })
        .eq('id', selectedTargetForProgress.id);

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
      });
      fetchTargets();
      fetchDashboardStats();
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

  // useEffect
  useEffect(() => {
    if (user?.role && (isExecutive || isMember)) {
      fetchIndicators();
      fetchTargets();
      if (isExecutive) {
        fetchDashboardStats();
      }
      fetchMembers();
    }
  }, [selectedPeriod, user, isExecutive, isMember, fetchIndicators, fetchTargets, fetchDashboardStats, fetchMembers]);

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
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="measurement_unit">測定単位 *</Label>
                    <Input
                      id="measurement_unit"
                      value={newIndicator.measurement_unit}
                      onChange={(e) => setNewIndicator({ ...newIndicator, measurement_unit: e.target.value })}
                      placeholder="例: 万円、件、%"
                    />
                  </div>
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
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => 
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
          </TabsContent>
        )}

        {/* 個人KPIタブ */}
        <TabsContent value="personal" className="space-y-6">
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
                    <DialogTitle>個人KPI目標を設定</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target_indicator">KPI指標 *</Label>
                        <Select
                          value={newTarget.indicator_id}
                          onValueChange={(value) => setNewTarget({ ...newTarget, indicator_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="指標を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {indicators
                              .filter(i => i.indicator_type === 'personal_kpi')
                              .map((indicator) => (
                                <SelectItem key={indicator.id} value={indicator.id}>
                                  {indicator.indicator_name} ({indicator.measurement_unit})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
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
                          value={newTarget.target_value}
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
                          value={newTarget.baseline_value}
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
                      <TableRow key={target.id}>
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
                                setNewProgress({ ...newProgress, recorded_value: target.current_value });
                                setShowProgressDialog(true);
                              }}
                            >
                              進捗記録
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {targets.filter(t => t.indicator_type === 'personal_kpi').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        個人KPIが設定されていません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* チームKPIタブ */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">チームKPI管理</h3>
            {isExecutive && (
              <Button onClick={() => setShowCreateTargetDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新しい目標設定
              </Button>
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
                      <TableRow key={target.id}>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTargetForProgress(target);
                              setNewProgress({ ...newProgress, recorded_value: target.current_value });
                              setShowProgressDialog(true);
                            }}
                          >
                            進捗記録
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {targets.filter(t => t.indicator_type === 'team_kpi').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
              <Button onClick={() => setShowCreateTargetDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新しい目標設定
              </Button>
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
                        <TableRow key={target.id}>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTargetForProgress(target);
                                setNewProgress({ ...newProgress, recorded_value: target.current_value });
                                setShowProgressDialog(true);
                              }}
                            >
                              進捗記録
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {targets.filter(t => t.indicator_type === 'kgi').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
                  value={newProgress.recorded_value}
                  onChange={(e) => setNewProgress({ ...newProgress, recorded_value: parseFloat(e.target.value) || 0 })}
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
    </div>
  );
};

export default KPIManager; 