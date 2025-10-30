
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Calendar, Clock, ArrowRight, Image as ImageIcon, List } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  slug?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const ARTICLES_PER_PAGE = 10;

const Blog: React.FC = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    // Ensure page starts at the top
    window.scrollTo(0, 0);
    fetchArticles(1);
  }, []);

  // ページ変更時の処理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchArticles(page);
    // ページ変更時にトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 記事URLを生成するヘルパー関数
  const getArticleUrl = (article: BlogArticle) => {
    return article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
  };

  // SEO用のデータを生成
  const generateBlogListSEOData = () => {
    const currentUrl = window.location.href;
    const baseUrl = window.location.origin;
    const imageUrl = `${baseUrl}/Queue.png`;
    const description = "Queue株式会社の技術ブログ。AI・機械学習の最新動向、開発事例、技術的な知見など、私たちの経験と学びを共有しています。";
    const title = "ブログ | Queue株式会社";

    // パンくずリスト
    const breadcrumbs = [
      { name: 'ホーム', url: baseUrl },
      { name: 'ブログ', url: currentUrl }
    ];

    // キーワード
    const keywords = 'Queue株式会社, AI, 人工知能, 機械学習, ブログ, 技術記事, 開発事例, テクノロジー, GenAI, LLM, プロンプトエンジニアリング';

    // ブログ一覧ページ用の構造化データ
    const blogStructuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Queue株式会社ブログ",
      "description": description,
      "url": currentUrl,
      "author": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": imageUrl,
          "width": 200,
          "height": 200
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": imageUrl,
          "width": 200,
          "height": 200
        }
      },
      "inLanguage": "ja-JP",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/news?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    return {
      title,
      description,
      keywords,
      image: imageUrl,
      url: currentUrl,
      type: 'website' as const,
      breadcrumbs,
      canonicalUrl: currentUrl.split('?')[0],
      structuredData: blogStructuredData
    };
  };

  const fetchArticles = async (page: number) => {
    try {
      setLoading(true);
      const start = (page - 1) * ARTICLES_PER_PAGE;
      const end = start + ARTICLES_PER_PAGE;

      const { data, error, count } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
        .range(start, end - 1);

      if (error) {
        console.error('Error fetching articles:', error);
        return;
      }

      setArticles(data || []);
      setTotalArticles(count || 0);
             setTotalPages(Math.ceil((count || 0) / ARTICLES_PER_PAGE));
    } catch (error) {
      console.error('Error:', error);
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

  // サマリーを安全に処理
  const getSafeSummary = (summary: string, maxLength: number = 120): string => {
    const cleanSummary = stripHtmlTags(summary);
    return cleanSummary.length > maxLength 
      ? cleanSummary.substring(0, maxLength) + '...'
      : cleanSummary;
  };

  const seoData = generateBlogListSEOData();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* SEO設定 */}
      <SEOHead {...seoData} />
      
      <Navbar />
      
      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="bg-white border-b">
          <Container>
            <div className="py-12 md:py-16">
              <div className="max-w-4xl mx-auto text-center">
                <header>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                    Queue 技術ブログ
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    AI・機械学習の最新動向、開発事例、技術的な知見など、<br className="hidden md:block" />
                私たちの経験と学びを共有しています。
              </p>
                </header>
              </div>
            </div>
          </Container>
        </section>
        
        {/* Articles List */}
        <section className="py-8 md:py-16">
          <Container>
            <div className="max-w-7xl mx-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">記事を読み込み中...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">まだ記事が投稿されていません。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {articles.map((article) => (
                    <Card key={article.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                      <CardContent className="p-0">
                        <article className="relative">
                          {/* ブログタグ */}
                          <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-navy-600 text-white text-xs px-2 py-1 shadow-sm">
                              ブログ
                            </Badge>
                          </div>

                          {/* 画像 */}
                          <div className="relative h-40 sm:h-44 md:h-48 bg-navy-50">
                        {article.image_url ? (
                            <img
                              src={article.image_url}
                              alt={article.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                    <div class="flex items-center justify-center h-full bg-navy-50 text-navy-300">
                                      <div class="text-center">
                                        <div class="w-10 h-10 mx-auto mb-2 bg-navy-600 rounded-lg flex items-center justify-center">
                                          <span class="text-white font-bold text-sm">Q</span>
                                        </div>
                                        <p class="text-xs font-medium text-navy-600">Queue株式会社</p>
                                      </div>
                                  </div>
                                `;
                              }}
                            />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-navy-50 text-navy-300">
                                <div className="text-center">
                                  <div className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 bg-navy-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm sm:text-lg">Q</span>
                                  </div>
                                  <p className="text-xs font-medium text-navy-600">Queue株式会社</p>
                                </div>
                          </div>
                            )}
                          </div>
                        
                          {/* コンテンツ */}
                          <div className="p-3 sm:p-4">
                          {/* メタ情報 */}
                            <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs text-gray-500">
                            <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <time dateTime={article.published_at || article.created_at}>
                                  {formatDate(article.published_at || article.created_at)}
                                </time>
                            </div>
                            {/* 目次アイコン */}
                            {article.table_of_contents && article.table_of_contents.length > 0 && (
                              <div className="flex items-center" title="目次付き記事">
                                <List className="h-3 w-3 text-blue-600" />
                                <span className="ml-1 text-blue-600 text-xs">目次</span>
                              </div>
                            )}
                          </div>
                          
                          {/* タイトル */}
                            <h3 className="font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                            <Link 
                                to={getArticleUrl(article)}
                                className="hover:text-navy-600 transition-colors duration-200 text-sm sm:text-base"
                            >
                              {article.title}
                            </Link>
                            </h3>

                            {/* 概要 */}
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-3">
                              {getSafeSummary(article.summary, 80)}
                            </p>

                            {/* タグ（最大2個） */}
                          {article.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {article.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="bg-navy-50 text-navy-700 border-navy-200 text-xs px-2 py-0.5">
                                  {tag}
                                </Badge>
                              ))}
                                {article.tags.length > 2 && (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                                    +{article.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                            {/* 読了時間と読むボタン */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{calculateReadTime(article.content)}分</span>
                              </div>
                              <Button 
                                asChild 
                                size="sm" 
                                className="bg-navy-700 hover:bg-navy-600 text-xs h-6 sm:h-7 px-2 sm:px-3"
                              >
                                <Link to={getArticleUrl(article)}>
                                  読む
                                  <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        </article>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {!loading && articles.length > 0 && totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      {/* Previous Page */}
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        
                        // Show first page, last page, current page, and pages around current page
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        
                        // Show ellipsis for gaps
                        if (
                          page === currentPage - 2 && currentPage > 3 ||
                          page === currentPage + 2 && currentPage < totalPages - 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        
                        return null;
                      })}

                      {/* Next Page */}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Page Information */}
              {!loading && articles.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-600">
                  <p>
                    {totalArticles}件中 {((currentPage - 1) * ARTICLES_PER_PAGE) + 1}〜
                    {Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles)}件を表示
                    (ページ {currentPage}/{totalPages})
                  </p>
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog;
