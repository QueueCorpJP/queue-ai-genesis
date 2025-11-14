import React from 'react';

import Index from '@/pages/Index';
import About from '@/pages/About';
import Company from '@/pages/Company';
import Careers from '@/pages/Careers';
import Contact from '@/pages/Contact';
import Consultation from '@/pages/Consultation';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Products from '@/pages/Products';
import ProductWorkmate from '@/pages/ProductWorkmate';
import CaseStudies from '@/pages/CaseStudies';
import Services from '@/pages/Services';
import WhyQueue from '@/pages/WhyQueue';
import type { MarketingRoute } from './routeList';
import { marketingRoutes } from './routeList';

export const routeToComponent: Record<MarketingRoute, React.FC> = {
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

export { marketingRoutes };


