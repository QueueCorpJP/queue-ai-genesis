/**
 * サイトマップ自動更新APIエンドポイント
 * 記事公開時に自動的にpublic/sitemap.xmlファイルを更新
 */

import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

interface Article {
  id: string;
  title: string;
  slug?: string | null;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
}

/**
 * サイトマップXML生成
 */
const generateSitemapXML = (articles: Article[]): string => {
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

  const articleUrls = articles.map(article => {
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
const generateNewsSitemapXML = (articles: Article[]): string => {
  const baseUrl = 'https://queue-tech.jp';
  
  const newsUrls = articles.map(article => {
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
 * ファイルシステムにサイトマップを保存
 */
export const saveSitemapFiles = async (): Promise<{
  success: boolean;
  message: string;
  articleCount?: number;
}> => {
  try {
    console.log('自動サイトマップファイル更新開始...');

    // 公開済み記事を取得
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('id, title, slug, updated_at, published_at, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('記事取得エラー:', error);
      return {
        success: false,
        message: `記事取得エラー: ${error.message}`
      };
    }

    const publishedArticles = articles || [];
    console.log(`公開記事数: ${publishedArticles.length}件`);

    // サイトマップXML生成
    const sitemapXml = generateSitemapXML(publishedArticles);
    const newsSitemapXml = generateNewsSitemapXML(publishedArticles);

    // ファイル保存先パス
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    const newsSitemapPath = path.join(publicDir, 'news-sitemap.xml');

    // ディレクトリ確認・作成
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // ファイル書き込み
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
    fs.writeFileSync(newsSitemapPath, newsSitemapXml, 'utf-8');

    const message = `サイトマップファイルを自動更新しました（${publishedArticles.length}記事）`;
    console.log(message);
    console.log(`更新ファイル:`);
    console.log(`  - ${sitemapPath}`);
    console.log(`  - ${newsSitemapPath}`);

    return {
      success: true,
      message,
      articleCount: publishedArticles.length
    };

  } catch (error) {
    console.error('サイトマップファイル保存エラー:', error);
    return {
      success: false,
      message: `ファイル保存エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * APIハンドラー（GET/POST対応）
 */
export const handleSitemapUpdate = async () => {
  return await saveSitemapFiles();
};

/**
 * Express.js風のAPIレスポンス
 */
export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'POST' || req.method === 'GET') {
      const result = await saveSitemapFiles();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          articleCount: result.articleCount,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.message
        });
      }
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
