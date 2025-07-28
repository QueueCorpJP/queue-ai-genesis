
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Search, RefreshCw, Eye, Phone, Mail, Filter, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContactRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const ContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('データの取得に失敗しました');
        return;
      }

      setContacts(data || []);
    } catch (error) {
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        toast.error('ステータスの更新に失敗しました');
        return;
      }

      setContacts(prev =>
        prev.map(contact =>
          contact.id === id
            ? { ...contact, status: newStatus as ContactRequest['status'] }
            : contact
        )
      );

      toast.success('ステータスを更新しました');
    } catch (error) {
      toast.error('ステータスの更新に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      pending: '未対応',
      in_progress: '対応中',
      completed: '完了',
      cancelled: 'キャンセル'
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const csvData = filteredContacts.map(contact => ({
      名前: contact.name,
      会社名: contact.company,
      メール: contact.email,
      電話番号: contact.phone,
      ステータス: getStatusBadge(contact.status).props.children,
      問い合わせ日時: new Date(contact.created_at).toLocaleString('ja-JP'),
      メッセージ: contact.message
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contact_requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ContactCard = ({ contact }: { contact: ContactRequest }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{contact.name}</h3>
            <p className="text-sm text-gray-600">{contact.company}</p>
          </div>
          {getStatusBadge(contact.status)}
        </div>
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <p className="flex items-center">
            <Mail className="w-4 h-4 mr-1" />
            {contact.email}
          </p>
          {contact.phone && (
            <p className="flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              {contact.phone}
            </p>
          )}
          <p>問い合わせ日: {new Date(contact.created_at).toLocaleDateString('ja-JP')}</p>
        </div>
        <div className="text-sm text-gray-700 mb-3">
          <p className="line-clamp-3">{contact.message}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size={isMobile ? "default" : "sm"}
            variant="outline"
            className={isMobile ? "min-h-[44px] px-4" : ""}
            onClick={() => {
              setSelectedContact(contact);
              setIsDetailDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            詳細
          </Button>
          <Select
            value={contact.status}
            onValueChange={(value) => updateStatus(contact.id, value)}
          >
            <SelectTrigger className="w-24">
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
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg md:text-xl">
            <MessageSquare className="w-5 h-5 mr-2" />
            お問い合わせ管理
          </CardTitle>
          <CardDescription>
            お問い合わせフォームからの問い合わせを確認・管理できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* フィルター・検索 */}
          <div className="space-y-4">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden">
              <Button
                variant="outline"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  フィルター
                </span>
                <span className="text-sm text-gray-500">
                  {filteredContacts.length}件
                </span>
              </Button>
            </div>

            {/* Filters */}
            <div className={`${mobileFiltersOpen || !isMobile ? 'block' : 'hidden'} md:block`}>
              <div className="flex flex-col md:flex-row gap-4">
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
                <div className="flex gap-2">
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
                  <Button onClick={exportToCSV} variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {filteredContacts.length}件の結果
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
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
                      <TableCell>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{contact.company}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                          {contact.phone && (
                              <div className="flex items-center mb-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.phone}
                            </div>
                          )}
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {contact.email}
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                        <TableCell>
                          {new Date(contact.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                              <Button
                              size="sm"
                                variant="outline"
                              onClick={() => {
                                setSelectedContact(contact);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              </Button>
                                      <Select
                              value={contact.status}
                              onValueChange={(value) => updateStatus(contact.id, value)}
                                      >
                              <SelectTrigger className="w-24">
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">データが見つかりません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw]' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>お問い合わせ詳細</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <div>
                  <label className="text-sm font-medium text-gray-700">お名前</label>
                  <p className="text-sm text-gray-900">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">会社名</label>
                  <p className="text-sm text-gray-900">{selectedContact.company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="text-sm text-gray-900">{selectedContact.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">電話番号</label>
                  <p className="text-sm text-gray-900">{selectedContact.phone || '未入力'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ステータス</label>
                  <div className="pt-1">
                    {getStatusBadge(selectedContact.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">問い合わせ日時</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedContact.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">更新日時</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedContact.updated_at).toLocaleString('ja-JP')}
                  </p>
                                    </div>
                                  </div>
              <div>
                <label className="text-sm font-medium text-gray-700">お問い合わせ内容</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md mt-1">
                  {selectedContact.message}
                </p>
              </div>
                            <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-2 pt-4`}>
                <Button
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedContact.email}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  メール送信
                </Button>
                {selectedContact.phone && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`tel:${selectedContact.phone}`, '_self')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    電話をかける
                  </Button>
                )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
    </div>
  );
};

export default ContactManager;
