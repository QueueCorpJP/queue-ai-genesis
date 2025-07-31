import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Edit, Trash2, Eye, Calendar, Filter, Download, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import NewsEditor from './NewsEditor';
import NewsEditorForm from './NewsEditorForm';
import { useIsMobile } from '@/hooks/use-mobile';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url?: string;
  image_caption?: string;
  author: string;
  source_url?: string;
  published_at?: string;
  created_at: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
}

const NewsManager: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        toast.error('記事の取得に失敗しました');
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('記事の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('この記事を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        toast.error('記事の削除に失敗しました');
        return;
      }

      setArticles(prev => prev.filter(article => article.id !== id));
      toast.success('記事を削除しました');
    } catch (error) {
      console.error('Error:', error);
      toast.error('記事の削除に失敗しました');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'archived' : 'published';
    
    try {
      const { error } = await supabase
        .from('news_articles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('ステータスの更新に失敗しました');
        return;
      }

      setArticles(prev =>
        prev.map(article =>
          article.id === id ? { ...article, status: newStatus as NewsArticle['status'] } : article
        )
      );

      toast.success('ステータスを更新しました');
    } catch (error) {
      console.error('Error:', error);
      toast.error('ステータスの更新に失敗しました');
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    setIsEditDialogOpen(false);
    setEditingArticle(null);
    fetchArticles(); // 記事一覧を再取得
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      archived: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      draft: '下書き',
      published: '公開',
      archived: 'アーカイブ'
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const csvData = filteredArticles.map(article => ({
      タイトル: article.title,
      概要: article.summary,
      著者: article.author,
      ステータス: getStatusBadge(article.status).props.children,
      作成日: new Date(article.created_at).toLocaleString('ja-JP'),
      公開日: article.published_at ? new Date(article.published_at).toLocaleString('ja-JP') : '未公開',
      出典: article.source_url || '未設定'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `news_articles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ArticleCard = ({ article }: { article: NewsArticle }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {article.image_url && (
            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={article.image_url} 
                alt={article.image_caption || article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
              {getStatusBadge(article.status)}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{article.summary}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span>{article.author}</span>
              <span>•</span>
              <span>{new Date(article.created_at).toLocaleDateString('ja-JP')}</span>
              {article.published_at && (
                <>
                  <span>•</span>
                  <span>公開: {new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedArticle(article);
                  setIsDetailDialogOpen(true);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                詳細
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(article)}
              >
                <Edit className="w-4 h-4 mr-1" />
                編集
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleStatus(article.id, article.status)}
              >
                <Calendar className="w-4 h-4 mr-1" />
                {article.status === 'published' ? 'アーカイブ' : '公開'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteArticle(article.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                削除
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">ブログ記事管理</h2>
        <NewsEditor onSave={fetchArticles} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">記事一覧</CardTitle>
        </CardHeader>
        <CardContent>
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
                  {filteredArticles.length}件
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
                  placeholder="タイトル、概要、本文で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
                <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="published">公開</SelectItem>
                <SelectItem value="archived">アーカイブ</SelectItem>
              </SelectContent>
            </Select>
                  <Button onClick={exportToCSV} variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {filteredArticles.length}件の結果
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>画像</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead>公開日</TableHead>
                    <TableHead>出典</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="w-20">
                        {article.image_url ? (
                            <img
                              src={article.image_url}
                                alt={article.image_caption || article.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                          <div className="font-medium truncate">{article.title}</div>
                          <div className="text-sm text-gray-500 truncate">{article.summary}</div>
                        </div>
                      </TableCell>
                          <TableCell>{getStatusBadge(article.status)}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(article.created_at).toLocaleDateString('ja-JP')}
                      </TableCell>
                          <TableCell className="text-sm">
                            {article.published_at 
                              ? new Date(article.published_at).toLocaleDateString('ja-JP') 
                              : '未公開'}
                      </TableCell>
                      <TableCell>
                            {article.source_url ? (
                            <a
                              href={article.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                            >
                                出典
                            </a>
                            ) : (
                              <span className="text-gray-400 text-sm">未設定</span>
                          )}
                      </TableCell>
                      <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(article)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleStatus(article.id, article.status)}
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteArticle(article.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {filteredArticles.length === 0 ? (
            <div className="text-center py-8">
                    <p className="text-gray-500">記事が見つかりません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>記事詳細</DialogTitle>
            <DialogDescription>
              ブログ記事の詳細情報を確認できます。
            </DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">タイトル</label>
                  <p className="text-sm text-gray-900">{selectedArticle.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">著者</label>
                  <p className="text-sm text-gray-900">{selectedArticle.author}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ステータス</label>
                  <div className="pt-1">
                    {getStatusBadge(selectedArticle.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">作成日</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedArticle.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                {selectedArticle.published_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">公開日</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedArticle.published_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}
                {selectedArticle.source_url && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">出典</label>
                    <a 
                      href={selectedArticle.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedArticle.source_url}
                    </a>
                  </div>
                )}
              </div>
              
              {selectedArticle.image_url && (
                <div>
                  <label className="text-sm font-medium text-gray-700">画像</label>
                  <div className="mt-2">
                    <img 
                      src={selectedArticle.image_url} 
                      alt={selectedArticle.image_caption || selectedArticle.title}
                      className="max-w-full h-auto rounded-lg"
                    />
                    {selectedArticle.image_caption && (
                      <p className="text-sm text-gray-500 mt-1">{selectedArticle.image_caption}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">概要</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md mt-1 blog-content">
                  {selectedArticle.summary.includes('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.summary }} />
                  ) : (
                    <p>{selectedArticle.summary}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">本文</label>
                <div 
                  className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md mt-1 blog-content"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </div>

              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">タグ</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedArticle.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>記事を編集</DialogTitle>
            <DialogDescription>
              記事の内容を編集できます。リッチテキストエディターで文字装飾や無料相談リンクの挿入が可能です。
            </DialogDescription>
          </DialogHeader>
          {editingArticle && (
            <NewsEditorForm 
              article={editingArticle}
              onSave={handleEditSave}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManager; 