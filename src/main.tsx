
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress Chrome extension errors in development
if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Could not establish connection') ||
        event.message?.includes('Receiving end does not exist') ||
        event.filename?.includes('service-worker-loader.js')) {
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Could not establish connection') ||
        event.reason?.message?.includes('Receiving end does not exist')) {
      event.preventDefault();
    }
  });
}

// Set global meta description for SEO
const setMetaDescription = () => {
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 'Queue株式会社｜AI技術で企業のDXを加速。AI受託開発、LLMソリューション、AIコンサルティングなど、最先端のAIサービスを提供。');
  }
};

// Create or update canonical link
const setCanonicalLink = () => {
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', window.location.href.split('?')[0]);
};

// Initialize SEO elements
setMetaDescription();
setCanonicalLink();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
