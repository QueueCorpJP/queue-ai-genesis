import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Upload, Image as ImageIcon, ExternalLink, MessageCircle, Table } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
// @ts-ignore - react-quillのタイプ定義が存在しないため
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill-better-table/dist/quill-better-table.css';
import Quill from 'quill';
import QuillBetterTable from 'quill-better-table';

// Quillにテーブルモジュールを登録
Quill.register({
  'modules/better-table': QuillBetterTable
}, true);

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
    table_of_contents: [] as any[],
    auto_generate_toc: false,
    toc_style: 'numbered' as 'numbered' | 'bulleted' | 'plain' | 'hierarchical',
    status: 'draft' as 'draft' | 'published' | 'archived'
  });
  const [newTag, setNewTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const quillRef = useRef<any>(null);
  const summaryQuillRef = useRef<any>(null);

  // 元に戻す・やり直し機能（useMemoより前に定義）
  const handleContentUndo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill && quill.history) {
      quill.history.undo();
    }
  };

  const handleContentRedo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill && quill.history) {
      quill.history.redo();
    }
  };

  const handleSummaryUndo = () => {
    const quill = summaryQuillRef.current?.getEditor();
    if (quill && quill.history) {
      quill.history.undo();
    }
  };

  const handleSummaryRedo = () => {
    const quill = summaryQuillRef.current?.getEditor();
    if (quill && quill.history) {
      quill.history.redo();
    }
  };

  // 無料相談リンク挿入機能
  function insertConsultationLink() {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      const link = '<a href="/consultation" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; font-weight: 600; margin: 16px 0; transition: all 0.3s ease;"><span style="margin-right: 8px;">💬</span>無料相談を申し込む</a>';
      quill.clipboard.dangerouslyPasteHTML(range.index, link);
      quill.setSelection(range.index + link.length);
    }
  }

  // テーブル挿入機能
  function insertTable() {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const tableModule = quill.getModule('better-table');
      if (tableModule) {
        tableModule.insertTable(3, 3); // 3x3のテーブルを挿入
        toast.success('テーブルを挿入しました');
      }
    }
  }

  // 本文用Quillツールバーの設定
  const contentModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['table-insert'], // テーブル挿入ボタン
        ['consultation-link'], // カスタムボタン
        ['undo', 'redo'], // 元に戻す・やり直し
        ['clean']
      ],
      handlers: {
        'table-insert': insertTable,
        'consultation-link': insertConsultationLink,
        'undo': handleContentUndo,
        'redo': handleContentRedo
      }
    },
    'better-table': {
      operationMenu: {
        items: {
          unmergeCells: {
            text: 'セルの結合を解除'
          },
          mergeCells: {
            text: 'セルを結合'
          },
          insertColumnRight: {
            text: '右に列を追加'
          },
          insertColumnLeft: {
            text: '左に列を追加'
          },
          insertRowUp: {
            text: '上に行を追加'
          },
          insertRowDown: {
            text: '下に行を追加'
          },
          deleteColumn: {
            text: '列を削除'
          },
          deleteRow: {
            text: '行を削除'
          },
          deleteTable: {
            text: 'テーブルを削除'
          }
        }
      }
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }), []);

  // 目次自動生成機能
  const generateTableOfContents = () => {
    const content = formData.content;
    if (!content) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems: any[] = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const title = heading.textContent?.trim() || '';
      const anchor = `heading-${index + 1}`;
      
      if (title) {
        tocItems.push({
          level,
          title,
          anchor,
          order: index + 1
        });
      }
    });
    
    setFormData(prev => ({
      ...prev,
      table_of_contents: tocItems,
      auto_generate_toc: true
    }));
    
    if (tocItems.length > 0) {
      toast.success(`目次を生成しました（${tocItems.length}項目）`);
    } else {
      toast.warning('見出しタグ（H1〜H6）が見つかりませんでした');
    }
  };

  // 概要用Quillツールバーの設定（シンプル版）
  const summaryModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['undo', 'redo'], // 元に戻す・やり直し
        ['clean']
      ],
      handlers: {
        'undo': handleSummaryUndo,
        'redo': handleSummaryRedo
      }
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script'
  ];

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
        table_of_contents: article.table_of_contents || [],
        auto_generate_toc: article.auto_generate_toc || false,
        toc_style: article.toc_style || 'numbered',
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
        table_of_contents: [],
        auto_generate_toc: false,
        toc_style: 'numbered',
        status: 'draft'
      });
      setImagePreview('');
    }
  }, [article]);

  // Quillエディタの初期化後にカスタムボタンを追加
  useEffect(() => {
    const addCustomButtons = () => {
      const toolbarContainer = document.querySelector('.ql-toolbar');
      
      // テーブル挿入ボタンを追加
      if (toolbarContainer && !document.querySelector('.ql-table-insert')) {
        const tableButton = document.createElement('button');
        tableButton.className = 'ql-table-insert';
        tableButton.innerHTML = '📊';
        tableButton.title = 'テーブルを挿入';
        tableButton.type = 'button';
        tableButton.style.background = '#10b981';
        tableButton.style.color = 'white';
        tableButton.style.border = 'none';
        tableButton.style.borderRadius = '4px';
        tableButton.style.padding = '6px 8px';
        tableButton.style.margin = '0 2px';
        tableButton.style.cursor = 'pointer';
        
        tableButton.addEventListener('click', insertTable);
        
        // consultation-linkボタンの前に追加
        const consultationButton = toolbarContainer.querySelector('.ql-consultation-link');
        if (consultationButton && consultationButton.parentNode) {
          consultationButton.parentNode.insertBefore(tableButton, consultationButton);
        } else {
          // consultationボタンがまだない場合はcleanボタンの前に追加
          const cleanButton = toolbarContainer.querySelector('.ql-clean');
          if (cleanButton && cleanButton.parentNode) {
            cleanButton.parentNode.insertBefore(tableButton, cleanButton);
          }
        }
      }
      
      // 無料相談リンクボタンを追加
      if (toolbarContainer && !document.querySelector('.ql-consultation-link')) {
        const customButton = document.createElement('button');
        customButton.className = 'ql-consultation-link';
        customButton.innerHTML = '💬';
        customButton.title = '無料相談リンクを挿入';
        customButton.type = 'button';
        customButton.style.background = '#3b82f6';
        customButton.style.color = 'white';
        customButton.style.border = 'none';
        customButton.style.borderRadius = '4px';
        customButton.style.padding = '6px 8px';
        customButton.style.margin = '0 2px';
        customButton.style.cursor = 'pointer';
        
        customButton.addEventListener('click', insertConsultationLink);
        
        // ツールバーの最後に追加
        const cleanButton = toolbarContainer.querySelector('.ql-clean');
        if (cleanButton && cleanButton.parentNode) {
          cleanButton.parentNode.insertBefore(customButton, cleanButton);
        }
      }
    };

    if (open) {
      // ダイアログが開いた後に少し遅延してボタンを追加
      setTimeout(addCustomButtons, 500);
    }
  }, [open]);

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

  // Quillツールバーのカスタムスタイルを追加
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        .ql-undo::before {
          content: "↶";
          font-size: 14px;
        }
        .ql-redo::before {
          content: "↷";
          font-size: 14px;
        }
        
        /* ツールバーボタンのホバー効果 */
        .ql-toolbar .ql-undo,
        .ql-toolbar .ql-redo {
          width: 28px !important;
          height: 28px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 4px !important;
          margin: 1px !important;
          background-color: white !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        
        .ql-toolbar .ql-undo:hover,
        .ql-toolbar .ql-redo:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? '記事を編集' : '新規記事を作成'}
          </DialogTitle>
          <DialogDescription>
            ブログ記事の作成・編集を行います。リッチテキストエディタで装飾やリンクの挿入が可能です。
          </DialogDescription>
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
            <div className="border rounded-md">
              <div className="bg-blue-50 border-b px-4 py-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>フォント・サイズ・色・斜体の変更が可能 | 元に戻す・やり直し機能付き</span>
                </div>
              </div>
              <ReactQuill
                ref={summaryQuillRef}
                theme="snow"
                value={formData.summary}
                onChange={(summary) => setFormData(prev => ({ ...prev, summary }))}
                modules={summaryModules}
                formats={formats}
                placeholder="記事の概要を入力してください。文字装飾やスタイル設定が可能です。"
                style={{ minHeight: '120px' }}
              />
            </div>
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
            <Label>本文 *</Label>
            <div className="border rounded-md">
              <div className="bg-amber-50 border-b px-4 py-2 text-sm text-amber-800">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>💬ボタンで無料相談リンクを挿入できます | フォント・サイズ・色の変更が可能</span>
                </div>
              </div>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                modules={contentModules}
                formats={formats}
                placeholder="記事の本文を入力してください。ツールバーから文字装飾や無料相談リンクの挿入、元に戻す・やり直しができます。"
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>

          {/* 目次設定 */}
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">目次設定</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={generateTableOfContents}
                disabled={!formData.content}
              >
                目次を自動生成
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>目次スタイル</Label>
                <Select 
                  value={formData.toc_style} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, toc_style: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numbered">番号付き (1. 2. 3.)</SelectItem>
                    <SelectItem value="bulleted">箇条書き (● ○ ▪)</SelectItem>
                    <SelectItem value="plain">プレーン</SelectItem>
                    <SelectItem value="hierarchical">階層表示</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>目次項目数</Label>
                <div className="text-sm text-gray-600 bg-white border rounded-md px-3 py-2">
                  {formData.table_of_contents && formData.table_of_contents.length > 0 ? `${formData.table_of_contents.length} 項目` : '目次未設定'}
                </div>
              </div>
            </div>
            
            {formData.table_of_contents && formData.table_of_contents.length > 0 && (
              <div className="space-y-2">
                <Label>目次プレビュー</Label>
                <div className="bg-white border rounded-md p-3 max-h-32 overflow-y-auto">
                  <ol className="space-y-1 text-sm">
                    {formData.table_of_contents.map((item: any, index: number) => (
                      <li key={index} className={`ml-${(item.level - 1) * 4} flex items-center`}>
                        <span className="text-blue-600 mr-2">
                          {formData.toc_style === 'numbered' && `${index + 1}.`}
                          {formData.toc_style === 'bulleted' && (item.level === 1 ? '●' : item.level === 2 ? '○' : '▪')}
                        </span>
                        <span className="text-gray-700">{item.title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source_name">出典名</Label>
              <Input
                id="source_name"
                value={formData.source_name}
                onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                placeholder="例：PR TIMES"
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