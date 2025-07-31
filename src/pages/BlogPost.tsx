import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ExternalLink, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ArticleCTA from '@/components/ArticleCTA';

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
      navigate('/blog');
      return;
    }
    fetchArticle();
  }, [id, navigate]);

  // SEO設定関数
  const setupSEO = (article: BlogArticle) => {
    const currentUrl = window.location.href;
    const baseUrl = window.location.origin;
    const imageUrl = article.image_url || `${baseUrl}/Queue.png`;
    
    // ページタイトル
    document.title = `${article.title} | Queue株式会社ブログ`;

    // 既存のmeta要素を削除
    const existingMetas = document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]');
    existingMetas.forEach(meta => meta.remove());

    // meta description（155文字以内に調整）
    let description = article.summary;
    if (description.length > 155) {
      description = description.substring(0, 152) + '...';
    }
    
    const metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', description);
    document.head.appendChild(metaDescription);

    // keywords
    if (article.tags.length > 0) {
      const metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', [...article.tags, 'Queue株式会社', 'AI', '人工知能', 'ブログ'].join(', '));
      document.head.appendChild(metaKeywords);
    }

    // canonical URL
    const canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', currentUrl.split('?')[0]);
    document.head.appendChild(canonicalLink);

    // 記事の統計情報を計算
    const wordCount = article.content.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 300)); // 日本語の平均読書速度

    // Open Graph Protocol (OGP)
    const ogMetas = [
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: article.title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: currentUrl },
      { property: 'og:image', content: imageUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: article.title },
      { property: 'og:site_name', content: 'Queue株式会社' },
      { property: 'og:locale', content: 'ja_JP' },
      { property: 'article:author', content: 'Queue株式会社' },
      { property: 'article:published_time', content: new Date(article.published_at || article.created_at).toISOString() },
      { property: 'article:modified_time', content: new Date(article.updated_at).toISOString() },
      { property: 'article:section', content: 'テクノロジー' }
    ];

    // 記事のタグをarticle:tagとして追加
    article.tags.forEach(tag => {
      ogMetas.push({ property: 'article:tag', content: tag });
    });

    ogMetas.forEach(({ property, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    });

    // Twitter Card
    const twitterMetas = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: article.title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
      { name: 'twitter:image:alt', content: article.title },
      { name: 'twitter:site', content: '@QueueCorp' },
      { name: 'twitter:creator', content: '@QueueCorp' }
    ];

    twitterMetas.forEach(({ name, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    });

    // 構造化データ (JSON-LD)
    const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": description,
      "image": {
        "@type": "ImageObject",
        "url": imageUrl,
        "width": 1200,
        "height": 630
      },
      "author": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/Queue.png`,
          "width": 200,
          "height": 200
        },
        "sameAs": [
          "https://twitter.com/QueueCorp",
          "https://github.com/QueueCorpJP"
        ]
      },
      "publisher": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/Queue.png`,
          "width": 200,
          "height": 200
        }
      },
      "datePublished": new Date(article.published_at || article.created_at).toISOString(),
      "dateModified": new Date(article.updated_at).toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      },
      "url": currentUrl,
      "keywords": article.tags.join(', '),
      "articleSection": "テクノロジー",
      "inLanguage": "ja-JP",
      "wordCount": wordCount,
      "timeRequired": `PT${readingTimeMinutes}M`,
      "isPartOf": {
        "@type": "Blog",
        "name": "Queue株式会社ブログ",
        "url": `${baseUrl}/blog`
      },
      "about": {
        "@type": "Thing",
        "name": "人工知能",
        "description": "AI技術と機械学習に関する専門的な知見"
      }
    };

    // 記事にソースがある場合は引用情報を追加
    if (article.source_name || article.source_url) {
      (structuredData as any).citation = {
        "@type": "CreativeWork",
        "name": article.source_name || "参考資料",
        "url": article.source_url
      };
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // robots meta tag（検索エンジンに対する指示）
    const robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    document.head.appendChild(robotsMeta);

    // 言語指定
    const htmlLang = document.documentElement;
    htmlLang.setAttribute('lang', 'ja');
  };

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
      
      // SEO設定
      setupSEO(data);

      // 記事閲覧数を記録
      trackArticleView(data.id);
    } catch (error) {
      console.error('Error:', error);
      toast.error('記事の取得に失敗しました');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // 記事閲覧数を記録する関数（同じIPから同じ記事への短時間の重複アクセスを制限）
  const trackArticleView = async (articleId: string) => {
    try {
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

      if (error) {
        console.error('Error tracking view:', error);
      } else {
        // 成功した場合は最後の閲覧時間を記録
        localStorage.setItem(viewKey, Date.now().toString());
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').filter(paragraph => paragraph.trim() !== '');
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

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされる時にSEOタグをクリーンアップ
      const metasToRemove = document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"]');
      metasToRemove.forEach(meta => meta.remove());
    };
  }, []);

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
                <Link to="/blog">
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="bg-white border-b">
          <Container>
            <div className="max-w-4xl mx-auto py-4">
              <nav className="flex items-center space-x-2 text-sm text-gray-500">
                <Link to="/" className="hover:text-navy-600">ホーム</Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-navy-600">ブログ</Link>
                <span>/</span>
                <span className="text-gray-900 truncate">{article.title}</span>
              </nav>
            </div>
          </Container>
        </section>

        {/* Article Content */}
        <section className="py-8 md:py-16">
          <Container>
            <div className="max-w-4xl mx-auto">
              {/* Back to Blog Button */}
              <div className="mb-8">
                <Button variant="ghost" asChild className="text-navy-600 hover:text-navy-800">
                  <Link to="/blog">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    ブログ一覧に戻る
                  </Link>
                </Button>
              </div>

              <Card className="overflow-hidden border-none shadow-lg">
                <CardContent className="p-0">
                  {/* Hero Image */}
                  {article.image_url && (
                    <div className="relative h-64 md:h-96 overflow-hidden bg-gray-100">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                              <div class="text-center">
                                <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm">画像を読み込めませんでした</p>
                              </div>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  )}

                  <div className="p-6 md:p-8">
                    {/* Meta Info */}
                    <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{calculateReadTime(article.content)}分で読める</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 leading-tight">
                      {article.title}
                    </h1>

                    {/* Summary */}
                    <div className="text-xl text-gray-700 mb-8 leading-relaxed blog-content">
                      {article.summary.includes('<') ? (
                        <div dangerouslySetInnerHTML={{ __html: article.summary }} />
                      ) : (
                        <p>{article.summary}</p>
                      )}
                    </div>

                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-navy-50 text-navy-700 border-navy-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-lg max-w-none mb-8">
                      <div 
                        className="text-gray-700 leading-relaxed blog-content"
                        dangerouslySetInnerHTML={{ __html: processContent(article.content) }}
                        style={{
                          fontSize: '16px',
                          lineHeight: '1.8'
                        }}
                      />
                      
                      {/* 記事の中間地点にcompact CTAを挿入 */}
                      <div className="my-8">
                        <ArticleCTA 
                          articleId={article.id} 
                          variant="compact"
                        />
                      </div>
                    </div>



                    {/* Main CTA at the end of article */}
                    <div className="my-12">
                      <ArticleCTA articleId={article.id} />
                    </div>

                    {/* Source */}
                    {(article.source_name || article.source_url) && (
                      <div className="border-t pt-6 mt-8">
                        <div className="flex items-center justify-between">
                          {article.source_name && (
                            <div className="text-sm text-gray-500">
                              参考: {article.source_name}
                            </div>
                          )}
                          {article.source_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                詳細を見る <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Back to Blog Button */}
              <div className="mt-12 text-center">
                <Button asChild className="bg-navy-700 hover:bg-navy-600">
                  <Link to="/blog">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    他の記事を読む
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPost; 