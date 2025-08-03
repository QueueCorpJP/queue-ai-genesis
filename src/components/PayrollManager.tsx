import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  Users, 
  TrendingUp,
  BarChart3,
  Building,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  is_active: boolean;
}

interface HourlyRate {
  id: string;
  member_id: string;
  member_name: string;
  hourly_rate: number;
  overtime_rate: number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
}

interface MonthlyPayroll {
  member_id: string;
  member_name: string;
  member_email: string;
  department: string;
  position: string;
  year_month: string;
  total_work_hours: number;
  total_overtime_hours: number;
  hourly_rate: number;
  overtime_rate: number;
  regular_pay: number;
  overtime_pay: number;
  total_pay: number;
  present_days: number;
  absent_days: number;
  remote_days: number;
  vacation_days: number;
}

interface PayrollSummary {
  total_employees: number;
  total_work_hours: number;
  total_overtime_hours: number;
  total_payroll: number;
  avg_pay_per_employee: number;
  departments_breakdown: {
    department: string;
    employee_count: number;
    total_pay: number;
    avg_pay: number;
  }[];
}

interface HourlyRateForm {
  member_id: string;
  hourly_rate: number;
  overtime_rate: number | null;
  effective_from: Date;
  effective_to: Date | undefined;
}

const PayrollManager: React.FC = () => {
  const { user } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [hourlyRates, setHourlyRates] = useState<HourlyRate[]>([]);
  const [monthlyPayroll, setMonthlyPayroll] = useState<MonthlyPayroll[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rates');
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  const [formData, setFormData] = useState<HourlyRateForm>({
    member_id: '',
    hourly_rate: 1000,
    overtime_rate: null,
    effective_from: new Date(),
    effective_to: undefined
  });

  // 役員権限チェック
  const isExecutive = user?.email === 'queue@queue-tech.jp';

  // メンバーIDを取得する関数
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
        // queue@queue-tech.jpの場合の特別処理
        if (user.email === 'queue@queue-tech.jp') {
          const { data: queueData, error: queueError } = await supabase
            .from('members')
            .select('id')
            .eq('email', 'queue@queue-tech.jp')
            .single();
          
          if (!queueError && queueData) {
            setCurrentMemberId(queueData.id);
            return;
          }
        }
        throw error;
      }

      if (data) {
        setCurrentMemberId(data.id);
        console.log('Payroll Manager - Member ID found:', data.id);
      }
    } catch (error) {
      console.error('Error fetching member ID:', error);
      setCurrentMemberId(null);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (isExecutive && currentMemberId) {
      fetchMembers();
      fetchHourlyRates();
      fetchMonthlyPayroll();
      fetchPayrollSummary();
    }
  }, [isExecutive, currentMemberId, selectedMonth]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, department, position, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('メンバー情報の取得に失敗しました');
    }
  };

  const fetchHourlyRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_hourly_rates')
        .select(`
          *,
          members!member_hourly_rates_member_id_fkey(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedRates = (data || []).map(rate => ({
        ...rate,
        member_name: rate.members.name
      }));
      
      setHourlyRates(formattedRates);
    } catch (error) {
      console.error('Error fetching hourly rates:', error);
      toast.error('時給設定の取得に失敗しました');
      setHourlyRates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyPayroll = async () => {
    try {
      const yearMonth = format(selectedMonth, 'yyyy-MM');
      console.log('Fetching payroll for:', yearMonth);
      
      const { data, error } = await supabase
        .from('monthly_payroll')
        .select('*')
        .eq('year_month', yearMonth)
        .order('total_pay', { ascending: false });

      if (error) throw error;
      console.log('Monthly payroll data:', data);
      
      // 詳細デバッグ：各レコードの内容を確認
      if (data && data.length > 0) {
        data.forEach((record, index) => {
          console.log(`Payroll Record ${index}:`, {
            member_name: record.member_name,
            total_work_hours: record.total_work_hours,
            hourly_rate: record.hourly_rate,
            regular_pay: record.regular_pay,
            overtime_pay: record.overtime_pay,
            total_pay: record.total_pay
          });
        });
      }
      
      setMonthlyPayroll(data || []);
    } catch (error) {
      console.error('Error fetching monthly payroll:', error);
      toast.error('月次人件費データの取得に失敗しました');
      setMonthlyPayroll([]);
    }
  };

  const fetchPayrollSummary = async () => {
    try {
      const yearMonth = format(selectedMonth, 'yyyy-MM');
      console.log('Fetching payroll summary for:', yearMonth);
      
      const { data, error } = await supabase
        .rpc('get_monthly_payroll_summary', { target_year_month: yearMonth });

      if (error) throw error;
      console.log('Payroll summary data:', data);
      
      if (data && data.length > 0) {
        setPayrollSummary(data[0]);
      } else {
        setPayrollSummary(null);
      }
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      toast.error('人件費サマリーの取得に失敗しました');
      setPayrollSummary(null);
    }
  };

  // デバッグ用：データの存在確認
  const checkDataExistence = async () => {
    try {
      const yearMonth = format(selectedMonth, 'yyyy-MM');
      
      // 勤怠データの確認
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('date', yearMonth + '-01')
        .lt('date', yearMonth + '-32');
      
      console.log('Attendance records count:', attendanceData?.length || 0);
      
      // 時給設定の確認
      const { data: ratesData, error: ratesError } = await supabase
        .from('member_hourly_rates')
        .select('*')
        .eq('is_active', true);
      
      console.log('Active hourly rates count:', ratesData?.length || 0);
      console.log('Active hourly rates details:', ratesData);
      
      // ビューの確認
      const { data: summaryData, error: summaryError } = await supabase
        .from('attendance_summary')
        .select('*')
        .limit(5);
      
      console.log('Attendance summary sample:', summaryData);
      
      // 月次統計の確認
      const { data: statsData, error: statsError } = await supabase
        .from('monthly_attendance_stats')
        .select('*')
        .eq('year_month', yearMonth);
      
      console.log('Monthly attendance stats:', statsData);
      
      // 時給設定との結合確認
      const { data: joinData, error: joinError } = await supabase
        .from('monthly_attendance_stats')
        .select(`
          *,
          member_hourly_rates!inner(hourly_rate, overtime_rate, effective_from, effective_to, is_active)
        `)
        .eq('year_month', yearMonth);
      
      console.log('Stats with hourly rates joined:', joinData);
      
    } catch (error) {
      console.error('Error checking data existence:', error);
    }
  };

  // テストデータの作成
  const createTestData = async () => {
    if (!currentMemberId) {
      toast.error('ユーザー情報が取得できていません');
      return;
    }

    try {
      const yearMonth = format(selectedMonth, 'yyyy-MM');
      
      // 時給設定の作成（存在しない場合）
      const { data: existingRate } = await supabase
        .from('member_hourly_rates')
        .select('*')
        .eq('member_id', currentMemberId)
        .eq('is_active', true)
        .single();

      if (!existingRate) {
        const effectiveFrom = format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1), 'yyyy-MM-dd');
        
        const { error: rateError } = await supabase
          .from('member_hourly_rates')
          .insert({
            member_id: currentMemberId,
            hourly_rate: 3000,
            overtime_rate: 3750,
            effective_from: effectiveFrom,
            created_by: currentMemberId
          });

        if (rateError) throw rateError;
        console.log('Test hourly rate created with effective_from:', effectiveFrom);
      } else {
        console.log('Existing hourly rate found:', existingRate);
      }

      // 勤怠データの作成（選択された月の数日分）
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const testDates = [
        format(new Date(year, month, 1), 'yyyy-MM-dd'),
        format(new Date(year, month, 2), 'yyyy-MM-dd'),
        format(new Date(year, month, 3), 'yyyy-MM-dd'),
        format(new Date(year, month, 4), 'yyyy-MM-dd'),
        format(new Date(year, month, 5), 'yyyy-MM-dd'),
      ];
      
      console.log('Creating test data for dates:', testDates);

      for (const date of testDates) {
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .upsert({
            member_id: currentMemberId,
            date: date,
            start_time: '09:00',
            end_time: '17:00',
            break_time_minutes: 60,
            status: 'present',
            attendance_type: 'regular'
          }, {
            onConflict: 'member_id,date'
          });

        if (attendanceError) {
          console.error('Error creating attendance record:', attendanceError);
        }
      }

      toast.success('テストデータを作成しました');
      
      // データを再取得
      await Promise.all([
        fetchHourlyRates(),
        fetchMonthlyPayroll(),
        fetchPayrollSummary()
      ]);
      
    } catch (error) {
      console.error('Error creating test data:', error);
      toast.error('テストデータの作成に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      hourly_rate: 1000,
      overtime_rate: null,
      effective_from: new Date(),
      effective_to: undefined
    });
    setEditingRate(null);
  };

  const handleCreateRate = async () => {
    if (!formData.member_id || !formData.hourly_rate) {
      toast.error('メンバーと時給を選択してください');
      return;
    }

    if (!currentMemberId) {
      toast.error('ユーザー情報の取得中です。しばらくお待ちください');
      return;
    }

    if (!isExecutive) {
      toast.error('この操作は役員のみ実行できます');
      return;
    }

    try {
      // 既存の時給設定を無効化
      const { error: deactivateError } = await supabase
        .from('member_hourly_rates')
        .update({ is_active: false })
        .eq('member_id', formData.member_id)
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      // 新しい時給設定を作成
      const { error } = await supabase
        .from('member_hourly_rates')
        .insert({
          member_id: formData.member_id,
          hourly_rate: formData.hourly_rate,
          overtime_rate: formData.overtime_rate,
          effective_from: format(formData.effective_from, 'yyyy-MM-dd'),
          effective_to: formData.effective_to ? format(formData.effective_to, 'yyyy-MM-dd') : null,
          created_by: currentMemberId
        });

      if (error) throw error;

      toast.success('時給設定を作成しました');
      setCreateDialogOpen(false);
      resetForm();
      await fetchHourlyRates();
    } catch (error: any) {
      console.error('Error creating hourly rate:', error);
      toast.error('時給設定の作成に失敗しました');
    }
  };

  const handleUpdateRate = async () => {
    if (!editingRate || !formData.hourly_rate) return;

    try {
      const { error } = await supabase
        .from('member_hourly_rates')
        .update({
          hourly_rate: formData.hourly_rate,
          overtime_rate: formData.overtime_rate,
          effective_from: format(formData.effective_from, 'yyyy-MM-dd'),
          effective_to: formData.effective_to ? format(formData.effective_to, 'yyyy-MM-dd') : null
        })
        .eq('id', editingRate.id);

      if (error) throw error;

      toast.success('時給設定を更新しました');
      setEditingRate(null);
      resetForm();
      await fetchHourlyRates();
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast.error('時給設定の更新に失敗しました');
    }
  };

  const openEditDialog = (rate: HourlyRate) => {
    setEditingRate(rate);
    setFormData({
      member_id: rate.member_id,
      hourly_rate: rate.hourly_rate,
      overtime_rate: rate.overtime_rate,
      effective_from: new Date(rate.effective_from),
      effective_to: rate.effective_to ? new Date(rate.effective_to) : undefined
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  if (!isExecutive) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600">この機能は役員のみ利用可能です</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 人件費サマリーカード */}
      {payrollSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総従業員数</p>
                  <div className="text-2xl font-bold">{payrollSummary.total_employees}人</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総労働時間</p>
                  <div className="text-2xl font-bold">{payrollSummary.total_work_hours}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総人件費</p>
                  <div className="text-2xl font-bold">{formatCurrency(payrollSummary.total_payroll)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均給与</p>
                  <div className="text-2xl font-bold">{formatCurrency(payrollSummary.avg_pay_per_employee)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* メインコンテンツ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                人件費管理
              </CardTitle>
              <CardDescription>
                メンバーの時給設定と月次人件費を管理します
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* デバッグボタン（開発環境のみ） */}
              {import.meta.env.DEV && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={checkDataExistence}
                    className="text-xs"
                  >
                    データ確認
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={createTestData}
                    className="text-xs bg-green-50 text-green-700"
                  >
                    テストデータ作成
                  </Button>
                </>
              )}
              
              {/* 月選択 */}
              <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedMonth, 'yyyy年MM月', { locale: ja })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  defaultMonth={selectedMonth}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rates">時給設定</TabsTrigger>
              <TabsTrigger value="payroll">月次人件費</TabsTrigger>
            </TabsList>

            {/* 時給設定タブ */}
            <TabsContent value="rates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">時給設定管理</h3>
                
                <Dialog open={createDialogOpen || !!editingRate} onOpenChange={(open) => {
                  if (!open) {
                    setCreateDialogOpen(false);
                    setEditingRate(null);
                    resetForm();
                  } else if (!editingRate) {
                    setCreateDialogOpen(true);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      時給設定
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingRate ? '時給設定を編集' : '新しい時給設定'}
                      </DialogTitle>
                      <DialogDescription>
                        メンバーの時給を設定します
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="member">メンバー</Label>
                        <Select 
                          value={formData.member_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}
                          disabled={!!editingRate}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="メンバーを選択" />
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

                      <div className="space-y-2">
                        <Label htmlFor="hourly_rate">基本時給 (円)</Label>
                        <Input
                          id="hourly_rate"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.hourly_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="overtime_rate">残業時給 (円)</Label>
                        <Input
                          id="overtime_rate"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.overtime_rate || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, overtime_rate: e.target.value ? parseInt(e.target.value) : null }))}
                          placeholder="未設定の場合は基本時給の1.25倍"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>有効開始日</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(formData.effective_from, 'yyyy年MM月dd日', { locale: ja })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.effective_from}
                              onSelect={(date) => date && setFormData(prev => ({ ...prev, effective_from: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>有効終了日（任意）</Label>
                        <div className="flex space-x-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex-1 justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.effective_to ? format(formData.effective_to, 'yyyy年MM月dd日', { locale: ja }) : '無期限'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.effective_to}
                                onSelect={(date) => setFormData(prev => ({ ...prev, effective_to: date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {formData.effective_to && (
                            <Button 
                              variant="outline" 
                              onClick={() => setFormData(prev => ({ ...prev, effective_to: undefined }))}
                            >
                              クリア
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setCreateDialogOpen(false);
                        setEditingRate(null);
                        resetForm();
                      }}>
                        キャンセル
                      </Button>
                      <Button onClick={editingRate ? handleUpdateRate : handleCreateRate}>
                        {editingRate ? '更新' : '作成'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 時給設定テーブル */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>メンバー</TableHead>
                      <TableHead>基本時給</TableHead>
                      <TableHead>残業時給</TableHead>
                      <TableHead>有効期間</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hourlyRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <div className="font-medium">{rate.member_name}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(rate.hourly_rate)}</TableCell>
                        <TableCell>
                          {rate.overtime_rate ? formatCurrency(rate.overtime_rate) : '基本時給の1.25倍'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(rate.effective_from), 'yyyy/MM/dd')}</div>
                            <div className="text-gray-500">
                              ～ {rate.effective_to ? format(new Date(rate.effective_to), 'yyyy/MM/dd') : '無期限'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(rate)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hourlyRates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  時給設定がありません。新しい設定を作成してください。
                </div>
              )}
            </TabsContent>

            {/* 月次人件費タブ */}
            <TabsContent value="payroll" className="space-y-4">
              <h3 className="text-lg font-medium">
                {format(selectedMonth, 'yyyy年MM月', { locale: ja })}の人件費
              </h3>

              {/* 部署別サマリー */}
              {payrollSummary?.departments_breakdown && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {payrollSummary.departments_breakdown.map((dept) => (
                    <Card key={dept.department}>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <Building className="h-6 w-6 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">{dept.department}</p>
                            <div className="text-lg font-bold">{formatCurrency(dept.total_pay)}</div>
                            <div className="text-xs text-gray-500">{dept.employee_count}人</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* 人件費詳細テーブル */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>メンバー</TableHead>
                      <TableHead>部署</TableHead>
                      <TableHead>労働時間</TableHead>
                      <TableHead>時給</TableHead>
                      <TableHead>基本給</TableHead>
                      <TableHead>残業代</TableHead>
                      <TableHead>合計</TableHead>
                      <TableHead>出勤日数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPayroll.map((payroll) => (
                      <TableRow key={payroll.member_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payroll.member_name}</div>
                            <div className="text-sm text-gray-500">{payroll.position}</div>
                          </div>
                        </TableCell>
                        <TableCell>{payroll.department}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{payroll.total_work_hours}h</div>
                            {payroll.total_overtime_hours > 0 && (
                              <div className="text-xs text-orange-600">
                                残業 {payroll.total_overtime_hours}h
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{formatCurrency(payroll.hourly_rate)}</div>
                            {payroll.overtime_rate !== payroll.hourly_rate && (
                              <div className="text-xs text-gray-500">
                                残業 {formatCurrency(payroll.overtime_rate)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(payroll.regular_pay)}</TableCell>
                        <TableCell>{formatCurrency(payroll.overtime_pay)}</TableCell>
                        <TableCell>
                          <div className="font-bold text-green-600">
                            {formatCurrency(payroll.total_pay)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{payroll.present_days}日</div>
                            <div className="text-xs text-gray-500">
                              リモート {payroll.remote_days}日 / 有給 {payroll.vacation_days}日
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {monthlyPayroll.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  この月の人件費データがありません。
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollManager; 