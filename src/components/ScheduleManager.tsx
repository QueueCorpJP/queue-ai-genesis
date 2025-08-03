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
  Plus, 
  Edit, 
  Trash2,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Building,
  BookOpen,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CompanySchedule {
  id: string;
  title: string;
  description: string;
  schedule_type: 'event' | 'meeting' | 'holiday' | 'deadline' | 'training' | 'other';
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  location: string | null;
  is_holiday: boolean;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  color: string;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  schedule_type: string;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  location: string | null;
  is_holiday: boolean;
  color: string;
  priority: string;
  days_until: number;
  date_label: string;
  urgency_level: string;
}

const ScheduleManager: React.FC = () => {
  const { user } = useAdmin();
  const [schedules, setSchedules] = useState<CompanySchedule[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingSchedule, setEditingSchedule] = useState<CompanySchedule | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // 現在のユーザーのメンバーID
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  
  // 役員権限チェック
  const [isExecutive, setIsExecutive] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule_type: 'event' as CompanySchedule['schedule_type'],
    start_date: new Date(),
    end_date: null as Date | null,
    start_time: '09:00',
    end_time: '10:00',
    is_all_day: false,
    location: '',
    is_holiday: false,
    color: '#3B82F6',
    priority: 'medium' as CompanySchedule['priority']
  });

  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (currentMemberId) {
      fetchSchedules();
      fetchUpcomingEvents();
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

  const fetchSchedules = async () => {
    if (!currentMemberId) return;
    
    setLoading(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      const { data, error } = await supabase
        .from('company_schedules')
        .select('*')
        .gte('start_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('start_date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('スケジュールの取得に失敗しました');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!currentMemberId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_upcoming_events', {
        days_ahead: 14
      });

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      toast.error('今後の予定の取得に失敗しました');
      setUpcomingEvents([]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      schedule_type: 'event',
      start_date: new Date(),
      end_date: null,
      start_time: '09:00',
      end_time: '10:00',
      is_all_day: false,
      location: '',
      is_holiday: false,
      color: '#3B82F6',
      priority: 'medium'
    });
    setEditingSchedule(null);
  };

  const handleCreateSchedule = async () => {
    if (!currentMemberId || !isExecutive) {
      toast.error('スケジュールの作成権限がありません');
      return;
    }

    try {
      const scheduleData = {
        title: formData.title,
        description: formData.description || null,
        schedule_type: formData.schedule_type,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        start_time: formData.is_all_day ? null : formData.start_time,
        end_time: formData.is_all_day ? null : formData.end_time,
        is_all_day: formData.is_all_day,
        location: formData.location || null,
        is_holiday: formData.is_holiday,
        color: formData.color,
        priority: formData.priority,
        created_by: currentMemberId
      };

      const { error } = await supabase
        .from('company_schedules')
        .insert(scheduleData);

      if (error) throw error;

      toast.success('スケジュールを作成しました');
      setCreateDialogOpen(false);
      resetForm();
      await Promise.all([fetchSchedules(), fetchUpcomingEvents()]);
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('スケジュールの作成に失敗しました');
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule || !isExecutive) return;

    try {
      const scheduleData = {
        title: formData.title,
        description: formData.description || null,
        schedule_type: formData.schedule_type,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        start_time: formData.is_all_day ? null : formData.start_time,
        end_time: formData.is_all_day ? null : formData.end_time,
        is_all_day: formData.is_all_day,
        location: formData.location || null,
        is_holiday: formData.is_holiday,
        color: formData.color,
        priority: formData.priority,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('company_schedules')
        .update(scheduleData)
        .eq('id', editingSchedule.id);

      if (error) throw error;

      toast.success('スケジュールを更新しました');
      setEditingSchedule(null);
      resetForm();
      await Promise.all([fetchSchedules(), fetchUpcomingEvents()]);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('スケジュールの更新に失敗しました');
    }
  };

  const openEditDialog = (schedule: CompanySchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description,
      schedule_type: schedule.schedule_type,
      start_date: new Date(schedule.start_date),
      end_date: schedule.end_date ? new Date(schedule.end_date) : null,
      start_time: schedule.start_time || '09:00',
      end_time: schedule.end_time || '10:00',
      is_all_day: schedule.is_all_day,
      location: schedule.location || '',
      is_holiday: schedule.is_holiday,
      color: schedule.color,
      priority: schedule.priority
    });
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!isExecutive) {
      toast.error('スケジュールの削除権限がありません');
      return;
    }

    try {
      const { error } = await supabase
        .from('company_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success('スケジュールを削除しました');
      await Promise.all([fetchSchedules(), fetchUpcomingEvents()]);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('スケジュールの削除に失敗しました');
    }
  };

  const getScheduleTypeIcon = (type: string) => {
    const icons = {
      event: <CalendarIcon className="w-4 h-4" />,
      meeting: <Users className="w-4 h-4" />,
      holiday: <Building className="w-4 h-4" />,
      deadline: <AlertCircle className="w-4 h-4" />,
      training: <BookOpen className="w-4 h-4" />,
      other: <Target className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <CalendarIcon className="w-4 h-4" />;
  };

  const getScheduleTypeLabel = (type: string) => {
    const labels = {
      event: 'イベント',
      meeting: '会議',
      holiday: '休暇',
      deadline: '締切',
      training: '研修',
      other: 'その他'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: <Badge variant="outline" className="bg-green-100 text-green-800">低</Badge>,
      medium: <Badge variant="outline" className="bg-yellow-100 text-yellow-800">中</Badge>,
      high: <Badge variant="outline" className="bg-red-100 text-red-800">高</Badge>
    };
    return badges[priority as keyof typeof badges] || <Badge variant="outline">{priority}</Badge>;
  };

  const getUrgencyBadge = (urgencyLevel: string) => {
    const badges = {
      today: <Badge className="bg-red-600 text-white">今日</Badge>,
      soon: <Badge className="bg-orange-500 text-white">近日</Badge>,
      holiday: <Badge className="bg-green-600 text-white">休暇</Badge>,
      upcoming: <Badge variant="outline">予定</Badge>
    };
    return badges[urgencyLevel as keyof typeof badges] || <Badge variant="outline">{urgencyLevel}</Badge>;
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
      {/* 今後の予定カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>今後の予定</span>
          </CardTitle>
          <CardDescription>今後2週間の企業スケジュール</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {getScheduleTypeIcon(event.schedule_type)}
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{event.date_label}</span>
                        {event.start_time && !event.is_all_day && (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{event.start_time}</span>
                          </>
                        )}
                        {event.location && (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getUrgencyBadge(event.urgency_level)}
                    {getPriorityBadge(event.priority)}
                  </div>
                </div>
              ))}
              {upcomingEvents.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  他 {upcomingEvents.length - 5} 件の予定があります
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              今後の予定はありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* スケジュール管理カード */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>企業スケジュール管理</CardTitle>
              <CardDescription>全社的なイベント・休暇・ミーティングの管理</CardDescription>
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
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {isExecutive && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      スケジュール作成
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSchedule ? 'スケジュール編集' : 'スケジュール作成'}
                      </DialogTitle>
                      <DialogDescription>
                        企業の全体スケジュールを{editingSchedule ? '編集' : '作成'}します
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">タイトル</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="スケジュールのタイトル"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="schedule_type">種別</Label>
                          <Select value={formData.schedule_type} onValueChange={(value) => setFormData(prev => ({ ...prev, schedule_type: value as any }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="event">イベント</SelectItem>
                              <SelectItem value="meeting">会議</SelectItem>
                              <SelectItem value="holiday">休暇</SelectItem>
                              <SelectItem value="deadline">締切</SelectItem>
                              <SelectItem value="training">研修</SelectItem>
                              <SelectItem value="other">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">説明</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="スケジュールの詳細説明"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>開始日</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {format(formData.start_date, 'yyyy年MM月dd日', { locale: ja })}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.start_date}
                                onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>終了日（任意）</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {formData.end_date ? format(formData.end_date, 'yyyy年MM月dd日', { locale: ja }) : '設定なし'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.end_date}
                                onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {formData.end_date && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setFormData(prev => ({ ...prev, end_date: null }))}
                            >
                              クリア
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_all_day"
                          checked={formData.is_all_day}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_all_day: checked }))}
                        />
                        <Label htmlFor="is_all_day">終日</Label>
                      </div>

                      {!formData.is_all_day && (
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
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">場所</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="会議室、オンライン等"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priority">優先度</Label>
                          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">低</SelectItem>
                              <SelectItem value="medium">中</SelectItem>
                              <SelectItem value="high">高</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_holiday"
                          checked={formData.is_holiday}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_holiday: checked }))}
                        />
                        <Label htmlFor="is_holiday">会社の休日として設定</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="color">カラー</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="color"
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <span className="text-sm text-gray-600">{formData.color}</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setCreateDialogOpen(false);
                        setEditingSchedule(null);
                        resetForm();
                      }}>
                        キャンセル
                      </Button>
                      <Button onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}>
                        {editingSchedule ? '更新' : '作成'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* スケジュールテーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>場所</TableHead>
                  <TableHead>優先度</TableHead>
                  {isExecutive && <TableHead>操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(new Date(schedule.start_date), 'MM/dd (E)', { locale: ja })}
                        </div>
                        {schedule.end_date && schedule.end_date !== schedule.start_date && (
                          <div className="text-xs text-gray-500">
                            ～ {format(new Date(schedule.end_date), 'MM/dd (E)', { locale: ja })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ backgroundColor: schedule.color }}
                          />
                          <span>{schedule.title}</span>
                          {schedule.is_holiday && (
                            <Badge variant="secondary" className="text-xs">休日</Badge>
                          )}
                        </div>
                        {schedule.description && (
                          <div className="text-sm text-gray-600">
                            {schedule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getScheduleTypeIcon(schedule.schedule_type)}
                        <span className="text-sm">{getScheduleTypeLabel(schedule.schedule_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.is_all_day ? (
                        <Badge variant="outline">終日</Badge>
                      ) : (
                        <div className="text-sm">
                          {schedule.start_time && schedule.end_time ? (
                            `${schedule.start_time} - ${schedule.end_time}`
                          ) : (
                            '-'
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {schedule.location ? (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{schedule.location}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(schedule.priority)}</TableCell>
                    {isExecutive && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(schedule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
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
                                <AlertDialogTitle>スケジュールを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{schedule.title}」を削除します。この操作は取り消すことができません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSchedule(schedule.id)}
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

          {schedules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {format(selectedMonth, 'yyyy年MM月', { locale: ja })}のスケジュールはありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManager; 