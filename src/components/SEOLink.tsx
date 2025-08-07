import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface SEOLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: React.ReactNode;
  external?: boolean;
  nofollow?: boolean;
  sponsored?: boolean;
  ugc?: boolean;
  title?: string;
  ariaLabel?: string;
  prefetch?: boolean;
}

const SEOLink: React.FC<SEOLinkProps> = ({
  to,
  children,
  external = false,
  nofollow = false,
  sponsored = false,
  ugc = false,
  title,
  ariaLabel,
  prefetch = false,
  className = '',
  ...props
}) => {
  // 外部リンクの判定
  const isExternal = external || to.startsWith('http') || to.startsWith('//');

  // rel属性の構築
  const buildRelAttribute = () => {
    const relParts: string[] = [];
    
    if (isExternal) {
      relParts.push('noopener');
      // セキュリティのためのnoreferrer（必要に応じて）
      if (nofollow || sponsored || ugc) {
        relParts.push('noreferrer');
      }
    }
    
    if (nofollow) relParts.push('nofollow');
    if (sponsored) relParts.push('sponsored');
    if (ugc) relParts.push('ugc');
    if (prefetch && !isExternal) relParts.push('prefetch');
    
    return relParts.length > 0 ? relParts.join(' ') : undefined;
  };

  const rel = buildRelAttribute();

  // 外部リンクの場合
  if (isExternal) {
    return (
      <a
        href={to}
        target="_blank"
        rel={rel}
        title={title}
        aria-label={ariaLabel}
        className={`hover:underline transition-colors ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }

  // 内部リンクの場合
  return (
    <Link
      to={to}
      title={title}
      aria-label={ariaLabel}
      className={`hover:underline transition-colors ${className}`}
      {...(rel && { rel })}
      {...props}
    >
      {children}
    </Link>
  );
};

// よく使用される内部リンクのプリセット
export const InternalLinks = {
  home: '/',
  about: '/about',
  company: '/company',
  services: '/services',
  products: '/products',
  workmate: '/products/workmate',
  news: '/news',
  caseStudies: '/case-studies',
  contact: '/contact',
  consultation: '/consultation',
  careers: '/careers',
  whyQueue: '/why-queue',
  terms: '/terms',
  privacy: '/privacy',
} as const;

// SEO最適化されたナビゲーションリンクコンポーネント
export const NavSEOLink: React.FC<{
  to: keyof typeof InternalLinks | string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  isActive?: boolean;
}> = ({ to, children, className = '', activeClassName = '', isActive = false }) => {
  const href = typeof to === 'string' && to in InternalLinks 
    ? InternalLinks[to as keyof typeof InternalLinks] 
    : to;

  return (
    <SEOLink
      to={href}
      className={`${className} ${isActive ? activeClassName : ''}`}
      prefetch={true}
    >
      {children}
    </SEOLink>
  );
};

export default SEOLink;