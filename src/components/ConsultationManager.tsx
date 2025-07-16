
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Search, RefreshCw, Eye, Phone, Mail, MessageSquare, Filter, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConsultationRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const ConsultationManager: React.FC = () => {
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consultations:', error);
        toast.error('データの取得に失敗しました');
        return;
      }

      setConsultations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultation_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('ステータスの更新に失敗しました');
        return;
      }

      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === id
            ? { ...consultation, status: newStatus as ConsultationRequest['status'] }
            : consultation
        )
      );

      toast.success('ステータスを更新しました');
    } catch (error) {
      console.error('Error:', error);
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

  const getServiceLabel = (service: string) => {
    const labels = {
      ai_development: 'AI開発',
      prompt_engineering: 'プロンプトエンジニアリング',
      prototype: 'プロトタイプ開発',
      other: 'その他'
    };
    return labels[service as keyof typeof labels] || service;
  };

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = 
      consultation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || consultation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const csvData = filteredConsultations.map(consultation => ({
      名前: consultation.name,
      会社名: consultation.company,
      メール: consultation.email,
      電話番号: consultation.phone,
      サービス: getServiceLabel(consultation.service),
      ステータス: getStatusBadge(consultation.status).props.children,
      申込日時: new Date(consultation.created_at).toLocaleString('ja-JP'),
      メッセージ: consultation.message
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consultation_requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ConsultationCard = ({ consultation }: { consultation: ConsultationRequest }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{consultation.name}</h3>
            <p className="text-sm text-gray-600">{consultation.company}</p>
          </div>
          {getStatusBadge(consultation.status)}
        </div>
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <p className="flex items-center">
            <Mail className="w-4 h-4 mr-1" />
            {consultation.email}
          </p>
          <p className="flex items-center">
            <Phone className="w-4 h-4 mr-1" />
            {consultation.phone}
          </p>
          <p>サービス: {getServiceLabel(consultation.service)}</p>
          <p>申込日: {new Date(consultation.created_at).toLocaleDateString('ja-JP')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedConsultation(consultation);
              setIsDetailDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            詳細
          </Button>
          <Select
            value={consultation.status}
            onValueChange={(value) => updateStatus(consultation.id, value)}
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
            <Calendar className="w-5 h-5 mr-2" />
            無料相談管理
          </CardTitle>
          <CardDescription>
            無料相談の申込を確認・管理できます
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
                  {filteredConsultations.length}件
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
            <Button onClick={fetchConsultations} variant="outline" size="icon">
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
              {filteredConsultations.length}件の結果
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申込者</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>サービス</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>申込日時</TableHead>
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
                ) : filteredConsultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      データが見つかりません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{consultation.name}</div>
                            <div className="text-sm text-gray-500">{consultation.email}</div>
                          </div>
                        </TableCell>
                      <TableCell>{consultation.company}</TableCell>
                      <TableCell>{getServiceLabel(consultation.service)}</TableCell>
                      <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                        <TableCell>
                          {new Date(consultation.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                              <Button
                              size="sm"
                                variant="outline"
                              onClick={() => {
                                setSelectedConsultation(consultation);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              </Button>
                                      <Select
                              value={consultation.status}
                              onValueChange={(value) => updateStatus(consultation.id, value)}
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
            ) : filteredConsultations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">データが見つかりません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map((consultation) => (
                  <ConsultationCard key={consultation.id} consultation={consultation} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>相談申込詳細</DialogTitle>
          </DialogHeader>
          {selectedConsultation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">申込者名</label>
                  <p className="text-sm text-gray-900">{selectedConsultation.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">会社名</label>
                  <p className="text-sm text-gray-900">{selectedConsultation.company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="text-sm text-gray-900">{selectedConsultation.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">電話番号</label>
                  <p className="text-sm text-gray-900">{selectedConsultation.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">興味のあるサービス</label>
                  <p className="text-sm text-gray-900">{getServiceLabel(selectedConsultation.service)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ステータス</label>
                  <div className="pt-1">
                    {getStatusBadge(selectedConsultation.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">申込日時</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedConsultation.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">更新日時</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedConsultation.updated_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">メッセージ</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md mt-1">
                  {selectedConsultation.message}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedConsultation.email}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  メール送信
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`tel:${selectedConsultation.phone}`, '_self')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  電話をかける
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationManager;
