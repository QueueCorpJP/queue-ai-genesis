#!/usr/bin/env node

/**
 * サイトマップ生成スクリプト
 * npm run generate:sitemap で実行
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node.js 用のfetchポリフィル
if (!global.fetch) {
  const { default: fetch, Headers, Request, Response } = await import('node-fetch');
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase設定（環境変数から取得）
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vrpdhzbfnwljdsretjld.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycGRoemJmbndsamRzcmV0amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTk0ODQsImV4cCI6MjA2ODA3NTQ4NH0.qGcEKtsF9jqa8Mg0Tc_M2MlC2s9DajhRJEs_PJ_UIE8';

const supabase = createClient(supabaseUrl, supabaseKey);

// XML文字列をエスケープ
const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// メインサイトマップ生成
const generateMainSitemap = (articles = []) => {
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

  // 静的ページのXML
  const staticUrls = staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  // 記事ページのXML
  // 親ハブスラグ解決用マップ
  const articleMap = new Map(articles.map(a => [a.id, a]));

  const articleUrls = articles.map(article => {
    let urlPath = '';
    
    if (article.page_type === 'hub' && article.slug) {
      urlPath = `/${article.slug}`;
    } else if (article.page_type === 'sub' && article.parent_hub_id && article.slug) {
      const parent = articleMap.get(article.parent_hub_id);
      if (parent && parent.slug) {
        urlPath = `/${parent.slug}/${article.slug}`;
      } else {
        // フォールバック: 親が見つからない場合でも何らかのURLを生成
        urlPath = article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
      }
    } else {
      urlPath = article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
    }

    const priority = article.page_type === 'hub' ? 0.8 : 0.6;

    return `
  <url>
    <loc>${baseUrl}${urlPath}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${articleUrls}
</urlset>`;
};

// ニュースサイトマップ生成
const generateNewsSitemap = (articles = []) => {
  const baseUrl = 'https://queue-tech.jp';
  // 親ハブスラグ解決用マップ
  const articleMap = new Map(articles.map(a => [a.id, a]));
  
  const newsUrls = articles.map(article => {
    let urlPath = '';
    
    if (article.page_type === 'hub' && article.slug) {
      urlPath = `/${article.slug}`;
    } else if (article.page_type === 'sub' && article.parent_hub_id && article.slug) {
      const parent = articleMap.get(article.parent_hub_id);
      if (parent && parent.slug) {
        urlPath = `/${parent.slug}/${article.slug}`;
      } else {
        urlPath = article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
      }
    } else {
      urlPath = article.slug ? `/news/${article.slug}` : `/news/id/${article.id}`;
    }

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

// メイン実行関数
async function generateSitemaps() {
  try {
    console.log('🚀 サイトマップ生成開始...');

    let publishedArticles = [];

    try {
      console.log('🔍 Supabase接続設定確認中...');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'なし');
      
      // 公開済み記事を取得（エラーハンドリング強化）
      console.log('📊 記事データ取得中...');
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, title, slug, updated_at, published_at, status, page_type, parent_hub_id')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      console.log('💾 データベースレスポンス:', { 
        error: error?.message || null, 
        dataCount: articles?.length || 0 
      });

      if (error) {
        console.warn('⚠️ 記事取得エラー（基本サイトマップのみ生成）:', error);
        publishedArticles = [];
      } else {
        publishedArticles = articles || [];
        console.log('✅ 記事取得成功:', publishedArticles.length, '件');
        if (publishedArticles.length > 0) {
          console.log('📰 取得記事例:', publishedArticles.slice(0, 2).map(a => ({ 
            id: a.id, 
            title: a.title.substring(0, 30) + '...', 
            slug: a.slug,
            type: a.page_type
          })));
        }
      }
    } catch (fetchError) {
      console.warn('⚠️ データベース接続エラー（基本サイトマップのみ生成）:', fetchError);
      publishedArticles = [];
    }

    console.log(`📰 公開記事数: ${publishedArticles.length}件`);

    // サイトマップ生成
    const mainSitemap = generateMainSitemap(publishedArticles);
    const newsSitemap = generateNewsSitemap(publishedArticles);

    // ファイル保存
    const publicDir = path.join(__dirname, '..', 'public');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), mainSitemap, 'utf-8');
    fs.writeFileSync(path.join(publicDir, 'news-sitemap.xml'), newsSitemap, 'utf-8');

    console.log('✅ サイトマップ生成完了');
    console.log(`📄 公開記事: ${publishedArticles.length}件`);
    console.log(`📁 保存先: ${publicDir}/`);
    console.log('   - sitemap.xml');
    console.log('   - news-sitemap.xml');

  } catch (error) {
    console.error('❌ エラー:', error);
    // エラーが発生しても基本サイトマップを生成して続行
    try {
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
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
</urlset>`;
      const publicDir = path.join(__dirname, '..', 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), fallbackSitemap, 'utf-8');
      console.log('✅ フォールバックサイトマップ生成完了');
    } catch (fallbackError) {
      console.error('❌ フォールバックサイトマップ生成も失敗:', fallbackError);
    }
    // エラーが発生してもビルドを続行するため、exitしない
    // process.exit(1);
  }
}

// 実行
generateSitemaps();