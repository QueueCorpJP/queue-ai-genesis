import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArticleCTA } from '@/components/ArticleCTA';
import readingTimeTracker from '@/utils/readingTimeTracker';

// ブログ記事のタイプ定義
type BlogArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source_name: string | null;
  source_url: string | null;
  image_url: string | null;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/news');
      return;
    }
    fetchArticle();

    // コンポーネントアンマウント時に閲覧終了
    return () => {
      readingTimeTracker.endTracking();
    };
  }, [id, navigate]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        setNotFound(true);
        return;
      }

      if (!data) {
        setNotFound(true);
        return;
      }

      setArticle(data);
      
      // 閲覧時間トラッキング開始
      await readingTimeTracker.startTracking(data.id);
      
      // ページ離脱時の処理設定
      readingTimeTracker.setupBeforeUnloadTracking();
    } catch (error) {
      console.error('Error:', error);
      toast.error('記事の取得に失敗しました');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // HTMLタグを除去してテキストのみを取得
  const stripHtmlTags = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // 読む時間を計算（日本語: 400文字/分）
  const calculateReadTime = (content: string) => {
    const textOnly = stripHtmlTags(content);
    const wordsPerMinute = 400; // 日本語の平均読書速度
    return Math.max(1, Math.ceil(textOnly.length / wordsPerMinute));
  };

  // HTMLコンテンツの改行処理を改善
  const processContent = (content: string) => {
    if (!content) return '';
    
    // 空の段落やdivタグを適切な改行に変換
    let processedContent = content
      // 空のpタグを改行に変換
      .replace(/<p[^>]*><\/p>/g, '<br><br>')
      // 空のdivタグを改行に変換
      .replace(/<div[^>]*><\/div>/g, '<br>')
      // 連続するbrタグを段落に変換
      .replace(/(<br\s*\/?>){3,}/g, '</p><p>')
      // 単独のbrタグ2つを段落分けに変換
      .replace(/(<br\s*\/?>){2}/g, '</p><p>')
      // 改行文字をbrタグに変換
      .replace(/\n/g, '<br>');
    
    // pタグで囲まれていない場合は囲む
    if (!processedContent.startsWith('<p') && !processedContent.startsWith('<div') && !processedContent.startsWith('<h')) {
      processedContent = `<p>${processedContent}</p>`;
    }
    
    return processedContent;
  };

  // SEO用のデータを生成
  const generateSEOData = (article: BlogArticle) => {
    const currentUrl = window.location.href;
    const baseUrl = window.location.origin;
    const imageUrl = article.image_url || `${baseUrl}/Queue.png`;
    
    // Description（155文字以内に調整）
    let description = stripHtmlTags(article.summary);
    if (description.length > 155) {
      description = description.substring(0, 152) + '...';
    }

    // パンくずリスト
    const breadcrumbs = [
      { name: 'ホーム', url: baseUrl },
      { name: 'ブログ', url: `${baseUrl}/news` },
      { name: article.title, url: currentUrl }
    ];

    // キーワードの生成（タグ + 基本キーワード）
    const keywords = [
      ...article.tags,
      'Queue株式会社',
      'AI',
      '人工知能',
      'テクノロジー',
      'ブログ'
    ].join(', ');

    return {
      title: article.title,
      description,
      keywords,
      image: imageUrl,
      url: currentUrl,
      type: 'article' as const,
      publishedTime: new Date(article.published_at || article.created_at).toISOString(),
      modifiedTime: new Date(article.updated_at).toISOString(),
      tags: article.tags,
      articleSection: 'テクノロジー',
      content: article.content,
      breadcrumbs,
      canonicalUrl: currentUrl.split('?')[0]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Container>
            <div className="max-w-4xl mx-auto py-24 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">記事を読み込み中...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Container>
            <div className="max-w-4xl mx-auto py-24 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
              <p className="text-gray-600 mb-8">
                指定された記事は見つかりませんでした。削除されたか、URLが間違っている可能性があります。
              </p>
              <Button asChild>
                <Link to="/news">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ブログ一覧に戻る
                </Link>
              </Button>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  const seoData = generateSEOData(article);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* SEO設定 */}
      <SEOHead {...seoData} />
      
      <Navbar />
      
      <main className="flex-1 relative">
        {/* Breadcrumb */}
        <section className="bg-white border-b relative z-10">
          <Container>
            <div className="max-w-4xl mx-auto py-4">
              <nav className="flex items-center space-x-2 text-sm text-gray-500" aria-label="パンくずナビゲーション">
                <Link to="/" className="hover:text-navy-600">ホーム</Link>
                <span>/</span>
                <Link to="/news" className="hover:text-navy-600">ブログ</Link>
                <span>/</span>
                <span className="text-gray-900 truncate">{article.title}</span>
              </nav>
            </div>
          </Container>
        </section>

        <section className="py-8 md:py-16 relative z-10">
          <Container>
            <div className="container max-w-4xl mx-auto px-4 py-6">
              <Button
                asChild
                variant="outline"
                className="mb-6 bg-white border-gray-200 hover:bg-gray-50"
              >
                <Link to="/news" className="inline-flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  ブログ一覧に戻る
                </Link>
              </Button>

              {/* Article Content */}
              <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Article Header */}
                <header className="p-6 md:p-8 border-b border-gray-200">
                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <time dateTime={article.published_at || article.created_at}>
                        {formatDate(article.published_at || article.created_at)}
                      </time>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{Math.ceil(article.content.length / 400)}分で読める</span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-navy-50 text-navy-700 border-navy-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                    {article.title}
                  </h1>

                  {/* Featured Image */}
                  {article.image_url && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-auto object-cover max-h-96"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Article Summary */}
                  {article.summary && (
                    <div className="prose max-w-none mb-6 pb-6 border-b border-gray-200">
                      <div 
                        className="summary-content text-lg leading-relaxed text-gray-700"
                        dangerouslySetInnerHTML={{ __html: article.summary }}
                      />
                    </div>
                  )}
                </header>

                {/* Article Body */}
                <div className="p-6 md:p-8">
                  <div 
                    className="blog-content prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                  
                  {/* Main CTA after article content */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <ArticleCTA articleId={article.id} />
                  </div>
                </div>

                {/* Article Footer */}
                <footer className="p-6 md:p-8 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-white border-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Share Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('リンクをクリップボードにコピーしました');
                        }}
                      >
                        リンクをコピー
                      </Button>
                    </div>
                  </div>
                  
                  {/* Compact CTA in footer area */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <ArticleCTA articleId={article.id} variant="compact" />
                  </div>
                </footer>
              </article>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPost; 