
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

const ChatAnalytics: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Simulate loading delay for better UX
    setIsLoading(true);
    const timer = setTimeout(() => {
      const storedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      setChatHistory(storedChats);
      generateChartData(storedChats, filterPeriod);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filterPeriod]);

  const generateChartData = (data: ChatMessage[], period: string) => {
    const userMessages = data.filter(msg => msg.role === 'user');
    
    if (userMessages.length === 0) {
      setChartData([]);
      return;
    }

    const now = new Date();
    const filteredMessages = userMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      if (period === 'day') {
        return msgDate.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return msgDate >= oneWeekAgo;
      } else if (period === 'month') {
        return msgDate.getMonth() === now.getMonth() && 
               msgDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Group by day for chart visualization
    const groupedByDay: Record<string, number> = {};
    
    filteredMessages.forEach(msg => {
      const date = new Date(msg.timestamp);
      const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
      
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = 0;
      }
      groupedByDay[dayKey]++;
    });

    // Sort dates chronologically
    const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
      const [monthA, dayA] = a.split('/').map(Number);
      const [monthB, dayB] = b.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });

    const chartDataArr = sortedDays.map(day => ({
      date: day,
      count: groupedByDay[day],
    }));

    setChartData(chartDataArr);
  };

  const clearChatHistory = () => {
    if (window.confirm('チャット履歴を削除してもよろしいですか？')) {
      localStorage.removeItem('chatHistory');
      setChatHistory([]);
      setChartData([]);
    }
  };

  // 期間フィルター部分の日本語変換
  const periodToJapanese = {
    'all': 'すべて',
    'day': '今日',
    'week': '今週',
    'month': '今月'
  };

  // ユーザーメッセージの総数を計算
  const userMessageCount = chatHistory.filter(msg => msg.role === 'user').length;
  
  // フィルター適用後のメッセージの総数を計算
  const filteredMessageCount = chartData.reduce((sum, item) => sum + item.count, 0);

  // 平均回答時間計算 (ユーザーメッセージの後のAIメッセージのタイムスタンプ差の平均)
  const calculateAverageResponseTime = () => {
    let totalResponseTime = 0;
    let responsesCount = 0;
    
    // Sort messages by timestamp
    const sortedMessages = [...chatHistory].sort((a, b) => 
      new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
    );
    
    for (let i = 0; i < sortedMessages.length - 1; i++) {
      if (sortedMessages[i].role === 'user' && sortedMessages[i+1].role === 'assistant') {
        const userMsgTime = new Date(sortedMessages[i].timestamp || '').getTime();
        const aiMsgTime = new Date(sortedMessages[i+1].timestamp || '').getTime();
        const responseTime = (aiMsgTime - userMsgTime) / 1000; // in seconds
        totalResponseTime += responseTime;
        responsesCount++;
      }
    }
    
    return responsesCount > 0 
      ? (totalResponseTime / responsesCount).toFixed(1)
      : '0.0';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <h2 className="text-xl md:text-2xl font-bold">チャットボット分析</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="day">今日</SelectItem>
              <SelectItem value="week">今週</SelectItem>
              <SelectItem value="month">今月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={clearChatHistory} size={isMobile ? "sm" : "default"}>
            履歴を削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総質問数</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{userMessageCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {filterPeriod === 'all' ? '全期間' : periodToJapanese[filterPeriod as keyof typeof periodToJapanese]}の質問数
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{filteredMessageCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均回答時間</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{calculateAverageResponseTime()}秒</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>日別質問数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${isMobile ? 'h-60' : 'h-72'}`}>
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
                  <YAxis allowDecimals={false} fontSize={isMobile ? 10 : 12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="質問数" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>質問履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : chatHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">日時</TableHead>
                    <TableHead className="w-1/6">ユーザー/AI</TableHead>
                    <TableHead>メッセージ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatHistory
                    .filter(msg => {
                      if (filterPeriod === 'all') return true;
                      
                      const msgDate = new Date(msg.timestamp || '');
                      const now = new Date();
                      
                      if (filterPeriod === 'day') {
                        return msgDate.toDateString() === now.toDateString();
                      } else if (filterPeriod === 'week') {
                        const oneWeekAgo = new Date(now);
                        oneWeekAgo.setDate(now.getDate() - 7);
                        return msgDate >= oneWeekAgo;
                      } else if (filterPeriod === 'month') {
                        return msgDate.getMonth() === now.getMonth() && 
                              msgDate.getFullYear() === now.getFullYear();
                      }
                      return true;
                    })
                    .slice()
                    .reverse()
                    .map((msg, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs md:text-sm">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleString('ja-JP') : '不明'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">{msg.role === 'user' ? 'ユーザー' : 'AI'}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs md:text-sm">
                          <div className="max-w-full truncate">{msg.content}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              チャット履歴がありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatAnalytics;
