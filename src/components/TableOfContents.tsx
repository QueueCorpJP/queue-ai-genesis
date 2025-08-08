import React from 'react';
import { List } from 'lucide-react';

// 目次項目の型定義
type TableOfContentsItem = {
  level: number;
  title: string;
  anchor: string;
  order: number;
};

type TableOfContentsProps = {
  items: TableOfContentsItem[];
  style: 'numbered' | 'bulleted' | 'plain' | 'hierarchical';
  className?: string;
};

const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  items, 
  style = 'numbered', 
  className = '' 
}) => {

  // スムーズスクロール（改良版）
  const scrollToAnchor = (anchor: string) => {
    console.log(`Scrolling to anchor: ${anchor}`);
    const element = document.getElementById(anchor);
    
    if (element) {
      console.log(`Found element with ID: ${anchor}`);
      
      // scroll-margin-topが設定されている場合はそれを使用、なければデフォルト値
      const scrollMarginTop = parseInt(
        window.getComputedStyle(element).scrollMarginTop || '120px'
      );
      
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      // 確実にスクロール位置を調整
      setTimeout(() => {
        const currentScrollY = window.scrollY;
        const elementTop = element.getBoundingClientRect().top + currentScrollY;
        const finalPosition = Math.max(0, elementTop - scrollMarginTop);
        
        if (Math.abs(window.scrollY - finalPosition) > 10) {
          window.scrollTo({
            top: finalPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      console.warn(`Element with ID "${anchor}" not found`);
      
      // フォールバック: URLハッシュを使用
      window.location.hash = anchor;
    }
  };



  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* 目次タイトル */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <List className="h-5 w-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">目次</h2>
      </div>
      
      {/* 目次リスト */}
      <nav>
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li key={`${item.anchor}-${index}`} className="flex">
              <button
                onClick={() => scrollToAnchor(item.anchor)}
                className="w-full text-left flex items-start gap-3 p-2 rounded-md transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <span className="text-gray-600 font-medium min-w-[24px] flex-shrink-0">
                  {item.order}.
                </span>
                <span className="text-gray-700 leading-relaxed">
                  {item.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default TableOfContents;