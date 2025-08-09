// サイトマップ生成APIエンドポイント
import { updateSitemaps, checkSitemapStatus } from '@/utils/sitemapUpdater';

/**
 * GET /api/sitemap/generate - サイトマップを手動生成
 */
export const handleGenerateSitemap = async () => {
  try {
    const result = await updateSitemaps();
    
    if (result.success) {
      return {
        success: true,
        message: result.message,
        data: {
          sitemap: result.sitemapXml,
          newsSitemap: result.newsSitemapXml,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: result.message
      };
    }
  } catch (error) {
    console.error('API Error - Generate Sitemap:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * GET /api/sitemap/status - サイトマップステータス確認
 */
export const handleSitemapStatus = async () => {
  try {
    const status = await checkSitemapStatus();
    
    return {
      success: true,
      data: {
        ...status,
        sitemapUrls: [
          'https://queue-tech.jp/sitemap.xml',
          'https://queue-tech.jp/news-sitemap.xml',
          'https://queue-tech.jp/ai-sitemap.xml'
        ],
        lastChecked: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('API Error - Sitemap Status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * サイトマップダウンロード用のXMLレスポンス
 */
export const handleSitemapDownload = async (type: 'main' | 'news' = 'main') => {
  try {
    const result = await updateSitemaps();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    const xml = type === 'news' ? result.newsSitemapXml : result.sitemapXml;
    
    return {
      success: true,
      data: xml,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}-sitemap.xml"`,
        'Cache-Control': 'public, max-age=3600' // 1時間キャッシュ
      }
    };
  } catch (error) {
    console.error('API Error - Sitemap Download:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};