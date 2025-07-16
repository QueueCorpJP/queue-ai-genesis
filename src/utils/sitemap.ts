interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

interface NewsArticle {
  id: string;
  title: string;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
}

export const generateSitemap = async (articles: NewsArticle[] = []): Promise<string> => {
  const baseUrl = 'https://queue-tech.jp';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'weekly' as const, priority: 1.0 },
    { path: '/about', changefreq: 'monthly' as const, priority: 0.8 },
    { path: '/services', changefreq: 'weekly' as const, priority: 0.9 },
    { path: '/products', changefreq: 'weekly' as const, priority: 0.9 },
    { path: '/products/prompty', changefreq: 'monthly' as const, priority: 0.7 },
    { path: '/products/workmate', changefreq: 'monthly' as const, priority: 0.7 },
    { path: '/news', changefreq: 'daily' as const, priority: 0.8 },
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
    urls.push({
      url: `${baseUrl}/news/${article.id}`,
      lastmod: new Date(article.updated_at).toISOString(),
      changefreq: 'monthly',
      priority: 0.6
    });
  });

  // Generate XML
  const xmlUrls = urls.map(url => `
  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${xmlUrls}
</urlset>`;
};

export const generateNewsSitemap = async (articles: NewsArticle[] = []): Promise<string> => {
  const baseUrl = 'https://queue-tech.jp';
  
  const publishedArticles = articles.filter(article => 
    article.status === 'published' && article.published_at
  );

  const newsUrls = publishedArticles.map(article => `
  <url>
    <loc>${baseUrl}/news/${article.id}</loc>
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
  </url>`).join('');

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

  const rssItems = publishedArticles.map(article => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${baseUrl}/news/${article.id}</link>
      <guid>${baseUrl}/news/${article.id}</guid>
      <pubDate>${new Date(article.published_at!).toUTCString()}</pubDate>
      <author>queue@queue-tech.jp (Queue株式会社)</author>
      <category>AI・テクノロジー</category>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Queue株式会社 ニュース</title>
    <link>${baseUrl}/news</link>
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