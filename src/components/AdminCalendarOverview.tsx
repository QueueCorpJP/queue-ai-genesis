import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Filter,
  Search,
  Eye,
  EyeOff,
  BarChart3,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X
} from 'lucide-react';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, parseISO, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import MemberScheduleDetail from './MemberScheduleDetail';

interface MemberCalendarData {
  member_id: string;
  member_name: string;
  member_email: string;
  department: string;
  total_events: number;
  company_events: number;
  personal_events: number;
  today_events: number;
  upcoming_events: number;
  events_detail: CalendarEvent[];
}

interface CalendarEvent {
  calendar_type: 'company' | 'personal';
  title: string;
  start_date: string;
  start_time: string | null;
  event_type: string;
  priority: string;
  color: string;
  is_private?: boolean;
}

interface AttendanceStatus {
  member_id: string;
  member_name: string;
  date: string;
  status: 'scheduled' | 'present' | 'absent' | 'late' | 'early_leave';
  attendance_type: 'regular' | 'remote' | 'business_trip' | 'sick_leave' | 'vacation';
  work_hours: number | null;
}

interface TodayAttendee {
  member_id: string;
  member_name: string;
  department: string;
  start_time: string | null;
  end_time: string | null;
  work_hours: number;
  attendance_type: string;
  status: string;
}

interface AttendanceEditForm {
  id: string;
  member_id: string;
  member_name: string;
  date: string;
  start_time: string;
  end_time: string;
  break_time_minutes: number;
  status: 'scheduled' | 'present' | 'absent' | 'late' | 'early_leave';
  attendance_type: 'regular' | 'remote' | 'business_trip' | 'sick_leave' | 'vacation';
  notes: string;
}

interface CalendarInsights {
  total_members: number;
  total_events: number;
  company_events: number;
  personal_events: number;
  events_today: number;
  events_this_week: number;
  most_active_member: string;
  most_common_event_type: string;
  average_events_per_member: number;
}

type ViewMode = 'calendar' | 'list' | 'attendance';
type DateRange = 'today' | 'week' | 'month' | 'custom';

const AdminCalendarOverview: React.FC = () => {
  const { user } = useAdmin();
  const [membersCalendarData, setMembersCalendarData] = useState<MemberCalendarData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceStatus[]>([]);
  const [calendarInsights, setCalendarInsights] = useState<CalendarInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  // フィルタリング
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showPrivateEvents, setShowPrivateEvents] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  
  // メンバー詳細表示
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<{ id: string; name: string } | null>(null);
  
  // 部署とメンバーのリスト
  const [departments, setDepartments] = useState<string[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; email: string; department: string; position: string }[]>([]);
  
  // 今日の出勤者リスト
  const [todayAttendees, setTodayAttendees] = useState<TodayAttendee[]>([]);
  
  // 勤怠編集モーダル
  const [editAttendanceModalOpen, setEditAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceEditForm | null>(null);
  
  // 役員権限チェック
  const isExecutive = user?.role && ['executive', 'ceo', 'admin'].includes(user.role);

  useEffect(() => {
    if (isExecutive) {
      fetchMembers();
    }
  }, [isExecutive]);

  useEffect(() => {
    if (isExecutive) {
      fetchCalendarData();
      fetchAttendanceData();
    }
  }, [selectedMonth, dateRange, selectedDepartment, selectedMember, showPrivateEvents, isExecutive]);

  useEffect(() => {
    if (isExecutive && members.length > 0) {
      fetchCalendarData();
      fetchAttendanceData();
      fetchCalendarInsights();
      fetchTodayAttendees();
    }
  }, [isExecutive, members, selectedDate, dateRange, customStartDate, customEndDate]);

  // メンバー一覧取得
  const fetchMembers = async () => {
    try {
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      const { data, error } = await client
        .from('members')
        .select('id, name, email, department, position')
        .eq('is_active', true)
        .order('department', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('Members fetched:', data?.length || 0, 'members');
      console.log('Members data:', data);
      setMembers(data || []);
      
      // 部署一覧を抽出
      const uniqueDepartments = [...new Set(data?.map(m => m.department).filter(Boolean))] as string[];
      console.log('Departments:', uniqueDepartments);
      setDepartments(uniqueDepartments);

    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('メンバー情報の取得に失敗しました');
    }
  };

  // カレンダーデータ取得
  const fetchCalendarData = async () => {
    if (!isExecutive) return;
    
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      // 代替実装：直接データベースからメンバーとスケジュール情報を取得
      const { data: memberData, error: memberError } = await client
        .from('members')
        .select('id, name, email, department, position')
        .eq('is_active', true);

      if (memberError) throw memberError;

      // 各メンバーのカレンダーデータを構築
      const membersCalendarData: MemberCalendarData[] = [];

      for (const member of memberData || []) {
        // 企業スケジュールを取得
        const { data: companySchedules, error: companyError } = await client
          .from('company_schedules')
          .select('*')
          .gte('start_date', format(startDate, 'yyyy-MM-dd'))
          .lte('start_date', format(endDate, 'yyyy-MM-dd'))
          .eq('is_active', true);

        if (companyError) {
          console.error('Error fetching company schedules:', companyError);
        }

        // 勤怠記録を取得（スケジュール的な要素として扱う）
        const { data: attendanceRecords, error: attendanceError } = await client
          .from('attendance_records')
          .select('*')
          .eq('member_id', member.id)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        if (attendanceError) {
          console.error('Error fetching attendance records:', attendanceError);
        }

        // デバッグ: 出勤予定データ確認
        if (process.env.NODE_ENV === 'development') {
          const scheduledRecords = (attendanceRecords || []).filter(r => r.status === 'scheduled');
          if (scheduledRecords.length > 0) {
            console.log(`${member.name} の出勤予定:`, scheduledRecords);
          }
        }

        // イベント詳細を構築
        const events_detail: CalendarEvent[] = [];

        // 企業スケジュールをイベントとして追加
        (companySchedules || []).forEach(schedule => {
          events_detail.push({
            calendar_type: 'company',
            title: schedule.title,
            start_date: schedule.start_date,
            start_time: schedule.start_time,
            event_type: schedule.schedule_type,
            priority: schedule.priority,
            color: schedule.color,
            is_private: false
          });
        });

        // 勤怠記録をイベントとして追加（予定も含む）
        (attendanceRecords || []).forEach(record => {
          const isScheduled = record.status === 'scheduled';
          const title = isScheduled 
            ? `出勤予定: ${getAttendanceTypeLabel(record.attendance_type)}`
            : `勤怠: ${getAttendanceTypeLabel(record.attendance_type)}`;
          
          events_detail.push({
            calendar_type: 'personal',
            title: title,
            start_date: record.date,
            start_time: record.start_time,
            event_type: record.attendance_type,
            priority: isScheduled ? 'low' : 'medium',
            color: getAttendanceColor(record.status),
            is_private: false
          });
        });

        // 今日と今後のイベント数を計算
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        
        const todayEvents = events_detail.filter(event => event.start_date === todayStr);
        const upcomingEvents = events_detail.filter(event => 
          new Date(event.start_date) > today
        );

        membersCalendarData.push({
          member_id: member.id,
          member_name: member.name,
          member_email: member.email,
          department: member.department || '未設定',
          total_events: events_detail.length,
          company_events: events_detail.filter(e => e.calendar_type === 'company').length,
          personal_events: events_detail.filter(e => e.calendar_type === 'personal').length,
          today_events: todayEvents.length,
          upcoming_events: upcomingEvents.length,
          events_detail: events_detail
        });
      }

      console.log('Calendar data fetched:', membersCalendarData.length, 'members');
      console.log('Members calendar data:', membersCalendarData);
      setMembersCalendarData(membersCalendarData);

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('カレンダーデータの取得に失敗しました');
      setMembersCalendarData([]);
    } finally {
      setLoading(false);
    }
  };

  // 勤怠ステータスの色取得
  const getAttendanceColor = (status: string) => {
    const colors: { [key: string]: string } = {
      present: '#10B981',      // 緑：出勤済み
      absent: '#EF4444',       // 赤：欠勤
      late: '#F59E0B',         // 黄色：遅刻
      early_leave: '#F97316',  // オレンジ：早退
      scheduled: '#3B82F6'     // 青：出勤予定（より目立つ色に変更）
    };
    return colors[status] || '#6B7280';
  };

  // 勤怠データ取得
  const fetchAttendanceData = async () => {
    if (!isExecutive) return;
    
    try {
      const { startDate, endDate } = getDateRange();
      
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      const { data, error } = await client
        .from('attendance_records')
        .select(`
          member_id,
          members!member_id(name, email, department),
          date,
          status,
          attendance_type,
          work_hours
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;

      console.log('Raw attendance data:', data);

      const formattedData: AttendanceStatus[] = (data || []).map(record => ({
        member_id: record.member_id,
        member_name: record.members?.name || 'Unknown',
        date: record.date,
        status: record.status,
        attendance_type: record.attendance_type,
        work_hours: record.work_hours
      }));

      console.log('Formatted attendance data:', formattedData);
      setAttendanceData(formattedData);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('勤怠データの取得に失敗しました');
    }
  };

  // カレンダー統計取得
  const fetchCalendarInsights = async () => {
    if (!isExecutive) return;
    
    try {
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      // 統計を手動で計算
      const insights: CalendarInsights = {
        total_members: 0,
        total_events: 0,
        company_events: 0,
        personal_events: 0,
        events_today: 0,
        events_this_week: 0,
        most_active_member: '',
        most_common_event_type: '',
        average_events_per_member: 0
      };

      // アクティブメンバー数を取得
      const { data: membersCount, error: membersError } = await client
        .from('members')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      if (!membersError) {
        insights.total_members = membersCount?.length || 0;
      }

      // 企業スケジュール数を取得
      const { data: companySchedules, error: companyError } = await client
        .from('company_schedules')
        .select('*')
        .eq('is_active', true);

      if (!companyError) {
        insights.company_events = companySchedules?.length || 0;
        insights.total_events += insights.company_events;
      }

      // 勤怠記録（個人イベント）数を取得
      const { data: attendanceRecords, error: attendanceError } = await client
        .from('attendance_records')
        .select('*');

      if (!attendanceError) {
        insights.personal_events = attendanceRecords?.length || 0;
        insights.total_events += insights.personal_events;
      }

      // 今日のイベント数を計算
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayCompanyEvents = companySchedules?.filter(s => s.start_date === today).length || 0;
      const todayAttendanceEvents = attendanceRecords?.filter(a => a.date === today).length || 0;
      insights.events_today = todayCompanyEvents + todayAttendanceEvents;

      // 今週のイベント数を計算
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const thisWeekCompanyEvents = companySchedules?.filter(s => 
        s.start_date >= weekStart && s.start_date <= weekEnd
      ).length || 0;
      const thisWeekAttendanceEvents = attendanceRecords?.filter(a => 
        a.date >= weekStart && a.date <= weekEnd
      ).length || 0;
      insights.events_this_week = thisWeekCompanyEvents + thisWeekAttendanceEvents;

      // 平均イベント数を計算
      if (insights.total_members > 0) {
        insights.average_events_per_member = Math.round(insights.total_events / insights.total_members * 10) / 10;
      }

      // 最も活発なメンバーを計算（簡略化）
      insights.most_active_member = 'データ分析中...';

      // 最も一般的なイベントタイプを計算
      const eventTypes: { [key: string]: number } = {};
      companySchedules?.forEach(s => {
        eventTypes[s.schedule_type] = (eventTypes[s.schedule_type] || 0) + 1;
      });
      attendanceRecords?.forEach(a => {
        eventTypes[a.attendance_type] = (eventTypes[a.attendance_type] || 0) + 1;
      });

      const mostCommonType = Object.entries(eventTypes).reduce((a, b) => 
        eventTypes[a[0]] > eventTypes[b[0]] ? a : b, ['', 0]
      );
      insights.most_common_event_type = mostCommonType[0] || '未分類';

      setCalendarInsights(insights);

    } catch (error) {
      console.error('Error fetching calendar insights:', error);
      // エラーは表示しない（統計データは必須ではないため）
    }
  };

  // 今日の出勤者取得
  const fetchTodayAttendees = async () => {
    if (!isExecutive) return;
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      const { data, error } = await client
        .from('attendance_records')
        .select(`
          member_id,
          members!member_id(name, email, department),
          start_time,
          end_time,
          work_hours,
          attendance_type,
          status
        `)
        .eq('date', today)
        .in('status', ['scheduled', 'present', 'late', 'early_leave'])
        .order('start_time', { ascending: true });

      if (error) throw error;

      const todayData: TodayAttendee[] = (data || []).map(record => ({
        member_id: record.member_id,
        member_name: record.members?.name || 'Unknown',
        department: record.members?.department || '未設定',
        start_time: record.start_time,
        end_time: record.end_time,
        work_hours: record.work_hours || 0,
        attendance_type: record.attendance_type,
        status: record.status
      }));

      console.log('今日の出勤者:', todayData);
      setTodayAttendees(todayData);

    } catch (error) {
      console.error('Error fetching today attendees:', error);
      // エラーは表示しない（補助的な機能のため）
    }
  };

  // 日付範囲計算
  const getDateRange = () => {
    switch (dateRange) {
      case 'today':
        return { startDate: selectedDate, endDate: selectedDate };
      case 'week':
        return { 
          startDate: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
          endDate: endOfWeek(selectedDate, { weekStartsOn: 1 })
        };
      case 'month':
        return { 
          startDate: startOfMonth(selectedMonth), 
          endDate: endOfMonth(selectedMonth)
        };
      case 'custom':
        return { 
          startDate: customStartDate || selectedDate, 
          endDate: customEndDate || selectedDate
        };
      default:
        return { startDate: selectedDate, endDate: selectedDate };
    }
  };

  // フィルタリング
  const filteredMembersData = membersCalendarData.filter(member => {
    // 検索条件
    if (searchTerm && !member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !member.member_email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // 部署フィルタ
    if (selectedDepartment !== 'all' && member.department !== selectedDepartment) {
      return false;
    }
    
    // メンバーフィルタ
    if (selectedMember !== 'all' && member.member_id !== selectedMember) {
      return false;
    }
    
    return true;
  });

  // デバッグ: フィルタリング結果（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('Raw members data:', membersCalendarData.length);
    console.log('Filtered members data:', filteredMembersData.length);
    console.log('Search term:', searchTerm);
    console.log('Selected department:', selectedDepartment);
    console.log('Selected member:', selectedMember);
  }

  // データリフレッシュ
  const refreshData = async () => {
    await Promise.all([
      fetchCalendarData(),
      fetchAttendanceData(),
      fetchCalendarInsights(),
      fetchTodayAttendees()
    ]);
    toast.success('データを更新しました');
  };

  // 勤怠編集関数
  const openEditAttendanceModal = async (attendee: TodayAttendee) => {
    try {
      // 詳細な勤怠データを取得
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      const { data, error } = await client
        .from('attendance_records')
        .select('*')
        .eq('member_id', attendee.member_id)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      if (error) throw error;

      setEditingAttendance({
        id: data.id,
        member_id: data.member_id,
        member_name: attendee.member_name,
        date: data.date,
        start_time: data.start_time || '09:00',
        end_time: data.end_time || '17:00',
        break_time_minutes: data.break_time_minutes || 60,
        status: data.status,
        attendance_type: data.attendance_type,
        notes: data.notes || ''
      });
      setEditAttendanceModalOpen(true);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast.error('勤怠データの取得に失敗しました');
    }
  };

  // 勤怠テーブルから編集モーダルを開く関数
  const openEditAttendanceFromTable = async (record: AttendanceStatus) => {
    try {
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      const { data, error } = await client
        .from('attendance_records')
        .select('*')
        .eq('member_id', record.member_id)
        .eq('date', record.date)
        .single();

      if (error) throw error;

      setEditingAttendance({
        id: data.id,
        member_id: data.member_id,
        member_name: record.member_name,
        date: data.date,
        start_time: data.start_time || '09:00',
        end_time: data.end_time || '17:00',
        break_time_minutes: data.break_time_minutes || 60,
        status: data.status,
        attendance_type: data.attendance_type,
        notes: data.notes || ''
      });
      setEditAttendanceModalOpen(true);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast.error('勤怠データの取得に失敗しました');
    }
  };

  const updateAttendanceRecord = async (formData: AttendanceEditForm) => {
    try {
      const adminClient = getSupabaseAdmin();
      const client = adminClient || supabase;

      // 労働時間を自動計算
      let workHours = 0;
      if (formData.start_time && formData.end_time) {
        const start = new Date(`2000-01-01T${formData.start_time}:00`);
        const end = new Date(`2000-01-01T${formData.end_time}:00`);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        workHours = Math.max(0, diffHours - (formData.break_time_minutes / 60));
      }

      const { error } = await client
        .from('attendance_records')
        .update({
          start_time: formData.start_time,
          end_time: formData.end_time,
          break_time_minutes: formData.break_time_minutes,
          work_hours: workHours,
          status: formData.status,
          attendance_type: formData.attendance_type,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.id);

      if (error) throw error;

      toast.success('勤怠データを更新しました');
      setEditAttendanceModalOpen(false);
      setEditingAttendance(null);
      
      // データを再取得
      await Promise.all([
        fetchTodayAttendees(),
        fetchAttendanceData()
      ]);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('勤怠データの更新に失敗しました');
    }
  };

  // イベント種別アイコン
  const getEventTypeIcon = (eventType: string, calendarType: string) => {
    if (calendarType === 'company') {
      switch (eventType) {
        case 'meeting': return '';
        case 'holiday': return '';
        case 'training': return '';
        case 'deadline': return '';
        default: return '';
      }
    } else {
      // 勤怠関連のアイコン
      switch (eventType) {
        case 'normal': return '';      // 通常出勤
        case 'overtime': return '';    // 残業
        case 'holiday': return '';    // 休日出勤
        case 'remote': return '';      // リモートワーク
        case 'halfday': return '';     // 半日勤務
        case 'personal': return '';
        case 'meeting': return '';
        case 'appointment': return '';
        case 'task': return '';
        case 'reminder': return '';
        default: return '';
      }
    }
  };

  // 優先度バッジ
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">緊急</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs bg-orange-500 hover:bg-orange-600">高</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">中</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">低</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  // 勤怠ステータスバッジ
  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">出勤</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="text-xs">欠勤</Badge>;
      case 'late':
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-xs">遅刻</Badge>;
      case 'early_leave':
        return <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-xs">早退</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="text-xs">予定</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // 勤怠タイプアイコン取得
  const getAttendanceTypeIcon = (type: string) => {
    switch (type) {
      case 'regular': return '';
      case 'remote': return '';
      case 'business_trip': return '';
      case 'sick_leave': return '';
      case 'vacation': return '';
      default: return '';
    }
  };

  // 勤怠タイプラベル取得
  const getAttendanceTypeLabel = (type: string) => {
    switch (type) {
      case 'regular': return '通常勤務';
      case 'remote': return 'リモート';
      case 'business_trip': return '出張';
      case 'sick_leave': return '病気休暇';
      case 'vacation': return '有給休暇';
      default: return type;
    }
  };

  // 時間フォーマット
  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5); // HH:MM形式
  };

  // メンバー展開/折りたたみ
  const toggleMemberExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  // イベントタイプのラベル取得
  const getEventTypeLabel = (eventType: string) => {
    const labels: { [key: string]: string } = {
      // 企業スケジュール
      event: 'イベント',
      meeting: '会議',
      holiday: '休暇',
      deadline: '締切',
      training: '研修',
      other: 'その他',
      // 勤怠タイプ
      regular: '通常勤務',
      remote: 'リモート',
      business_trip: '出張',
      sick_leave: '病欠',
      vacation: '有給'
    };
    return labels[eventType] || eventType;
  };

  // 月間カレンダービューコンポーネント
  const MonthlyCalendarView: React.FC<{ 
    selectedDate: Date; 
    membersData: MemberCalendarData[] 
  }> = ({ selectedDate, membersData }) => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 日付ごとのイベントを集計
    const getEventsForDate = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const events: { event: CalendarEvent; memberName: string }[] = [];
      
      membersData.forEach(member => {
        member.events_detail.forEach(event => {
          if (event.start_date === dateStr) {
            events.push({ event, memberName: member.member_name });
          }
        });
      });
      
      return events;
    };

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* 曜日ヘッダー */}
        {['月', '火', '水', '木', '金', '土', '日'].map(day => (
          <div key={day} className="text-center font-medium text-sm text-gray-600 p-2">
            {day}
          </div>
        ))}
        
        {/* カレンダー日付 */}
        {calendarDays.map(day => {
          const events = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-24 p-2 border border-gray-100 ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className={`text-sm font-medium ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              
              {/* イベント表示 */}
              <div className="mt-1 space-y-1">
                {events.slice(0, 3).map((item, index) => (
                  <div 
                    key={index}
                    className="text-xs p-1 rounded truncate"
                    style={{ 
                      backgroundColor: item.event.color + '20',
                      borderLeft: `2px solid ${item.event.color}`
                    }}
                    title={`${item.memberName}: ${item.event.title}`}
                  >
                    <div className="font-medium truncate">{item.event.title}</div>
                    <div className="text-gray-600 truncate">{item.memberName}</div>
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{events.length - 3} 件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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

  // メンバー詳細表示が選択されている場合
  if (selectedMemberForDetail) {
    return (
      <MemberScheduleDetail
        memberId={selectedMemberForDetail.id}
        memberName={selectedMemberForDetail.name}
        onClose={() => setSelectedMemberForDetail(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">カレンダー・勤怠管理</h2>
          <p className="text-gray-500">全メンバーのカレンダーと勤怠状況を管理します</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {calendarInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総メンバー数</p>
                  <p className="text-2xl font-bold text-gray-900">{calendarInsights.total_members}</p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総イベント数</p>
                  <p className="text-2xl font-bold text-gray-900">{calendarInsights.total_events}</p>
                </div>
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今日のイベント</p>
                  <p className="text-2xl font-bold text-gray-900">{calendarInsights.events_today}</p>
                </div>
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均イベント数</p>
                  <p className="text-2xl font-bold text-gray-900">{calendarInsights.average_events_per_member}</p>
                </div>
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 今日の出勤者 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Clock className="w-5 h-5 mr-2" />
            今日の出勤予定 ({format(new Date(), 'yyyy年MM月dd日', { locale: ja })})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAttendees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              今日の出勤予定はありません
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAttendees.map((attendee) => (
                <div key={attendee.member_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getAttendanceTypeIcon(attendee.attendance_type)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{attendee.member_name}</h4>
                          <p className="text-sm text-gray-500">{attendee.department}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatTime(attendee.start_time)} - {formatTime(attendee.end_time)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">勤務時間:</span>
                          <span className="font-medium">{attendee.work_hours}h</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">形態:</span>
                          <span>{getAttendanceTypeLabel(attendee.attendance_type)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex flex-col space-y-2">
                      {getAttendanceStatusBadge(attendee.status)}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditAttendanceModal(attendee)}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        編集
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* フィルタ・設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            フィルタ・表示設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 検索 */}
            <div className="space-y-2">
              <Label htmlFor="search">メンバー検索</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="名前またはメール"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 部署フィルタ */}
            <div className="space-y-2">
              <Label htmlFor="department">部署</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="部署を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部署</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* メンバーフィルタ */}
            <div className="space-y-2">
              <Label htmlFor="member">メンバー</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="メンバーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全メンバー</SelectItem>
                  {members
                    .filter(m => selectedDepartment === 'all' || m.department === selectedDepartment)
                    .map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 日付範囲 */}
            <div className="space-y-2">
              <Label htmlFor="dateRange">期間</Label>
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="期間を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今日</SelectItem>
                  <SelectItem value="week">今週</SelectItem>
                  <SelectItem value="month">指定月</SelectItem>
                  <SelectItem value="custom">カスタム</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 月選択 */}
          {dateRange === 'month' && (
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedMonth, 'yyyy年MM月', { locale: ja })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedMonth(date);
                      }
                    }}
                    defaultMonth={selectedMonth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* カスタム日付範囲 */}
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {customStartDate ? format(customStartDate, 'yyyy/MM/dd') : '開始日'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
              <span>〜</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {customEndDate ? format(customEndDate, 'yyyy/MM/dd') : '終了日'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* 表示オプション */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="showPrivate"
                checked={showPrivateEvents}
                onCheckedChange={setShowPrivateEvents}
              />
              <Label htmlFor="showPrivate" className="text-sm">
                プライベートイベントを表示
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ビュー切り替えタブ */}
      <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>カレンダー</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>リスト</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>勤怠</span>
          </TabsTrigger>
        </TabsList>

        {/* カレンダービュー */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>カレンダービュー</CardTitle>
              <CardDescription>
                全メンバーのスケジュールを統合表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 月間カレンダー表示 */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">
                      {format(dateRange === 'month' ? selectedMonth : selectedDate, 'yyyy年MM月', { locale: ja })} カレンダー
                    </h3>
                                        <MonthlyCalendarView
                      selectedDate={dateRange === 'month' ? selectedMonth : selectedDate}
                      membersData={filteredMembersData}
                    />
                  </div>

                  {/* メンバー別詳細表示 */}
                  {filteredMembersData.map(member => (
                    <div key={member.member_id} className="border border-gray-200 rounded-lg p-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleMemberExpansion(member.member_id)}
                      >
                        <div className="flex items-center space-x-3">
                          {expandedMembers.has(member.member_id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          <div>
                            <h3 className="font-medium text-gray-900">{member.member_name}</h3>
                            <p className="text-sm text-gray-500">{member.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="text-xs">
                            総計: {member.total_events}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            会社: {member.company_events}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            勤怠: {member.personal_events}
                          </Badge>
                          {member.today_events > 0 && (
                            <Badge variant="default" className="text-xs">
                              今日: {member.today_events}
                            </Badge>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemberForDetail({
                                id: member.member_id,
                                name: member.member_name
                              });
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            詳細
                          </Button>
                        </div>
                      </div>

                      {expandedMembers.has(member.member_id) && (
                        <div className="mt-4 space-y-2">
                          {member.events_detail.length > 0 ? (
                            member.events_detail
                              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                              .map((event, index) => {
                                const isToday = event.start_date === format(new Date(), 'yyyy-MM-dd');
                                const isScheduled = event.title.includes('出勤予定');
                                
                                return (
                                <div 
                                  key={index}
                                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                                    isToday 
                                      ? isScheduled 
                                        ? 'bg-blue-50 border border-blue-200' 
                                        : 'bg-green-50 border border-green-200'
                                      : 'bg-gray-50'
                                  }`}
                                  style={{ borderLeft: `4px solid ${event.color}` }}
                                >
                                <span className="text-lg">
                                  {getEventTypeIcon(event.event_type, event.calendar_type)}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-sm">{event.title}</h4>
                                    {event.is_private && <EyeOff className="w-3 h-3 text-gray-400" />}
                                    {isToday && (
                                      <Badge variant="default" className="text-xs bg-blue-600 text-white">
                                        今日
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {event.calendar_type === 'company' ? '会社' : '勤怠'}
                                    </Badge>
                                    {getPriorityBadge(event.priority)}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                    <span>{format(new Date(event.start_date), 'MM/dd (E)', { locale: ja })}</span>
                                    {event.start_time && <span>{event.start_time}</span>}
                                    <span>{getEventTypeLabel(event.event_type)}</span>
                                  </div>
                                </div>
                              </div>
                                );
                              })
                          ) : (
                            <p className="text-sm text-gray-500 py-4">この期間にイベントはありません</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* リストビュー */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>メンバー一覧</CardTitle>
              <CardDescription>
                メンバー別のスケジュール概要を表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">読み込み中...</span>
                </div>
              ) : filteredMembersData.length === 0 ? (
                members.length > 0 ? (
                  // カレンダーデータはないが、基本メンバー情報は表示
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>メンバー</TableHead>
                          <TableHead>部署</TableHead>
                          <TableHead>役職</TableHead>
                          <TableHead>ステータス</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members
                          .filter(member => {
                            // フィルタリング条件を適用
                            if (searchTerm && !member.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                                !member.email.toLowerCase().includes(searchTerm.toLowerCase())) {
                              return false;
                            }
                            if (selectedDepartment !== 'all' && member.department !== selectedDepartment) {
                              return false;
                            }
                            if (selectedMember !== 'all' && member.id !== selectedMember) {
                              return false;
                            }
                            return true;
                          })
                          .map(member => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{member.name}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{member.department || '未設定'}</TableCell>
                              <TableCell>{member.position || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  アクティブ
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedMemberForDetail({
                                    id: member.id,
                                    name: member.name
                                  })}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  詳細
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 bg-blue-50 border-t">
                      <p className="text-sm text-blue-700">
                        カレンダーデータを読み込み中です。イベント情報は準備でき次第表示されます。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">メンバーデータがありません</p>
                    <p className="text-sm">データを読み込んでいるか、条件に一致するメンバーが見つかりません。</p>
                    <Button onClick={refreshData} className="mt-4" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      データを再読み込み
                    </Button>
                  </div>
                )
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>メンバー</TableHead>
                        <TableHead>部署</TableHead>
                        <TableHead>総イベント</TableHead>
                        <TableHead>会社イベント</TableHead>
                        <TableHead>個人イベント</TableHead>
                        <TableHead>今日</TableHead>
                        <TableHead>今後</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembersData.map(member => (
                      <TableRow key={member.member_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.member_name}</div>
                            <div className="text-sm text-gray-500">{member.member_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.total_events}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {member.company_events}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {member.personal_events}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.today_events > 0 ? (
                            <Badge variant="default">{member.today_events}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.upcoming_events > 0 ? (
                            <Badge variant="secondary">{member.upcoming_events}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedMemberForDetail({
                              id: member.member_id,
                              name: member.member_name
                            })}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            詳細
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
        </TabsContent>

        {/* 勤怠ビュー */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>勤怠状況</CardTitle>
              <CardDescription>
                メンバーの勤怠状況を確認します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>メンバー</TableHead>
                      <TableHead>日付</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>勤務形態</TableHead>
                      <TableHead>労働時間</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData
                      .filter(record => {
                        const member = members.find(m => m.id === record.member_id);
                        if (!member) return false;
                        
                        // フィルタリング条件を適用
                        if (searchTerm && !member.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                          return false;
                        }
                        if (selectedDepartment !== 'all' && member.department !== selectedDepartment) {
                          return false;
                        }
                        if (selectedMember !== 'all' && record.member_id !== selectedMember) {
                          return false;
                        }
                        
                        return true;
                      })
                      .map(record => (
                        <TableRow key={`${record.member_id}-${record.date}`}>
                          <TableCell>
                            <div className="font-medium">{record.member_name}</div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.date), 'MM/dd (E)', { locale: ja })}
                          </TableCell>
                          <TableCell>
                            {getAttendanceStatusBadge(record.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {record.attendance_type === 'regular' ? '通常' :
                               record.attendance_type === 'remote' ? 'リモート' :
                               record.attendance_type === 'business_trip' ? '出張' :
                               record.attendance_type === 'sick_leave' ? '病欠' :
                               record.attendance_type === 'vacation' ? '有給' : record.attendance_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.work_hours ? `${record.work_hours}時間` : '-'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditAttendanceFromTable(record)}
                              className="h-8 px-3 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              編集
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 勤怠編集モーダル */}
      <Dialog open={editAttendanceModalOpen} onOpenChange={setEditAttendanceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>勤怠データ編集</DialogTitle>
          </DialogHeader>
          {editingAttendance && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">メンバー</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {editingAttendance.member_name}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">日付</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {format(new Date(editingAttendance.date), 'yyyy年MM月dd日', { locale: ja })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">開始時刻</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={editingAttendance.start_time}
                    onChange={(e) => setEditingAttendance(prev => prev ? {...prev, start_time: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">終了時刻</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={editingAttendance.end_time}
                    onChange={(e) => setEditingAttendance(prev => prev ? {...prev, end_time: e.target.value} : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="break_time">休憩時間（分）</Label>
                <Input
                  id="break_time"
                  type="number"
                  value={editingAttendance.break_time_minutes}
                  onChange={(e) => setEditingAttendance(prev => prev ? {...prev, break_time_minutes: parseInt(e.target.value) || 0} : null)}
                />
              </div>

              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select 
                  value={editingAttendance.status} 
                  onValueChange={(value) => setEditingAttendance(prev => prev ? {...prev, status: value as any} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">予定</SelectItem>
                    <SelectItem value="present">出勤</SelectItem>
                    <SelectItem value="absent">欠勤</SelectItem>
                    <SelectItem value="late">遅刻</SelectItem>
                    <SelectItem value="early_leave">早退</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="attendance_type">勤務形態</Label>
                <Select 
                  value={editingAttendance.attendance_type} 
                  onValueChange={(value) => setEditingAttendance(prev => prev ? {...prev, attendance_type: value as any} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">通常勤務</SelectItem>
                    <SelectItem value="remote">リモート</SelectItem>
                    <SelectItem value="business_trip">出張</SelectItem>
                    <SelectItem value="sick_leave">病気休暇</SelectItem>
                    <SelectItem value="vacation">有給休暇</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={editingAttendance.notes}
                  onChange={(e) => setEditingAttendance(prev => prev ? {...prev, notes: e.target.value} : null)}
                  placeholder="備考を入力してください"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setEditAttendanceModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
            <Button onClick={() => editingAttendance && updateAttendanceRecord(editingAttendance)}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendarOverview;

