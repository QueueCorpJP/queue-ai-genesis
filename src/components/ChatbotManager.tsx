import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search, Filter, Download, Eye, Calendar, User, Clock } from 'lucide-react';
import { supabase, supabaseAdmin, ChatbotConversation } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatbotManagerProps {
  className?: string;
}

const ChatbotManager: React.FC<ChatbotManagerProps> = ({ className = '' }) => {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatbotConversation | null>(null);
  const [stats, setStats] = useState({
    totalConversations: 0,
    todayConversations: 0,
    weeklyConversations: 0,
    monthlyConversations: 0,
    uniqueSessions: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    console.log('ChatbotManager component mounted, fetching data...');
    
    // Test Supabase connection and RLS policies
    const testConnection = async () => {
      try {
        // Test basic connection with count using admin client
        const { data, error } = await supabaseAdmin
          .from('chatbot_conversations')
          .select('count', { count: 'exact', head: true });
        
        console.log('Supabase admin connection test:', { data, error });
        
        // Test with admin client (bypasses RLS)
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('chatbot_conversations')
          .select('*')
          .limit(1);
        
        console.log('Admin query test:', {
          adminData,
          adminError,
          hasData: adminData?.length > 0,
          errorCode: adminError?.code,
          errorMessage: adminError?.message,
          supabaseAdminURL: import.meta.env.VITE_SUPABASE_URL,
          serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set'
        });
        
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    };
    
    testConnection();
    fetchConversations();
    fetchStats();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log('Fetching chatbot conversations with admin client...');
      
      // Use admin client to bypass RLS
      const { data: tableData, error: tableError, count } = await supabaseAdmin
        .from('chatbot_conversations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Supabase admin query result:', {
        data: tableData,
        error: tableError,
        count,
        dataLength: tableData?.length || 0
      });

      if (tableError) {
        console.error('Error fetching conversations:', tableError);
        
        // Show more detailed error information
        if (tableError.code === 'PGRST116') {
          toast({
            title: "テーブルが見つかりません",
            description: "chatbot_conversationsテーブルが存在しません。データベースマイグレーションを実行してください。",
            variant: "destructive",
          });
        } else {
          toast({
            title: "エラー",
            description: `チャットボットの会話履歴の取得に失敗しました: ${tableError.message}`,
            variant: "destructive",
          });
        }
        return;
      }

      console.log('Conversations fetched successfully:', tableData?.length || 0);
      setConversations(tableData || []);
      
      // Show success message if data is found
      if (tableData && tableData.length > 0) {
        toast({
          title: "データ取得成功",
          description: `${tableData.length}件のチャット履歴を取得しました。`,
          variant: "default",
        });
      } else {
        toast({
          title: "データなし",
          description: "チャットボットの会話履歴がありません。テストデータを追加してください。",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "エラー",
        description: "チャットボットの会話履歴の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching chatbot stats with admin client...');
      
      const { data, error } = await supabaseAdmin
        .from('chatbot_conversations')
        .select('created_at, session_id');

      console.log('Stats query result:', { data, error, count: data?.length || 0 });

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayConversations = data.filter(item => new Date(item.created_at) >= today).length;
      const weeklyConversations = data.filter(item => new Date(item.created_at) >= weekAgo).length;
      const monthlyConversations = data.filter(item => new Date(item.created_at) >= monthAgo).length;
      const uniqueSessions = new Set(data.map(item => item.session_id)).size;

      const calculatedStats = {
        totalConversations: data.length,
        todayConversations,
        weeklyConversations,
        monthlyConversations,
        uniqueSessions
      };

      console.log('Calculated stats:', calculatedStats);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Test function to add sample data
  const addTestData = async () => {
    try {
      const testConversation = {
        session_id: `test_${Date.now()}`,
        user_message: "テストメッセージ: こんにちは",
        bot_response: "テストレスポンス: こんにちは！Queue株式会社のAIアシスタントです。",
        timestamp: new Date().toISOString(),
        user_ip: "127.0.0.1",
        user_agent: "Test Agent"
      };

      console.log('Adding test data with admin client:', testConversation);
      
      const { data, error } = await supabaseAdmin
        .from('chatbot_conversations')
        .insert(testConversation);
      
      if (error) {
        console.error('Error adding test data:', error);
        toast({
          title: "テストデータ追加エラー",
          description: `エラー: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Test data added successfully:', data);
        toast({
          title: "テストデータ追加成功",
          description: "テストデータが正常に追加されました。",
          variant: "default",
        });
        
        // Refresh data
        fetchConversations();
        fetchStats();
      }
    } catch (error) {
      console.error('Error adding test data:', error);
      toast({
        title: "テストデータ追加エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.bot_response.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = filterDate === '' || 
      new Date(conv.created_at).toISOString().split('T')[0] === filterDate;
    
    return matchesSearch && matchesDate;
  });

  const exportConversations = () => {
    const csvContent = [
      ['セッションID', 'ユーザーメッセージ', 'ボットレスポンス', '作成日時'],
      ...filteredConversations.map(conv => [
        conv.session_id,
        conv.user_message,
        conv.bot_response,
        new Date(conv.created_at).toLocaleString('ja-JP')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chatbot_conversations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatsCard = ({ title, value, icon: Icon, color = 'blue' }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 text-${color}-600`} />
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold">チャットボット管理</h2>
        <div className="flex items-center gap-2">
          <Button onClick={addTestData} variant="outline" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">テストデータ追加</span>
            <span className="sm:hidden">テスト</span>
          </Button>
          <Button onClick={exportConversations} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV出力</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard title="総会話数" value={stats.totalConversations} icon={MessageSquare} />
        <StatsCard title="今日の会話" value={stats.todayConversations} icon={Calendar} color="green" />
        <StatsCard title="週間会話数" value={stats.weeklyConversations} icon={Clock} color="yellow" />
        <StatsCard title="月間会話数" value={stats.monthlyConversations} icon={Calendar} color="purple" />
        <StatsCard title="ユニークセッション" value={stats.uniqueSessions} icon={User} color="indigo" />
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="会話内容を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="sm:w-auto"
        />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">会話一覧</TabsTrigger>
          <TabsTrigger value="details">会話詳細</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">会話データなし</h3>
                  <p className="text-gray-500">チャットボットの会話データが見つかりません。</p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {conversation.session_id.substring(0, 8)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(conversation.timestamp).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 font-medium">
                          ユーザー: {conversation.user_message}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          AI: {conversation.bot_response}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConversation(conversation)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">詳細</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedConversation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">会話詳細</CardTitle>
                <CardDescription>
                  セッションID: {selectedConversation.session_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">セッションID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedConversation.session_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">日時</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedConversation.timestamp).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  {selectedConversation.user_agent && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">ユーザーエージェント</label>
                      <p className="text-sm text-gray-900 break-all">{selectedConversation.user_agent}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ユーザーメッセージ</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-blue-50 p-3 rounded-md mt-1">
                    {selectedConversation.user_message}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">AIレスポンス</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md mt-1">
                    {selectedConversation.bot_response}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">会話を選択してください</h3>
                <p className="text-gray-500">会話一覧から詳細を確認したい会話を選択してください。</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotManager; 