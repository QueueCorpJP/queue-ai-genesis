import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { useToast } from './ui/use-toast';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  User,
  Lightbulb
} from 'lucide-react';

// 型定義
interface PersonalKPI {
  target_id: string;
  indicator_id: string;
  indicator_name: string;
  description: string;
  measurement_unit: string;
  category: string;
  target_period: string;
  target_value: number;
  current_value: number;
  achievement_rate: number;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  performance_status: string;
  timeline_status: string;
}

interface KPICategory {
  category_name: string;
  description: string;
  examples: string;
}

interface MeasurementUnit {
  unit_name: string;
  unit_type: string;
  description: string;
}

const PersonalKPICreator: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAdmin();

  // State管理
  const [personalKPIs, setPersonalKPIs] = useState<PersonalKPI[]>([]);
  const [categories, setCategories] = useState<KPICategory[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<PersonalKPI | null>(null);

  // フォーム状態
  const [newKPI, setNewKPI] = useState({
    indicator_name: '',
    description: '',
    measurement_unit: '',
    category: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    target_type: 'increase' as 'increase' | 'decrease' | 'maintain',
    target_value: 0,
    baseline_value: 0,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: '',
  });

  const [progressRecord, setProgressRecord] = useState({
    recorded_value: 0,
    comments: '',
    evidence_url: '',
  });

  // データ取得関数
  const fetchPersonalKPIs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_personal_kpis', {
        p_target_period: selectedPeriod
      });

      if (error) {
        console.error('Error fetching personal KPIs:', error);
        toast.error('個人KPIの取得に失敗しました');
        return;
      }

      setPersonalKPIs(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('個人KPIの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_kpi_categories')
        .select('*');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMeasurementUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_kpi_measurement_units')
        .select('*');

      if (error) {
        console.error('Error fetching measurement units:', error);
        return;
      }

      setMeasurementUnits(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 個人KPI作成
  const createPersonalKPI = async () => {
    try {
      if (!newKPI.indicator_name || !newKPI.measurement_unit || !newKPI.category) {
        toast.error('必須項目を入力してください');
        return;
      }

      setIsLoading(true);

      // 1. KPI指標を作成
      const { data: indicatorData, error: indicatorError } = await supabase.rpc(
        'create_personal_kpi_indicator',
        {
          p_indicator_name: newKPI.indicator_name,
          p_description: newKPI.description,
          p_measurement_unit: newKPI.measurement_unit,
          p_category: newKPI.category,
          p_frequency: newKPI.frequency,
          p_target_type: newKPI.target_type,
        }
      );

      if (indicatorError) {
        console.error('Error creating indicator:', indicatorError);
        toast.error('KPI指標の作成に失敗しました');
        return;
      }

      // 2. KPI目標を作成
      const { data: targetData, error: targetError } = await supabase.rpc(
        'create_personal_kpi_target',
        {
          p_indicator_id: indicatorData,
          p_target_period: selectedPeriod,
          p_target_value: newKPI.target_value,
          p_baseline_value: newKPI.baseline_value,
          p_priority: newKPI.priority,
          p_notes: newKPI.notes,
        }
      );

      if (targetError) {
        console.error('Error creating target:', targetError);
        toast.error('KPI目標の作成に失敗しました');
        return;
      }

      toast.success('個人KPIを作成しました');
      setShowCreateDialog(false);
      setNewKPI({
        indicator_name: '',
        description: '',
        measurement_unit: '',
        category: '',
        frequency: 'monthly',
        target_type: 'increase',
        target_value: 0,
        baseline_value: 0,
        priority: 'medium',
        notes: '',
      });
      
      await fetchPersonalKPIs();
    } catch (error) {
      console.error('Error:', error);
      toast.error('個人KPIの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 進捗記録
  const recordProgress = async () => {
    if (!selectedKPI) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('kpi_progress_records')
        .insert({
          target_id: selectedKPI.target_id,
          recorded_value: progressRecord.recorded_value,
          comments: progressRecord.comments,
          evidence_url: progressRecord.evidence_url,
          recorded_by: user?.id,
        });

      if (error) {
        console.error('Error recording progress:', error);
        toast.error('進捗記録に失敗しました');
        return;
      }

      toast.success('進捗を記録しました');
      setShowProgressDialog(false);
      setProgressRecord({
        recorded_value: 0,
        comments: '',
        evidence_url: '',
      });
      
      await fetchPersonalKPIs();
    } catch (error) {
      console.error('Error:', error);
      toast.error('進捗記録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // パフォーマンスステータスの色とアイコン
  const getPerformanceDisplay = (status: string) => {
    switch (status) {
      case 'achieved':
        return { color: 'bg-green-500', icon: CheckCircle, text: '達成', className: 'text-green-700 bg-green-100' };
      case 'on_track':
        return { color: 'bg-blue-500', icon: TrendingUp, text: '順調', className: 'text-blue-700 bg-blue-100' };
      case 'needs_attention':
        return { color: 'bg-yellow-500', icon: AlertTriangle, text: '要注意', className: 'text-yellow-700 bg-yellow-100' };
      case 'at_risk':
        return { color: 'bg-red-500', icon: TrendingDown, text: '危険', className: 'text-red-700 bg-red-100' };
      default:
        return { color: 'bg-gray-500', icon: Activity, text: '不明', className: 'text-gray-700 bg-gray-100' };
    }
  };

  // タイムラインステータスの表示
  const getTimelineDisplay = (status: string, daysRemaining: number) => {
    switch (status) {
      case 'overdue':
        return { text: '期限超過', className: 'text-red-700 bg-red-100' };
      case 'due_soon':
        return { text: `あと${Math.ceil(daysRemaining)}日`, className: 'text-orange-700 bg-orange-100' };
      case 'on_schedule':
        return { text: `あと${Math.ceil(daysRemaining)}日`, className: 'text-green-700 bg-green-100' };
      default:
        return { text: '不明', className: 'text-gray-700 bg-gray-100' };
    }
  };

  useEffect(() => {
    fetchPersonalKPIs();
    fetchCategories();
    fetchMeasurementUnits();
  }, [selectedPeriod]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ログインが必要です</h3>
            <p className="text-gray-600 max-w-md">
              個人KPI機能を利用するにはログインしてください。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">個人KPI管理</h2>
          <p className="text-gray-600">自分の目標を設定して、進捗を管理しましょう</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="period">対象期間</Label>
            <Input
              id="period"
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-40"
            />
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新しいKPI作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>個人KPI作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* KPI基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="indicator_name">KPI名 *</Label>
                    <Input
                      id="indicator_name"
                      value={newKPI.indicator_name}
                      onChange={(e) => setNewKPI({ ...newKPI, indicator_name: e.target.value })}
                      placeholder="例: 新規顧客獲得数"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリ *</Label>
                    <Select 
                      value={newKPI.category} 
                      onValueChange={(value) => setNewKPI({ ...newKPI, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.category_name} value={cat.category_name}>
                            <div>
                              <div className="font-medium">{cat.category_name}</div>
                              <div className="text-sm text-gray-500">{cat.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={newKPI.description}
                    onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                    placeholder="このKPIの詳細や計測方法を説明してください"
                    rows={3}
                  />
                </div>

                {/* 測定設定 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="measurement_unit">測定単位 *</Label>
                    <Select 
                      value={newKPI.measurement_unit} 
                      onValueChange={(value) => setNewKPI({ ...newKPI, measurement_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="単位を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {measurementUnits.map((unit) => (
                          <SelectItem key={unit.unit_name} value={unit.unit_name}>
                            <div>
                              <div className="font-medium">{unit.unit_name}</div>
                              <div className="text-sm text-gray-500">{unit.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="frequency">頻度</Label>
                    <Select 
                      value={newKPI.frequency} 
                      onValueChange={(value) => setNewKPI({ ...newKPI, frequency: value as any })}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="target_type">目標タイプ</Label>
                    <Select 
                      value={newKPI.target_type} 
                      onValueChange={(value) => setNewKPI({ ...newKPI, target_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">向上</SelectItem>
                        <SelectItem value="decrease">削減</SelectItem>
                        <SelectItem value="maintain">維持</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 目標値設定 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_value">目標値 *</Label>
                    <Input
                      id="target_value"
                      type="number"
                      value={newKPI.target_value}
                      onChange={(e) => setNewKPI({ ...newKPI, target_value: Number(e.target.value) })}
                      placeholder="100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="baseline_value">ベースライン値</Label>
                    <Input
                      id="baseline_value"
                      type="number"
                      value={newKPI.baseline_value}
                      onChange={(e) => setNewKPI({ ...newKPI, baseline_value: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">優先度</Label>
                    <Select 
                      value={newKPI.priority} 
                      onValueChange={(value) => setNewKPI({ ...newKPI, priority: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="critical">重要</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">メモ</Label>
                  <Textarea
                    id="notes"
                    value={newKPI.notes}
                    onChange={(e) => setNewKPI({ ...newKPI, notes: e.target.value })}
                    placeholder="目標達成のための具体的なアクションプランなど"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={createPersonalKPI} 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? '作成中...' : 'KPI作成'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 個人KPI一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            個人KPI一覧 ({selectedPeriod})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          ) : personalKPIs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">個人KPIを作成しましょう</h3>
              <p className="text-gray-600 mb-4">
                まずは1つ、自分の目標を設定してみてください。<br />
                小さな目標から始めることが成功の秘訣です。
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                最初のKPIを作成する
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {personalKPIs.map((kpi) => {
                const performance = getPerformanceDisplay(kpi.performance_status);
                const timeline = getTimelineDisplay(kpi.timeline_status, kpi.days_remaining);
                
                return (
                  <Card key={kpi.target_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{kpi.indicator_name}</h3>
                            <Badge className={performance.className}>
                              <performance.icon className="w-3 h-3 mr-1" />
                              {performance.text}
                            </Badge>
                            <Badge variant="outline" className={timeline.className}>
                              <Clock className="w-3 h-3 mr-1" />
                              {timeline.text}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{kpi.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">カテゴリ:</span>
                              <span className="ml-1 font-medium">{kpi.category}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">目標値:</span>
                              <span className="ml-1 font-medium">{kpi.target_value} {kpi.measurement_unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">現在値:</span>
                              <span className="ml-1 font-medium">{kpi.current_value} {kpi.measurement_unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">達成率:</span>
                              <span className="ml-1 font-medium">{kpi.achievement_rate}%</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Progress value={Math.min(kpi.achievement_rate, 100)} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKPI(kpi);
                              setShowProgressDialog(true);
                            }}
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            進捗記録
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 進捗記録ダイアログ */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>進捗記録 - {selectedKPI?.indicator_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recorded_value">記録値 *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="recorded_value"
                  type="number"
                  value={progressRecord.recorded_value}
                  onChange={(e) => setProgressRecord({ ...progressRecord, recorded_value: Number(e.target.value) })}
                  placeholder="現在の数値"
                />
                <span className="text-gray-500">{selectedKPI?.measurement_unit}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">コメント</Label>
              <Textarea
                id="comments"
                value={progressRecord.comments}
                onChange={(e) => setProgressRecord({ ...progressRecord, comments: e.target.value })}
                placeholder="進捗の詳細や気づいたことを記録"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evidence_url">根拠資料URL（任意）</Label>
              <Input
                id="evidence_url"
                value={progressRecord.evidence_url}
                onChange={(e) => setProgressRecord({ ...progressRecord, evidence_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowProgressDialog(false)}
              >
                キャンセル
              </Button>
              <Button 
                onClick={recordProgress} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '記録中...' : '進捗記録'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalKPICreator;

