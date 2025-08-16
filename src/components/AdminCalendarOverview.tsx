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
  CheckCircle
} from 'lucide-react';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

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
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  // フィルタリング
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showPrivateEvents, setShowPrivateEvents] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  
  // 部署とメンバーのリスト
  const [departments, setDepartments] = useState<string[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; department: string }[]>([]);
  
  // 役員権限チェック
  const isExecutive = user?.role && ['executive', 'ceo', 'admin'].includes(user.role);

  useEffect(() => {
    if (isExecutive) {
      fetchMembers();
    }
  }, [isExecutive]);

  useEffect(() => {
    if (isExecutive && members.length > 0) {
      fetchCalendarData();
      fetchAttendanceData();
      fetchCalendarInsights();
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

      setMembers(data || []);
      
      // 部署一覧を抽出
      const uniqueDepartments = [...new Set(data?.map(m => m.department).filter(Boolean))] as string[];
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

      const { data, error } = await client.rpc('get_all_members_calendar_overview', {
        start_date_param: format(startDate, 'yyyy-MM-dd'),
        end_date_param: format(endDate, 'yyyy-MM-dd')
      });

      if (error) throw error;

      console.log('📅 Calendar data fetched:', data?.length || 0, 'members');
      setMembersCalendarData(data || []);

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('カレンダーデータの取得に失敗しました');
      setMembersCalendarData([]);
    } finally {
      setLoading(false);
    }
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
          members!inner(name, email, department),
          date,
          status,
          attendance_type,
          work_hours
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData: AttendanceStatus[] = (data || []).map(record => ({
        member_id: record.member_id,
        member_name: record.members.name,
        date: record.date,
        status: record.status,
        attendance_type: record.attendance_type,
        work_hours: record.work_hours
      }));

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

      const { data, error } = await client.rpc('get_calendar_insights');

      if (error) throw error;

      if (data && data.length > 0) {
        setCalendarInsights(data[0]);
      }

    } catch (error) {
      console.error('Error fetching calendar insights:', error);
      // エラーは表示しない（統計データは必須ではないため）
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
          startDate: startOfMonth(selectedDate), 
          endDate: endOfMonth(selectedDate)
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

  // データリフレッシュ
  const refreshData = async () => {
    await Promise.all([
      fetchCalendarData(),
      fetchAttendanceData(),
      fetchCalendarInsights()
    ]);
    toast.success('データを更新しました');
  };

  // イベント種別アイコン
  const getEventTypeIcon = (eventType: string, calendarType: string) => {
    if (calendarType === 'company') {
      switch (eventType) {
        case 'meeting': return '🤝';
        case 'holiday': return '🏖️';
        case 'training': return '📚';
        case 'deadline': return '⚠️';
        default: return '📅';
      }
    } else {
      switch (eventType) {
        case 'personal': return '📅';
        case 'meeting': return '🤝';
        case 'appointment': return '📋';
        case 'task': return '✅';
        case 'reminder': return '⏰';
        default: return '📌';
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
                  <SelectItem value="month">今月</SelectItem>
                  <SelectItem value="custom">カスタム</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                          <Badge variant="outline" className="text-xs">
                            会社: {member.company_events}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            個人: {member.personal_events}
                          </Badge>
                        </div>
                      </div>

                      {expandedMembers.has(member.member_id) && (
                        <div className="mt-4 space-y-2">
                          {member.events_detail.length > 0 ? (
                            member.events_detail.map((event, index) => (
                              <div 
                                key={index}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                                style={{ borderLeft: `4px solid ${event.color}` }}
                              >
                                <span className="text-lg">
                                  {getEventTypeIcon(event.event_type, event.calendar_type)}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-sm">{event.title}</h4>
                                    {event.is_private && <EyeOff className="w-3 h-3 text-gray-400" />}
                                    <Badge variant="outline" className="text-xs">
                                      {event.calendar_type === 'company' ? '会社' : '個人'}
                                    </Badge>
                                    {getPriorityBadge(event.priority)}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                    <span>{format(new Date(event.start_date), 'MM/dd (E)', { locale: ja })}</span>
                                    {event.start_time && <span>{event.start_time}</span>}
                                    <span>{event.event_type}</span>
                                  </div>
                                </div>
                              </div>
                            ))
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCalendarOverview;

