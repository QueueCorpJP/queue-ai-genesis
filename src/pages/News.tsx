
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

const Blog: React.FC = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "ブログ | Queue株式会社";
    
    // SEO設定
    setupBlogListSEO();
    
    // Ensure page starts at the top
    window.scrollTo(0, 0);
    fetchArticles();
  }, []);

  // ブログ一覧ページのSEO設定
  const setupBlogListSEO = () => {
    const currentUrl = window.location.href;
    const baseUrl = window.location.origin;
    const imageUrl = `${baseUrl}/Queue.png`;
    const description = "Queue株式会社の技術ブログ。AI・機械学習の最新動向、開発事例、技術的な知見など、私たちの経験と学びを共有しています。";

    // 既存のmeta要素を削除
    const existingMetas = document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[type="application/ld+json"]');
    existingMetas.forEach(meta => meta.remove());

    // meta description
    const metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', description);
    document.head.appendChild(metaDescription);

    // keywords
    const metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    metaKeywords.setAttribute('content', 'Queue株式会社, AI, 人工知能, 機械学習, ブログ, 技術記事, 開発事例, テクノロジー');
    document.head.appendChild(metaKeywords);

    // canonical URL
    const canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', currentUrl.split('?')[0]);
    document.head.appendChild(canonicalLink);

    // Open Graph Protocol (OGP)
    const ogMetas = [
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'ブログ | Queue株式会社' },
      { property: 'og:description', content: description },
      { property: 'og:url', content: currentUrl },
      { property: 'og:image', content: imageUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: 'Queue株式会社' },
      { property: 'og:locale', content: 'ja_JP' }
    ];

    ogMetas.forEach(({ property, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    });

    // Twitter Card
    const twitterMetas = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'ブログ | Queue株式会社' },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
      { name: 'twitter:site', content: '@QueueCorp' },
      { name: 'twitter:creator', content: '@QueueCorp' }
    ];

    twitterMetas.forEach(({ name, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    });

    // 構造化データ (JSON-LD) - ブログ一覧ページ用
    const structuredData = {
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
          "url": imageUrl
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": imageUrl
        }
      },
      "inLanguage": "ja-JP",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/blog?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      setArticles(data || []);
    } catch (error) {
      // Silently handle error in production
    } finally {
      setLoading(false);
    }
  };

  // 記事閲覧数を記録する関数（同じIPから同じ記事への短時間の重複アクセスを制限）
  const trackArticleView = async (articleId: string) => {
    try {
      // IPアドレスとUser-Agentを取得
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const currentIp = ipData.ip || 'unknown';
      
      // ローカルストレージで同じ記事への最近のアクセスをチェック（1時間以内は重複記録しない）
      const viewKey = `article_view_${articleId}_${currentIp}`;
      const lastViewTime = localStorage.getItem(viewKey);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      if (lastViewTime && parseInt(lastViewTime) > oneHourAgo) {
        // 1時間以内に同じIPから同じ記事を閲覧している場合はスキップ
        return;
      }
      
      const { error } = await supabase
        .from('news_article_views')
        .insert({
          article_id: articleId,
          ip_address: currentIp,
          user_agent: navigator.userAgent
        });

      if (!error) {
        // 成功した場合は最後の閲覧時間を記録
        localStorage.setItem(viewKey, Date.now().toString());
      }
    } catch (error) {
      // Silently handle error in production
    }
  };

  // 記事がビューポートに入った時に閲覧数を記録
  const handleArticleInView = (articleId: string) => {
    trackArticleView(articleId);
  };

  // Intersection Observer を使用して記事の表示を検知
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const articleId = entry.target.getAttribute('data-article-id');
            if (articleId && !entry.target.hasAttribute('data-viewed')) {
              entry.target.setAttribute('data-viewed', 'true');
              handleArticleInView(articleId);
            }
          }
        });
      },
      {
        threshold: 0.5, // 記事の50%が表示されたら閲覧とみなす
        rootMargin: '0px 0px -100px 0px' // 少し余裕を持たせる
      }
    );

    // 記事要素を観察対象に追加
    const articleElements = document.querySelectorAll('[data-article-id]');
    articleElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [articles]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 400; // 日本語の平均読書スピード
    // HTMLタグを除去してテキストのみを取得
    const textOnly = content.replace(/<[^>]*>/g, '');
    const characters = textOnly.length;
    const minutes = Math.ceil(characters / wordsPerMinute);
    return Math.max(1, minutes);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-queue-gradient py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">ブログ</h1>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Queue株式会社の技術記事やインサイトをお届けします。
                AI・機械学習の最新動向、開発事例、技術的な知見など、
                私たちの経験と学びを共有しています。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16">
          <Container>
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">記事を読み込み中...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">現在、表示できる記事はありません。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <Card 
                      key={article.id} 
                      className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
                      data-article-id={article.id}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        {/* アイキャッチ画像 */}
                        {article.image_url ? (
                          <div className="relative h-48 overflow-hidden bg-gray-100">
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center">
                            <ImageIcon className="w-16 h-16 text-navy-400" />
                          </div>
                        )}
                        
                        <div className="p-6 flex flex-col flex-grow">
                          {/* メタ情報 */}
                          <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(article.published_at || article.created_at)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{estimateReadingTime(article.content)}分</span>
                            </div>
                          </div>
                          
                          {/* タイトル */}
                          <h2 className="text-xl font-bold mb-3 text-gray-900 leading-tight line-clamp-2">
                            <Link 
                              to={`/blog/${article.id}`}
                              className="hover:text-navy-600 transition-colors"
                            >
                              {article.title}
                            </Link>
                          </h2>
                          
                          {/* 要約 */}
                          <div className="text-gray-600 mb-4 line-clamp-3 flex-grow blog-content">
                            {article.summary.includes('<') ? (
                              <div dangerouslySetInnerHTML={{ __html: article.summary }} />
                            ) : (
                              <p>{article.summary}</p>
                            )}
                          </div>
                          
                          {/* タグ */}
                          {article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="bg-navy-50 text-navy-700 border-navy-200 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {article.tags.length > 3 && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                                  +{article.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* 続きを読むボタン */}
                          <div className="mt-auto">
                            <Button asChild variant="ghost" className="w-full justify-between p-0 h-auto text-navy-600 hover:text-navy-800">
                              <Link to={`/blog/${article.id}`} className="flex items-center justify-between w-full py-2">
                                <span>続きを読む</span>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
