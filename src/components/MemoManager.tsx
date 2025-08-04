import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Star, 
  Edit3, 
  Trash2, 
  Tag, 
  Calendar,
  Lightbulb,
  Users,
  BookOpen,
  Target,
  MessageSquare,
  CheckSquare,
  Sparkles,
  FileText,
  Heart,
  Archive,
  Filter,
  SortDesc,
  Clock
} from 'lucide-react';

interface PersonalMemo {
  id: string;
  member_id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
  category_display?: string;
  priority_display?: string;
}

interface MemoStats {
  total_memos: number;
  categories_breakdown: Record<string, number>;
  weekly_activity: Array<{ date: string; count: number }>;
  priority_distribution: Record<string, number>;
  favorite_count: number;
  recent_activity: number;
}

const MemoManager: React.FC = () => {
  const { user } = useAdmin();
  const [memos, setMemos] = useState<PersonalMemo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<PersonalMemo[]>([]);
  const [stats, setStats] = useState<MemoStats>({
    total_memos: 0,
    categories_breakdown: {},
    weekly_activity: [],
    priority_distribution: {},
    favorite_count: 0,
    recent_activity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMemo, setEditingMemo] = useState<PersonalMemo | null>(null);
  
  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title' | 'priority'>('created_at');

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    tags: '',
    is_favorite: false,
    reminder_date: ''
  });

  // カテゴリとアイコンのマッピング
  const categoryOptions = [
    { value: 'general', label: '一般', icon: <FileText className="w-4 h-4" /> },
    { value: 'ideas', label: 'アイデア', icon: <Lightbulb className="w-4 h-4" /> },
    { value: 'meeting', label: '会議', icon: <Users className="w-4 h-4" /> },
    { value: 'project', label: 'プロジェクト', icon: <Target className="w-4 h-4" /> },
    { value: 'learning', label: '学習', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'goal', label: '目標', icon: <Target className="w-4 h-4" /> },
    { value: 'reflection', label: '振り返り', icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'task', label: 'タスク', icon: <CheckSquare className="w-4 h-4" /> },
    { value: 'inspiration', label: 'インスピレーション', icon: <Sparkles className="w-4 h-4" /> },
    { value: 'other', label: 'その他', icon: <FileText className="w-4 h-4" /> }
  ];

  const priorityOptions = [
    { value: 'low', label: '低', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: '中', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: '高', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'urgent', label: '緊急', color: 'bg-red-100 text-red-800' }
  ];

  // メモ取得
  const fetchMemos = useCallback(async () => {
    if (!user?.id) {
      console.log('📝 User ID not available for memo fetch');
      return;
    }

    console.log('📝 Fetching memos for user:', user.id);
    setIsLoading(true);
    try {
      // まずテーブルの存在を確認するためのクエリ
      const { data, error } = await supabase
        .from('personal_memos')
        .select('*')
        .eq('member_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('📝 Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      setMemos(data || []);
      console.log('📝 Memos fetched successfully:', data?.length || 0);
    } catch (error: any) {
      console.error('📝 Error fetching memos:', error);
      
      // テーブルが存在しない場合の具体的なエラーメッセージ
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        toast({
          title: 'マイメモ機能は準備中です',
          description: 'personal_memosテーブルが作成されていません。データベースのマイグレーションを実行してください。',
          variant: 'destructive',
        });
      } else if (error.code === '42501' || error.message?.includes('permission denied')) {
        toast({
          title: '権限エラー',
          description: 'メモへのアクセス権限がありません。RLSポリシーを確認してください。',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'エラー',
          description: `メモの取得に失敗しました: ${error.message}`,
          variant: 'destructive',
        });
      }
      
      // エラーの場合は空配列を設定
      setMemos([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // 統計情報取得（RPC関数を使わずに基本クエリで取得）
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('📊 Calculating memo stats for user:', user.id);
      
      // 基本的なメモデータを取得
      const { data: memosData, error: memosError } = await supabase
        .from('personal_memos')
        .select('category, priority, is_favorite, created_at')
        .eq('member_id', user.id)
        .eq('is_archived', false);

      if (memosError) {
        throw memosError;
      }

      const memos = memosData || [];
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 統計を計算
      const categories_breakdown: Record<string, number> = {};
      const priority_distribution: Record<string, number> = {};
      let favorite_count = 0;
      let recent_activity = 0;

      memos.forEach(memo => {
        // カテゴリ別集計
        categories_breakdown[memo.category] = (categories_breakdown[memo.category] || 0) + 1;
        
        // 優先度別集計
        priority_distribution[memo.priority] = (priority_distribution[memo.priority] || 0) + 1;
        
        // お気に入り数
        if (memo.is_favorite) {
          favorite_count++;
        }
        
        // 最近の活動（1週間以内）
        if (new Date(memo.created_at) > oneWeekAgo) {
          recent_activity++;
        }
      });

      const calculatedStats = {
        total_memos: memos.length,
        categories_breakdown,
        weekly_activity: [], // 簡略化のため空配列
        priority_distribution,
        favorite_count,
        recent_activity
      };

      console.log('📊 Memo stats calculated:', calculatedStats);
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('📝 Error calculating memo stats:', error);
      // エラーの場合はデフォルト値を設定
      setStats({
        total_memos: 0,
        categories_breakdown: {},
        weekly_activity: [],
        priority_distribution: {},
        favorite_count: 0,
        recent_activity: 0
      });
      
      // personal_memosテーブルが存在しない場合のメッセージ
      toast({
        title: 'マイメモ機能は準備中です',
        description: 'データベースのマイグレーションが必要です。管理者にお問い合わせください。',
        variant: 'destructive',
      });
    }
  }, [user?.id]);

  // フィルタリング処理
  useEffect(() => {
    let filtered = [...memos];

    // 検索フィルター
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(memo => 
        memo.title.toLowerCase().includes(searchLower) ||
        memo.content.toLowerCase().includes(searchLower) ||
        memo.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // カテゴリフィルター
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === filterCategory);
    }

    // 優先度フィルター
    if (filterPriority && filterPriority !== 'all') {
      filtered = filtered.filter(memo => memo.priority === filterPriority);
    }

    // お気に入りフィルター
    if (showFavoritesOnly) {
      filtered = filtered.filter(memo => memo.is_favorite);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredMemos(filtered);
  }, [memos, searchTerm, filterCategory, filterPriority, showFavoritesOnly, sortBy]);

  // 初期データ取得
  useEffect(() => {
    if (user?.id) {
      fetchMemos();
      fetchStats();
    }
  }, [user?.id, fetchMemos, fetchStats]);

  // フォームリセット
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      tags: '',
      is_favorite: false,
      reminder_date: ''
    });
    setEditingMemo(null);
  };

  // メモ作成
  const handleCreateMemo = async () => {
    if (!user?.id || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'エラー',
        description: 'タイトルと内容を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const memoData = {
        member_id: user.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        tags: tagsArray,
        is_favorite: formData.is_favorite,
        reminder_date: formData.reminder_date || null
      };

      const { error } = await supabase
        .from('personal_memos')
        .insert(memoData);

      if (error) {
        console.error('📝 Create memo error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      toast({
        title: '成功',
        description: 'メモを作成しました。',
      });

      setShowCreateDialog(false);
      resetForm();
      await Promise.all([fetchMemos(), fetchStats()]);
    } catch (error) {
      console.error('📝 Error creating memo:', error);
      toast({
        title: 'エラー',
        description: 'メモの作成に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  // メモ更新
  const handleUpdateMemo = async () => {
    if (!editingMemo || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'エラー',
        description: 'タイトルと内容を入力してください。',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const memoData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        tags: tagsArray,
        is_favorite: formData.is_favorite,
        reminder_date: formData.reminder_date || null
      };

      const { error } = await supabase
        .from('personal_memos')
        .update(memoData)
        .eq('id', editingMemo.id);

      if (error) throw error;

      toast({
        title: '成功',
        description: 'メモを更新しました。',
      });

      resetForm();
      await Promise.all([fetchMemos(), fetchStats()]);
    } catch (error) {
      console.error('📝 Error updating memo:', error);
      toast({
        title: 'エラー',
        description: 'メモの更新に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  // メモ削除
  const handleDeleteMemo = async (memoId: string) => {
    if (!confirm('このメモを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('personal_memos')
        .delete()
        .eq('id', memoId);

      if (error) throw error;

      toast({
        title: '成功',
        description: 'メモを削除しました。',
      });

      await Promise.all([fetchMemos(), fetchStats()]);
    } catch (error) {
      console.error('📝 Error deleting memo:', error);
      toast({
        title: 'エラー',
        description: 'メモの削除に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  // お気に入り切り替え
  const toggleFavorite = async (memo: PersonalMemo) => {
    try {
      const { error } = await supabase
        .from('personal_memos')
        .update({ is_favorite: !memo.is_favorite })
        .eq('id', memo.id);

      if (error) throw error;

      await Promise.all([fetchMemos(), fetchStats()]);
    } catch (error) {
      console.error('📝 Error toggling favorite:', error);
      toast({
        title: 'エラー',
        description: 'お気に入りの更新に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  // 編集ダイアログを開く
  const openEditDialog = (memo: PersonalMemo) => {
    setEditingMemo(memo);
    setFormData({
      title: memo.title,
      content: memo.content,
      category: memo.category,
      priority: memo.priority,
      tags: memo.tags.join(', '),
      is_favorite: memo.is_favorite,
      reminder_date: memo.reminder_date ? memo.reminder_date.split('T')[0] : ''
    });
  };

  // カテゴリアイコンを取得
  const getCategoryIcon = (category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.icon || <FileText className="w-4 h-4" />;
  };

  // カテゴリ表示名を取得
  const getCategoryLabel = (category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption?.label || category;
  };

  // 優先度色を取得
  const getPriorityColor = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return priorityOption?.color || 'bg-gray-100 text-gray-800';
  };

  // 優先度表示名を取得
  const getPriorityLabel = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return priorityOption?.label || priority;
  };

  if (!user?.id) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">ログインが必要です。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">マイメモ</h2>
          <p className="text-gray-600">日々の気づき・アイデア・業務メモを記録しましょう</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              新しいメモ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMemo ? 'メモを編集' : '新しいメモを作成'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="メモのタイトルを入力"
                />
              </div>
              <div>
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="メモの内容を入力..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">カテゴリ</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            {option.icon}
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">優先度</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="例: アイデア, 重要, 後で確認"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                    className="rounded"
                  />
                  <Star className="w-4 h-4" />
                  <span>お気に入り</span>
                </label>
              </div>
              <div>
                <Label htmlFor="reminder_date">リマインダー日付（任意）</Label>
                <Input
                  id="reminder_date"
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}>
                  キャンセル
                </Button>
                <Button onClick={editingMemo ? handleUpdateMemo : handleCreateMemo}>
                  {editingMemo ? '更新' : '作成'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総メモ数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_memos}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">お気に入り</p>
                <p className="text-2xl font-bold text-gray-900">{stats.favorite_count}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今週の活動</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent_activity}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">アイデア数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.categories_breakdown?.ideas || 0}
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター・検索 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="メモを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="カテゴリ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className="w-4 h-4 mr-2" />
              お気に入り
            </Button>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">作成日</SelectItem>
                <SelectItem value="updated_at">更新日</SelectItem>
                <SelectItem value="title">タイトル</SelectItem>
                <SelectItem value="priority">優先度</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* メモ一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || (filterCategory && filterCategory !== 'all') || (filterPriority && filterPriority !== 'all') || showFavoritesOnly
                ? 'フィルター条件に一致するメモがありません'
                : 'まだメモがありません。最初のメモを作成しましょう！'
              }
            </p>
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <Card key={memo.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getCategoryIcon(memo.category)}
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(memo.category)}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(memo.priority)}`}>
                        {getPriorityLabel(memo.priority)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{memo.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(memo)}
                    className="flex-shrink-0 ml-2"
                  >
                    <Star className={`w-4 h-4 ${memo.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {memo.content}
                </p>
                
                {memo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {memo.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {memo.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{memo.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  <p>作成: {new Date(memo.created_at).toLocaleDateString('ja-JP')}</p>
                  {memo.created_at !== memo.updated_at && (
                    <p>更新: {new Date(memo.updated_at).toLocaleDateString('ja-JP')}</p>
                  )}
                  {memo.reminder_date && (
                    <p className="flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      リマインダー: {new Date(memo.reminder_date).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditDialog(memo);
                      setShowCreateDialog(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMemo(memo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoManager; 