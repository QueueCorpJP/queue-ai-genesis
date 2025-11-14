import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { marketingRoutes, type MarketingRoute } from '../src/ssr/routeList';

function getTemplateHtml(): string {
	// Try multiple possible paths for index.html in Vercel
	const possiblePaths = [
		path.join(process.cwd(), 'index.html'),
		path.join(process.cwd(), '..', 'index.html'),
		path.join(__dirname, '..', 'index.html'),
		path.join(__dirname, '..', '..', 'index.html'),
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

function resolvePrerenderPath(route: MarketingRoute) {
	const normalized = route === '/' ? '' : route.replace(/^\//, '');
	const distDir = path.join(process.cwd(), 'dist', 'prerender');
	return path.join(distDir, normalized, 'index.html');
}

function isMarketingRoute(route: string): route is MarketingRoute {
	return marketingRoutes.includes(route as MarketingRoute);
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

	if (!isMarketingRoute(normalizedPath)) {
		console.log('[SSR] Path not in prerender list:', normalizedPath);
		const html = getTemplateHtml();
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	}

	const filePath = resolvePrerenderPath(normalizedPath);
	try {
		const html = fs.readFileSync(filePath, 'utf8');
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
		return res.status(200).send(html);
	} catch (err) {
		console.error('[SSR] Failed to read prerendered HTML:', filePath, err);
		const html = getTemplateHtml();
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	}
}


