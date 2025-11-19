import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Upload, Image as ImageIcon, MessageCircle, Table, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { generateSlug, calculateReadingTime } from '@/utils/seoUtils';
import { onArticlePublished, onArticleUnpublished } from '@/utils/autoSitemapUpdate';
// @ts-ignore - react-quillのタイプ定義が存在しないため
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// import 'quill-better-table/dist/quill-better-table.css';
// import Quill from 'quill';
// import QuillBetterTable from 'quill-better-table';

// Quillにテーブルモジュールを登録
// Quill.register({
//   'modules/better-table': QuillBetterTable
// }, true);

interface NewsEditorFormProps {
  article?: any;
  onSave: () => void;
  onCancel?: () => void;
}

const NewsEditorForm: React.FC<NewsEditorFormProps> = ({ article, onSave, onCancel }) => {
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
    status: 'draft' as 'draft' | 'published' | 'archived',
    // ハブ構造関連フィールド
    page_type: 'normal' as 'normal' | 'hub' | 'sub',
    parent_hub_id: '' as string | null,
    cluster_sort_order: '' as number | '' | null,
    // SEO関連フィールド
    seo_title: '',
    meta_description: '',
    meta_keywords: '',
    slug: '',
    canonical_url: '',
    focus_keyword: '',
    reading_time_minutes: 0,
    article_type: 'blog_post' as string,
    author_name: 'Queue株式会社',
    author_url: 'https://queue-tech.jp',
    og_title: '',
    og_description: '',
    og_image: '',
    og_type: 'article',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    twitter_card_type: 'summary_large_image',
    meta_robots: 'index, follow'
  });
  const [newTag, setNewTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const quillRef = useRef<any>(null);
  const summaryQuillRef = useRef<any>(null);
  // ハブページ選択用
  const [hubOptions, setHubOptions] = useState<{ id: string; title: string; slug?: string | null }[]>([]);
  const [hubSubPages, setHubSubPages] = useState<any[]>([]);
  
  // 元に戻す機能用の履歴管理
  const [contentHistory, setContentHistory] = useState<string[]>([]);
  const [summaryHistory, setSummaryHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [summaryHistoryIndex, setSummaryHistoryIndex] = useState(-1);

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

  // SEOデータ自動生成機能
  const generateSEOData = () => {
    const { title, summary, content, tags } = formData;
    if (!title.trim()) {
      toast.error('タイトルを入力してからSEOデータを生成してください');
      return;
    }

    // HTMLタグを除去する関数
    const stripHtml = (html: string) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    // SEOタイトル生成（60文字以内）
    const seoTitle = title.length > 50 ? title.substring(0, 50).trim() + '...' : title;
    
    // メタディスクリプション生成（160文字以内）
    const cleanSummary = stripHtml(summary);
    const metaDescription = cleanSummary || stripHtml(content).substring(0, 150) + '...';
    const finalMetaDescription = metaDescription.length > 160 ? metaDescription.substring(0, 160).trim() + '...' : metaDescription;
    
    // スラッグ生成
    const slug = generateSlug(title);
    
    // メタキーワード生成
    const keywords = ['Queue株式会社', 'AI', '人工知能', ...tags].join(', ');
    
    // 読了時間計算
    const readingTime = calculateReadingTime(content);
    
    // カノニカルURL生成
    const canonicalUrl = `/news/${slug}`;

    setFormData(prev => ({
      ...prev,
      seo_title: seoTitle,
      meta_description: finalMetaDescription,
      meta_keywords: keywords,
      slug: slug,
      canonical_url: canonicalUrl,
      reading_time_minutes: readingTime,
      og_title: seoTitle,
      og_description: finalMetaDescription,
      og_image: prev.image_url || '/Queue.png',
      twitter_title: seoTitle.length > 70 ? seoTitle.substring(0, 67) + '...' : seoTitle,
      twitter_description: finalMetaDescription.length > 200 ? finalMetaDescription.substring(0, 197) + '...' : finalMetaDescription,
      twitter_image: prev.image_url || '/Queue.png'
    }));

    toast.success('SEOデータを自動生成しました');
  };

  // 記事データ初期化
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
        status: article.status || 'draft',
        // ハブ構造関連フィールド（未設定データは既存記事として normal 扱い）
        page_type: (article.page_type as 'normal' | 'hub' | 'sub') || 'normal',
        parent_hub_id: article.parent_hub_id || null,
        cluster_sort_order: typeof article.cluster_sort_order === 'number'
          ? article.cluster_sort_order
          : '',
        // SEO関連フィールド
        seo_title: article.seo_title || '',
        meta_description: article.meta_description || '',
        meta_keywords: article.meta_keywords || '',
        slug: article.slug || '',
        canonical_url: article.canonical_url || '',
        focus_keyword: article.focus_keyword || '',
        reading_time_minutes: article.reading_time_minutes || 0,
        article_type: article.article_type || 'blog_post',
        author_name: article.author_name || 'Queue株式会社',
        author_url: article.author_url || 'https://queue-tech.jp',
        og_title: article.og_title || '',
        og_description: article.og_description || '',
        og_image: article.og_image || '',
        og_type: article.og_type || 'article',
        twitter_title: article.twitter_title || '',
        twitter_description: article.twitter_description || '',
        twitter_image: article.twitter_image || '',
        twitter_card_type: article.twitter_card_type || 'summary_large_image',
        meta_robots: article.meta_robots || 'index, follow'
      });
      setImagePreview(article.image_url || '');
      // 既存記事編集時にハブ/サブ関連データも読み込む
      if (article.page_type === 'hub') {
        fetchSubPages(article.id);
      }
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
        status: 'draft',
        page_type: 'normal',
        parent_hub_id: null,
        cluster_sort_order: '',
        // SEO関連フィールド
        seo_title: '',
        meta_description: '',
        meta_keywords: '',
        slug: '',
        canonical_url: '',
        focus_keyword: '',
        reading_time_minutes: 0,
        article_type: 'blog_post',
        author_name: 'Queue株式会社',
        author_url: 'https://queue-tech.jp',
        og_title: '',
        og_description: '',
        og_image: '',
        og_type: 'article',
        twitter_title: '',
        twitter_description: '',
        twitter_image: '',
        twitter_card_type: 'summary_large_image',
        meta_robots: 'index, follow'
      });
      setImagePreview('');
    }
  }, [article]);

  // ハブ候補の一覧を取得（ページ種別 = hub の記事）
  useEffect(() => {
    const loadHubs = async () => {
      try {
        const { data, error } = await supabase
          .from('news_articles')
          .select('id, title, slug, page_type')
          .eq('page_type', 'hub')
          .order('title', { ascending: true });

        if (error) {
          console.error('Error fetching hub pages:', error);
          return;
        }

        setHubOptions(data || []);
      } catch (err) {
        console.error('Error loading hub pages:', err);
      }
    };

    loadHubs();
  }, []);

  // 指定ハブの配下ページ一覧取得（ハブ編集時に利用）
  const fetchSubPages = async (hubId: string) => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, slug, status, cluster_sort_order, published_at')
        .eq('parent_hub_id', hubId)
        .order('cluster_sort_order', { ascending: true })
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching sub pages for hub:', error);
        return;
      }

      setHubSubPages(data || []);
    } catch (err) {
      console.error('Error loading sub pages:', err);
    }
  };

  // ハンドラー関数を先に定義
  const insertConsultationLink = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      const link = '<a href="/consultation" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; font-weight: 600; margin: 16px 0; transition: all 0.3s ease;">無料相談を申し込む</a>';
      quill.clipboard.dangerouslyPasteHTML(range.index, link);
      quill.setSelection(range.index + link.length);
    }
  };

  // テーブル挿入機能（一時的に無効化）
  // const insertTable = (rows: number = 3, cols: number = 3) => {
  //   const quill = quillRef.current?.getEditor();
  //   if (quill) {
  //     const range = quill.getSelection(true);
  //     
  //     // テーブルHTMLを生成
  //     let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">';
  //     
  //     // ヘッダー行
  //     tableHTML += '<thead><tr>';
  //     for (let j = 0; j < cols; j++) {
  //       tableHTML += `<th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: bold; text-align: left;">ヘッダー ${j + 1}</th>`;
  //     }
  //     tableHTML += '</tr></thead>';
  //     
  //     // データ行
  //     tableHTML += '<tbody>';
  //     for (let i = 1; i < rows; i++) {
  //       tableHTML += '<tr>';
  //       for (let j = 0; j < cols; j++) {
  //         tableHTML += `<td style="border: 1px solid #e2e8f0; padding: 12px;">データ ${i}-${j + 1}</td>`;
  //       }
  //       tableHTML += '</tr>';
  //     }
  //     tableHTML += '</tbody></table><p><br></p>';
  //     
  //     quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
  //     quill.setSelection(range.index + tableHTML.length);
  //   }
  // };

  // 比較表テンプレート挿入（一時的に無効化）
  // const insertComparisonTable = () => {
  //   const quill = quillRef.current?.getEditor();
  //   if (quill) {
  //     const range = quill.getSelection(true);
  //     
  //     const comparisonTableHTML = `
  //       <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
  //         <thead>
  //           <tr>
  //             <th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: bold; text-align: left;">項目</th>
  //             <th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: bold; text-align: center;">プランA</th>
  //             <th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: bold; text-align: center;">プランB</th>
  //             <th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: bold; text-align: center;">プランC</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: 600;">価格</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">¥10,000</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">¥20,000</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">¥30,000</td>
  //           </tr>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: 600;">機能数</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">5個</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">10個</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">無制限</td>
  //           </tr>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: 600;">サポート</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">メール</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">メール + チャット</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">24時間対応</td>
  //           </tr>
  //           <tr style="background-color: #f0f9ff;">
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; font-weight: 600;">おすすめ度</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">★★★</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">★★★★★</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">★★★★</td>
  //           </tr>
  //         </tbody>
  //       </table>
  //       <p><br></p>
  //     `;
  //     
  //     quill.clipboard.dangerouslyPasteHTML(range.index, comparisonTableHTML);
  //     quill.setSelection(range.index + comparisonTableHTML.length);
  //   }
  // };

  // 仕様表テンプレート挿入（一時的に無効化）
  // const insertSpecTable = () => {
  //   const quill = quillRef.current?.getEditor();
  //   if (quill) {
  //     const range = quill.getSelection(true);
  //     
  //     const specTableHTML = `
  //       <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
  //         <thead>
  //           <tr>
  //             <th style="border: 1px solid #e2e8f0; padding: 12px; background-color: #1e3a8a; color: white; font-weight: bold; text-align: left;" colspan="2">製品仕様</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: 600; width: 30%;">プロセッサー</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px;">Intel Core i7-12700K</td>
  //           </tr>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: 600;">メモリ</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px;">32GB DDR4</td>
  //           </tr>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: 600;">ストレージ</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px;">1TB NVMe SSD</td>
  //           </tr>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: 600;">OS</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px;">Windows 11 Pro</td>
  //           </tr>
  //           <tr>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px; background-color: #f8fafc; font-weight: 600;">保証期間</td>
  //             <td style="border: 1px solid #e2e8f0; padding: 12px;">3年間</td>
  //           </tr>
  //         </tbody>
  //       </table>
  //       <p><br></p>
  //     `;
  //     
  //     quill.clipboard.dangerouslyPasteHTML(range.index, specTableHTML);
  //     quill.setSelection(range.index + specTableHTML.length);
  //   }
  // };

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
        // ['table', 'comparison-table', 'spec-table'], // テーブル関連ボタン（一時的に無効化）
        ['consultation-link'], // カスタムボタン
        ['undo', 'redo'], // 元に戻す・やり直し
        ['clean']
      ],
      handlers: {
        // 'table': () => insertTable(3, 3),  // 一時的に無効化
        // 'comparison-table': insertComparisonTable,  // 一時的に無効化
        // 'spec-table': insertSpecTable,  // 一時的に無効化
        'consultation-link': insertConsultationLink,
        'undo': handleContentUndo,
        'redo': handleContentRedo
      }
    },
    // 'better-table': {  // 一時的に無効化
      // operationMenu: {
        // items: {
          // unmergeCells: {
          //   text: 'セルの結合を解除'
          // },
          // mergeCells: {
          //   text: 'セルを結合'
          // },
          // insertColumnRight: {
          //   text: '右に列を追加'
          // },
          // insertColumnLeft: {
          //   text: '左に列を追加'
          // },
          // insertRowUp: {
          //   text: '上に行を追加'
          // },
          // insertRowDown: {
          //   text: '下に行を追加'
          // },
          // deleteColumn: {
          //   text: '列を削除'
          // },
          // deleteRow: {
          //   text: '行を削除'
          // },
          // deleteTable: {
          //   text: 'テーブルを削除'
          // }
        // }
      // }
    // },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }), []);

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
    // 'better-table': {  // 一時的に無効化
      // operationMenu: {
        // items: {
          // unmergeCells: {
          //   text: 'セルの結合を解除'
          // },
          // mergeCells: {
          //   text: 'セルを結合'
          // },
          // insertColumnRight: {
          //   text: '右に列を追加'
          // },
          // insertColumnLeft: {
          //   text: '左に列を追加'
          // },
          // insertRowUp: {
          //   text: '上に行を追加'
          // },
          // insertRowDown: {
          //   text: '下に行を追加'
          // },
          // deleteColumn: {
          //   text: '列を削除'
          // },
          // deleteRow: {
          //   text: '行を削除'
          // },
          // deleteTable: {
          //   text: 'テーブルを削除'
          // }
        // }
      // }
    // },
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
    'link', 'image', 'video', 'table',
    'color', 'background',
    'align', 'script'
  ];



  // Quillエディタの初期化後にカスタムボタンを追加
  useEffect(() => {
    // カスタムツールバーボタンのスタイルを追加
    const style = document.createElement('style');
    style.id = 'custom-quill-styles';
    style.textContent = `
      .ql-table::before {
        content: "";
        font-size: 14px;
      }
      .ql-comparison-table::before {
        content: "";
        font-size: 14px;
      }
      .ql-spec-table::before {
        content: "";
        font-size: 14px;
      }
      .ql-consultation-link::before {
        content: "";
        font-size: 14px;
      }
      .ql-undo::before {
        content: "↶";
        font-size: 14px;
      }
      .ql-redo::before {
        content: "↷";
        font-size: 14px;
      }
      
      /* ツールバーボタンのホバー効果 */
      .ql-toolbar .ql-table,
      .ql-toolbar .ql-comparison-table,
      .ql-toolbar .ql-spec-table,
      .ql-toolbar .ql-consultation-link,
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
      
      .ql-toolbar .ql-table:hover,
      .ql-toolbar .ql-comparison-table:hover,
      .ql-toolbar .ql-spec-table:hover,
      .ql-toolbar .ql-consultation-link:hover,
      .ql-toolbar .ql-undo:hover,
      .ql-toolbar .ql-redo:hover {
        background-color: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
      }
      
      /* アクティブ状態 */
      .ql-toolbar .ql-table.ql-active,
      .ql-toolbar .ql-comparison-table.ql-active,
      .ql-toolbar .ql-spec-table.ql-active,
      .ql-toolbar .ql-consultation-link.ql-active {
        background-color: #3b82f6 !important;
        color: white !important;
        border-color: #2563eb !important;
      }
    `;
    
    if (!document.getElementById('custom-quill-styles')) {
      document.head.appendChild(style);
    }

    const addCustomButton = () => {
      const toolbarContainer = document.querySelector('.ql-toolbar');
      if (toolbarContainer && !document.querySelector('.ql-consultation-link')) {
        const customButton = document.createElement('button');
        customButton.className = 'ql-consultation-link';
        customButton.innerHTML = '';
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

    // Quillエディタが完全に初期化された後にボタンを追加
    const timer = setTimeout(addCustomButton, 100);
    return () => clearTimeout(timer);
  }, []);

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
      
      // 記事データ（SEO情報含む）をデータベースに送信
      const articleData = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        source_name: formData.source_name || 'Queue株式会社',
        source_url: formData.source_url || null,
        image_url: finalImageUrl || null,
        tags: formData.tags || [],
        table_of_contents: formData.table_of_contents || null,
        auto_generate_toc: formData.auto_generate_toc || false,
        toc_style: formData.toc_style || 'numbered',
        status: formData.status,
        // ハブ構造メタデータ
        page_type: formData.page_type || 'normal',
        parent_hub_id:
          formData.page_type === 'sub' && formData.parent_hub_id
            ? formData.parent_hub_id
            : null,
        cluster_sort_order:
          formData.page_type === 'sub' && formData.cluster_sort_order !== ''
            ? Number(formData.cluster_sort_order)
            : null,
        published_at: formData.status === 'published' ? now : null,
        updated_at: now,
        // SEO関連フィールド
        seo_title: formData.seo_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords || null,
        slug: formData.slug || null,
        canonical_url: formData.canonical_url || null,
        focus_keyword: formData.focus_keyword || null,
        reading_time_minutes: formData.reading_time_minutes || null,
        article_type: formData.article_type || 'blog_post',
        author_name: formData.author_name || 'Queue株式会社',
        author_url: formData.author_url || 'https://queue-tech.jp',
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        og_image: formData.og_image || finalImageUrl || null,
        og_type: formData.og_type || 'article',
        twitter_title: formData.twitter_title || null,
        twitter_description: formData.twitter_description || null,
        twitter_image: formData.twitter_image || finalImageUrl || null,
        twitter_card_type: formData.twitter_card_type || 'summary_large_image',
        meta_robots: formData.meta_robots || 'index, follow',
        last_seo_update: now
      };

      if (article) {
        // 既存記事の更新
        const { error } = await supabase
          .from('news_articles')
          .update(articleData)
          .eq('id', article.id);

        if (error) {
          console.error('記事更新エラー:', error);
          throw error;
        }
        toast.success('記事を更新しました');
        
        // 記事が公開状態の場合、サイトマップを自動更新
        if (formData.status === 'published') {
          await onArticlePublished(article.id, formData.title);
        } else if (article.status === 'published' && formData.status !== 'published') {
          // 公開状態から非公開に変更された場合
          await onArticleUnpublished(article.id, formData.title);
        }
      } else {
        // 新規記事の作成
        const { data: insertedData, error } = await supabase
          .from('news_articles')
          .insert(articleData)
          .select('id')
          .single();

        if (error) {
          console.error('記事作成エラー:', error);
          throw error;
        }
        toast.success('記事を作成しました');
        
        // 新規記事が公開状態の場合、サイトマップを自動更新
        if (formData.status === 'published' && insertedData) {
          await onArticlePublished(insertedData.id, formData.title);
        }
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving article:', error);
      
      // エラーメッセージを詳細化
      let errorMessage = '記事の保存に失敗しました';
      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'スラッグが重複しています。タイトルを変更してください。';
        } else if (error.message.includes('violates not-null')) {
          errorMessage = '必須項目が入力されていません。';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = '入力値に問題があります。';
        } else {
          errorMessage = `保存エラー: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
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

      {/* ハブ構造設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="page_type">ページ種別</Label>
          <Select
            value={formData.page_type}
            onValueChange={(value: 'normal' | 'hub' | 'sub') =>
              setFormData(prev => ({ ...prev, page_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ページ種別を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">通常の記事</SelectItem>
              <SelectItem value="hub">ハブページ</SelectItem>
              <SelectItem value="sub">ハブ配下のページ</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            「ハブページ」は特定テーマのまとめページ、「ハブ配下のページ」はそのテーマ内のユースケースや業界別紹介などを想定しています。
          </p>
        </div>

        {/* ハブ配下ページの場合のみ: 親ハブ＋並び順 */}
        {formData.page_type === 'sub' && (
          <div className="space-y-2">
            <Label htmlFor="parent_hub_id">親ハブページ</Label>
            <Select
              value={formData.parent_hub_id || ''}
              onValueChange={(value: string) =>
                setFormData(prev => ({ ...prev, parent_hub_id: value || null }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="親ハブページを選択" />
              </SelectTrigger>
              <SelectContent>
                {hubOptions.length === 0 ? (
                  <SelectItem value="" disabled>
                    ハブページがまだ作成されていません
                  </SelectItem>
                ) : (
                  hubOptions.map(hub => (
                    <SelectItem key={hub.id} value={hub.id}>
                      {hub.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="space-y-1 mt-3">
              <Label htmlFor="cluster_sort_order">ハブ内の表示順序（任意）</Label>
              <Input
                id="cluster_sort_order"
                type="number"
                min={1}
                placeholder="例: 1（小さい番号ほど上に表示されます）"
                value={formData.cluster_sort_order === '' ? '' : formData.cluster_sort_order}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    cluster_sort_order: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-gray-500">
                未設定の場合は公開日の新しい順に並びます。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ハブページ編集時: 配下ページの簡易リスト（読み取り専用） */}
      {formData.page_type === 'hub' && article && (
        <div className="mt-2 border border-dashed border-navy-100 rounded-lg p-3 bg-navy-50/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-navy-800">
              このハブに紐付いているページ一覧（読み取り専用）
            </p>
          </div>
          {hubSubPages.length === 0 ? (
            <p className="text-xs text-gray-600">
              まだこのハブ配下のページは設定されていません。「ページ種別」で「ハブ配下のページ」を選択し、このハブを親として紐付けてください。
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-gray-700">
              {hubSubPages.map(sub => (
                <li key={sub.id} className="flex items-center justify-between">
                  <span className="truncate">
                    {sub.cluster_sort_order != null && (
                      <span className="font-mono mr-1">#{sub.cluster_sort_order}</span>
                    )}
                    {sub.title}
                  </span>
                  <span className="ml-2 text-[11px] text-gray-500 whitespace-nowrap">
                    {sub.status === 'published' ? '公開' : '下書き'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* SEO自動生成ボタン */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">SEO最適化</h3>
              <p className="text-sm text-blue-700">タイトルと内容からSEOデータを自動生成</p>
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={generateSEOData}
            disabled={!formData.title.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            SEO生成
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="seo">SEO設定</TabsTrigger>
          <TabsTrigger value="social">SNS設定</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6 mt-6">
          <div className="space-y-2">
        <Label htmlFor="summary">概要 *</Label>
        <div className="border rounded-md">
          <div className="bg-blue-50 border-b px-4 py-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>フォント・サイズ・色・斜体の変更が可能 | 元に戻す機能付き</span>
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
        <Label htmlFor="content">本文 *</Label>
        <div className="border rounded-md">
          <div className="bg-amber-50 border-b px-4 py-2 text-sm text-amber-800">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <MessageCircle className="h-4 w-4" />
              <span className="flex-1">ボタンで無料相談リンクを挿入</span>
            </div>
            <div className="mt-1 text-xs text-amber-700 flex flex-wrap gap-x-4 gap-y-1">
              <span>基本テーブル</span>
              <span>比較表テンプレート</span> 
              <span>仕様表テンプレート</span>
              <span>↶↷元に戻す/やり直し</span>
            </div>
          </div>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            modules={contentModules}
            formats={formats}
            placeholder="記事の本文を入力してください。ツールバーから文字装飾や無料相談リンクの挿入ができます。"
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
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEOタイトル</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO用のタイトル（60文字以内）"
                  maxLength={60}
                />
                <div className="text-xs text-gray-500">
                  {formData.seo_title.length}/60文字
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta_description">メタディスクリプション</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="検索結果に表示される説明（160文字以内）"
                  maxLength={160}
                  rows={3}
                />
                <div className="text-xs text-gray-500">
                  {formData.meta_description.length}/160文字
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">スラッグ（URL）</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
                <div className="text-xs text-gray-500">
                  URL: /news/{formData.slug}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="focus_keyword">フォーカスキーワード</Label>
                <Input
                  id="focus_keyword"
                  value={formData.focus_keyword}
                  onChange={(e) => setFormData(prev => ({ ...prev, focus_keyword: e.target.value }))}
                  placeholder="メインキーワード"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_keywords">メタキーワード</Label>
                <Textarea
                  id="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="キーワード1, キーワード2, キーワード3"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="canonical_url">カノニカルURL</Label>
                <Input
                  id="canonical_url"
                  value={formData.canonical_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, canonical_url: e.target.value }))}
                  placeholder="/news/article-slug"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="article_type">記事タイプ</Label>
                <Select value={formData.article_type} onValueChange={(value) => setFormData(prev => ({ ...prev, article_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_post">ブログ記事</SelectItem>
                    <SelectItem value="news">ニュース</SelectItem>
                    <SelectItem value="tutorial">チュートリアル</SelectItem>
                    <SelectItem value="case_study">事例紹介</SelectItem>
                    <SelectItem value="technical">技術記事</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reading_time">読了時間（分）</Label>
                <Input
                  id="reading_time"
                  type="number"
                  value={formData.reading_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, reading_time_minutes: parseInt(e.target.value) || 0 }))}
                  placeholder="5"
                  min="1"
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="social" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Open Graph設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Open Graph（Facebook・LinkedIn）</h3>
              
              <div className="space-y-2">
                <Label htmlFor="og_title">OGタイトル</Label>
                <Input
                  id="og_title"
                  value={formData.og_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, og_title: e.target.value }))}
                  placeholder="Facebook/LinkedIn用タイトル（95文字以内）"
                  maxLength={95}
                />
                <div className="text-xs text-gray-500">
                  {formData.og_title.length}/95文字
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og_description">OGディスクリプション</Label>
                <Textarea
                  id="og_description"
                  value={formData.og_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, og_description: e.target.value }))}
                  placeholder="Facebook/LinkedIn用説明文（300文字以内）"
                  maxLength={300}
                  rows={3}
                />
                <div className="text-xs text-gray-500">
                  {formData.og_description.length}/300文字
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og_image">OG画像URL</Label>
                <Input
                  id="og_image"
                  value={formData.og_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, og_image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            {/* Twitter Cards設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Twitter Cards</h3>
              
              <div className="space-y-2">
                <Label htmlFor="twitter_title">Twitterタイトル</Label>
                <Input
                  id="twitter_title"
                  value={formData.twitter_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter_title: e.target.value }))}
                  placeholder="Twitter用タイトル（70文字以内）"
                  maxLength={70}
                />
                <div className="text-xs text-gray-500">
                  {formData.twitter_title.length}/70文字
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter_description">Twitterディスクリプション</Label>
                <Textarea
                  id="twitter_description"
                  value={formData.twitter_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter_description: e.target.value }))}
                  placeholder="Twitter用説明文（200文字以内）"
                  maxLength={200}
                  rows={3}
                />
                <div className="text-xs text-gray-500">
                  {formData.twitter_description.length}/200文字
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter_image">Twitter画像URL</Label>
                <Input
                  id="twitter_image"
                  value={formData.twitter_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter_image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter_card_type">Twitterカードタイプ</Label>
                <Select value={formData.twitter_card_type} onValueChange={(value) => setFormData(prev => ({ ...prev, twitter_card_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">概要</SelectItem>
                    <SelectItem value="summary_large_image">大きな画像付き概要</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={loading || uploadingImage}>
          {loading || uploadingImage ? '保存中...' : article ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
};

export default NewsEditorForm; 