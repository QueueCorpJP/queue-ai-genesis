// XMLサイトマップAPIエンドポイント
// 検索エンジンクロール最適化のためのサイトマップ提供機能

import { generateXMLSitemap, generateSitemapIndex, generateArticlesSitemap, generateStaticSitemap, generateRobotsTxt } from '@/utils/sitemapGenerator';

// Vercel Edge Functionまたは Express.js対応のサイトマップハンドラー

/**
 * メインサイトマップエンドポイント
 */
export const handleSitemap = async (request: Request): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // サイトマップインデックス
    if (pathname === '/sitemap.xml') {
      const sitemapXML = await generateXMLSitemap();
      
      return new Response(sitemapXML, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Vary': 'Accept-Encoding'
        }
      });
    }

    // サイトマップインデックス（大量記事対応）
    if (pathname === '/sitemap-index.xml') {
      const sitemapIndex = await generateSitemapIndex();
      
      return new Response(sitemapIndex, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Vary': 'Accept-Encoding'
        }
      });
    }

    // 静的ページサイトマップ
    if (pathname === '/sitemap-static.xml') {
      const staticSitemap = generateStaticSitemap();
      
      return new Response(staticSitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'Vary': 'Accept-Encoding'
        }
      });
    }

    // 記事サイトマップ（分割対応）
    const articlesSitemapMatch = pathname.match(/^\/sitemap-articles-(\d+)\.xml$/);
    if (articlesSitemapMatch) {
      const page = parseInt(articlesSitemapMatch[1], 10);
      const articlesSitemap = await generateArticlesSitemap(page);
      
      return new Response(articlesSitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Vary': 'Accept-Encoding'
        }
      });
    }

    // robots.txt
    if (pathname === '/robots.txt') {
      const robotsTxt = generateRobotsTxt();
      
      return new Response(robotsTxt, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        }
      });
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

/**
 * Express.js用のサイトマップルーター
 */
export const setupSitemapRoutes = (app: any) => {
  // XMLサイトマップ
  app.get('/sitemap.xml', async (req: any, res: any) => {
    try {
      const sitemapXML = await generateXMLSitemap();
      res.set({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Vary': 'Accept-Encoding'
      });
      res.send(sitemapXML);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // サイトマップインデックス
  app.get('/sitemap-index.xml', async (req: any, res: any) => {
    try {
      const sitemapIndex = await generateSitemapIndex();
      res.set({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Vary': 'Accept-Encoding'
      });
      res.send(sitemapIndex);
    } catch (error) {
      console.error('Sitemap index generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // 静的ページサイトマップ
  app.get('/sitemap-static.xml', (req: any, res: any) => {
    try {
      const staticSitemap = generateStaticSitemap();
      res.set({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Vary': 'Accept-Encoding'
      });
      res.send(staticSitemap);
    } catch (error) {
      console.error('Static sitemap generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // 記事サイトマップ（分割対応）
  app.get('/sitemap-articles-:page.xml', async (req: any, res: any) => {
    try {
      const page = parseInt(req.params.page, 10);
      if (isNaN(page) || page < 1) {
        return res.status(400).send('Invalid page number');
      }
      
      const articlesSitemap = await generateArticlesSitemap(page);
      res.set({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Vary': 'Accept-Encoding'
      });
      res.send(articlesSitemap);
    } catch (error) {
      console.error('Articles sitemap generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // robots.txt
  app.get('/robots.txt', (req: any, res: any) => {
    try {
      const robotsTxt = generateRobotsTxt();
      res.set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400'
      });
      res.send(robotsTxt);
    } catch (error) {
      console.error('Robots.txt generation error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
};

/**
 * Vite Dev Server用のミドルウェア
 */
export const sitemapMiddleware = (req: any, res: any, next: any) => {
  const url = req.url;

  if (url === '/sitemap.xml') {
    generateXMLSitemap().then(sitemapXML => {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(sitemapXML);
    }).catch(error => {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Internal Server Error');
    });
    return;
  }

  if (url === '/robots.txt') {
    const robotsTxt = generateRobotsTxt();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(robotsTxt);
    return;
  }

  next();
};