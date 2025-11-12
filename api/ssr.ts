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
	const rootIndexPath = path.join(process.cwd(), 'index.html');
	try {
		return fs.readFileSync(rootIndexPath, 'utf8');
	} catch {
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const url = req.url || '/';
	const pathname = url.split('?')[0] || '/';

	const Component = routeToComponent[pathname];
	if (!Component) {
		// For routes we don't SSR, fall back to serving the base HTML so static hosting can handle it
		const html = getTemplateHtml();
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	}

	try {
		const appHtml = renderToString(
			<Providers>
				<StaticRouter location={pathname}>
					<Component />
				</StaticRouter>
			</Providers>
		);

		let html = getTemplateHtml();
		// Inject SSR markup
		html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		return res.status(200).send(html);
	} catch (err) {
		console.error('SSR render error:', err);
		return res.status(500).send('Internal Server Error');
	}
}


