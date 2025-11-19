import { getFullArticleUrl, NEWS_BASE_PATH } from '@/config/urls';

interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
  videos?: Array<{
    thumbnail_loc: string;
    title: string;
    description: string;
    content_loc?: string;
    duration?: number;
  }>;
}

interface NewsArticle {
  id: string;
  title: string;
  slug?: string | null;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
}

export const generateSitemap = async (articles: NewsArticle[] = []): Promise<string> => {
  const baseUrl = 'https://queue-tech.jp';
  const urls: SitemapUrl[] = [];
  const newsPath = NEWS_BASE_PATH === '/' ? '' : NEWS_BASE_PATH;

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'weekly' as const, priority: 1.0 },
    { path: '/about', changefreq: 'monthly' as const, priority: 0.8 },
    { path: '/services', changefreq: 'weekly' as const, priority: 0.9 },
    { path: '/products', changefreq: 'weekly' as const, priority: 0.9 },
  
    { path: '/products/workmate', changefreq: 'monthly' as const, priority: 0.7 },
    { path: newsPath || '/news', changefreq: 'daily' as const, priority: 0.8 },
    { path: '/case-studies', changefreq: 'weekly' as const, priority: 0.7 },
    { path: '/contact', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/consultation', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/careers', changefreq: 'monthly' as const, priority: 0.5 },
    { path: '/why-queue', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/company', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/privacy', changefreq: 'yearly' as const, priority: 0.3 },
    { path: '/terms', changefreq: 'yearly' as const, priority: 0.3 },
  ];

  // Add static pages
  staticPages.forEach(page => {
    urls.push({
      url: `${baseUrl}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Add published articles
  const publishedArticles = articles.filter(article => 
    article.status === 'published' && article.published_at
  );

  publishedArticles.forEach(article => {
    // Use configurable URL helper
    const articleUrl = getFullArticleUrl(article.slug, article.id, baseUrl);
    urls.push({
      url: articleUrl,
      lastmod: new Date(article.updated_at).toISOString(),
      changefreq: 'monthly',
      priority: 0.6
    });
  });

  // Generate XML
  const xmlUrls = urls.map(url => {
    let urlXml = `
  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>`;

    // Add image sitemap data if available
    if (url.images && url.images.length > 0) {
      url.images.forEach(image => {
        urlXml += `
    <image:image>
      <image:loc>${image.loc}</image:loc>`;
        if (image.caption) {
          urlXml += `
      <image:caption>${escapeXml(image.caption)}</image:caption>`;
        }
        if (image.title) {
          urlXml += `
      <image:title>${escapeXml(image.title)}</image:title>`;
        }
        urlXml += `
    </image:image>`;
      });
    }

    // Add video sitemap data if available
    if (url.videos && url.videos.length > 0) {
      url.videos.forEach(video => {
        urlXml += `
    <video:video>
      <video:thumbnail_loc>${video.thumbnail_loc}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.description)}</video:description>`;
        if (video.content_loc) {
          urlXml += `
      <video:content_loc>${video.content_loc}</video:content_loc>`;
        }
        if (video.duration) {
          urlXml += `
      <video:duration>${video.duration}</video:duration>`;
        }
        urlXml += `
    </video:video>`;
      });
    }

    urlXml += `
  </url>`;
    return urlXml;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${xmlUrls}
</urlset>`;
};

export const generateNewsSitemap = async (articles: NewsArticle[] = []): Promise<string> => {
  const baseUrl = 'https://queue-tech.jp';
  
  const publishedArticles = articles.filter(article => 
    article.status === 'published' && article.published_at
  );

  const newsUrls = publishedArticles.map(article => {
    const articleUrl = getFullArticleUrl(article.slug, article.id, baseUrl);
    return `
  <url>
    <loc>${articleUrl}</loc>
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

export const generateRSSFeed = async (articles: NewsArticle[] = []): Promise<string> => {
  const baseUrl = 'https://queue-tech.jp';
  
  const publishedArticles = articles
    .filter(article => article.status === 'published' && article.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
    .slice(0, 20); // Latest 20 articles

  const rssItems = publishedArticles.map(article => {
    const articleUrl = getFullArticleUrl(article.slug, article.id, baseUrl);
    return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid>${articleUrl}</guid>
      <pubDate>${new Date(article.published_at!).toUTCString()}</pubDate>
      <author>queue@queue-tech.jp (Queue株式会社)</author>
      <category>AI・テクノロジー</category>
    </item>`;
  }).join('');

  const newsPath = NEWS_BASE_PATH === '/' ? '' : NEWS_BASE_PATH;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Queue株式会社 ニュース</title>
    <link>${baseUrl}${newsPath}</link>
    <description>AI技術で企業のDXを加速するQueue株式会社の最新ニュース</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/Queue.png</url>
      <title>Queue株式会社</title>
      <link>${baseUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

export const saveSitemapToPublic = async (sitemapContent: string, filename: string = 'sitemap.xml'): Promise<void> => {
  // This would typically be handled by a build process or server-side function
  // For client-side, we can provide the content for download or API submission
  console.log(`Sitemap generated for ${filename}:`, sitemapContent);
}; 