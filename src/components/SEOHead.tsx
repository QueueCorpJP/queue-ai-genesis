import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
  articleType?: 'website' | 'article' | 'product' | 'service';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Queue株式会社 | 「Queue株式会社に任せればいける」——その確信を30分で。",
  description = "初回商談で、貴社の業務に合わせたプロトタイプ型デモをその場で提示。Queueの「即体感デモ」は、「まだ検討中」を「もう任せたい」へと変えます。",
  keywords = "キュー株式会社,Queue株式会社,AI駆動開発,プロンプトエンジニアリング,AI開発,プロトタイプ制作,デジタル変革,DX,人工知能,機械学習,自動化,イノベーション,テクノロジー",
  ogTitle,
  ogDescription,
  ogImage = "/Queue.png",
  canonicalUrl,
  structuredData,
  articleType = 'website',
  publishedTime,
  modifiedTime,
  author = 'Queue株式会社',
  breadcrumbs
}) => {
  useEffect(() => {
    const siteUrl = "https://queue-tech.jp";
    const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

    // ページタイトルを設定
    document.title = title;

    // 言語設定
    document.documentElement.setAttribute('lang', 'ja');

    // 既存のSEOメタタグを削除
    const existingMetas = document.querySelectorAll(
      'meta[name="description"], meta[name="keywords"], meta[name="author"], meta[name="robots"], ' +
      'meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], ' +
      'script[type="application/ld+json"][data-seo="true"]'
    );
    existingMetas.forEach(meta => meta.remove());

    // メタタグ作成ヘルパー関数
    const createMeta = (name: string, content: string, isProperty = false) => {
      const meta = document.createElement('meta');
      if (isProperty) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      meta.setAttribute('content', content);
      return meta;
    };

    // 基本メタタグ
    document.head.appendChild(createMeta('description', description));
    document.head.appendChild(createMeta('keywords', keywords));
    document.head.appendChild(createMeta('author', author));
    document.head.appendChild(createMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'));
    document.head.appendChild(createMeta('language', 'Japanese'));
    document.head.appendChild(createMeta('revisit-after', '7 days'));
    document.head.appendChild(createMeta('theme-color', '#2563eb'));
    document.head.appendChild(createMeta('msapplication-TileColor', '#2563eb'));
    document.head.appendChild(createMeta('application-name', 'Queue株式会社'));
    
    // パフォーマンス最適化のためのメタタグ
    document.head.appendChild(createMeta('format-detection', 'telephone=no'));
    document.head.appendChild(createMeta('mobile-web-app-capable', 'yes'));
    document.head.appendChild(createMeta('apple-mobile-web-app-capable', 'yes'));
    document.head.appendChild(createMeta('apple-mobile-web-app-status-bar-style', 'black-translucent'));
    
    // セキュリティ関連のメタタグ
    document.head.appendChild(createMeta('referrer', 'strict-origin-when-cross-origin'));
    
    // 記事の時間情報
    if (publishedTime) {
      document.head.appendChild(createMeta('article:published_time', publishedTime, true));
    }
    if (modifiedTime) {
      document.head.appendChild(createMeta('article:modified_time', modifiedTime, true));
    }
    if (author && articleType === 'article') {
      document.head.appendChild(createMeta('article:author', author, true));
    }

    // Canonical URL
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', fullCanonicalUrl);
    document.head.appendChild(canonical);

    // Open Graph メタタグ
    const ogMetas = [
      { property: 'og:type', content: articleType },
      { property: 'og:url', content: fullCanonicalUrl },
      { property: 'og:title', content: ogTitle || title },
      { property: 'og:description', content: ogDescription || description },
      { property: 'og:image', content: fullOgImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: ogTitle || title },
      { property: 'og:site_name', content: 'Queue株式会社' },
      { property: 'og:locale', content: 'ja_JP' }
    ];
    
    // 記事の場合は追加のOGタグ
    if (articleType === 'article' && publishedTime) {
      ogMetas.push({ property: 'article:published_time', content: publishedTime });
    }
    if (articleType === 'article' && modifiedTime) {
      ogMetas.push({ property: 'article:modified_time', content: modifiedTime });
    }
    if (articleType === 'article' && author) {
      ogMetas.push({ property: 'article:author', content: author });
    }

    ogMetas.forEach(({ property, content }) => {
      document.head.appendChild(createMeta(property, content, true));
    });

    // Twitter メタタグ
    const twitterMetas = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:url', content: fullCanonicalUrl },
      { name: 'twitter:title', content: ogTitle || title },
      { name: 'twitter:description', content: ogDescription || description },
      { name: 'twitter:image', content: fullOgImage }
    ];

    twitterMetas.forEach(({ name, content }) => {
      document.head.appendChild(createMeta(name, content));
    });

    // 構造化データ
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // パンくずリストの構造化データ
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.url.startsWith('http') ? crumb.url : `${siteUrl}${crumb.url}`
        }))
      };

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.setAttribute('data-seo', 'true');
      breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
      document.head.appendChild(breadcrumbScript);
    }

    // 会社の基本構造化データ
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Queue株式会社",
      "alternateName": ["キュー株式会社", "キュー", "Queue"],
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/Queue.png`,
        "width": 200,
        "height": 200
      },
      "description": "AI駆動開発でビジネスを革新するテクノロジー企業",
      "foundingDate": "2020",
      "industry": "人工知能・ソフトウェア開発",
      "keywords": "AI駆動開発,プロンプトエンジニアリング,AI開発,DX,人工知能",
      "sameAs": [
        "https://github.com/QueueCorpJP"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Japanese", "English"],
        "url": `${siteUrl}/contact`
      }
    };

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.setAttribute('data-seo', 'true');
    orgScript.textContent = JSON.stringify(organizationData);
    document.head.appendChild(orgScript);

    // Preconnect リンク
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
      const metasToRemove = document.querySelectorAll(
        'meta[name="description"], meta[name="keywords"], meta[name="author"], meta[name="robots"], ' +
        'meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"][data-seo="true"]'
      );
      metasToRemove.forEach(meta => meta.remove());
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, structuredData]);

  return null; // DOM操作のみでJSXは返さない
};

export default SEOHead; 