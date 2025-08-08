// ReactQuill DOMNodeInserted警告対策用ポリフィル
// 廃止予定のDOMNodeInsertedイベントをMutation Observerで置き換え

/**
 * DOMNodeInserted警告を抑制し、Mutation Observerで代替する
 */
export const initQuillPolyfill = () => {
  // すでにポリフィルが適用されている場合はスキップ
  if ((window as any).__quillPolyfillApplied) return;

  // DOMNodeInsertedイベントリスナーの追加を無効化
  const originalAddEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function(type: string, listener: any, options?: any) {
    // DOMNodeInsertedイベントの場合は静かに代替実装
    if (type === 'DOMNodeInserted' || type === 'DOMNodeRemoved') {
      // MutationObserverで代替実装（警告なし）
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (type === 'DOMNodeInserted') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // DOMNodeInsertedイベントをシミュレート
                const event = new CustomEvent('DOMNodeInserted', {
                  detail: { target: node, relatedNode: mutation.target }
                });
                
                // リスナーが関数の場合は実行
                if (typeof listener === 'function') {
                  try {
                    listener.call(this, event);
                  } catch (error) {
                    // エラーも静かに処理
                  }
                }
              }
            });
          } else if (type === 'DOMNodeRemoved') {
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const event = new CustomEvent('DOMNodeRemoved', {
                  detail: { target: node, relatedNode: mutation.target }
                });
                
                if (typeof listener === 'function') {
                  try {
                    listener.call(this, event);
                  } catch (error) {
                    // エラーも静かに処理
                  }
                }
              }
            });
          }
        });
      });
      
      // 対象要素の子要素変更を監視
      observer.observe(this, {
        childList: true,
        subtree: true
      });
      
      // クリーンアップ用に観察者を保存
      if (!(this as any).__mutationObservers) {
        (this as any).__mutationObservers = [];
      }
      (this as any).__mutationObservers.push(observer);
      
      return;
    }
    
    // その他のイベントは通常通り処理
    return originalAddEventListener.call(this, type, listener, options);
  };

  // DOMNodeRemovedイベントも同様に処理
  const originalRemoveEventListener = Element.prototype.removeEventListener;
  Element.prototype.removeEventListener = function(type: string, listener: any, options?: any) {
    if (type === 'DOMNodeInserted' || type === 'DOMNodeRemoved') {
      // MutationObserverのクリーンアップ
      if ((this as any).__mutationObservers) {
        (this as any).__mutationObservers.forEach((observer: MutationObserver) => {
          observer.disconnect();
        });
        (this as any).__mutationObservers = [];
      }
      return;
    }
    
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  // フラグを設定してポリフィルの重複適用を防ぐ
  (window as any).__quillPolyfillApplied = true;
  
  console.info('[Quill Polyfill] DOMNodeInserted polyfill applied successfully');
};

/**
 * コンソール警告フィルター（開発環境用）
 */
export const suppressQuillWarnings = () => {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    
    // ReactQuill関連の警告を抑制
    if (
      message.includes('DOMNodeInserted') ||
      message.includes('mutation event') ||
      message.includes('findDOMNode is deprecated') ||
      message.includes('findDOMNode') ||
      message.includes('StrictMode') ||
      message.includes('ReactQuill')
    ) {
      // 重要でない警告は表示しない
      return;
    }
    
    // その他の警告は通常通り表示
    return originalConsoleWarn.apply(console, args);
  };

  // console.error も同様にフィルター
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    
    // ReactQuill関連のエラーを抑制
    if (
      message.includes('findDOMNode is deprecated') ||
      message.includes('ReactQuill') ||
      message.includes('StrictMode')
    ) {
      // 重要でないエラーは表示しない
      return;
    }
    
    // その他のエラーは通常通り表示
    return originalConsoleError.apply(console, args);
  };
};

/**
 * ReactQuill最適化設定
 */
export const getOptimizedQuillConfig = () => {
  return {
    // Quillモジュール設定最適化
    clipboard: {
      // HTMLペースト時の最適化
      matchVisual: false,
      // 不要なイベントリスナーを削減
      fastReplace: true
    },
    keyboard: {
      // キーボードイベントの最適化
      bindings: {
        // カスタムキーバインドでパフォーマンス向上
        tab: false // デフォルトのTabハンドリングを無効化
      }
    },
    // 履歴管理の最適化
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  };
};

/**
 * ReactQuillコンポーネント用のラッパー設定
 */
export const createQuillWrapper = (ref: React.RefObject<any>) => {
  return {
    onReady: () => {
      // Quillインスタンスの準備完了後の最適化
      if (ref.current) {
        const quill = ref.current.getEditor();
        
        // 不要なイベントリスナーを削除
        const container = quill.container;
        if (container) {
          // パフォーマンス最適化
          container.setAttribute('spellcheck', 'false');
        }
      }
    },
    onSelectionChange: (range: any, source: string, editor: any) => {
      // 選択変更時の最適化処理
      if (source === 'user' && range) {
        // ユーザー操作時のみ処理
      }
    }
  };
};