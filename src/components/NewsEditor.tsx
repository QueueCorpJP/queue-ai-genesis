import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface NewsEditorProps {
  article?: any;
  onSave: () => void;
  trigger?: React.ReactNode;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ article, onSave, trigger }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    source_name: '',
    source_url: '',
    image_url: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived'
  });
  const [newTag, setNewTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        summary: article.summary || '',
        content: article.content || '',
        source_name: article.source_name || '',
        source_url: article.source_url || '',
        image_url: article.image_url || '',
        tags: article.tags || [],
        status: article.status || 'draft'
      });
      setImagePreview(article.image_url || '');
    } else {
      setFormData({
        title: '',
        summary: '',
        content: '',
        source_name: '',
        source_url: '',
        image_url: '',
        tags: [],
        status: 'draft'
      });
      setImagePreview('');
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;

      // ファイルアップロードがある場合
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const now = new Date().toISOString();
      const articleData = {
        ...formData,
        image_url: finalImageUrl,
        published_at: formData.status === 'published' ? now : null,
        updated_at: now
      };

      if (article) {
        // 既存記事の更新
        const { error } = await supabase
          .from('news_articles')
          .update(articleData)
          .eq('id', article.id);

        if (error) throw error;
        toast.success('記事を更新しました');
      } else {
        // 新規記事の作成
        const { error } = await supabase
          .from('news_articles')
          .insert(articleData);

        if (error) throw error;
        toast.success('記事を作成しました');
      }

      setOpen(false);
      onSave();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('記事の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true);
      
      // ファイル名を生成（タイムスタンプ + ランダム文字列）
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `news-images/${fileName}`;

      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('画像のアップロードに失敗しました');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB制限）
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ファイルサイズは5MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('JPEG、PNG、WebP形式の画像ファイルのみ対応しています');
        return;
      }

      setImageFile(file);

      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setImagePreview(url);
    setImageFile(null); // URLを入力した場合はファイルをクリア
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規記事
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? '記事を編集' : '新規記事を作成'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="記事のタイトルを入力"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="published">公開</SelectItem>
                  <SelectItem value="archived">アーカイブ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">概要 *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="記事の概要を入力"
              rows={2}
              required
            />
          </div>

          {/* 画像アップロード */}
          <div className="space-y-4">
            <Label>アイキャッチ画像</Label>
            
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">ファイルアップロード</TabsTrigger>
                <TabsTrigger value="url">URL指定</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-10 w-10 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          ファイルを選択
                        </span>
                        {' '}またはドラッグ&ドロップ
                      </div>
                      <div className="text-xs text-gray-500">
                        JPEG、PNG、WebP（最大5MB）
                      </div>
                    </div>
                  </label>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="画像のURLを入力"
                    value={formData.image_url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleImageUrlChange(formData.image_url)}
                  >
                    プレビュー
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* 画像プレビュー */}
            {imagePreview && (
              <div className="relative">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      プレビュー
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="プレビュー"
                    className="max-w-full h-48 object-cover rounded border"
                    onError={() => {
                      toast.error('画像の読み込みに失敗しました');
                      clearImage();
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">本文 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="記事の本文を入力（改行で段落を分けます）"
              rows={10}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source_name">出典名 *</Label>
              <Input
                id="source_name"
                value={formData.source_name}
                onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                placeholder="例：PR TIMES"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_url">出典URL</Label>
              <Input
                id="source_url"
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>タグ</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-queue-light text-queue-blue">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="新しいタグを入力"
              />
              <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                追加
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || uploadingImage}>
              {loading || uploadingImage ? '保存中...' : article ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewsEditor; 