#!/usr/bin/env node

/**
 * サイトマップ生成スクリプト
 * npm run generate:sitemap で実行
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase設定（環境変数から取得）
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lkxdvdjbixdyblltqhfl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreGR2ZGpiaXhkeWJsbHRxaGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MjkxNTksImV4cCI6MjA1MjIwNTE1OX0.6UzlHSL-OJhzGRJWwxm8Z7hl-OKGOjfCcN-3PO29vn4';

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

// ニュースサイトマップ生成
const generateNewsSitemap = (articles = []) => {
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

// メイン実行関数
async function generateSitemaps() {
  try {
    console.log('🚀 サイトマップ生成開始...');

    let publishedArticles = [];

    try {
      // 公開済み記事を取得（エラーハンドリング強化）
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, title, slug, updated_at, published_at, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.warn('⚠️ 記事取得エラー（基本サイトマップのみ生成）:', error.message);
        publishedArticles = [];
      } else {
        publishedArticles = articles || [];
      }
    } catch (fetchError) {
      console.warn('⚠️ データベース接続エラー（基本サイトマップのみ生成）:', fetchError.message);
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
    process.exit(1);
  }
}

// 実行
generateSitemaps();