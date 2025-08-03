import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  articleSection?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
  // 新規追加フィールド
  content?: string; // 記事本文（読み時間計算用）
  readingTimeMinutes?: number;
  wordCount?: number;
  breadcrumbs?: { name: string; url: string }[];
  faqItems?: { question: string; answer: string }[];
  alternateUrls?: { lang: string; url: string }[];
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Queue株式会社 | AI駆動で、圧倒的スピードと品質を。',
  description = 'Queue株式会社｜AI技術で企業のDXを加速。AI受託開発、LLMソリューション、AIコンサルティングなど、最先端のAIサービスを提供。',
  keywords = 'Queue株式会社,Queue,キュー,AI開発,AI受託開発,生成AI,LLM,GenAI,プロンプトエンジニアリング,AI導入支援,Prompty,Workmate',
  author = 'Queue株式会社',
  image = 'https://queue-tech.jp/Queue.png',
  url = 'https://queue-tech.jp/',
  type = 'website',
  publishedTime,
  modifiedTime,
  tags = [],
  articleSection,
  noIndex = false,
  canonicalUrl,
  structuredData,
  content,
  readingTimeMinutes,
  wordCount,
  breadcrumbs = [],
  faqItems = [],
  alternateUrls = []
}) => {
  const siteTitle = 'Queue株式会社';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
  const baseUrl = 'https://queue-tech.jp';
  
  // Generate article keywords from tags
  const articleKeywords = tags.length > 0 ? `${keywords},${tags.join(',')}` : keywords;
  
  // 自動的に読み時間を計算（日本語対応）
  const calculateReadingTime = (text?: string): number => {
    if (!text) return 1;
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    const japaneseWordsPerMinute = 400; // 日本語の平均読書速度
    return Math.max(1, Math.ceil(cleanText.length / japaneseWordsPerMinute));
  };

  const estimatedReadingTime = readingTimeMinutes || calculateReadingTime(content);
  const estimatedWordCount = wordCount || (content ? content.replace(/<[^>]*>/g, '').length : 0);

  // 組織の構造化データ
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Queue株式会社",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/Queue.png`,
      "width": 200,
      "height": 200
    },
    "sameAs": [
      "https://twitter.com/queuetechjp",
      "https://github.com/QueueCorpJP"
    ],
    "description": "AI技術で企業のDXを加速する先進的なテクノロジー企業",
    "foundingDate": "2020",
    "industry": "人工知能・ソフトウェア開発",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+81-3-XXXX-XXXX",
      "contactType": "customer service",
      "availableLanguage": ["Japanese", "English"]
    }
  };

  // ブログポスト/記事の構造化データ
  const createArticleStructuredData = () => {
    if (type !== 'article') return null;

    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": description,
      "image": {
        "@type": "ImageObject",
        "url": image,
        "width": 1200,
        "height": 630
      },
      "author": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/Queue.png`,
          "width": 200,
          "height": 200
        }
      },
      "publisher": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/Queue.png`,
          "width": 200,
          "height": 200
        }
      },
      "datePublished": publishedTime,
      "dateModified": modifiedTime || publishedTime,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      },
      "url": url,
      "keywords": tags.join(', '),
      "articleSection": articleSection || "テクノロジー",
      "inLanguage": "ja-JP",
      "wordCount": estimatedWordCount,
      "timeRequired": `PT${estimatedReadingTime}M`,
      "isPartOf": {
        "@type": "Blog",
        "name": "Queue株式会社ブログ",
        "url": `${baseUrl}/news`
      },
      "about": {
        "@type": "Thing",
        "name": "人工知能",
        "description": "AI技術と機械学習に関する専門的な知見"
      },
      "mentions": tags.map(tag => ({
        "@type": "Thing",
        "name": tag
      }))
    };
  };

  // パンくずリストの構造化データ
  const createBreadcrumbStructuredData = () => {
    if (breadcrumbs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
  };

  // FAQ構造化データ
  const createFAQStructuredData = () => {
    if (faqItems.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };
  };

  // WebSite構造化データ（サイト検索機能付き）
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Queue株式会社",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/news?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // 全ての構造化データを統合
  const allStructuredData = [
    organizationStructuredData,
    websiteStructuredData,
    createArticleStructuredData(),
    createBreadcrumbStructuredData(),
    createFAQStructuredData(),
    structuredData
  ].filter(Boolean);

  // DOM操作でSEOメタタグを設定
  useEffect(() => {
    // ページタイトルを設定
    document.title = fullTitle;

    // 言語設定
    document.documentElement.setAttribute('lang', 'ja');

    // 既存のメタタグを削除
    const existingMetas = document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[name="author"], meta[name="robots"], meta[name="googlebot"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"], script[type="application/ld+json"][data-seo="true"]');
    existingMetas.forEach(meta => meta.remove());

    // Basic Meta Tags
    const createMeta = (name: string, content: string, property = false) => {
      const meta = document.createElement('meta');
      if (property) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      meta.setAttribute('content', content);
      return meta;
    };

    // Description（155文字以内に調整）
    let trimmedDescription = description;
    if (trimmedDescription.length > 155) {
      trimmedDescription = trimmedDescription.substring(0, 152) + '...';
    }

    document.head.appendChild(createMeta('description', trimmedDescription));
    document.head.appendChild(createMeta('keywords', articleKeywords));
    document.head.appendChild(createMeta('author', author));
    
    // Robots
    document.head.appendChild(createMeta('robots', noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'));
    document.head.appendChild(createMeta('googlebot', 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'));
    
    // Performance and Security
    document.head.appendChild(createMeta('theme-color', '#0a2540'));
    document.head.appendChild(createMeta('msapplication-TileColor', '#0a2540'));
    document.head.appendChild(createMeta('format-detection', 'telephone=no'));

    // Canonical URL
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', canonicalUrl || url);
    document.head.appendChild(canonical);

    // RSS Feed
    const rss = document.createElement('link');
    rss.setAttribute('rel', 'alternate');
    rss.setAttribute('type', 'application/rss+xml');
    rss.setAttribute('title', 'Queue株式会社 ニュース');
    rss.setAttribute('href', `${baseUrl}/rss.xml`);
    document.head.appendChild(rss);

    // Open Graph
    const ogMetas = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: trimmedDescription },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: siteTitle },
      { property: 'og:locale', content: 'ja_JP' }
    ];

    // Article specific Open Graph
    if (type === 'article') {
      if (publishedTime) ogMetas.push({ property: 'article:published_time', content: publishedTime });
      if (modifiedTime) ogMetas.push({ property: 'article:modified_time', content: modifiedTime });
      if (articleSection) ogMetas.push({ property: 'article:section', content: articleSection });
      ogMetas.push({ property: 'article:author', content: author });
      tags.forEach(tag => {
        ogMetas.push({ property: 'article:tag', content: tag });
      });
    }

    ogMetas.forEach(({ property, content }) => {
      document.head.appendChild(createMeta(property, content, true));
    });

    // Twitter Card
    const twitterMetas = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: trimmedDescription },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: title },
      { name: 'twitter:site', content: '@queuetechjp' },
      { name: 'twitter:creator', content: '@queuetechjp' }
    ];

    // Article specific Twitter Card
    if (type === 'article' && estimatedReadingTime) {
      twitterMetas.push({ name: 'twitter:label1', content: '読了時間' });
      twitterMetas.push({ name: 'twitter:data1', content: `${estimatedReadingTime}分` });
    }

    twitterMetas.forEach(({ name, content }) => {
      document.head.appendChild(createMeta(name, content));
    });

    // Structured Data
    allStructuredData.forEach((data, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'true');
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    });

    // Preconnect for performance
    const preconnects = [
      { href: 'https://fonts.googleapis.com' },
      { href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
    ];

    preconnects.forEach(({ href, crossOrigin }) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'preconnect');
      link.setAttribute('href', href);
      if (crossOrigin) link.setAttribute('crossorigin', crossOrigin);
      document.head.appendChild(link);
    });

    // クリーンアップ関数
    return () => {
      // コンポーネントがアンマウントされる時にSEOタグをクリーンアップ
      const metasToRemove = document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"][data-seo="true"]');
      metasToRemove.forEach(meta => meta.remove());
    };
  }, [
    fullTitle, 
    description, 
    articleKeywords, 
    author, 
    image, 
    url, 
    type, 
    publishedTime, 
    modifiedTime, 
    tags, 
    articleSection, 
    noIndex, 
    canonicalUrl, 
    estimatedReadingTime,
    allStructuredData
  ]);

  return null; // DOM操作を使うため、JSXを返さない
};

export default SEOHead; 