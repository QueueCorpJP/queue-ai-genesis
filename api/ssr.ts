import type { VercelRequest, VercelResponse } from '@vercel/node';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import fs from 'fs';
import path from 'path';
import { Providers } from '../src/ssr/Providers';

// Import page components for static routes we can safely SSR
import Index from '../src/pages/Index';
import About from '../src/pages/About';
import Company from '../src/pages/Company';
import Careers from '../src/pages/Careers';
import Contact from '../src/pages/Contact';
import Consultation from '../src/pages/Consultation';
import Terms from '../src/pages/Terms';
import Privacy from '../src/pages/Privacy';
import Products from '../src/pages/Products';
import ProductWorkmate from '../src/pages/ProductWorkmate';
import CaseStudies from '../src/pages/CaseStudies';
import Services from '../src/pages/Services';
import WhyQueue from '../src/pages/WhyQueue';

const routeToComponent: Record<string, React.FC> = {
	'/': Index,
	'/about': About,
	'/company': Company,
	'/careers': Careers,
	'/contact': Contact,
	'/consultation': Consultation,
	'/terms': Terms,
	'/privacy': Privacy,
	'/products': Products,
	'/products/workmate': ProductWorkmate,
	'/case-studies': CaseStudies,
	'/services': Services,
	'/why-queue': WhyQueue,
};

function getTemplateHtml(): string {
	// Try multiple possible paths for index.html in Vercel / static builds.
	// Avoid using __dirname because this file can be bundled as an ES module
	// where __dirname is not defined.
	const possiblePaths = [
		path.join(process.cwd(), 'index.html'),
		path.join(process.cwd(), 'dist', 'index.html'),
		path.join(process.cwd(), '..', 'index.html'),
		path.join(process.cwd(), '..', 'dist', 'index.html'),
	];

	for (const htmlPath of possiblePaths) {
		try {
			if (fs.existsSync(htmlPath)) {
				const content = fs.readFileSync(htmlPath, 'utf8');
				console.log('[SSR] Found index.html at:', htmlPath);
				return content;
			}
		} catch (err) {
			console.log('[SSR] Failed to read:', htmlPath, err);
		}
	}

	console.warn('[SSR] Could not find index.html, using fallback');
	// Minimal fallback HTML if index.html isn't readable in the serverless bundle
	return [
		'<!DOCTYPE html>',
		'<html lang="ja"><head>',
		'<meta charSet="UTF-8"/>',
		'<meta name="viewport" content="width=device-width, initial-scale=1"/>',
		'<title>Queue株式会社</title>',
		'<link rel="icon" type="image/png" href="/Queue.png"/>',
		'</head><body>',
		'<div id="root"></div>',
		'</body></html>'
	].join('');
}

function isBot(userAgent: string | undefined): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	return /bot|crawler|spider|bing|google|duckduckbot|baidu|yandex|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|slackbot|vkShare|W3C_Validator|redditbot|applebot|whatsapp|telegrambot|googlebot/i.test(ua);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Check user-agent as fallback (in case rewrite didn't catch it)
	const userAgent = req.headers['user-agent'] || '';
	if (!isBot(userAgent)) {
		console.log('[SSR] Not a bot, serving base HTML. User-Agent:', userAgent);
		const html = getTemplateHtml();
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	}

	// Get path from query parameter (passed by Vercel rewrite) or from URL
	let pathname = (req.query.path as string) || req.url?.split('?')[0] || '/';
	// Handle empty path (root route)
	if (!pathname || pathname === '' || pathname === 'undefined') {
		pathname = '/';
	}
	// Normalize pathname - ensure it starts with /
	const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

	console.log('[SSR] Rendering path:', normalizedPath, 'Query:', req.query, 'URL:', req.url);

	const Component = routeToComponent[normalizedPath];
	if (!Component) {
		console.log('[SSR] No component found for path:', normalizedPath, 'Available routes:', Object.keys(routeToComponent));
		// For routes we don't SSR, fall back to serving the base HTML so static hosting can handle it
		const html = getTemplateHtml();
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	}

	try {
		console.log('[SSR] Starting renderToString for:', normalizedPath);
		const appHtml = renderToString(
			<Providers>
				<StaticRouter location={normalizedPath}>
					<Component />
				</StaticRouter>
			</Providers>
		);

		console.log('[SSR] Render complete, HTML length:', appHtml.length);

		let html = getTemplateHtml();
		console.log('[SSR] Template HTML length:', html.length);
		
		// Inject SSR markup - handle various formats
		const rootDivPatterns = [
			/<div id="root"><\/div>/,
			/<div id="root">\s*<\/div>/,
			/<div id=['"]root['"]><\/div>/,
			/<div id=['"]root['"]>\s*<\/div>/,
		];

		let replaced = false;
		for (const pattern of rootDivPatterns) {
			if (pattern.test(html)) {
				html = html.replace(pattern, `<div id="root">${appHtml}</div>`);
				replaced = true;
				console.log('[SSR] Successfully injected HTML using pattern:', pattern);
				break;
			}
		}

		if (!replaced) {
			console.warn('[SSR] Could not find root div to replace, appending instead');
			html = html.replace('</body>', `<div id="root">${appHtml}</div></body>`);
		}

		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
		console.log('[SSR] Sending response, final HTML length:', html.length);
		return res.status(200).send(html);
	} catch (err) {
		console.error('[SSR] Render error:', err);
		if (err instanceof Error) {
			console.error('[SSR] Error stack:', err.stack);
		}
		// Fallback to base HTML on error
		const html = getTemplateHtml();
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	}
}


