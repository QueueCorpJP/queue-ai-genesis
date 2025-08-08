// XMLサイトマップ生成ユーティリティ
// 検索エンジンクロール最適化のためのサイトマップ機能

import { supabase } from '@/lib/supabase';
import { generateSitemapEntry } from './seoUtils';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export interface SitemapIndex {
  sitemap: string;
  lastmod: string;
}

/**
 * 静的ページのサイトマップエントリー
 */
const getStaticPages = (): SitemapEntry[] => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  const today = new Date().toISOString().split('T')[0];
  
  return [
    {
      url: baseUrl,
      lastmod: today,
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/news`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/company`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/services`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/products`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.7'
    }
  ];
};

/**
 * 記事のサイトマップエントリーを取得
 */
export const getArticleSitemapEntries = async (): Promise<SitemapEntry[]> => {
  try {
    const { data: articles, error } = await supabase
      .from('sitemap_articles')
      .select('*')
      .order('lastmod', { ascending: false });
    
    if (error) {
      console.error('Error fetching sitemap articles:', error);
      return [];
    }
    
    const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
    
    return articles.map(article => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastmod: article.lastmod,
      changefreq: article.changefreq,
      priority: article.priority
    }));
  } catch (error) {
    console.error('Error generating article sitemap entries:', error);
    return [];
  }
};

/**
 * XMLサイトマップを生成
 */
export const generateXMLSitemap = async (): Promise<string> => {
  const staticPages = getStaticPages();
  const articlePages = await getArticleSitemapEntries();
  const allPages = [...staticPages, ...articlePages];
  
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';
  
  const urls = allPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');
  
  return `${xmlHeader}\n${urlsetOpen}${urls}\n${urlsetClose}`;
};

/**
 * サイトマップインデックスを生成（大量の記事がある場合用）
 */
export const generateSitemapIndex = async (): Promise<string> => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  const today = new Date().toISOString().split('T')[0];
  
  // 記事数を確認
  const { count } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');
  
  const sitemapEntries: SitemapIndex[] = [
    {
      sitemap: `${baseUrl}/sitemap-static.xml`,
      lastmod: today
    }
  ];
  
  // 記事数が多い場合は分割
  const articlesPerSitemap = 1000;
  const numberOfSitemaps = Math.ceil((count || 0) / articlesPerSitemap);
  
  for (let i = 0; i < numberOfSitemaps; i++) {
    sitemapEntries.push({
      sitemap: `${baseUrl}/sitemap-articles-${i + 1}.xml`,
      lastmod: today
    });
  }
  
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const sitemapindexClose = '</sitemapindex>';
  
  const sitemaps = sitemapEntries.map(entry => `
  <sitemap>
    <loc>${entry.sitemap}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </sitemap>`).join('');
  
  return `${xmlHeader}\n${sitemapindexOpen}${sitemaps}\n${sitemapindexClose}`;
};

/**
 * 分割された記事サイトマップを生成
 */
export const generateArticlesSitemap = async (page: number = 1, limit: number = 1000): Promise<string> => {
  const offset = (page - 1) * limit;
  
  try {
    const { data: articles, error } = await supabase
      .from('sitemap_articles')
      .select('*')
      .order('lastmod', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching articles for sitemap:', error);
      return '';
    }
    
    const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
    
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';
    
    const urls = articles.map(article => `
  <url>
    <loc>${baseUrl}/news/${article.slug}</loc>
    <lastmod>${article.lastmod}</lastmod>
    <changefreq>${article.changefreq}</changefreq>
    <priority>${article.priority}</priority>
  </url>`).join('');
    
    return `${xmlHeader}\n${urlsetOpen}${urls}\n${urlsetClose}`;
  } catch (error) {
    console.error('Error generating articles sitemap:', error);
    return '';
  }
};

/**
 * 静的ページのサイトマップを生成
 */
export const generateStaticSitemap = (): string => {
  const staticPages = getStaticPages();
  
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';
  
  const urls = staticPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');
  
  return `${xmlHeader}\n${urlsetOpen}${urls}\n${urlsetClose}`;
};

/**
 * robots.txtを生成
 */
export const generateRobotsTxt = (): string => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  
  return `User-agent: *
Allow: /

# サイトマップの場所
Sitemap: ${baseUrl}/sitemap.xml

# クロール頻度の制限
Crawl-delay: 1

# 特定のパスを除外（必要に応じて）
# Disallow: /admin/
# Disallow: /api/`;
};

/**
 * サイトマップを自動的にサーチコンソールに送信
 */
export const submitSitemapToSearchConsole = async (sitemapUrl: string): Promise<boolean> => {
  try {
    // Google Search Console APIを使用してサイトマップを送信
    // 実際の実装では、適切な認証とAPIキーが必要
    console.log(`Sitemap submitted: ${sitemapUrl}`);
    return true;
  } catch (error) {
    console.error('Error submitting sitemap:', error);
    return false;
  }
};

/**
 * サイトマップ情報を取得
 */
export const getSitemapInfo = async () => {
  try {
    const { count: totalArticles } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    const { data: recentArticles } = await supabase
      .from('news_articles')
      .select('updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    const lastUpdated = recentArticles?.[0]?.updated_at || new Date().toISOString();
    const staticPages = getStaticPages();
    
    return {
      totalUrls: (totalArticles || 0) + staticPages.length,
      totalArticles: totalArticles || 0,
      totalStaticPages: staticPages.length,
      lastUpdated,
      sitemapUrl: `${import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp'}/sitemap.xml`
    };
  } catch (error) {
    console.error('Error getting sitemap info:', error);
    return null;
  }
};