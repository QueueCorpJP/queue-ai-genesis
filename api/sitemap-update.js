/**
 * Vercel Functions用 サイトマップ自動更新API
 * /api/sitemap-update で呼び出し可能
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase設定
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vrpdhzbfnwljdsretjld.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycGRoemJmbndsamRzcmV0amxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTk0ODQsImV4cCI6MjA2ODA3NTQ4NH0.qGcEKtsF9jqa8Mg0Tc_M2MlC2s9DajhRJEs_PJ_UIE8';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * XML文字列エスケープ
 */
const escapeXml = (text) => {
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
const generateSitemapXML = (articles) => {
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
const generateNewsSitemapXML = (articles) => {
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
 * メインハンドラー関数
 */
export default async function handler(req, res) {
  try {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    console.log('🚀 Vercel Functions: サイトマップ自動更新開始...');

    // 公開済み記事を取得
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('id, title, slug, updated_at, published_at, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('❌ 記事取得エラー:', error);
      return res.status(500).json({
        success: false,
        error: `記事取得エラー: ${error.message}`
      });
    }

    const publishedArticles = articles || [];
    console.log(`📰 公開記事数: ${publishedArticles.length}件`);

    // サイトマップXML生成
    const sitemapXml = generateSitemapXML(publishedArticles);
    const newsSitemapXml = generateNewsSitemapXML(publishedArticles);

    // Vercel環境では直接ファイル書き込みできないため、
    // 生成されたXMLを返す（フロントエンドでダウンロード可能）
    const responseData = {
      success: true,
      message: `✅ サイトマップを生成しました（${publishedArticles.length}記事）`,
      articleCount: publishedArticles.length,
      timestamp: new Date().toISOString(),
      sitemapXml,
      newsSitemapXml,
      note: 'Vercel環境のため、XMLデータを返します。フロントエンドでファイル更新してください。'
    };

    console.log('✅ サイトマップ生成完了');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ API エラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
