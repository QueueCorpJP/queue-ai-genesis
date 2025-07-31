
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

// ブログ記事のタイプ定義
type BlogArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source_name: string;
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
    // Ensure page starts at the top
    window.scrollTo(0, 0);
    fetchArticles();
  }, []);

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

  // 記事閲覧数を記録する関数
  const trackArticleView = async (articleId: string) => {
    try {
      // IPアドレスとUser-Agentを取得
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      const { error } = await supabase
        .from('news_article_views')
        .insert({
          article_id: articleId,
          ip_address: ipData.ip || 'unknown',
          user_agent: navigator.userAgent
        });

      if (error) {
        // Silently handle error in production
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

  const formatContent = (content: string) => {
    // コンテンツを段落に分割（改行で分ける）
    return content.split('\n').filter(paragraph => paragraph.trim() !== '');
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
            <div className="max-w-4xl mx-auto">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">記事を読み込み中...</p>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">現在、表示できる記事はありません。</p>
                </div>
              ) : (
                articles.map((article) => (
                  <Card 
                    key={article.id} 
                    className="mb-8 overflow-hidden border-none shadow-md queue-card"
                    data-article-id={article.id}
                  >
                    <CardContent className="p-0">
                      {/* アイキャッチ画像 */}
                      {article.image_url && (
                        <div className="relative h-64 md:h-80 overflow-hidden bg-gray-100">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              // 画像読み込みエラー時のフォールバック
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
                          {/* 画像上のオーバーレイ（必要に応じて） */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      )}
                      
                      <div className="p-6 md:p-8">
                        <div className="flex items-center mb-4 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(article.published_at || article.created_at)}</span>
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">{article.title}</h2>
                        <p className="text-lg mb-6 text-gray-700">{article.summary}</p>
                        
                        <div className="space-y-4 mb-6">
                          {formatContent(article.content).map((paragraph, idx) => (
                            <p key={idx} className="text-gray-600">{paragraph}</p>
                          ))}
                        </div>
                        
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {article.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="bg-queue-light text-queue-blue">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between border-t pt-4 mt-6">
                          {article.source_name && (
                            <div className="text-sm text-gray-500">
                              参考: {article.source_name}
                            </div>
                          )}
                          {!article.source_name && <div></div>}
                          {article.source_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                詳細を見る <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
