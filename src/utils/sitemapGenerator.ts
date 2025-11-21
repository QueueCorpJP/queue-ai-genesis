import { supabase } from '@/lib/supabase';
import { generateSitemap, generateNewsSitemap } from './sitemap';
import fs from 'fs';
import path from 'path';

interface ArticleForSitemap {
  id: string;
  title: string;
  slug?: string | null;
  updated_at: string;
  published_at: string | null;
  status: 'published' | 'draft' | 'archived';
  page_type?: 'normal' | 'hub' | 'sub' | null;
  parent_hub_id?: string | null;
}

/**
 * サイトマップファイルを物理的に生成・保存
 */
export const generateSitemapFiles = async (): Promise<{
  success: boolean;
  message: string;
  files?: string[];
}> => {
  try {
    console.log('サイトマップ生成開始...');
    
    // 公開済み記事を取得
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('id, title, slug, updated_at, published_at, status, page_type, parent_hub_id')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('記事データ取得エラー:', error);
      return {
        success: false,
        message: `記事データ取得エラー: ${error.message}`
      };
    }

    const publishedArticles: ArticleForSitemap[] = articles || [];
    console.log(`公開記事数: ${publishedArticles.length}件`);

    // メインサイトマップ生成
    const mainSitemap = await generateSitemap(publishedArticles);
    
    // ニュースサイトマップ生成
    const newsSitemap = await generateNewsSitemap(publishedArticles);

    // ファイル保存用のディレクトリパス
    const publicDir = path.join(process.cwd(), 'public');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // サイトマップファイルを保存
    const mainSitemapPath = path.join(publicDir, 'sitemap.xml');
    const newsSitemapPath = path.join(publicDir, 'news-sitemap.xml');
    
    fs.writeFileSync(mainSitemapPath, mainSitemap, 'utf-8');
    fs.writeFileSync(newsSitemapPath, newsSitemap, 'utf-8');

    console.log('サイトマップファイル生成完了');
    console.log(`メインサイトマップ: ${mainSitemapPath}`);
    console.log(`ニュースサイトマップ: ${newsSitemapPath}`);

    return {
      success: true,
      message: `サイトマップを正常に生成しました（記事数: ${publishedArticles.length}件）`,
      files: [
        'sitemap.xml',
        'news-sitemap.xml'
      ]
    };

  } catch (error) {
    console.error('サイトマップ生成エラー:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * 記事公開時のサイトマップ更新
 */
export const updateSitemapOnPublish = async (articleId: string): Promise<void> => {
  try {
    console.log(`記事公開によるサイトマップ更新開始: ${articleId}`);
    
    const result = await generateSitemapFiles();
    
    if (result.success) {
      console.log('サイトマップ更新完了:', result.message);
    } else {
      console.error('サイトマップ更新失敗:', result.message);
    }
  } catch (error) {
    console.error('サイトマップ更新エラー:', error);
  }
};

/**
 * 開発環境での手動サイトマップ生成
 */
export const generateSitemapDev = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    console.warn('この関数はサーバーサイドでのみ実行してください');
    return;
  }

  const result = await generateSitemapFiles();
  console.log('開発環境サイトマップ生成結果:', result);
};