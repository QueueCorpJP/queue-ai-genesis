import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  MapPin,
  Building,
  User,
  BarChart3,
  TrendingUp,
  Home,
  Plane,
  Heart,
  Coffee,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MemberDetail {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  is_active: boolean;
}

interface MemberScheduleData {
  attendance_records: AttendanceRecord[];
  company_schedules: CompanySchedule[];
  monthly_stats: MonthlyStats | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  break_time_minutes: number;
  work_hours: number | null;
  overtime_hours: number;
  status: 'scheduled' | 'present' | 'absent' | 'late' | 'early_leave';
  attendance_type: 'regular' | 'remote' | 'business_trip' | 'sick_leave' | 'vacation';
  notes: string | null;
}

interface CompanySchedule {
  id: string;
  title: string;
  description: string | null;
  schedule_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  location: string | null;
  color: string;
  priority: string;
}

interface MonthlyStats {
  present_days: number;
  absent_days: number;
  late_days: number;
  total_work_hours: number;
  total_overtime_hours: number;
  remote_days: number;
  vacation_days: number;
  avg_work_hours_per_day: number;
}

interface MemberScheduleDetailProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
}

const MemberScheduleDetail: React.FC<MemberScheduleDetailProps> = ({ memberId, memberName, onClose }) => {
  const { user } = useAdmin();
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [scheduleData, setScheduleData] = useState<MemberScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // 編集・削除機能用のstate
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    break_time_minutes: 60,
    attendance_type: 'regular' as AttendanceRecord['attendance_type'],
    notes: ''
  });
  
  // admin権限チェック
  const isAdmin = user?.role && ['executive', 'ceo', 'admin'].includes(user.role);
  
  // 役員権限チェック
  const isExecutive = user?.role && ['executive', 'ceo', 'admin'].includes(user.role);

  useEffect(() => {
    if (isExecutive && memberId) {
      fetchMemberDetail();
      fetchMemberScheduleData();
    }
  }, [isExecutive, memberId, selectedMonth]);

  const fetchMemberDetail = async () => {
    try {
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      const { data, error } = await client
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      setMemberDetail(data);
    } catch (error) {
      console.error('Error fetching member detail:', error);
      toast.error('メンバー詳細の取得に失敗しました');
    }
  };

  const fetchMemberScheduleData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      // 勤怠記録を取得
      const { data: attendanceData, error: attendanceError } = await client
        .from('attendance_records')
        .select('*')
        .eq('member_id', memberId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // 企業スケジュールを取得
      const { data: companyData, error: companyError } = await client
        .from('company_schedules')
        .select('*')
        .gte('start_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('start_date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (companyError) throw companyError;

      // 月次統計を計算
      const monthlyStats = calculateMonthlyStats(attendanceData || []);

      setScheduleData({
        attendance_records: attendanceData || [],
        company_schedules: companyData || [],
        monthly_stats: monthlyStats
      });

    } catch (error) {
      console.error('Error fetching member schedule data:', error);
      toast.error('スケジュールデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 編集ダイアログを開く
  const openEditDialog = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      start_time: record.start_time || '09:00',
      end_time: record.end_time || '17:00',
      break_time_minutes: record.break_time_minutes,
      attendance_type: record.attendance_type,
      notes: record.notes || ''
    });
    setEditDialogOpen(true);
  };

  // 編集を保存
  const handleSaveEdit = async () => {
    if (!editingRecord || !isAdmin) return;

    try {
      const { error } = await getSupabaseAdmin()
        .from('attendance_records')
        .update({
          start_time: formData.start_time,
          end_time: formData.end_time,
          break_time_minutes: formData.break_time_minutes,
          attendance_type: formData.attendance_type,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast.success('勤怠記録を更新しました');
      setEditDialogOpen(false);
      setEditingRecord(null);
      fetchMemberScheduleData(); // データを再取得
    } catch (error) {
      console.error('Error updating attendance record:', error);
      toast.error('勤怠記録の更新に失敗しました');
    }
  };

  // 記録を削除
  const handleDeleteRecord = async (recordId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await getSupabaseAdmin()
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast.success('勤怠記録を削除しました');
      fetchMemberScheduleData(); // データを再取得
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast.error('勤怠記録の削除に失敗しました');
    }
  };

  const calculateMonthlyStats = (attendanceRecords: AttendanceRecord[]): MonthlyStats => {
    // 出勤として計算対象とする記録（予定・出勤・遅刻・早退）
    const workingRecords = attendanceRecords.filter(r => 
      ['present', 'late', 'early_leave', 'scheduled'].includes(r.status)
    );
    const presentRecords = attendanceRecords.filter(r => r.status === 'present');
    const absentRecords = attendanceRecords.filter(r => r.status === 'absent');
    const lateRecords = attendanceRecords.filter(r => r.status === 'late');
    const remoteRecords = attendanceRecords.filter(r => r.attendance_type === 'remote');
    const vacationRecords = attendanceRecords.filter(r => r.attendance_type === 'vacation');

    // 労働時間計算（予定も含める）
    const totalWorkHours = workingRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0);
    const totalOvertimeHours = workingRecords.reduce((sum, r) => sum + r.overtime_hours, 0);
    const avgWorkHours = workingRecords.length > 0 ? totalWorkHours / workingRecords.length : 0;

    console.log('📊 統計計算詳細:', {
      totalRecords: attendanceRecords.length,
      workingRecords: workingRecords.length,
      presentRecords: presentRecords.length,
      remoteRecords: remoteRecords.length,
      totalWorkHours,
      totalOvertimeHours,
      avgWorkHours,
      recordStatuses: attendanceRecords.map(r => ({ date: r.date, status: r.status, hours: r.work_hours }))
    });

    return {
      present_days: workingRecords.length, // 予定も含めた出勤日数
      absent_days: absentRecords.length,
      late_days: lateRecords.length,
      total_work_hours: totalWorkHours,
      total_overtime_hours: totalOvertimeHours,
      remote_days: remoteRecords.length,
      vacation_days: vacationRecords.length,
      avg_work_hours_per_day: Math.round(avgWorkHours * 10) / 10
    };
  };

  const getAttendanceStatusBadge = (status: string) => {
    const badges = {
      present: <Badge className="bg-green-500 text-white">出勤</Badge>,
      absent: <Badge className="bg-red-500 text-white">欠勤</Badge>,
      late: <Badge className="bg-orange-500 text-white">遅刻</Badge>,
      early_leave: <Badge className="bg-yellow-500 text-white">早退</Badge>,
      scheduled: <Badge variant="outline">予定</Badge>
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
  };

  const getAttendanceTypeIcon = (type: string) => {
    const icons = {
      regular: <Home className="w-4 h-4" />,
      remote: <MapPin className="w-4 h-4" />,
      business_trip: <Plane className="w-4 h-4" />,
      sick_leave: <Heart className="w-4 h-4" />,
      vacation: <Coffee className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Home className="w-4 h-4" />;
  };

  const getAttendanceTypeLabel = (type: string) => {
    const labels = {
      regular: '通常勤務',
      remote: 'リモート',
      business_trip: '出張',
      sick_leave: '病欠',
      vacation: '有給'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isExecutive) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">アクセス権限が必要です</h3>
          <p className="text-gray-500">このページは役員のみアクセス可能です。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{memberName} のスケジュール詳細</h2>
          {memberDetail && (
            <p className="text-gray-500">
              {memberDetail.department} - {memberDetail.position}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedMonth, 'yyyy年MM月', { locale: ja })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>

      {/* 月次統計カード */}
      {scheduleData?.monthly_stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">出勤日数</p>
                  <div className="text-2xl font-bold">{scheduleData.monthly_stats.present_days}日</div>
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
                  <div className="text-2xl font-bold">{scheduleData.monthly_stats.total_work_hours}h</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">残業時間</p>
                  <div className="text-2xl font-bold">{scheduleData.monthly_stats.total_overtime_hours}h</div>
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
                  <div className="text-2xl font-bold">{scheduleData.monthly_stats.remote_days}日</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 勤怠記録テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            勤怠記録
          </CardTitle>
          <CardDescription>
            {format(selectedMonth, 'yyyy年MM月', { locale: ja })}の勤怠状況
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>備考</TableHead>
                  {isAdmin && <TableHead>操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleData?.attendance_records.map((record) => (
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
                          {record.overtime_hours > 0 && (
                            <div className="text-xs text-orange-600">
                              残業 {record.overtime_hours}h
                            </div>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getAttendanceStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-32 truncate">
                        {record.notes || '-'}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(record)}
                            title="勤怠記録を編集"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="勤怠記録を削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>勤怠記録を削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {memberName}さんの{format(new Date(record.date), 'yyyy年MM月dd日 (E)', { locale: ja })}の勤怠記録を削除します。
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
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(!scheduleData?.attendance_records || scheduleData.attendance_records.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              {format(selectedMonth, 'yyyy年MM月', { locale: ja })}の勤怠記録はありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>勤怠記録を編集</DialogTitle>
            <DialogDescription>
              {editingRecord && (
                <>
                  {memberName}さんの{format(new Date(editingRecord.date), 'yyyy年MM月dd日 (E)', { locale: ja })}の勤怠記録を編集します
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">開始時刻</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_time">終了時刻</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div>
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

            <div>
              <Label htmlFor="attendance_type">勤務形態</Label>
              <Select value={formData.attendance_type} onValueChange={(value) => setFormData(prev => ({ ...prev, attendance_type: value as AttendanceRecord['attendance_type'] }))}>
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

            <div>
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 企業スケジュール */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            企業スケジュール
          </CardTitle>
          <CardDescription>
            {format(selectedMonth, 'yyyy年MM月', { locale: ja })}の全社スケジュール
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData?.company_schedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="flex items-center space-x-3 p-4 border rounded-lg"
                style={{ borderLeft: `4px solid ${schedule.color}` }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{schedule.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {schedule.schedule_type}
                    </Badge>
                    <Badge 
                      variant={schedule.priority === 'high' ? 'destructive' : 'outline'} 
                      className="text-xs"
                    >
                      {schedule.priority === 'high' ? '高' : schedule.priority === 'medium' ? '中' : '低'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{format(new Date(schedule.start_date), 'MM/dd (E)', { locale: ja })}</span>
                    {schedule.start_time && !schedule.is_all_day && (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>{schedule.start_time} - {schedule.end_time}</span>
                      </>
                    )}
                    {schedule.location && (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>{schedule.location}</span>
                      </>
                    )}
                  </div>
                  {schedule.description && (
                    <p className="text-sm text-gray-600 mt-2">{schedule.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(!scheduleData?.company_schedules || scheduleData.company_schedules.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              {format(selectedMonth, 'yyyy年MM月', { locale: ja })}の企業スケジュールはありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberScheduleDetail;
