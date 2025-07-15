
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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
