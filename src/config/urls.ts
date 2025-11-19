/**
 * URL Configuration
 * Configurable base path for news articles
 * 
 * Set VITE_NEWS_BASE_PATH environment variable to change the base path.
 * Examples:
 *   - VITE_NEWS_BASE_PATH=/news (default)
 *   - VITE_NEWS_BASE_PATH=/blog
 *   - VITE_NEWS_BASE_PATH=/ (root level)
 */

// Get base path from environment variable, default to '/news'
export const NEWS_BASE_PATH = import.meta.env.VITE_NEWS_BASE_PATH || '/news';

// Helper function to generate article URL
export const getArticleUrl = (slug?: string | null, id?: string): string => {
  const basePath = NEWS_BASE_PATH === '/' ? '' : NEWS_BASE_PATH;
  
  if (slug) {
    return `${basePath}/${slug}`;
  } else if (id) {
    return `${basePath}/id/${id}`;
  }
  return basePath || '/news';
};

// Helper function to generate article URL path (without domain)
export const getArticleUrlPath = (slug?: string | null, id?: string): string => {
  return getArticleUrl(slug, id);
};

// Helper function to generate full article URL with domain
export const getFullArticleUrl = (slug?: string | null, id?: string, baseUrl?: string): string => {
  const siteUrl = baseUrl || import.meta.env.VITE_SITE_URL || 'https://queue-tech.jp';
  const path = getArticleUrlPath(slug, id);
  return `${siteUrl}${path}`;
};

