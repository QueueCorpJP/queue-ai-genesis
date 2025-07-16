import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  articleSection?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Queue株式会社 | AI駆動で、圧倒的スピードと品質を。',
  description = 'Queue株式会社｜AI技術で企業のDXを加速。AI受託開発、LLMソリューション、AIコンサルティングなど、最先端のAIサービスを提供。',
  keywords = 'Queue株式会社,Queue,キュー,AI開発,AI受託開発,生成AI,LLM,GenAI,プロンプトエンジニアリング,AI導入支援,Prompty,Workmate',
  author = 'Queue株式会社',
  image = 'https://queue-tech.jp/Queue.png',
  url = 'https://queue-tech.jp/',
  type = 'website',
  publishedTime,
  modifiedTime,
  tags = [],
  articleSection,
  noIndex = false,
  canonicalUrl,
  structuredData
}) => {
  const siteTitle = 'Queue株式会社';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
  
  // Generate article keywords from tags
  const articleKeywords = tags.length > 0 ? `${keywords},${tags.join(',')}` : keywords;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={articleKeywords} />
      <meta name="author" content={author} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl || url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="ja_JP" />
      
      {/* Article specific Open Graph */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {articleSection && <meta property="article:section" content={articleSection} />}
          <meta property="article:author" content={author} />
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@queuetechjp" />
      <meta name="twitter:creator" content="@queuetechjp" />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#0a2540" />
      <meta name="msapplication-TileColor" content="#0a2540" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead; 