import { useEffect } from 'react';

interface PerformanceMonitorProps {
  enableReporting?: boolean;
  sampleRate?: number;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enableReporting = false,
  sampleRate = 0.1,
}) => {
  useEffect(() => {
    // Core Web Vitals監視
    const observePerformance = () => {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            if (enableReporting && Math.random() < sampleRate) {
              console.log('LCP:', lastEntry.startTime);
              // 本番環境では分析サービスに送信
              // analytics.track('core_web_vitals', {
              //   metric: 'LCP',
              //   value: lastEntry.startTime,
              //   page: window.location.pathname
              // });
            }
          });
          
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (error) {
          console.warn('LCP observation failed:', error);
        }

        // First Input Delay (FID)
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (enableReporting && Math.random() < sampleRate) {
                console.log('FID:', entry.processingStart - entry.startTime);
                // analytics.track('core_web_vitals', {
                //   metric: 'FID',
                //   value: entry.processingStart - entry.startTime,
                //   page: window.location.pathname
                // });
              }
            });
          });
          
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (error) {
          console.warn('FID observation failed:', error);
        }

        // Cumulative Layout Shift (CLS)
        try {
          let clsValue = 0;
          let clsEntries: PerformanceEntry[] = [];
          
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                clsEntries.push(entry);
              }
            });
            
            if (enableReporting && Math.random() < sampleRate) {
              console.log('CLS:', clsValue);
              // analytics.track('core_web_vitals', {
              //   metric: 'CLS',
              //   value: clsValue,
              //   page: window.location.pathname
              // });
            }
          });
          
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (error) {
          console.warn('CLS observation failed:', error);
        }
      }

      // Navigation Timing API
      if ('performance' in window && 'getEntriesByType' in performance) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            
            if (navigation && enableReporting && Math.random() < sampleRate) {
              const metrics = {
                // Time to First Byte
                ttfb: navigation.responseStart - navigation.fetchStart,
                // DOM Content Loaded
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                // Load Complete
                loadComplete: navigation.loadEventEnd - navigation.navigationStart,
                // DNS Lookup
                dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                // TCP Connection
                tcpConnection: navigation.connectEnd - navigation.connectStart,
              };
              
              console.log('Navigation Metrics:', metrics);
              // analytics.track('navigation_timing', {
              //   ...metrics,
              //   page: window.location.pathname
              // });
            }
          }, 0);
        });
      }

      // Resource Timing API
      if ('performance' in window && 'getEntriesByType' in performance) {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name.includes('.js') || entry.name.includes('.css') || entry.name.includes('.png') || entry.name.includes('.jpg') || entry.name.includes('.webp')) {
              if (enableReporting && Math.random() < sampleRate) {
                console.log('Resource Load Time:', {
                  name: entry.name,
                  duration: entry.duration,
                  size: entry.transferSize,
                });
                // analytics.track('resource_timing', {
                //   resource: entry.name,
                //   duration: entry.duration,
                //   size: entry.transferSize,
                //   page: window.location.pathname
                // });
              }
            }
          });
        });
        
        try {
          resourceObserver.observe({ type: 'resource', buffered: true });
        } catch (error) {
          console.warn('Resource observation failed:', error);
        }
      }
    };

    // 遅延実行でパフォーマンスへの影響を最小化
    const timeoutId = setTimeout(observePerformance, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enableReporting, sampleRate]);

  // パフォーマンスヒント用のリソースヒント追加
  useEffect(() => {
    const addResourceHints = () => {
      // DNS prefetch for external domains
      const dnsPrefetchDomains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdn.gpteng.co',
      ];

      dnsPrefetchDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      });

      // Preconnect to critical domains
      const preconnectDomains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ];

      preconnectDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    };

    addResourceHints();
  }, []);

  return null;
};

export default PerformanceMonitor;