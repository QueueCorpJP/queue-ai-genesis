
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './pages/blog-content.css'
import { initQuillPolyfill, suppressQuillWarnings } from './utils/quillPolyfill'

// Suppress Chrome extension errors in development and production
const suppressChromeExtensionErrors = () => {
  window.addEventListener('error', (event) => {
    // Chrome extension related errors
    const errorMessage = event.message || '';
    const errorSource = event.filename || '';
    const errorStack = event.error?.stack || '';
    
    if (errorMessage.includes('Could not establish connection') ||
        errorMessage.includes('Receiving end does not exist') ||
        errorMessage.includes('No tab with id') ||
        errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('runtime.lastError') ||
        errorSource.includes('service-worker-loader.js') ||
        errorSource.includes('extension') ||
        errorSource.includes('chrome-extension://') ||
        errorStack.includes('chrome-extension://') ||
        errorStack.includes('service-worker') ||
        errorStack.includes('content_script')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    // Chrome extension related promise rejections
    const reason = event.reason;
    const message = reason?.message || reason?.toString?.() || '';
    const stack = reason?.stack || '';
    
    if (message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('No tab with id') ||
        message.includes('Extension context invalidated') ||
        message.includes('runtime.lastError') ||
        stack.includes('chrome-extension://') ||
        stack.includes('service-worker') ||
        stack.includes('content_script')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Suppress console errors from Chrome extensions
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args) => {
    const message = args.join(' ').toString();
    if (message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('No tab with id') ||
        message.includes('Extension context invalidated') ||
        message.includes('runtime.lastError') ||
        message.includes('The message port closed before a response was received') ||
        message.includes('chrome-extension://') ||
        message.includes('service-worker-loader.js')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args.join(' ').toString();
    if (message.includes('Multiple GoTrueClient instances detected') ||
        message.includes('chrome-extension://') ||
        message.includes('service-worker')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
};

// Apply error suppression and polyfills
suppressChromeExtensionErrors();
initQuillPolyfill();
suppressQuillWarnings();

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
