import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CalendarIcon, Plus, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon2, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/contexts/AdminContext';

interface MonthlyExpense {
  id: string;
  year_month: string;
  expense_category: string;
  expense_name: string;
  expense_type: 'fixed' | 'variable';
  budgeted_amount: number;
  actual_amount: number;
  payment_status: 'unpaid' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  payment_due_date: string | null;
  payment_date: string | null;
  vendor_name: string | null;
  description: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ExpenseSummary {
  year_month: string;
  expense_type: string;
  expense_category: string;
  expense_count: number;
  total_budgeted_amount: number;
  total_actual_amount: number;
  total_paid_amount: number;
  total_unpaid_amount: number;
  total_overdue_amount: number;
  payment_completion_rate: number;
  budget_variance_percentage: number;
}

interface DashboardOverview {
  current_month_total: number;
  current_month_budget: number;
  current_month_unpaid_count: number;
  current_month_unpaid_amount: number;
  previous_month_total: number;
  overdue_payments_count: number;
  overdue_payments_amount: number;
  year_to_date_total: number;
  year_to_date_budget: number;
  current_month_fixed_costs: number;
  current_month_variable_costs: number;
}

const ExpenseManager: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAdmin();

  // 役員権限チェック
  if (!user?.role || !['executive', 'ceo', 'admin'].includes(user.role)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">アクセス権限がありません</h3>
            <p className="text-gray-600 max-w-md">
              販管費管理機能は役員アカウントのみご利用いただけます。<br />
              アクセスが必要な場合は、役員アカウントでログインしてください。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [summaries, setSummaries] = useState<ExpenseSummary[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MonthlyExpense | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    expense_category: '',
    expense_name: '',
    expense_type: 'fixed' as 'fixed' | 'variable',
    budgeted_amount: '',
    actual_amount: '',
    payment_status: 'unpaid' as 'unpaid' | 'paid' | 'overdue' | 'cancelled' | 'partial',
    payment_due_date: '',
    payment_date: '',
    vendor_name: '',
    description: '',
    receipt_url: '',
    is_recurring: false,
  });

  // 費目カテゴリ定義
  const expenseCategories = [
    { value: 'personnel', label: '人件費' },
    { value: 'office_rent', label: 'オフィス賃料' },
    { value: 'utilities', label: '水道光熱費' },
    { value: 'communication', label: '通信費' },
    { value: 'marketing', label: 'マーケティング費' },
    { value: 'travel', label: '旅費交通費' },
    { value: 'office_supplies', label: '事務用品費' },
    { value: 'software', label: 'ソフトウェア費' },
    { value: 'legal', label: '法務費' },
    { value: 'insurance', label: '保険料' },
    { value: 'tax', label: '税金' },
    { value: 'maintenance', label: '保守・メンテナンス費' },
    { value: 'training', label: '研修費' },
    { value: 'entertainment', label: '交際費' },
    { value: 'other', label: 'その他' },
  ];

  // 支払いステータス定義
  const paymentStatuses = [
    { value: 'unpaid', label: '未払い', color: 'destructive' },
    { value: 'paid', label: '支払い済み', color: 'default' },
    { value: 'overdue', label: '期限切れ', color: 'destructive' },
    { value: 'partial', label: '一部支払い', color: 'secondary' },
    { value: 'cancelled', label: 'キャンセル', color: 'outline' },
  ];

  // データ取得
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_expenses')
        .select('*')
        .eq('year_month', selectedMonth)
        .order('expense_category', { ascending: true })
        .order('expense_name', { ascending: true });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'エラー',
        description: '販管費データの取得に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_expense_summary')
        .select('*')
        .eq('year_month', selectedMonth)
        .order('expense_type', { ascending: true })
        .order('expense_category', { ascending: true });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const fetchOverview = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_expense_overview')
        .select('*')
        .single();

      if (error) throw error;
      setOverview(data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  useEffect(() => {
    if (user?.role && ['executive', 'ceo', 'admin'].includes(user.role)) {
      fetchExpenses();
      fetchSummaries();
      fetchOverview();
    }
  }, [selectedMonth, user]);

  // フォーム初期化
  const resetForm = () => {
    setFormData({
      expense_category: '',
      expense_name: '',
      expense_type: 'fixed',
      budgeted_amount: '',
      actual_amount: '',
      payment_status: 'unpaid',
      payment_due_date: '',
      payment_date: '',
      vendor_name: '',
      description: '',
      receipt_url: '',
      is_recurring: false,
    });
    setEditingExpense(null);
  };

  // 編集開始
  const startEdit = (expense: MonthlyExpense) => {
    setEditingExpense(expense);
    setFormData({
      expense_category: expense.expense_category,
      expense_name: expense.expense_name,
      expense_type: expense.expense_type,
      budgeted_amount: expense.budgeted_amount.toString(),
      actual_amount: expense.actual_amount.toString(),
      payment_status: expense.payment_status,
      payment_due_date: expense.payment_due_date || '',
      payment_date: expense.payment_date || '',
      vendor_name: expense.vendor_name || '',
      description: expense.description || '',
      receipt_url: expense.receipt_url || '',
      is_recurring: expense.is_recurring,
    });
    setIsDialogOpen(true);
  };

  // 保存処理
  const handleSave = async () => {
    if (!formData.expense_category || !formData.expense_name || !formData.budgeted_amount) {
      toast({
        title: 'エラー',
        description: '必須項目を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    // ユーザーIDの確認と取得
    let userId = user?.id;
    
    if (!userId || userId === '1') {
      // AdminContextからのIDが正しくない場合、データベースから取得
      try {
        const { data: memberData } = await supabase
          .from('members')
          .select('id')
          .eq('email', user?.email || 'queue@queue-tech.jp')
          .eq('is_active', true)
          .single();
        
        if (memberData?.id) {
          userId = memberData.id;
          console.log('💰 Retrieved user ID from database:', userId);
        } else {
          toast({
            title: 'エラー',
            description: 'ユーザー情報が取得できません。再ログインしてください。',
            variant: 'destructive',
          });
          return;
        }
      } catch (error) {
        console.error('💰 Failed to get user ID:', error);
        toast({
          title: 'エラー',
          description: 'ユーザー情報の取得に失敗しました。再ログインしてください。',
          variant: 'destructive',
        });
        return;
      }
    }

    // 数値の検証
    const budgetedAmount = parseFloat(formData.budgeted_amount);
    const actualAmount = parseFloat(formData.actual_amount) || budgetedAmount;
    
    // 最大値制限 (decimal(12,2) = 9,999,999,999.99)
    const MAX_AMOUNT = 9999999999.99;
    
    if (isNaN(budgetedAmount) || budgetedAmount < 0) {
      toast({
        title: 'エラー',
        description: '予算額は0以上の数値を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    if (budgetedAmount > MAX_AMOUNT) {
      toast({
        title: 'エラー',
        description: '予算額は99億円以下で入力してください。',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(actualAmount) || actualAmount < 0) {
      toast({
        title: 'エラー',
        description: '実際金額は0以上の数値を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    if (actualAmount > MAX_AMOUNT) {
      toast({
        title: 'エラー',
        description: '実際金額は99億円以下で入力してください。',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const expenseData = {
        year_month: selectedMonth,
        expense_category: formData.expense_category,
        expense_name: formData.expense_name.trim(),
        expense_type: formData.expense_type,
        budgeted_amount: budgetedAmount,
        actual_amount: actualAmount,
        payment_status: formData.payment_status,
        payment_due_date: formData.payment_due_date || null,
        payment_date: formData.payment_date || null,
        vendor_name: formData.vendor_name?.trim() || null,
        description: formData.description?.trim() || null,
        receipt_url: formData.receipt_url?.trim() || null,
        is_recurring: formData.is_recurring,
        created_by: userId,
        updated_by: userId,
      };

      console.log('💰 Saving expense data:', expenseData);

      let result;
      if (editingExpense) {
        // 更新時はcreated_byを除外し、updated_byには正しいuserIdを使用
        const { created_by, ...updateData } = expenseData;
        updateData.updated_by = userId;
        result = await supabase
          .from('monthly_expenses')
          .update(updateData)
          .eq('id', editingExpense.id)
          .select();
      } else {
        result = await supabase
          .from('monthly_expenses')
          .insert([expenseData])
          .select();
      }

      if (result.error) {
        console.error('💰 Database error:', result.error);
        throw result.error;
      }

      console.log('💰 Save successful:', result.data);

      toast({
        title: '成功',
        description: `販管費を${editingExpense ? '更新' : '登録'}しました。`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchExpenses();
      fetchSummaries();
      fetchOverview();
    } catch (error: any) {
      console.error('💰 Error saving expense:', error);
      
      let errorMessage = '販管費の保存に失敗しました。';
      
      if (error?.code === '23505') {
        errorMessage = 'この年月・カテゴリ・費目名の組み合わせは既に存在します。';
      } else if (error?.code === '23503') {
        errorMessage = 'ユーザー情報が正しくありません。再ログインしてください。';
      } else if (error?.code === '23514') {
        errorMessage = '入力値が制約に違反しています。費目カテゴリや支払いステータスを確認してください。';
      } else if (error?.code === '22P02') {
        errorMessage = 'ユーザーID形式が正しくありません。ページを再読み込みしてください。';
      } else if (error?.code === '22003') {
        errorMessage = '入力された金額が大きすぎます。99億円以下で入力してください。';
      } else if (error?.code === '42501') {
        errorMessage = 'アクセス権限がありません。役員アカウントでログインしてください。';
      } else if (error?.message) {
        errorMessage = `エラー: ${error.message}`;
      }
      
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 削除処理
  const handleDelete = async (expenseId: string) => {
    if (!confirm('この販管費を削除してもよろしいですか？')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: '成功',
        description: '販管費を削除しました。',
      });

      fetchExpenses();
      fetchSummaries();
      fetchOverview();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'エラー',
        description: '販管費の削除に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 定期費用コピー
  const copyRecurringExpenses = async () => {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('copy_recurring_expenses', {
        from_year_month: lastMonthStr,
        to_year_month: selectedMonth,
      });

      if (error) throw error;

      toast({
        title: '成功',
        description: `${data}件の定期費用をコピーしました。`,
      });

      fetchExpenses();
      fetchSummaries();
    } catch (error) {
      console.error('Error copying recurring expenses:', error);
      toast({
        title: 'エラー',
        description: '定期費用のコピーに失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 人件費同期処理
  const syncPersonnelCosts = async () => {
    setIsLoading(true);
    try {
      // ユーザーIDの取得
      let userId = user?.id;
      
      if (!userId || userId === '1') {
        const { data: memberData } = await supabase
          .from('members')
          .select('id')
          .eq('email', user?.email || 'queue@queue-tech.jp')
          .eq('is_active', true)
          .single();
        
        if (!memberData?.id) {
          throw new Error('ユーザー情報が取得できません');
        }
        userId = memberData.id;
      }

      const { data, error } = await supabase.rpc('sync_personnel_costs_by_member', {
        target_year_month: selectedMonth,
        sync_user_id: userId,
      });

      if (error) throw error;

      const result = data;
      if (result.success) {
        toast({
          title: '成功',
          description: `${result.synced_members}名のメンバー給与を個別同期しました。合計 ¥${Math.round(result.total_amount).toLocaleString()} (支払期限: ${result.month_end_date}) (新規:${result.created_entries}件、更新:${result.updated_entries}件)`,
        });
        
        fetchExpenses();
        fetchSummaries();
        fetchOverview();
      } else {
        toast({
          title: '情報',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing personnel costs:', error);
      toast({
        title: 'エラー',
        description: '人件費の同期に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // アクセス権限チェック
  if (!user?.role || !['executive', 'ceo', 'admin'].includes(user.role)) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          販管費管理機能にアクセスする権限がありません。役員アカウントでログインしてください。
        </AlertDescription>
      </Alert>
    );
  }

  // 金額フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  // ステータスバッジ色取得
  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    const statusConfig = paymentStatuses.find(s => s.value === status);
    return statusConfig?.color as "default" | "destructive" | "secondary" | "outline" || "default";
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">販管費管理</h2>
          <p className="text-muted-foreground">月次の販売管理費を入力・管理します</p>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Button onClick={syncPersonnelCosts} variant="outline" disabled={isLoading} className="bg-blue-50 text-blue-700 hover:bg-blue-100">
            <DollarSign className="h-4 w-4 mr-2" />
            人件費同期（個別）
          </Button>
          <Button onClick={copyRecurringExpenses} variant="outline" disabled={isLoading}>
            定期費用コピー
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                費用追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? '販管費編集' : '販管費追加'}
                </DialogTitle>
                <DialogDescription>
                  販売管理費の詳細情報を入力してください。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense_category">費目カテゴリ *</Label>
                    <Select value={formData.expense_category} onValueChange={(value) => setFormData({ ...formData, expense_category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expense_type">費用種別</Label>
                    <Select value={formData.expense_type} onValueChange={(value: 'fixed' | 'variable') => setFormData({ ...formData, expense_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">固定費</SelectItem>
                        <SelectItem value="variable">変動費</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="expense_name">費目名 *</Label>
                  <Input
                    id="expense_name"
                    value={formData.expense_name}
                    onChange={(e) => setFormData({ ...formData, expense_name: e.target.value })}
                    placeholder="具体的な費目名を入力"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgeted_amount">予算額 *</Label>
                    <Input
                      id="budgeted_amount"
                      type="number"
                      min="0"
                      max="9999999999.99"
                      step="0.01"
                      value={formData.budgeted_amount}
                      onChange={(e) => setFormData({ ...formData, budgeted_amount: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">最大99億円まで</p>
                  </div>
                  <div>
                    <Label htmlFor="actual_amount">実際金額</Label>
                    <Input
                      id="actual_amount"
                      type="number"
                      min="0"
                      max="9999999999.99"
                      step="0.01"
                      value={formData.actual_amount}
                      onChange={(e) => setFormData({ ...formData, actual_amount: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">最大99億円まで（空白時は予算額を使用）</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_status">支払いステータス</Label>
                    <Select value={formData.payment_status} onValueChange={(value: any) => setFormData({ ...formData, payment_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vendor_name">支払い先</Label>
                    <Input
                      id="vendor_name"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      placeholder="支払い先名称"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_due_date">支払い期限</Label>
                    <Input
                      id="payment_due_date"
                      type="date"
                      value={formData.payment_due_date}
                      onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_date">支払い日</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">備考</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="備考・説明"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="receipt_url">領収書URL</Label>
                  <Input
                    id="receipt_url"
                    type="url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_recurring">定期的な費用（毎月自動コピー対象）</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={handleSave} disabled={isLoading}>
                  {editingExpense ? '更新' : '登録'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ダッシュボード概要 */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の総費用</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.current_month_total || 0)}</div>
              <p className="text-xs text-muted-foreground">
                予算: {formatCurrency(overview.current_month_budget || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未払い金額</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.current_month_unpaid_amount || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {overview.current_month_unpaid_count || 0}件の未払い
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">期限切れ</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(overview.overdue_payments_amount || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {overview.overdue_payments_count || 0}件の期限切れ
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">年間累計</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.year_to_date_total || 0)}</div>
              <p className="text-xs text-muted-foreground">
                予算: {formatCurrency(overview.year_to_date_budget || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* タブコンテンツ */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">費用一覧</TabsTrigger>
          <TabsTrigger value="summary">集計・分析</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>販管費一覧 ({selectedMonth})</CardTitle>
              <CardDescription>
                月次の販売管理費の詳細一覧です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">データを読み込み中...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  この月の販管費データはありません。
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>費目名</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead className="text-right">予算額</TableHead>
                      <TableHead className="text-right">実際金額</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>支払い期限</TableHead>
                      <TableHead>支払い先</TableHead>
                      <TableHead className="w-20">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {expenseCategories.find(c => c.value === expense.expense_category)?.label || expense.expense_category}
                        </TableCell>
                        <TableCell>
                          <div>
                            {expense.expense_name}
                            {expense.is_recurring && (
                              <Badge variant="outline" className="ml-2 text-xs">定期</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={expense.expense_type === 'fixed' ? 'secondary' : 'outline'}>
                            {expense.expense_type === 'fixed' ? '固定費' : '変動費'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.budgeted_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.actual_amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(expense.payment_status)}>
                            {paymentStatuses.find(s => s.value === expense.payment_status)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expense.payment_due_date ? new Date(expense.payment_due_date).toLocaleDateString('ja-JP') : '-'}
                        </TableCell>
                        <TableCell>{expense.vendor_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(expense)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {summaries.map((summary, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {expenseCategories.find(c => c.value === summary.expense_category)?.label} 
                    <Badge variant={summary.expense_type === 'fixed' ? 'secondary' : 'outline'} className="ml-2">
                      {summary.expense_type === 'fixed' ? '固定費' : '変動費'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{selectedMonth}の集計</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>費用件数:</span>
                      <span>{summary.expense_count}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span>予算総額:</span>
                      <span>{formatCurrency(summary.total_budgeted_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>実際総額:</span>
                      <span>{formatCurrency(summary.total_actual_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>支払い済み:</span>
                      <span className="text-green-600">{formatCurrency(summary.total_paid_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>未払い:</span>
                      <span className="text-red-600">{formatCurrency(summary.total_unpaid_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>支払い完了率:</span>
                      <span>{summary.payment_completion_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>予算差異:</span>
                      <span className={summary.budget_variance_percentage > 0 ? 'text-red-600' : 'text-green-600'}>
                        {summary.budget_variance_percentage > 0 ? '+' : ''}{summary.budget_variance_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseManager; 