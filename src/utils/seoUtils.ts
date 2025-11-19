// SEO最適化ユーティリティ関数
// 検索エンジンクロール最適化のための各種ヘルパー関数

import { getFullArticleUrl, NEWS_BASE_PATH } from '@/config/urls';

export interface ArticleSEOData {
  // 基本情報
  id: string;
  title: string;
  summary: string;
  content: string;
  slug?: string;
  published_at?: string;
  updated_at?: string;
  
  // SEO専用フィールド
  seo_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  focus_keyword?: string;
  reading_time_minutes?: number;
  article_type?: string;
  author_name?: string;
  author_url?: string;
  
  // Open Graph
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  
  // Twitter Cards
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card_type?: string;
  
  // 管理
  meta_robots?: string;
  structured_data?: any;
  
  // 従来フィールド
  image_url?: string;
  tags?: string[];
}

export interface SEOMetaData {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: string;
  author: string;
  publishedTime?: string;
  modifiedTime?: string;
  articleType: string;
  structuredData: any;
  robots: string;
}

/**
 * 記事データからSEOメタデータを生成
 */
export const generateArticleSEOData = (article: ArticleSEOData): SEOMetaData => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  const defaultImage = `${baseUrl}/Queue.png`;
  const articleUrl = getFullArticleUrl(article.slug, article.id, baseUrl);

  // HTMLタグを除去
  const stripHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // SEOタイトルの生成・最適化
  const generateSEOTitle = (): string => {
    const title = article.seo_title || article.title;
    const siteName = ' | Queue株式会社';
    const maxLength = 60 - siteName.length;
    
    if (title.length > maxLength) {
      return title.substring(0, maxLength).trim() + '...' + siteName;
    }
    return title + siteName;
  };

  // メタディスクリプションの生成・最適化
  const generateMetaDescription = (): string => {
    const description = article.meta_description || stripHtml(article.summary);
    const maxLength = 160;
    
    if (description.length > maxLength) {
      return description.substring(0, maxLength).trim() + '...';
    }
    return description;
  };

  // キーワードの生成
  const generateKeywords = (): string => {
    const keywords: string[] = [];
    
    // メタキーワード
    if (article.meta_keywords) {
      keywords.push(article.meta_keywords);
    }
    
    // フォーカスキーワード
    if (article.focus_keyword) {
      keywords.push(article.focus_keyword);
    }
    
    // タグ
    if (article.tags && article.tags.length > 0) {
      keywords.push(...article.tags);
    }
    
    // デフォルトキーワード
    keywords.push('Queue株式会社', 'AI', '人工知能', '技術ブログ');
    
    return [...new Set(keywords)].join(', ');
  };

  // 構造化データの生成
  const generateStructuredData = () => {
    if (article.structured_data) {
      return article.structured_data;
    }

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.seo_title || article.title,
      "description": generateMetaDescription(),
      "image": article.og_image || article.image_url || defaultImage,
      "author": {
        "@type": "Organization",
        "name": article.author_name || "Queue株式会社",
        "url": article.author_url || baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": defaultImage,
          "width": 200,
          "height": 200
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "logo": {
          "@type": "ImageObject",
          "url": defaultImage,
          "width": 200,
          "height": 200
        },
        "url": baseUrl
      },
      "datePublished": article.published_at,
      "dateModified": article.updated_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "url": articleUrl,
      "keywords": generateKeywords(),
      "wordCount": stripHtml(article.content).length,
      "timeRequired": article.reading_time_minutes ? `PT${article.reading_time_minutes}M` : undefined,
      "inLanguage": "ja-JP",
      "articleSection": article.article_type || "技術ブログ",
      "about": article.focus_keyword ? {
        "@type": "Thing",
        "name": article.focus_keyword
      } : undefined
    };
  };

  return {
    title: generateSEOTitle(),
    description: generateMetaDescription(),
    keywords: generateKeywords(),
    canonicalUrl: article.canonical_url || articleUrl,
    ogTitle: article.og_title || article.seo_title || article.title,
    ogDescription: article.og_description || generateMetaDescription(),
    ogImage: article.og_image || article.image_url || defaultImage,
    ogType: article.og_type || 'article',
    twitterTitle: article.twitter_title || article.seo_title || article.title,
    twitterDescription: article.twitter_description || generateMetaDescription(),
    twitterImage: article.twitter_image || article.image_url || defaultImage,
    twitterCard: article.twitter_card_type || 'summary_large_image',
    author: article.author_name || 'Queue株式会社',
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
    articleType: article.article_type || 'article',
    structuredData: generateStructuredData(),
    robots: article.meta_robots || 'index, follow'
  };
};

/**
 * スラッグ生成関数（フロントエンド用）
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s\-]/g, '') // 特殊文字を除去
    .replace(/\s+/g, '-') // スペースをハイフンに
    .replace(/\-+/g, '-') // 連続するハイフンを1つに
    .replace(/^-+|-+$/g, ''); // 先頭・末尾のハイフンを除去
};

/**
 * SEO完成度スコア計算
 */
export const calculateSEOScore = (article: ArticleSEOData): {
  score: number;
  recommendations: string[];
} => {
  let score = 0;
  const recommendations: string[] = [];
  
  // SEOタイトル（20点）
  if (article.seo_title && article.seo_title.length > 0) {
    score += 20;
    if (article.seo_title.length > 60) {
      recommendations.push('SEOタイトルが60文字を超えています');
    }
  } else {
    recommendations.push('SEOタイトルを設定してください');
  }
  
  // メタディスクリプション（20点）
  if (article.meta_description && article.meta_description.length > 0) {
    score += 20;
    if (article.meta_description.length > 160) {
      recommendations.push('メタディスクリプションが160文字を超えています');
    }
  } else {
    recommendations.push('メタディスクリプションを設定してください');
  }
  
  // メタキーワード（15点）
  if (article.meta_keywords && article.meta_keywords.length > 0) {
    score += 15;
  } else {
    recommendations.push('メタキーワードを設定してください');
  }
  
  // スラッグ（15点）
  if (article.slug && article.slug.length > 0) {
    score += 15;
  } else {
    recommendations.push('SEOフレンドリーなスラッグを設定してください');
  }
  
  // フォーカスキーワード（10点）
  if (article.focus_keyword && article.focus_keyword.length > 0) {
    score += 10;
  } else {
    recommendations.push('フォーカスキーワードを設定してください');
  }
  
  // OG画像（10点）
  if (article.og_image || article.image_url) {
    score += 10;
  } else {
    recommendations.push('OG画像を設定してください');
  }
  
  // カノニカルURL（10点）
  if (article.canonical_url && article.canonical_url.length > 0) {
    score += 10;
  } else {
    recommendations.push('カノニカルURLを設定してください');
  }
  
  return { score, recommendations };
};

/**
 * XMLサイトマップエントリー生成
 */
export const generateSitemapEntry = (article: ArticleSEOData) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  const articleUrl = getFullArticleUrl(article.slug, article.id, baseUrl);
  
  const lastmod = article.updated_at || article.published_at;
  const publishedDate = article.published_at ? new Date(article.published_at) : new Date();
  const now = new Date();
  const daysSincePublished = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 更新頻度を動的に決定
  let changefreq = 'monthly';
  if (daysSincePublished <= 7) {
    changefreq = 'daily';
  } else if (daysSincePublished <= 30) {
    changefreq = 'weekly';
  }
  
  // 優先度を動的に決定
  let priority = '0.5';
  if (daysSincePublished <= 7) {
    priority = '0.9';
  } else if (daysSincePublished <= 30) {
    priority = '0.7';
  }
  
  return {
    url: articleUrl,
    lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    changefreq,
    priority
  };
};

/**
 * パンくずリスト生成
 */
export const generateBreadcrumbs = (article: ArticleSEOData) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  const newsPath = NEWS_BASE_PATH === '/' ? '' : NEWS_BASE_PATH;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ホーム",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "ブログ",
        "item": `${baseUrl}${newsPath}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": getFullArticleUrl(article.slug, article.id, baseUrl)
      }
    ]
  };
};

/**
 * 読了時間計算（フロントエンド用）
 */
export const calculateReadingTime = (content: string): number => {
  const stripHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };
  
  const textOnly = stripHtml(content);
  const wordsPerMinute = 400; // 日本語の平均読書速度
  return Math.max(1, Math.ceil(textOnly.length / wordsPerMinute));
};

/**
 * SEO監査レポート生成
 */
export const generateSEOAudit = (article: ArticleSEOData) => {
  const { score, recommendations } = calculateSEOScore(article);
  const readingTime = calculateReadingTime(article.content);
  
  return {
    score,
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
    recommendations,
    metrics: {
      titleLength: article.seo_title?.length || article.title.length,
      descriptionLength: article.meta_description?.length || 0,
      readingTime,
      hasSlug: !!article.slug,
      hasFocusKeyword: !!article.focus_keyword,
      hasOgImage: !!(article.og_image || article.image_url),
      hasCanonicalUrl: !!article.canonical_url
    }
  };
};