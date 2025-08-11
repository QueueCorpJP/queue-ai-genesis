import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar, 
  User, 
  Star,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  Copy,
  RefreshCw,
  Search,
  Filter,
  Users,
  Target,
  ClipboardList,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';

// 型定義
interface InterviewQuestion {
  id?: string;
  question_title: string;
  question_detail: string;
  evaluation_score: number;
  max_score: number;
  comments: string;
}

interface QuestionTemplate {
  id: string;
  category: string;
  question_title: string;
  question_detail: string;
  evaluation_criteria: string;
  max_score: number;
  sort_order: number;
}

interface RecruitmentInterview {
  id?: string;
  // 採用概要
  position_title: string;
  hiring_count: number;
  hiring_deadline: string;
  interview_date: string;
  interviewer_name: string;
  
  // 候補者情報
  candidate_name: string;
  candidate_age: number | null;
  current_job: string;
  contact_email: string;
  contact_phone: string;
  
  // 最終評価
  total_score: number;
  max_score: number;
  strengths: string;
  concerns: string;
  final_decision: 'pending' | 'hire' | 'hold' | 'reject';
  
  // 決定事項
  hiring_status: 'under_review' | 'hired' | 'rejected' | 'offer_sent' | 'offer_accepted' | 'offer_declined';
  expected_start_date: string;
  offer_conditions: string;
  salary_offer: number | null;
  
  // システム情報
  interview_status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes: string;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  achievement_percentage?: number;
  days_until_interview?: number;
  days_until_deadline?: number;
  question_count?: number;
}

const RecruitmentManager: React.FC = () => {
  const { user } = useAdmin();
  const [interviews, setInterviews] = useState<RecruitmentInterview[]>([]);
  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<RecruitmentInterview | null>(null);
  const [editingInterview, setEditingInterview] = useState<RecruitmentInterview | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 権限チェック
  const isExecutive = user?.role && ['executive', 'ceo', 'admin'].includes(user.role);

  useEffect(() => {
    if (isExecutive) {
      loadData();
    }
  }, [isExecutive]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInterviews(),
        loadQuestionTemplates()
      ]);
    } catch (error) {
      console.error('Error loading recruitment data:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadInterviews = async () => {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from('recruitment_interviews_overview')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error loading interviews:', error);
      throw error;
    }
  };

  const loadQuestionTemplates = async () => {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from('interview_question_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setQuestionTemplates(data || []);
    } catch (error) {
      console.error('Error loading question templates:', error);
      throw error;
    }
  };

  const loadInterviewQuestions = async (interviewId: string) => {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from('interview_question_evaluations')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setInterviewQuestions(data || []);
    } catch (error) {
      console.error('Error loading interview questions:', error);
      toast.error('面接質問の読み込みに失敗しました');
    }
  };

  const createNewInterview = () => {
    const newInterview: RecruitmentInterview = {
      position_title: '',
      hiring_count: 1,
      hiring_deadline: '',
      interview_date: '',
      interviewer_name: '',
      candidate_name: '',
      candidate_age: null,
      current_job: '',
      contact_email: '',
      contact_phone: '',
      total_score: 0,
      max_score: 0,
      strengths: '',
      concerns: '',
      final_decision: 'pending',
      hiring_status: 'under_review',
      expected_start_date: '',
      offer_conditions: '',
      salary_offer: null,
      interview_status: 'scheduled',
      notes: ''
    };

    setEditingInterview(newInterview);
    setInterviewQuestions([]);
    setShowEditDialog(true);
  };

  const editInterview = async (interview: RecruitmentInterview) => {
    setEditingInterview({ ...interview });
    if (interview.id) {
      await loadInterviewQuestions(interview.id);
    }
    setShowEditDialog(true);
  };

  const saveInterview = async () => {
    if (!editingInterview || !user?.id) {
      toast.error('必要な情報が不足しています');
      return;
    }

    setSaving(true);
    try {
      const client = getSupabaseAdmin();
      
      const interviewData = {
        ...editingInterview,
        created_by: editingInterview.id ? undefined : user.id,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      let savedInterview;

      if (editingInterview.id) {
        // 更新
        const { data, error } = await client
          .from('recruitment_interviews')
          .update(interviewData)
          .eq('id', editingInterview.id)
          .select()
          .single();

        if (error) throw error;
        savedInterview = data;
      } else {
        // 新規作成
        const { data, error } = await client
          .from('recruitment_interviews')
          .insert(interviewData)
          .select()
          .single();

        if (error) throw error;
        savedInterview = data;
      }

      // 面接質問の保存
      if (savedInterview && interviewQuestions.length > 0) {
        // 既存の質問を削除
        await client
          .from('interview_question_evaluations')
          .delete()
          .eq('interview_id', savedInterview.id);

        // 新しい質問を挿入
        const questionsToInsert = interviewQuestions.map(q => ({
          interview_id: savedInterview.id,
          question_title: q.question_title,
          question_detail: q.question_detail,
          evaluation_score: q.evaluation_score,
          max_score: q.max_score,
          comments: q.comments
        }));

        const { error: questionsError } = await client
          .from('interview_question_evaluations')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      toast.success(editingInterview.id ? '面接情報を更新しました' : '新しい面接を作成しました');
      setShowEditDialog(false);
      setEditingInterview(null);
      setInterviewQuestions([]);
      await loadInterviews();
    } catch (error) {
      console.error('Error saving interview:', error);
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const deleteInterview = async (interviewId: string) => {
    if (!confirm('この面接記録を削除してもよろしいですか？')) {
      return;
    }

    try {
      const client = getSupabaseAdmin();
      const { error } = await client
        .from('recruitment_interviews')
        .delete()
        .eq('id', interviewId);

      if (error) throw error;

      toast.success('面接記録を削除しました');
      await loadInterviews();
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error('削除に失敗しました');
    }
  };

  const addQuestionFromTemplate = (template: QuestionTemplate) => {
    const newQuestion: InterviewQuestion = {
      question_title: template.question_title,
      question_detail: template.question_detail,
      evaluation_score: 0,
      max_score: template.max_score,
      comments: ''
    };

    setInterviewQuestions([...interviewQuestions, newQuestion]);
    setShowTemplateDialog(false);
  };

  const addCustomQuestion = () => {
    const newQuestion: InterviewQuestion = {
      question_title: '',
      question_detail: '',
      evaluation_score: 0,
      max_score: 5,
      comments: ''
    };

    setInterviewQuestions([...interviewQuestions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof InterviewQuestion, value: any) => {
    const updatedQuestions = [...interviewQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setInterviewQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = interviewQuestions.filter((_, i) => i !== index);
    setInterviewQuestions(updatedQuestions);
  };

  const getStatusBadge = (status: string, type: 'interview' | 'final' | 'hiring') => {
    const statusConfig = {
      interview: {
        scheduled: { label: '予定', color: 'bg-blue-100 text-blue-800' },
        completed: { label: '完了', color: 'bg-green-100 text-green-800' },
        cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' },
        rescheduled: { label: '再調整', color: 'bg-yellow-100 text-yellow-800' }
      },
      final: {
        pending: { label: '未決定', color: 'bg-gray-100 text-gray-800' },
        hire: { label: '採用', color: 'bg-green-100 text-green-800' },
        hold: { label: '保留', color: 'bg-yellow-100 text-yellow-800' },
        reject: { label: '不採用', color: 'bg-red-100 text-red-800' }
      },
      hiring: {
        under_review: { label: '検討中', color: 'bg-gray-100 text-gray-800' },
        hired: { label: '採用決定', color: 'bg-green-100 text-green-800' },
        rejected: { label: '見送り', color: 'bg-red-100 text-red-800' },
        offer_sent: { label: 'オファー送信', color: 'bg-blue-100 text-blue-800' },
        offer_accepted: { label: 'オファー承諾', color: 'bg-green-100 text-green-800' },
        offer_declined: { label: 'オファー辞退', color: 'bg-red-100 text-red-800' }
      }
    };

    const config = statusConfig[type][status as keyof typeof statusConfig[typeof type]];
    return (
      <Badge className={`text-xs ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || status}
      </Badge>
    );
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = 
      interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.position_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.interview_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 権限チェック
  if (!isExecutive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">アクセス権限がありません</h3>
          <p className="text-gray-600">採用管理機能は役員のみ利用可能です。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">採用データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">採用管理</h1>
          <p className="text-gray-600">面接テンプレートと候補者の管理</p>
        </div>
        <Button onClick={createNewInterview} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>新しい面接を作成</span>
        </Button>
      </div>

      {/* 検索・フィルター */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="候補者名またはポジションで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="scheduled">予定</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                  <SelectItem value="rescheduled">再調整</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              更新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 面接リスト */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterviews.map((interview) => (
          <Card key={interview.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{interview.candidate_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {interview.position_title}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(interview.interview_status, 'interview')}
                  {interview.final_decision !== 'pending' && 
                    getStatusBadge(interview.final_decision, 'final')
                  }
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">
                    {interview.interview_date ? 
                      new Date(interview.interview_date).toLocaleDateString('ja-JP') : 
                      '未定'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{interview.current_job || '-'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 truncate">{interview.contact_email || '-'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">
                    {interview.total_score}/{interview.max_score}
                    {interview.achievement_percentage !== undefined && 
                      ` (${interview.achievement_percentage}%)`
                    }
                  </span>
                </div>
              </div>

              {interview.days_until_interview !== undefined && (
                <div className={`text-xs px-2 py-1 rounded-full text-center ${
                  interview.days_until_interview < 0 ? 'bg-red-100 text-red-800' :
                  interview.days_until_interview === 0 ? 'bg-orange-100 text-orange-800' :
                  interview.days_until_interview <= 3 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {interview.days_until_interview < 0 
                    ? `面接から${Math.abs(interview.days_until_interview)}日経過`
                    : interview.days_until_interview === 0 
                    ? '今日が面接日'
                    : `面接まであと${interview.days_until_interview}日`
                  }
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => editInterview(interview)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  編集
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deleteInterview(interview.id!)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterviews.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">面接記録がありません</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? '検索条件に一致する面接記録が見つかりませんでした。'
                : '最初の面接記録を作成してください。'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button onClick={createNewInterview}>
                <Plus className="w-4 h-4 mr-2" />
                新しい面接を作成
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 面接編集ダイアログ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInterview?.id ? '面接情報編集' : '新しい面接作成'}
            </DialogTitle>
            <DialogDescription>
              面接の詳細情報と評価を管理します
            </DialogDescription>
          </DialogHeader>

          {editingInterview && (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">採用概要</TabsTrigger>
                <TabsTrigger value="candidate">候補者情報</TabsTrigger>
                <TabsTrigger value="questions">面接質問</TabsTrigger>
                <TabsTrigger value="evaluation">最終評価</TabsTrigger>
                <TabsTrigger value="decision">決定事項</TabsTrigger>
              </TabsList>

              {/* 採用概要 */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position_title">採用予定ポジション *</Label>
                    <Input
                      id="position_title"
                      value={editingInterview.position_title}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        position_title: e.target.value
                      })}
                      placeholder="PM兼エンジニア"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hiring_count">採用人数</Label>
                    <Input
                      id="hiring_count"
                      type="number"
                      min="1"
                      value={editingInterview.hiring_count}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        hiring_count: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hiring_deadline">採用期限</Label>
                    <Input
                      id="hiring_deadline"
                      type="date"
                      value={editingInterview.hiring_deadline}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        hiring_deadline: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interview_date">面接日</Label>
                    <Input
                      id="interview_date"
                      type="date"
                      value={editingInterview.interview_date}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        interview_date: e.target.value
                      })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="interviewer_name">面接官</Label>
                    <Input
                      id="interviewer_name"
                      value={editingInterview.interviewer_name}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        interviewer_name: e.target.value
                      })}
                      placeholder="谷口 太一"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 候補者情報 */}
              <TabsContent value="candidate" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="candidate_name">氏名 *</Label>
                    <Input
                      id="candidate_name"
                      value={editingInterview.candidate_name}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        candidate_name: e.target.value
                      })}
                      placeholder="山田 太郎"
                    />
                  </div>
                  <div>
                    <Label htmlFor="candidate_age">年齢</Label>
                    <Input
                      id="candidate_age"
                      type="number"
                      min="18"
                      max="100"
                      value={editingInterview.candidate_age || ''}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        candidate_age: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="27"
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_job">現職</Label>
                    <Input
                      id="current_job"
                      value={editingInterview.current_job}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        current_job: e.target.value
                      })}
                      placeholder="受託開発会社 エンジニア"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">連絡先メール</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={editingInterview.contact_email}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        contact_email: e.target.value
                      })}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="contact_phone">電話番号</Label>
                    <Input
                      id="contact_phone"
                      value={editingInterview.contact_phone}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        contact_phone: e.target.value
                      })}
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 面接質問 */}
              <TabsContent value="questions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">面接質問項目</h3>
                  <div className="flex space-x-2">
                    <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          テンプレートから追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>質問テンプレート</DialogTitle>
                          <DialogDescription>
                            事前定義された質問項目から選択して追加できます
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {questionTemplates.map((template) => (
                            <Card key={template.id} className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium">{template.question_title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    カテゴリ: {template.category}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-2">
                                    {template.question_detail}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">最大 {template.max_score} 点</span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => addQuestionFromTemplate(template)}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  追加
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={addCustomQuestion}>
                      <Plus className="w-4 h-4 mr-2" />
                      カスタム質問追加
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {interviewQuestions.map((question, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label>質問項目</Label>
                              <Input
                                value={question.question_title}
                                onChange={(e) => updateQuestion(index, 'question_title', e.target.value)}
                                placeholder="質問のタイトルを入力"
                              />
                            </div>
                            <div>
                              <Label>詳細質問例</Label>
                              <Textarea
                                value={question.question_detail}
                                onChange={(e) => updateQuestion(index, 'question_detail', e.target.value)}
                                placeholder="具体的な質問内容を入力"
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="ml-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>評価点 (0-{question.max_score})</Label>
                            <Input
                              type="number"
                              min="0"
                              max={question.max_score}
                              value={question.evaluation_score}
                              onChange={(e) => updateQuestion(index, 'evaluation_score', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>最大点数</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={question.max_score}
                              onChange={(e) => updateQuestion(index, 'max_score', parseInt(e.target.value) || 5)}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Label>評価</Label>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(question.max_score)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 cursor-pointer ${
                                    i < question.evaluation_score
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                  onClick={() => updateQuestion(index, 'evaluation_score', i + 1)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>コメント</Label>
                          <Textarea
                            value={question.comments}
                            onChange={(e) => updateQuestion(index, 'comments', e.target.value)}
                            placeholder="評価に関するコメントを入力"
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {interviewQuestions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p>質問項目が追加されていません</p>
                      <p className="text-sm">テンプレートから追加するか、カスタム質問を作成してください</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 最終評価 */}
              <TabsContent value="evaluation" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>合計点</Label>
                    <div className="text-2xl font-bold text-blue-600">
                      {interviewQuestions.reduce((sum, q) => sum + q.evaluation_score, 0)} / {interviewQuestions.reduce((sum, q) => sum + q.max_score, 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      達成率: {interviewQuestions.reduce((sum, q) => sum + q.max_score, 0) > 0 
                        ? Math.round((interviewQuestions.reduce((sum, q) => sum + q.evaluation_score, 0) / interviewQuestions.reduce((sum, q) => sum + q.max_score, 0)) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="final_decision">最終判断</Label>
                    <Select 
                      value={editingInterview.final_decision} 
                      onValueChange={(value: 'pending' | 'hire' | 'hold' | 'reject') => 
                        setEditingInterview({...editingInterview, final_decision: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">未決定</SelectItem>
                        <SelectItem value="hire">採用</SelectItem>
                        <SelectItem value="hold">保留</SelectItem>
                        <SelectItem value="reject">不採用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="strengths">強み</Label>
                  <Textarea
                    id="strengths"
                    value={editingInterview.strengths}
                    onChange={(e) => setEditingInterview({
                      ...editingInterview,
                      strengths: e.target.value
                    })}
                    placeholder="AI実務経験が豊富・学習意欲が高い"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="concerns">懸念点</Label>
                  <Textarea
                    id="concerns"
                    value={editingInterview.concerns}
                    onChange={(e) => setEditingInterview({
                      ...editingInterview,
                      concerns: e.target.value
                    })}
                    placeholder="PM経験が浅い"
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* 決定事項 */}
              <TabsContent value="decision" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hiring_status">採用有無</Label>
                    <Select 
                      value={editingInterview.hiring_status} 
                      onValueChange={(value: 'under_review' | 'hired' | 'rejected' | 'offer_sent' | 'offer_accepted' | 'offer_declined') => 
                        setEditingInterview({...editingInterview, hiring_status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_review">検討中</SelectItem>
                        <SelectItem value="hired">採用決定</SelectItem>
                        <SelectItem value="rejected">見送り</SelectItem>
                        <SelectItem value="offer_sent">オファー送信</SelectItem>
                        <SelectItem value="offer_accepted">オファー承諾</SelectItem>
                        <SelectItem value="offer_declined">オファー辞退</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expected_start_date">入社予定日</Label>
                    <Input
                      id="expected_start_date"
                      type="date"
                      value={editingInterview.expected_start_date}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        expected_start_date: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary_offer">提示給与（月額）</Label>
                    <Input
                      id="salary_offer"
                      type="number"
                      min="0"
                      value={editingInterview.salary_offer || ''}
                      onChange={(e) => setEditingInterview({
                        ...editingInterview,
                        salary_offer: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interview_status">面接ステータス</Label>
                    <Select 
                      value={editingInterview.interview_status} 
                      onValueChange={(value: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled') => 
                        setEditingInterview({...editingInterview, interview_status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">予定</SelectItem>
                        <SelectItem value="completed">完了</SelectItem>
                        <SelectItem value="cancelled">キャンセル</SelectItem>
                        <SelectItem value="rescheduled">再調整</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="offer_conditions">オファー条件</Label>
                  <Textarea
                    id="offer_conditions"
                    value={editingInterview.offer_conditions}
                    onChange={(e) => setEditingInterview({
                      ...editingInterview,
                      offer_conditions: e.target.value
                    })}
                    placeholder="月給50万円・フルリモート可・副業OK"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    value={editingInterview.notes}
                    onChange={(e) => setEditingInterview({
                      ...editingInterview,
                      notes: e.target.value
                    })}
                    placeholder="その他のメモや特記事項"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
            <Button onClick={saveInterview} disabled={saving}>
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingInterview?.id ? '更新' : '作成'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruitmentManager;
