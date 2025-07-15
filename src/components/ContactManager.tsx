
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Eye, 
  RefreshCw,
  MessageSquare,
  Building,
  Mail,
  Phone
} from 'lucide-react';

interface ContactRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const ContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactRequest[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // データを取得
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "データ取得エラー",
        description: "お問い合わせデータの取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, statusFilter]);

  // ステータス更新
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setContacts(prev =>
        prev.map(contact =>
          contact.id === id ? { ...contact, status: newStatus as any } : contact
        )
      );

      toast({
        title: "ステータス更新完了",
        description: "お問い合わせのステータスを更新しました。",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "更新エラー",
        description: "ステータスの更新に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '未対応', variant: 'destructive' as const },
      in_progress: { label: '対応中', variant: 'default' as const },
      completed: { label: '完了', variant: 'secondary' as const },
      cancelled: { label: 'キャンセル', variant: 'outline' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            お問い合わせ管理
          </CardTitle>
          <CardDescription>
            お問い合わせフォームからの問い合わせを確認・管理できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* フィルター・検索 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="名前、会社名、メールアドレスで検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="pending">未対応</SelectItem>
                <SelectItem value="in_progress">対応中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchContacts} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* テーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>問い合わせ者</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>問い合わせ日時</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      データが見つかりません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.company}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>{formatDate(contact.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedContact(contact)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>お問い合わせ詳細</DialogTitle>
                                <DialogDescription>
                                  問い合わせ内容の詳細を確認できます
                                </DialogDescription>
                              </DialogHeader>
                              {selectedContact && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">お名前</label>
                                      <p className="p-2 bg-gray-50 rounded">{selectedContact.name}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">会社名</label>
                                      <p className="p-2 bg-gray-50 rounded">{selectedContact.company}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">メールアドレス</label>
                                      <div className="p-2 bg-gray-50 rounded flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                                        <a 
                                          href={`mailto:${selectedContact.email}`}
                                          className="text-blue-600 hover:underline"
                                        >
                                          {selectedContact.email}
                                        </a>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">電話番号</label>
                                      <div className="p-2 bg-gray-50 rounded flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                        {selectedContact.phone ? (
                                          <a 
                                            href={`tel:${selectedContact.phone}`}
                                            className="text-blue-600 hover:underline"
                                          >
                                            {selectedContact.phone}
                                          </a>
                                        ) : (
                                          <span className="text-gray-500">未記入</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">お問い合わせ内容</label>
                                    <p className="p-3 bg-gray-50 rounded min-h-[120px] whitespace-pre-wrap">
                                      {selectedContact.message}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between pt-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">ステータス変更</label>
                                      <Select
                                        value={selectedContact.status}
                                        onValueChange={(value) => updateStatus(selectedContact.id, value)}
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">未対応</SelectItem>
                                          <SelectItem value="in_progress">対応中</SelectItem>
                                          <SelectItem value="completed">完了</SelectItem>
                                          <SelectItem value="cancelled">キャンセル</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="text-right text-sm text-gray-600">
                                      <p>問い合わせ日時: {formatDate(selectedContact.created_at)}</p>
                                      <p>更新日時: {formatDate(selectedContact.updated_at)}</p>
                                    </div>
                                  </div>
                                  <div className="pt-4 border-t">
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                                        className="flex items-center"
                                      >
                                        <Mail className="w-4 h-4 mr-2" />
                                        メール送信
                                      </Button>
                                      {selectedContact.phone && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(`tel:${selectedContact.phone}`, '_blank')}
                                          className="flex items-center"
                                        >
                                          <Phone className="w-4 h-4 mr-2" />
                                          電話をかける
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactManager;
