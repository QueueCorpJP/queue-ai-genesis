import fs from 'fs/promises';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import { Providers } from '../src/ssr/Providers';
import { marketingRoutes, type MarketingRoute } from '../src/ssr/routeList';
import { routeToComponent } from '../src/ssr/routes';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');
const OUTPUT_DIR = path.join(DIST_DIR, 'prerender');

const ROOT_PATTERNS = [
	/<div id="root"><\/div>/,
	/<div id="root">\s*<\/div>/,
	/<div id=['"]root['"]><\/div>/,
	/<div id=['"]root['"]>\s*<\/div>/,
];

async function loadTemplate() {
	try {
		return await fs.readFile(TEMPLATE_PATH, 'utf8');
	} catch (error) {
		throw new Error(`[prerender] Failed to read template HTML at ${TEMPLATE_PATH}: ${(error as Error).message}`);
	}
}

function injectHtml(template: string, appHtml: string) {
	for (const pattern of ROOT_PATTERNS) {
		if (pattern.test(template)) {
			return template.replace(pattern, `<div id="root">${appHtml}</div>`);
		}
	}

	return template.replace('</body>', `<div id="root">${appHtml}</div></body>`);
}

function createOutputPath(route: string) {
	const trimmed = route.replace(/^\/+/, '');
	const segments = trimmed.length > 0 ? trimmed.split('/') : [];
	return path.join(OUTPUT_DIR, ...segments);
}

async function renderRoute(route: MarketingRoute, template: string) {
	const Component = routeToComponent[route];
	if (!Component) {
		console.warn(`[prerender] No component found for ${route}, skipping.`);
		return;
	}

	const appHtml = renderToString(
		<Providers>
			<StaticRouter location={route}>
				<Component />
			</StaticRouter>
		</Providers>
	);

	const finalHtml = injectHtml(template, appHtml);
	const targetDir = createOutputPath(route);
	await fs.mkdir(targetDir, { recursive: true });
	await fs.writeFile(path.join(targetDir, 'index.html'), finalHtml, 'utf8');
	console.log(`[prerender] Generated ${path.relative(DIST_DIR, path.join(targetDir, 'index.html'))}`);
}

async function main() {
	console.log('[prerender] Starting static render pipeline...');
	const template = await loadTemplate();
	await fs.rm(OUTPUT_DIR, { recursive: true, force: true });

	for (const route of marketingRoutes) {
		await renderRoute(route, template);
	}

	console.log('[prerender] Completed rendering static routes.');
}

main().catch((error) => {
	console.error('[prerender] Failed to render static routes:', error);
	process.exit(1);
});


