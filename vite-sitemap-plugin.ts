/**
 * Vite開発環境用 サイトマップ自動更新プラグイン
 * 記事更新時にpublic/sitemap.xmlを自動生成
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

interface Article {
  id: string;
  title: string;
  slug?: string | null;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
}

// Supabase設定
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vrpdhzbfnwljdsretjld.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycGRoemJmbndsamRzcmV0amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTk0ODQsImV4cCI6MjA2ODA3NTQ4NH0.qGcEKtsF9jqa8Mg0Tc_M2MlC2s9DajhRJEs_PJ_UIE8';

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.warn('⚠️ Supabase connection failed:', error.message);
}

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
 * サイトマップXML生成
 */
const generateSitemapXML = (articles: Article[]): string => {
  const baseUrl = 'https://queue-tech.jp';
  
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
      <news:publication_date>${new Date(article.published_at).toISOString()}</news:publication_date>
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
 * サイトマップファイル自動生成
 */
const generateSitemapFiles = async (): Promise<void> => {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, skipping sitemap generation');
      return;
    }

    console.log('🚀 開発環境: サイトマップ自動生成中...');

    // 公開済み記事を取得
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('id, title, slug, updated_at, published_at, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('⚠️ 記事取得エラー:', error.message);
      return;
    }

    const publishedArticles = articles || [];
    console.log(`📰 公開記事数: ${publishedArticles.length}件`);

    // サイトマップXML生成
    const sitemapXml = generateSitemapXML(publishedArticles);
    const newsSitemapXml = generateNewsSitemapXML(publishedArticles);

    // ファイル保存
    const publicDir = path.join(process.cwd(), 'public');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(publicDir, 'news-sitemap.xml'), newsSitemapXml, 'utf-8');

    console.log(`✅ サイトマップファイル自動更新完了（${publishedArticles.length}記事）`);
    console.log('   - public/sitemap.xml');
    console.log('   - public/news-sitemap.xml');

  } catch (error) {
    console.warn('⚠️ サイトマップ自動生成エラー:', error.message);
  }
};

/**
 * Viteプラグイン
 */
export function sitemapPlugin(): Plugin {
  return {
    name: 'sitemap-auto-generator',
    configureServer(server: ViteDevServer) {
      // 開発サーバー起動時にサイトマップを生成
      generateSitemapFiles();

      // APIエンドポイントを追加
      server.middlewares.use('/api/sitemap-update', async (req, res, next) => {
        if (req.method === 'POST' || req.method === 'GET') {
          try {
            console.log('🔄 API呼び出し: サイトマップ更新');
            await generateSitemapFiles();
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              success: true,
              message: 'サイトマップファイルを自動更新しました',
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({
              success: false,
              error: error.message
            }));
          }
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({
            success: false,
            error: 'Method not allowed'
          }));
        }
      });

      console.log('✅ サイトマップ自動更新プラグイン有効化');
      console.log('   - 開発サーバー起動時: 自動生成');
      console.log('   - API エンドポイント: /api/sitemap-update');
    },
    buildStart() {
      // ビルド開始時にもサイトマップを生成
      generateSitemapFiles();
    }
  };
}
