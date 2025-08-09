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
import TableOfContents from '@/components/TableOfContents';
import readingTimeTracker from '@/utils/readingTimeTracker';
import { generateArticleSEOData, generateBreadcrumbs } from '@/utils/seoUtils';

// 目次項目の型定義
type TableOfContentsItem = {
  level: number;
  title: string;
  anchor: string;
  order: number;
};

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
  table_of_contents: TableOfContentsItem[] | null;
  auto_generate_toc: boolean;
  toc_style: 'numbered' | 'bulleted' | 'plain' | 'hierarchical';
  // SEO関連フィールド
  seo_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  slug?: string | null;
  canonical_url?: string | null;
  focus_keyword?: string | null;
  reading_time_minutes?: number | null;
  article_type?: string | null;
  author_name?: string | null;
  author_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  og_type?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image?: string | null;
  twitter_card_type?: string | null;
  meta_robots?: string | null;
  structured_data?: any;
  last_seo_update?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const BlogPost: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id && !slug) {
      navigate('/news');
      return;
    }
    fetchArticle();

    // コンポーネントアンマウント時に閲覧終了
    return () => {
      readingTimeTracker.endTracking();
    };
  }, [id, slug, navigate]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('status', 'published');
      
      // スラッグまたはIDで検索
      if (slug) {
        query = query.eq('slug', slug);
      } else if (id) {
        query = query.eq('id', id);
      }
      
      const { data, error } = await query.single();

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

  const calculateReadTime = (content: string) => {
    const textOnly = stripHtmlTags(content);
    const wordsPerMinute = 400; // 日本語の平均読書速度
    return Math.max(1, Math.ceil(textOnly.length / wordsPerMinute));
  };

  // 記事コンテンツにアンカーIDを挿入する関数（改良版）
  const insertAnchorsIntoContent = (content: string, tocItems: TableOfContentsItem[] | null) => {
    if (!tocItems || tocItems.length === 0) {
      return content;
    }

    let processedContent = content;
    
    // DOMパーサーを使用してより確実に処理
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedContent;
    
    // 見出しタグを順番に処理してアンカーIDを追加
    tocItems.forEach((item) => {
      // すべての該当レベルの見出しを取得
      const headings = tempDiv.querySelectorAll(`h${item.level}`);
      
      headings.forEach((heading) => {
        const headingText = heading.textContent?.trim() || '';
        const itemTitle = item.title.trim();
        
        // テキストが一致し、まだIDが設定されていない場合
        if (headingText === itemTitle && !heading.getAttribute('id')) {
          heading.setAttribute('id', item.anchor);
          
          // スクロール位置調整のためのスタイルを追加
          (heading as HTMLElement).style.scrollMarginTop = '120px';
          
          console.log(`Added anchor: ${item.anchor} to heading: ${itemTitle}`);
        }
      });
    });

    return tempDiv.innerHTML;
  };

  // SEOデータ生成（新しいSEOユーティリティを使用）
  const generateSEOData = (article: BlogArticle) => {
    const seoData = generateArticleSEOData(article);
    const breadcrumbs = generateBreadcrumbs(article);
    
    return {
      title: seoData.title,
      description: seoData.description,
      keywords: seoData.keywords,
      canonicalUrl: seoData.canonicalUrl,
      ogTitle: seoData.ogTitle,
      ogDescription: seoData.ogDescription,
      ogImage: seoData.ogImage,
      ogType: seoData.ogType,
      twitterTitle: seoData.twitterTitle,
      twitterDescription: seoData.twitterDescription,
      twitterImage: seoData.twitterImage,
      twitterCard: seoData.twitterCard,
      author: seoData.author,
      authorUrl: article.author_url,
      robots: seoData.robots,
      publishedTime: seoData.publishedTime,
      modifiedTime: seoData.modifiedTime,
      articleType: seoData.articleType,
      focusKeyword: article.focus_keyword,
      readingTime: article.reading_time_minutes || calculateReadTime(article.content),
      structuredData: {
        article: seoData.structuredData,
        breadcrumbs: breadcrumbs
      },
      breadcrumbs: [
        { name: 'ホーム', url: `${window.location.origin}` },
        { name: 'ブログ', url: `${window.location.origin}/news` },
        { name: article.title, url: `${window.location.origin}/news/${article.slug || article.id}` }
      ]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16 sm:pt-20 md:pt-24">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">記事を読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16 sm:pt-20 md:pt-24">
          <div className="text-center p-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              お探しの記事は削除されたか、URLが間違っている可能性があります。
            </p>
            <Button asChild>
              <Link to="/news">ブログ一覧に戻る</Link>
            </Button>
          </div>
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
      
      <main className="flex-1 relative pt-16 sm:pt-20 md:pt-24">
        {/* Breadcrumb */}
        <section className="bg-white border-b relative">
          <Container>
            <div className="max-w-4xl mx-auto py-3 sm:py-4 px-4">
              <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 overflow-x-auto" aria-label="パンくずナビゲーション">
                <Link to="/" className="hover:text-navy-600 whitespace-nowrap">ホーム</Link>
                <span className="text-gray-400">/</span>
                <Link to="/news" className="hover:text-navy-600 whitespace-nowrap">ブログ</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 truncate min-w-0">{article.title}</span>
              </nav>
            </div>
          </Container>
        </section>

        <section className="py-4 sm:py-6 md:py-8 lg:py-12 relative">
          <Container>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Back Button */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mb-4 sm:mb-6 bg-white border-gray-200 hover:bg-gray-50"
              >
                <Link to="/news" className="inline-flex items-center text-xs sm:text-sm">
                  <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">ブログ一覧に戻る</span>
                  <span className="sm:hidden">戻る</span>
                </Link>
              </Button>

              {/* Article Content */}
              <article className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                {/* Article Header */}
                <header className="p-4 sm:p-6 md:p-8 border-b border-gray-200">
                  {/* Meta Information */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <time dateTime={article.published_at || article.created_at} className="whitespace-nowrap">
                        {formatDate(article.published_at || article.created_at)}
                      </time>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">{Math.ceil(article.content.length / 400)}分で読める</span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="bg-navy-50 text-navy-700 border-navy-200 text-xs px-2 py-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-1">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                    {article.title}
                  </h1>

                  {/* Featured Image */}
                  {article.image_url && (
                    <div className="mb-4 sm:mb-6 rounded-lg overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-auto object-cover max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-96"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Article Summary */}
                  {article.summary && (
                    <div className="prose prose-sm sm:prose-base max-w-none mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                      <div 
                        className="summary-content text-base sm:text-lg leading-relaxed text-gray-700"
                        dangerouslySetInnerHTML={{ __html: article.summary }}
                      />
                    </div>
                  )}
                </header>

                {/* Article Body */}
                <div className="p-4 sm:p-6 md:p-8">
                  {/* Table of Contents - Full Width Header Style */}
                  {article.table_of_contents && article.table_of_contents.length > 0 && (
                    <div className="mb-8">
                      <TableOfContents 
                        items={article.table_of_contents}
                        style={article.toc_style}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Article Content - Full Width */}
                  <div 
                    className="blog-content prose prose-sm sm:prose-base lg:prose-lg max-w-none [&>*]:max-w-full
                             [&_h1]:text-lg [&_h1]:sm:text-xl [&_h1]:md:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
                             [&_h2]:text-base [&_h2]:sm:text-lg [&_h2]:md:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3
                             [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:md:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                             [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4
                             [&_a]:text-navy-600 [&_a]:no-underline hover:[&_a]:underline
                             [&_strong]:text-gray-900 [&_strong]:font-semibold
                             [&_ul]:space-y-2 [&_ol]:space-y-2 [&_li]:text-gray-700 [&_li]:leading-relaxed
                             [&_blockquote]:border-l-4 [&_blockquote]:border-navy-200 [&_blockquote]:bg-navy-50 [&_blockquote]:p-4 [&_blockquote]:rounded-r [&_blockquote]:my-4
                             [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
                             [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
                             [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4
                             [&_table]:text-sm [&_table]:border-collapse [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block [&_table]:sm:table
                             [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold
                             [&_td]:border [&_td]:border-gray-300 [&_td]:p-2"
                    dangerouslySetInnerHTML={{ 
                      __html: insertAnchorsIntoContent(article.content, article.table_of_contents) 
                    }}
                  />
                  
                  {/* Main CTA after article content */}
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                    <ArticleCTA articleId={article.id} />
                  </div>
                </div>

                {/* Article Footer */}
                <footer className="p-4 sm:p-6 md:p-8 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {article.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="bg-white border-gray-300 text-xs sm:text-sm px-2 py-1"
                          >
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
                        className="text-xs sm:text-sm px-3 py-2"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('リンクをクリップボードにコピーしました');
                        }}
                      >
                        <span className="hidden sm:inline">リンクをコピー</span>
                        <span className="sm:hidden">コピー</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Compact CTA in footer area */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
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