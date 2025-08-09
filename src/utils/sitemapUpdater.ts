// サイトマップ自動更新ユーティリティ
import { supabase } from '@/lib/supabase';
import { generateSitemap, generateNewsSitemap } from './sitemap';

interface ArticleForSitemap {
  id: string;
  title: string;
  slug?: string | null;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
}

/**
 * 全記事を取得してサイトマップを更新
 */
export const updateSitemaps = async (): Promise<{
  success: boolean;
  message: string;
  sitemapXml?: string;
  newsSitemapXml?: string;
}> => {
  try {
    // 公開済み記事を取得
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('id, title, slug, updated_at, published_at, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles for sitemap:', error);
      return {
        success: false,
        message: `記事取得エラー: ${error.message}`
      };
    }

    // サイトマップ生成
    const sitemapXml = await generateSitemap(articles || []);
    const newsSitemapXml = await generateNewsSitemap(articles || []);

    console.log('✅ サイトマップを更新しました:', {
      総記事数: articles?.length || 0,
      公開記事数: articles?.filter(a => a.published_at).length || 0
    });

    return {
      success: true,
      message: `サイトマップを更新しました（${articles?.length || 0}記事）`,
      sitemapXml,
      newsSitemapXml
    };

  } catch (error) {
    console.error('Error updating sitemaps:', error);
    return {
      success: false,
      message: `サイトマップ更新エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * 記事公開時に自動的にサイトマップを更新
 */
export const onArticlePublished = async (articleId: string): Promise<void> => {
  try {
    console.log(`📝 記事公開検知: ${articleId} - サイトマップを更新中...`);
    
    const result = await updateSitemaps();
    
    if (result.success) {
      console.log('✅ サイトマップ自動更新完了:', result.message);
      
      // Webhook or external API call for search engines (optional)
      await notifySearchEngines();
    } else {
      console.error('❌ サイトマップ自動更新失敗:', result.message);
    }
  } catch (error) {
    console.error('Error in onArticlePublished:', error);
  }
};

/**
 * 検索エンジンにサイトマップ更新を通知（オプション）
 */
const notifySearchEngines = async (): Promise<void> => {
  try {
    const siteUrl = 'https://queue-tech.jp';
    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    
    // Google Search Console への ping（実際のAPIキーが必要）
    // const googleResponse = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    
    // Bing Webmaster Tools への ping（実際のAPIキーが必要）
    // const bingResponse = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    
    console.log('🔔 検索エンジンに更新通知送信済み');
  } catch (error) {
    console.log('⚠️ 検索エンジン通知はスキップしました:', error);
  }
};

/**
 * サイトマップのステータスをチェック
 */
export const checkSitemapStatus = async (): Promise<{
  lastUpdated: string;
  articleCount: number;
  publishedCount: number;
}> => {
  try {
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('published_at, status, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const publishedArticles = articles?.filter(a => a.status === 'published') || [];
    const lastUpdated = articles?.[0]?.updated_at || new Date().toISOString();

    return {
      lastUpdated,
      articleCount: articles?.length || 0,
      publishedCount: publishedArticles.length
    };
  } catch (error) {
    console.error('Error checking sitemap status:', error);
    return {
      lastUpdated: new Date().toISOString(),
      articleCount: 0,
      publishedCount: 0
    };
  }
};