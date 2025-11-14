export const marketingRoutes = [
	'/',
	'/about',
	'/company',
	'/careers',
	'/contact',
	'/consultation',
	'/terms',
	'/privacy',
	'/products',
	'/products/workmate',
	'/case-studies',
	'/services',
	'/why-queue',
] as const;

export type MarketingRoute = (typeof marketingRoutes)[number];


