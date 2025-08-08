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

  // スムーズスクロール
  const scrollToAnchor = (anchor: string) => {
    const element = document.getElementById(anchor);
    if (element) {
      const headerOffset = 100; // ナビゲーションヘッダーの高さを考慮
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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

  // インデントレベルの計算
  const getIndentClass = (level: number) => {
    const baseIndent = style === 'hierarchical' ? (level - 1) * 4 : 0;
    return `ml-${baseIndent}`;
  };

  // 見出しレベルに応じたスタイル
  const getLevelStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'text-base font-semibold text-gray-900';
      case 2:
        return 'text-sm font-medium text-gray-800';
      case 3:
        return 'text-sm text-gray-700';
      case 4:
        return 'text-xs text-gray-600';
      case 5:
        return 'text-xs text-gray-500';
      case 6:
        return 'text-xs text-gray-500';
      default:
        return 'text-sm text-gray-700';
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className={`sticky top-20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-blue-600" />
            目次
          </div>
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
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          <nav>
            <ol className={`space-y-1 ${getListStyle()}`}>
              {items.map((item, index) => (
                <li
                  key={`${item.anchor}-${index}`}
                  className={`${getIndentClass(item.level)}`}
                >
                  <button
                    onClick={() => scrollToAnchor(item.anchor)}
                    className={`
                      w-full text-left p-2 rounded-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-700
                      ${activeAnchor === item.anchor ? 'bg-blue-100 text-blue-800 font-medium' : ''}
                      ${getLevelStyle(item.level)}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {style === 'numbered' && (
                        <span className="text-blue-600 font-medium text-xs mt-0.5">
                          {item.order}.
                        </span>
                      )}
                      {style === 'bulleted' && item.level <= 3 && (
                        <span className="text-blue-600 mt-1">
                          {item.level === 1 ? '●' : item.level === 2 ? '○' : '▪'}
                        </span>
                      )}
                      {style === 'hierarchical' && (
                        <Hash className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                      )}
                      <span className="flex-1 leading-relaxed">
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