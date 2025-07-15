
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
  Filter, 
  Eye, 
  Edit,
  RefreshCw,
  Calendar,
  Building,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

interface ConsultationRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: 'ai_development' | 'prompt_engineering' | 'prototype' | 'other';
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const ConsultationManager: React.FC = () => {
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<ConsultationRequest[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const { toast } = useToast();

  // データを取得
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConsultations(data || []);
      setFilteredConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast({
        title: "データ取得エラー",
        description: "無料相談データの取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = consultations;

    if (searchTerm) {
      filtered = filtered.filter(consultation =>
        consultation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(consultation => consultation.status === statusFilter);
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(consultation => consultation.service === serviceFilter);
    }

    setFilteredConsultations(filtered);
  }, [consultations, searchTerm, statusFilter, serviceFilter]);

  // ステータス更新
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultation_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === id ? { ...consultation, status: newStatus as any } : consultation
        )
      );

      toast({
        title: "ステータス更新完了",
        description: "無料相談のステータスを更新しました。",
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

  const getServiceLabel = (service: string) => {
    const serviceMap = {
      ai_development: 'AI受託開発',
      prompt_engineering: 'プロンプトエンジニアリング',
      prototype: '高速プロトタイピング',
      other: 'その他'
    };
    return serviceMap[service as keyof typeof serviceMap] || service;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            無料相談管理
          </CardTitle>
          <CardDescription>
            無料相談の申込を確認・管理できます
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
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="サービス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="ai_development">AI受託開発</SelectItem>
                <SelectItem value="prompt_engineering">プロンプトエンジニアリング</SelectItem>
                <SelectItem value="prototype">高速プロトタイピング</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchConsultations} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* テーブル */}
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
                      <TableCell className="font-medium">{consultation.name}</TableCell>
                      <TableCell>{consultation.company}</TableCell>
                      <TableCell>{getServiceLabel(consultation.service)}</TableCell>
                      <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                      <TableCell>{formatDate(consultation.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedConsultation(consultation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>無料相談詳細</DialogTitle>
                                <DialogDescription>
                                  申込内容の詳細を確認できます
                                </DialogDescription>
                              </DialogHeader>
                              {selectedConsultation && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">お名前</label>
                                      <p className="p-2 bg-gray-50 rounded">{selectedConsultation.name}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">会社名</label>
                                      <p className="p-2 bg-gray-50 rounded">{selectedConsultation.company}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">メールアドレス</label>
                                      <p className="p-2 bg-gray-50 rounded">{selectedConsultation.email}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">電話番号</label>
                                      <p className="p-2 bg-gray-50 rounded">{selectedConsultation.phone}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">興味のあるサービス</label>
                                    <p className="p-2 bg-gray-50 rounded">{getServiceLabel(selectedConsultation.service)}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">メッセージ</label>
                                    <p className="p-3 bg-gray-50 rounded min-h-[100px] whitespace-pre-wrap">
                                      {selectedConsultation.message}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between pt-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">ステータス変更</label>
                                      <Select
                                        value={selectedConsultation.status}
                                        onValueChange={(value) => updateStatus(selectedConsultation.id, value)}
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
                                      <p>申込日時: {formatDate(selectedConsultation.created_at)}</p>
                                      <p>更新日時: {formatDate(selectedConsultation.updated_at)}</p>
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

export default ConsultationManager;
