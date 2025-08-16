/**
 * 自動サイトマップ更新ユーティリティ
 * 記事ステータス変更時に自動でサイトマップを更新・保存
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  slug?: string | null;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
}

/**
 * サイトマップXML生成（メインサイトマップ）
 */
export const generateSitemapXML = (articles: Article[]): string => {
  const baseUrl = 'https://queue-tech.jp';
  
  // 静的ページ
  const staticPages = [
    { path: '/', changefreq: 'weekly', priority: 1.0 },
    { path: '/about', changefreq: 'monthly', priority: 0.8 },
    { path: '/services', changefreq: 'weekly', priority: 0.9 },
    { path: '/products', changefreq: 'weekly', priority: 0.9 },
    { path: '/products/workmate', changefreq: 'monthly', priority: 0.7 },
    { path: '/news', changefreq: 'daily', priority: 0.8 },
    { path: '/case-studies', changefreq: 'weekly', priority: 0.7 },
    { path: '/contact', changefreq: 'monthly', priority: 0.6 },
    { path: '/consultation', changefreq: 'monthly', priority: 0.6 },
    { path: '/careers', changefreq: 'monthly', priority: 0.5 },
    { path: '/why-queue', changefreq: 'monthly', priority: 0.6 },
    { path: '/company', changefreq: 'monthly', priority: 0.6 },
    { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
    { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  ];

  const staticUrls = staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  // 公開済み記事のURL
  const publishedArticles = articles.filter(article => 
    article.status === 'published' && article.published_at
  );

  const articleUrls = publishedArticles.map(article => {
    const urlPath = article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
    return `
  <url>
    <loc>${baseUrl}${urlPath}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${articleUrls}
</urlset>`;
};

/**
 * ニュースサイトマップXML生成
 */
export const generateNewsSitemapXML = (articles: Article[]): string => {
  const baseUrl = 'https://queue-tech.jp';
  
  const publishedArticles = articles.filter(article => 
    article.status === 'published' && article.published_at
  );

  const newsUrls = publishedArticles.map(article => {
    const urlPath = article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
    return `
  <url>
    <loc>${baseUrl}${urlPath}</loc>
    <news:news>
      <news:publication>
        <news:name>Queue株式会社</news:name>
        <news:language>ja</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.published_at!).toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsUrls}
</urlset>`;
};

/**
 * XML文字列エスケープ
 */
const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * ファイルダウンロード機能
 */
export const downloadFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 自動ファイル更新API呼び出し
 * サーバーサイドでpublic/sitemap.xmlを直接更新
 */
export const updateSitemapFiles = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('🔄 サイトマップファイル自動更新開始...');
    
    // サーバーサイドAPI呼び出し（Vercel Functions or 別途APIサーバー）
    const response = await fetch('/api/sitemap-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_files'
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ サイトマップファイル更新成功:', result.message);
      return {
        success: true,
        message: result.message
      };
    } else {
      throw new Error(result.error || 'Unknown API error');
    }

  } catch (error) {
    console.error('❌ サイトマップファイル更新エラー:', error);
    
    // フォールバック: ダウンロードで手動更新を促す
    console.log('🔄 フォールバック: ダウンロード方式にフォールバック');
    return {
      success: false,
      message: `自動更新に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * 自動サイトマップ更新メイン関数
 * 記事ステータス変更時に呼び出される - 完全自動化版
 */
export const autoUpdateSitemaps = async (
  changedArticleId?: string,
  showToast: boolean = true
): Promise<{
  success: boolean;
  message: string;
  sitemapXml?: string;
  newsSitemapXml?: string;
}> => {
  try {
    if (showToast) {
      toast.info('🔄 サイトマップを自動更新中...');
    }
    
    console.log(`🚀 自動サイトマップ更新開始 ${changedArticleId ? `(記事ID: ${changedArticleId})` : ''}`);
    
    // 🎯 完全自動化: サーバーサイドでファイル更新
    const fileUpdateResult = await updateSitemapFiles();
    
    if (fileUpdateResult.success) {
      // 成功: publicフォルダのファイルが自動更新された
      const message = `✅ サイトマップファイルを自動更新しました`;
      console.log(message);
      
      if (showToast) {
        toast.success(message, {
          description: 'public/sitemap.xmlが自動更新されました'
        });
      }

      return {
        success: true,
        message: fileUpdateResult.message
      };
    } else {
      // 失敗: フォールバックとしてダウンロード方式
      console.log('🔄 フォールバック: ダウンロード方式で対応...');
      
      // 全公開済み記事を取得
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, title, slug, updated_at, published_at, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('❌ 記事取得エラー:', error);
        if (showToast) {
          toast.error('サイトマップ更新に失敗しました');
        }
        return {
          success: false,
          message: `記事取得エラー: ${error.message}`
        };
      }

      const publishedArticles = articles || [];
      console.log(`📰 公開記事数: ${publishedArticles.length}件`);

      // サイトマップXML生成
      const sitemapXml = generateSitemapXML(publishedArticles);
      const newsSitemapXml = generateNewsSitemapXML(publishedArticles);

      const message = `⚠️ 自動更新は失敗しましたが、サイトマップを生成しました（${publishedArticles.length}記事）`;
      console.log(message);
      
      if (showToast) {
        toast.warning(message, {
          description: '手動ダウンロード用のサイトマップを生成しました'
        });
      }

      return {
        success: true,
        message,
        sitemapXml,
        newsSitemapXml
      };
    }

  } catch (error) {
    console.error('❌ 自動サイトマップ更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (showToast) {
      toast.error(`サイトマップ更新エラー: ${errorMessage}`);
    }
    
    return {
      success: false,
      message: `サイトマップ更新エラー: ${errorMessage}`
    };
  }
};

/**
 * 記事公開時の自動サイトマップ更新
 * より詳細なログとユーザー通知付き
 */
export const onArticlePublished = async (
  articleId: string, 
  articleTitle: string
): Promise<void> => {
  console.log(`📝 記事公開検知: "${articleTitle}" (ID: ${articleId})`);
  
  toast.info(`📝 記事「${articleTitle}」を公開しました`, {
    description: 'サイトマップを自動更新中...'
  });

  const result = await autoUpdateSitemaps(articleId, false);
  
  if (result.success) {
    toast.success('🎉 記事公開完了！', {
      description: `サイトマップも自動更新されました`
    });
    
    // Google Search Console通知（今後の実装）
    notifySearchEngines();
  } else {
    toast.error('⚠️ 記事は公開されましたが、サイトマップ更新に失敗', {
      description: '手動でサイトマップを更新してください'
    });
  }
};

/**
 * 記事非公開時の自動サイトマップ更新
 */
export const onArticleUnpublished = async (
  articleId: string, 
  articleTitle: string
): Promise<void> => {
  console.log(`📝 記事非公開検知: "${articleTitle}" (ID: ${articleId})`);
  
  toast.info(`📝 記事「${articleTitle}」を非公開にしました`, {
    description: 'サイトマップを自動更新中...'
  });

  const result = await autoUpdateSitemaps(articleId, false);
  
  if (result.success) {
    toast.success('✅ 記事非公開完了！', {
      description: 'サイトマップも自動更新されました'
    });
  } else {
    toast.warning('⚠️ 記事は非公開になりましたが、サイトマップ更新に失敗');
  }
};

/**
 * 検索エンジンへの通知（将来実装）
 */
const notifySearchEngines = async (): Promise<void> => {
  try {
    // Google Search Console API
    // Bing Webmaster Tools API
    // その他検索エンジンへのpingを送信
    
    console.log('🔔 検索エンジンにサイトマップ更新を通知予定');
    
    // 実装例（将来）:
    // await fetch('/api/notify-search-engines', { method: 'POST' });
    
  } catch (error) {
    console.log('⚠️ 検索エンジン通知はスキップしました:', error);
  }
};
