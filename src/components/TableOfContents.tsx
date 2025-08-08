import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, List, Hash } from 'lucide-react';

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
  // 横幅いっぱい表示かどうかを判定
  const isFullWidth = className?.includes('w-full');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string>('');

  // アクティブな見出しの追跡
  useEffect(() => {
    const handleScroll = () => {
      const anchors = items.map(item => item.anchor);
      const currentAnchor = anchors.find(anchor => {
        const element = document.getElementById(anchor);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 0;
        }
        return false;
      });
      
      if (currentAnchor) {
        setActiveAnchor(currentAnchor);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

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

  // 目次スタイルの設定
  const getListStyle = () => {
    switch (style) {
      case 'numbered':
        return 'list-decimal';
      case 'bulleted':
        return 'list-disc';
      case 'plain':
        return 'list-none';
      case 'hierarchical':
        return 'list-none';
      default:
        return 'list-decimal';
    }
  };

  // インデントレベルの計算（Tailwindの動的クラス問題を解決）
  const getIndentStyle = (level: number) => {
    if (style === 'hierarchical') {
      const indentSize = (level - 1) * 16; // 16px = 1rem
      return { marginLeft: `${indentSize}px` };
    }
    return {};
  };

  // 見出しレベルに応じたスタイル（改善版）
  const getLevelStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'text-base font-bold text-gray-900 leading-6';
      case 2:
        return 'text-sm font-semibold text-gray-800 leading-5';
      case 3:
        return 'text-sm font-medium text-gray-700 leading-5';
      case 4:
        return 'text-sm text-gray-600 leading-5';
      case 5:
        return 'text-xs text-gray-500 leading-4';
      case 6:
        return 'text-xs text-gray-500 leading-4';
      default:
        return 'text-sm text-gray-700 leading-5';
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className={`${isFullWidth ? '' : 'sticky top-20'} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-blue-600" />
            目次
          </div>
          {!isFullWidth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0 pb-4">
          <nav>
            <ol className={`${getListStyle()} ${isFullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1' : 'space-y-0'}`}>
              {items.map((item, index) => (
                <li
                  key={`${item.anchor}-${index}`}
                  style={!isFullWidth ? getIndentStyle(item.level) : {}}
                  className={`${isFullWidth ? 'break-inside-avoid' : 'mb-1'}`}
                >
                  <button
                    onClick={() => scrollToAnchor(item.anchor)}
                    className={`
                      w-full text-left transition-all duration-300 
                      hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                      ${activeAnchor === item.anchor 
                        ? 'bg-blue-100 text-blue-800 font-medium shadow-sm border-l-4 border-blue-500' 
                        : 'hover:border-l-4 hover:border-blue-200'
                      }
                      ${getLevelStyle(item.level)}
                      border-l-4 border-transparent
                      ${isFullWidth ? 'px-2 py-1.5 rounded-md' : 'px-3 py-2.5 rounded-lg'}
                    `}
                  >
                    <div className={`flex items-start ${isFullWidth ? 'gap-2' : 'gap-3'}`}>
                      {style === 'numbered' && (
                        <span className={`text-blue-600 font-bold mt-0.5 ${isFullWidth ? 'text-xs min-w-[16px]' : 'text-sm min-w-[20px]'}`}>
                          {item.order}.
                        </span>
                      )}
                      {style === 'bulleted' && item.level <= 3 && (
                        <span className={`text-blue-600 mt-1 ${isFullWidth ? 'text-xs min-w-[12px]' : 'text-sm min-w-[16px]'}`}>
                          {item.level === 1 ? '●' : item.level === 2 ? '○' : '▪'}
                        </span>
                      )}
                      {style === 'hierarchical' && (
                        <Hash className={`text-blue-600 mt-0.5 flex-shrink-0 ${isFullWidth ? 'h-3 w-3' : 'h-4 w-4'}`} />
                      )}
                      <span className={`flex-1 leading-relaxed break-words ${isFullWidth && item.level > 1 ? 'pl-2' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </CardContent>
      )}
    </Card>
  );
};

export default TableOfContents;