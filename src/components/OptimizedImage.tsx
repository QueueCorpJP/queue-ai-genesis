import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false,
  sizes,
  quality = 80,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // WebP対応チェック
    const checkWebPSupport = () => {
      return new Promise<boolean>((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
          resolve(webP.height === 2);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });
    };

    const loadImage = async () => {
      try {
        const supportsWebP = await checkWebPSupport();
        let optimizedSrc = src;

        // WebP対応の場合は拡張子を変更
        if (supportsWebP && !src.includes('.webp') && !src.startsWith('data:')) {
          const extension = src.split('.').pop()?.toLowerCase();
          if (extension && ['jpg', 'jpeg', 'png'].includes(extension)) {
            optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          }
        }

        // 品質パラメータを追加（外部URLでない場合）
        if (!optimizedSrc.startsWith('http') && !optimizedSrc.startsWith('data:')) {
          const separator = optimizedSrc.includes('?') ? '&' : '?';
          optimizedSrc += `${separator}quality=${quality}`;
          
          if (width) {
            optimizedSrc += `&w=${width}`;
          }
          if (height) {
            optimizedSrc += `&h=${height}`;
          }
        }

        setImageSrc(optimizedSrc);
      } catch (error) {
        console.warn('Image optimization failed, using original source:', error);
        setImageSrc(src);
      }
    };

    loadImage();
  }, [src, width, height, quality]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    // フォールバックとして元の画像を試す
    if (imageSrc !== src) {
      setImageSrc(src);
      setHasError(false);
    }
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">画像を読み込めませんでした</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        // SEO最適化のための属性
        itemProp="image"
        // Core Web Vitals改善のための属性
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  );
};

export default OptimizedImage;