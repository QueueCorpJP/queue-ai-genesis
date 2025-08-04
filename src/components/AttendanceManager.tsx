import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
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
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Home,
  MapPin,
  Plane,
  Heart,
  Coffee,
  BarChart3,
  CalendarDays,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AttendanceRecord {
  id: string;
  member_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_time_minutes: number;
  work_hours: number;
  overtime_hours: number;
  status: 'scheduled' | 'present' | 'absent' | 'late' | 'early_leave';
  attendance_type: 'regular' | 'remote' | 'business_trip' | 'sick_leave' | 'vacation';
  notes: string;
  submitted_at: string;
  approved_by: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
}

interface MonthlyStats {
  member_id: string;
  member_name: string;
  member_email: string;
  department: string;
  position: string;
  year: number;
  month: number;
  year_month: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  actual_late_days: number;
  early_leave_days: number;
  total_work_hours: number;
  total_overtime_hours: number;
  total_hours: number;
  avg_work_hours_per_day: number;
  remote_days: number;
  business_trip_days: number;
  sick_leave_days: number;
  vacation_days: number;
}

type DateSelectionMode = 'single' | 'multiple' | 'range';

const AttendanceManager: React.FC = () => {
  const { user } = useAdmin();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // 現在のユーザーのメンバーID
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  
  // 役員権限チェック
  const [isExecutive, setIsExecutive] = useState(false);

  // 複数日付選択機能のstate
  const [dateSelectionMode, setDateSelectionMode] = useState<DateSelectionMode>('single');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // フォームデータ
  const [formData, setFormData] = useState({
    date: new Date(),
    start_time: '09:00',
    end_time: '17:00',
    break_time_minutes: 60,
    status: 'scheduled' as AttendanceRecord['status'],
    attendance_type: 'regular' as AttendanceRecord['attendance_type'],
    notes: ''
  });

  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (currentMemberId) {
      fetchAttendance();
      fetchMonthlyStats();
    }
  }, [currentMemberId, selectedMonth]);

  // メールアドレスからメンバーIDを取得
  const fetchMemberId = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, role')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching member ID:', error);
        toast.error('メンバー情報の取得に失敗しました');
        return;
      }

      if (data) {
        setCurrentMemberId(data.id);
        setIsExecutive(data.role === 'executive');
      }
    } catch (error) {
      console.error('Error fetching member ID:', error);
      toast.error('メンバー情報の取得に失敗しました');
    }
  };

  const fetchAttendance = async () => {
    if (!currentMemberId) return;
    
    setLoading(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('member_id', currentMemberId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('勤怠データの取得に失敗しました');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    if (!currentMemberId) return;
    
    try {
      const yearMonth = format(selectedMonth, 'yyyy-MM');
      
      // 管理者権限がある場合はadminクライアントを使用
      const client = isExecutive ? getSupabaseAdmin() : supabase;
      
      const { data, error } = await client
        .from('monthly_attendance_stats')
        .select('*')
        .eq('member_id', currentMemberId)
        .eq('year_month', yearMonth)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching monthly stats:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // デフォルト値を設定
        setMonthlyStats({
          member_id: currentMemberId,
          member_name: '',
          member_email: user?.email || '',
          department: '',
          position: '',
          year: selectedMonth.getFullYear(),
          month: selectedMonth.getMonth() + 1,
          year_month: yearMonth,
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          late_days: 0,
          actual_late_days: 0,
          early_leave_days: 0,
          total_work_hours: 0,
          total_overtime_hours: 0,
          total_hours: 0,
          avg_work_hours_per_day: 0,
          remote_days: 0,
          business_trip_days: 0,
          sick_leave_days: 0,
          vacation_days: 0
        });
        
        // ユーザーには軽微なメッセージのみ表示
        if (!error.message?.includes('permission denied') && !error.message?.includes('row-level security')) {
          toast.error('月次統計の取得に失敗しました');
        }
        return;
      }
      
      setMonthlyStats(data || {
        member_id: currentMemberId,
        member_name: '',
        member_email: user?.email || '',
        department: '',
        position: '',
        year: selectedMonth.getFullYear(),
        month: selectedMonth.getMonth() + 1,
        year_month: yearMonth,
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        actual_late_days: 0,
        early_leave_days: 0,
        total_work_hours: 0,
        total_overtime_hours: 0,
        total_hours: 0,
        avg_work_hours_per_day: 0,
        remote_days: 0,
        business_trip_days: 0,
        sick_leave_days: 0,
        vacation_days: 0
      });
    } catch (error: any) {
      console.error('Error fetching monthly stats:', error);
      
      // デフォルト値を設定してエラーを隠す
      setMonthlyStats({
        member_id: currentMemberId,
        member_name: '',
        member_email: user?.email || '',
        department: '',
        position: '',
        year: selectedMonth.getFullYear(),
        month: selectedMonth.getMonth() + 1,
        year_month: format(selectedMonth, 'yyyy-MM'),
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        actual_late_days: 0,
        early_leave_days: 0,
        total_work_hours: 0,
        total_overtime_hours: 0,
        total_hours: 0,
        avg_work_hours_per_day: 0,
        remote_days: 0,
        business_trip_days: 0,
        sick_leave_days: 0,
        vacation_days: 0
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date(),
      start_time: '09:00',
      end_time: '17:00',
      break_time_minutes: 60,
      status: 'scheduled',
      attendance_type: 'regular',
      notes: ''
    });
    setDateSelectionMode('single');
    setSelectedDates([]);
    setDateRange({});
    setEditingRecord(null);
  };

  const handleCreateRecord = async () => {
    if (!currentMemberId) return;

    // 対象日付を取得
    const targetDates: Date[] = [];
    
    if (dateSelectionMode === 'single') {
      targetDates.push(formData.date);
    } else if (dateSelectionMode === 'multiple') {
      if (selectedDates.length === 0) {
        toast.error('日付を選択してください');
        return;
      }
      targetDates.push(...selectedDates);
    } else if (dateSelectionMode === 'range') {
      if (!dateRange.from || !dateRange.to) {
        toast.error('期間を選択してください');
        return;
      }
      const rangeDates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      targetDates.push(...rangeDates);
    }

    const successCount = { value: 0 };
    const errorCount = { value: 0 };
    const duplicateCount = { value: 0 };

    try {
      // 各日付に対して記録を作成
      const records = targetDates.map(date => ({
        member_id: currentMemberId,
        date: format(date, 'yyyy-MM-dd'),
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        break_time_minutes: formData.break_time_minutes,
        status: formData.status,
        attendance_type: formData.attendance_type,
        notes: formData.notes
      }));

      // 一括挿入を試行
      const { error } = await supabase
        .from('attendance_records')
        .insert(records);

      if (error) {
        // 重複エラーの場合は個別に処理
        if (error.code === '23505') {
          for (const date of targetDates) {
            try {
              const { error: singleError } = await supabase
                .from('attendance_records')
                .insert({
                  member_id: currentMemberId,
                  date: format(date, 'yyyy-MM-dd'),
                  start_time: formData.start_time || null,
                  end_time: formData.end_time || null,
                  break_time_minutes: formData.break_time_minutes,
                  status: formData.status,
                  attendance_type: formData.attendance_type,
                  notes: formData.notes
                });

              if (singleError) {
                if (singleError.code === '23505') {
                  duplicateCount.value++;
                } else {
                  errorCount.value++;
                }
              } else {
                successCount.value++;
              }
            } catch (e) {
              errorCount.value++;
            }
          }
        } else {
          throw error;
        }
      } else {
        successCount.value = targetDates.length;
      }

      // 結果メッセージ
      let message = '';
      if (successCount.value > 0) {
        message += `${successCount.value}件の勤怠記録を作成しました`;
      }
      if (duplicateCount.value > 0) {
        message += message ? `、${duplicateCount.value}件は重複のためスキップされました` : `${duplicateCount.value}件は重複のためスキップされました`;
      }
      if (errorCount.value > 0) {
        message += message ? `、${errorCount.value}件でエラーが発生しました` : `${errorCount.value}件でエラーが発生しました`;
      }

      if (successCount.value > 0) {
        toast.success(message);
      } else if (duplicateCount.value > 0) {
        toast.warning(message);
      } else {
        toast.error(message);
      }

      setCreateDialogOpen(false);
      resetForm();
      await Promise.all([fetchAttendance(), fetchMonthlyStats()]);
    } catch (error: any) {
      console.error('Error creating attendance records:', error);
      toast.error('勤怠記録の作成に失敗しました');
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;

    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          break_time_minutes: formData.break_time_minutes,
          attendance_type: formData.attendance_type,
          notes: formData.notes,
          submitted_at: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast.success('勤怠記録を更新しました');
      setEditingRecord(null);
      resetForm();
      await Promise.all([fetchAttendance(), fetchMonthlyStats()]);
    } catch (error) {
      console.error('Error updating attendance record:', error);
      toast.error('勤怠記録の更新に失敗しました');
    }
  };

  const openEditDialog = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      date: new Date(record.date),
      start_time: record.start_time || '09:00',
      end_time: record.end_time || '17:00',
      break_time_minutes: record.break_time_minutes,
      status: record.status,
      attendance_type: record.attendance_type,
      notes: record.notes
    });
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast.success('勤怠記録を削除しました');
      await Promise.all([fetchAttendance(), fetchMonthlyStats()]);
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast.error('勤怠記録の削除に失敗しました');
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const badges = {
      scheduled: <Badge variant="outline" className="bg-blue-100 text-blue-800">予定</Badge>,
      present: <Badge variant="outline" className="bg-green-100 text-green-800">出勤</Badge>,
      absent: <Badge variant="outline" className="bg-red-100 text-red-800">欠勤</Badge>,
      late: <Badge variant="outline" className="bg-yellow-100 text-yellow-800">遅刻</Badge>,
      early_leave: <Badge variant="outline" className="bg-orange-100 text-orange-800">早退</Badge>
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  const getAttendanceTypeIcon = (type: AttendanceRecord['attendance_type']) => {
    const icons = {
      regular: <Home className="w-4 h-4" />,
      remote: <MapPin className="w-4 h-4" />,
      business_trip: <Plane className="w-4 h-4" />,
      sick_leave: <Heart className="w-4 h-4" />,
      vacation: <Coffee className="w-4 h-4" />
    };
    return icons[type] || <Home className="w-4 h-4" />;
  };

  const getAttendanceTypeLabel = (type: AttendanceRecord['attendance_type']) => {
    const labels = {
      regular: '通常勤務',
      remote: 'リモート',
      business_trip: '出張',
      sick_leave: '病欠',
      vacation: '有給'
    };
    return labels[type] || type;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-gray-600">ログインが必要です</p>
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
      {/* 月次統計カード */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">出勤日数</p>
                  <div className="text-2xl font-bold">{monthlyStats.present_days}日</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総労働時間</p>
                  <div className="text-2xl font-bold">{monthlyStats.total_work_hours}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">残業時間</p>
                  <div className="text-2xl font-bold">{monthlyStats.total_overtime_hours}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">リモート日数</p>
                  <div className="text-2xl font-bold">{monthlyStats.remote_days}日</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 勤怠管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                勤怠管理
              </CardTitle>
              <CardDescription>
                出勤予定と勤務時間を管理します
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-4">
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

              {/* 新規作成ダイアログ */}
              <Dialog open={createDialogOpen || !!editingRecord} onOpenChange={(open) => {
                if (!open) {
                  setCreateDialogOpen(false);
                  setEditingRecord(null);
                  resetForm();
                } else if (!editingRecord) {
                  setCreateDialogOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    勤怠記録
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRecord ? '勤怠記録を編集' : '新しい勤怠記録'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRecord ? '勤怠記録を更新します' : '出勤予定を登録します'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* 日付選択モード切り替え */}
                    {!editingRecord && (
                      <div className="space-y-3">
                        <Label>日付選択モード</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="single"
                              name="dateMode"
                              checked={dateSelectionMode === 'single'}
                              onChange={() => setDateSelectionMode('single')}
                              className="w-4 h-4"
                            />
                            <label htmlFor="single" className="text-sm">単一日付</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="multiple"
                              name="dateMode"
                              checked={dateSelectionMode === 'multiple'}
                              onChange={() => setDateSelectionMode('multiple')}
                              className="w-4 h-4"
                            />
                            <label htmlFor="multiple" className="text-sm">複数日付</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="range"
                              name="dateMode"
                              checked={dateSelectionMode === 'range'}
                              onChange={() => setDateSelectionMode('range')}
                              className="w-4 h-4"
                            />
                            <label htmlFor="range" className="text-sm">期間選択</label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 日付選択 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>日付</Label>
                        {!editingRecord && (dateSelectionMode === 'multiple' || dateSelectionMode === 'range') && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDates([]);
                              setDateRange({});
                            }}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            リセット
                          </Button>
                        )}
                      </div>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={!!editingRecord}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editingRecord || dateSelectionMode === 'single' 
                              ? format(formData.date, 'yyyy年MM月dd日', { locale: ja })
                              : dateSelectionMode === 'multiple'
                                ? selectedDates.length > 0
                                  ? `${selectedDates.length}日選択中`
                                  : '複数日付を選択'
                                : dateRange.from && dateRange.to
                                  ? `${format(dateRange.from, 'MM/dd', { locale: ja })} - ${format(dateRange.to, 'MM/dd', { locale: ja })}`
                                  : dateRange.from
                                    ? `${format(dateRange.from, 'MM/dd', { locale: ja })} -`
                                    : '期間を選択'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          {(editingRecord || dateSelectionMode === 'single') && (
                            <Calendar
                              mode="single"
                              selected={formData.date}
                              onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                              initialFocus
                            />
                          )}
                          {!editingRecord && dateSelectionMode === 'multiple' && (
                            <Calendar
                              mode="multiple"
                              selected={selectedDates}
                              onSelect={(dates) => setSelectedDates(dates || [])}
                              initialFocus
                            />
                          )}
                          {!editingRecord && dateSelectionMode === 'range' && (
                            <Calendar
                              mode="range"
                              selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                              onSelect={(range) => setDateRange(range || {})}
                              numberOfMonths={2}
                              initialFocus
                            />
                          )}
                        </PopoverContent>
                      </Popover>
                      
                      {/* 選択された日付の表示 */}
                      {!editingRecord && dateSelectionMode === 'multiple' && selectedDates.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <div className="text-xs text-gray-600 mb-1">選択された日付:</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedDates.map((date, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {format(date, 'MM/dd', { locale: ja })}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {!editingRecord && dateSelectionMode === 'range' && dateRange.from && dateRange.to && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <div className="text-xs text-gray-600 mb-1">選択された期間:</div>
                          <Badge variant="secondary" className="text-xs">
                            {format(dateRange.from, 'yyyy年MM月dd日', { locale: ja })} - {format(dateRange.to, 'yyyy年MM月dd日', { locale: ja })}
                            （{eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length}日間）
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">開始時刻</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end_time">終了時刻</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="break_time">休憩時間（分）</Label>
                      <Input
                        id="break_time"
                        type="number"
                        min="0"
                        max="480"
                        value={formData.break_time_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, break_time_minutes: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attendance_type">勤務形態</Label>
                      <Select value={formData.attendance_type} onValueChange={(value) => setFormData(prev => ({ ...prev, attendance_type: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">通常勤務</SelectItem>
                          <SelectItem value="remote">リモート</SelectItem>
                          <SelectItem value="business_trip">出張</SelectItem>
                          <SelectItem value="sick_leave">病欠</SelectItem>
                          <SelectItem value="vacation">有給</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">備考</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="特記事項があれば入力してください"
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setCreateDialogOpen(false);
                      setEditingRecord(null);
                      resetForm();
                    }}>
                      キャンセル
                    </Button>
                    <Button onClick={editingRecord ? handleUpdateRecord : handleCreateRecord}>
                      {editingRecord ? '更新' : 
                        dateSelectionMode === 'single' ? '作成' :
                        dateSelectionMode === 'multiple' ? `一括作成 (${selectedDates.length}件)` :
                        dateSelectionMode === 'range' && dateRange.from && dateRange.to ? 
                          `一括作成 (${eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length}件)` : 
                          '作成'
                      }
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 勤怠テーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>勤務形態</TableHead>
                  <TableHead>開始時刻</TableHead>
                  <TableHead>終了時刻</TableHead>
                  <TableHead>労働時間</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium">
                        {format(new Date(record.date), 'MM/dd (E)', { locale: ja })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getAttendanceTypeIcon(record.attendance_type)}
                        <span className="text-sm">{getAttendanceTypeLabel(record.attendance_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.start_time || '-'}</TableCell>
                    <TableCell>{record.end_time || '-'}</TableCell>
                    <TableCell>
                      {record.work_hours ? (
                        <div>
                          <div className="text-sm font-medium">{record.work_hours}h</div>
                          {record.overtime_hours && record.overtime_hours > 0 && (
                            <div className="text-xs text-orange-600">
                              残業 {record.overtime_hours}h
                            </div>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(record)}
                          disabled={record.status === 'present'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {(isExecutive || record.member_id === currentMemberId) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>勤怠記録を削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {format(new Date(record.date), 'yyyy年MM月dd日 (E)', { locale: ja })}の勤怠記録を削除します。
                                  この操作は取り消すことができません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {attendance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              勤怠記録がありません。新しい記録を作成してください。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManager; 