import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  Clock,
  MapPin,
  Users,
  Building,
  BookOpen,
  Target,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

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

interface ScheduleWidgetProps {
  showHeader?: boolean;
  maxItems?: number;
  onViewAllClick?: () => void;
}

const ScheduleWidget: React.FC<ScheduleWidgetProps> = ({ 
  showHeader = true, 
  maxItems = 5,
  onViewAllClick 
}) => {
  const { user } = useAdmin();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchMemberId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (currentMemberId) {
      fetchUpcomingEvents();
    }
  }, [currentMemberId]);

  // メールアドレスからメンバーIDを取得
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
        console.error('Error fetching member ID:', error);
        return;
      }

      if (data) {
        setCurrentMemberId(data.id);
      }
    } catch (error) {
      console.error('Error fetching member ID:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!currentMemberId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_upcoming_events', {
        days_ahead: 14
      });

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
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

  const getUrgencyBadge = (urgencyLevel: string, size: 'sm' | 'xs' = 'sm') => {
    const badgeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : '';
    
    const badges = {
      today: <Badge className={`bg-red-600 text-white ${badgeClass}`}>今日</Badge>,
      soon: <Badge className={`bg-orange-500 text-white ${badgeClass}`}>近日</Badge>,
      holiday: <Badge className={`bg-green-600 text-white ${badgeClass}`}>休暇</Badge>,
      upcoming: <Badge variant="outline" className={badgeClass}>予定</Badge>
    };
    return badges[urgencyLevel as keyof typeof badges] || <Badge variant="outline" className={badgeClass}>{urgencyLevel}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-l-red-500',
      medium: 'border-l-yellow-500',
      low: 'border-l-green-500'
    };
    return colors[priority as keyof typeof colors] || 'border-l-gray-300';
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm">読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  const displayEvents = upcomingEvents.slice(0, maxItems);

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CalendarIcon className="w-5 h-5" />
              <span>今後の予定</span>
            </CardTitle>
            {onViewAllClick && upcomingEvents.length > maxItems && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAllClick}
                className="text-blue-600 hover:text-blue-700"
              >
                すべて表示
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? 'pt-0' : ''}>
        {displayEvents.length > 0 ? (
          <div className="space-y-3">
            {displayEvents.map((event) => (
              <div 
                key={event.id} 
                className={`flex items-start justify-between p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors ${getPriorityColor(event.priority)}`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="mt-0.5">
                    {getScheduleTypeIcon(event.schedule_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      {event.is_holiday && (
                        <Badge variant="secondary" className="text-xs">休日</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span className="font-medium">{event.date_label}</span>
                      </div>
                      
                      {event.start_time && !event.is_all_day && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{event.start_time}</span>
                          {event.end_time && <span>-{event.end_time}</span>}
                        </div>
                      )}
                      
                      {event.is_all_day && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">終日</Badge>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-20">{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1 ml-2">
                  {getUrgencyBadge(event.urgency_level, 'xs')}
                  {event.days_until <= 1 && (
                    <div className="text-xs text-gray-500">
                      {event.days_until === 0 ? '今日' : 
                       event.days_until === 1 ? '明日' : 
                       `${event.days_until}日後`}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {upcomingEvents.length > maxItems && !onViewAllClick && (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500">
                  他 {upcomingEvents.length - maxItems} 件の予定があります
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">今後の予定はありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduleWidget; 