-- Seed example hub and sub pages for AI受託開発クラスター
-- 注意:
-- - 既存データと衝突しないように slug の重複がある場合はINSERTをスキップします。
-- - 本シードはデモ用であり、本番運用では内容を編集・削除して問題ありません。

DO $$
DECLARE
  hub_id uuid;
BEGIN
  -- すでに ai-jutaku のハブが存在する場合は再作成しない
  SELECT id INTO hub_id
  FROM news_articles
  WHERE slug = 'ai-jutaku'
    AND page_type = 'hub'
  LIMIT 1;

  IF hub_id IS NULL THEN
    INSERT INTO news_articles (
      title,
      summary,
      content,
      source_name,
      source_url,
      image_url,
      tags,
      status,
      published_at,
      page_type,
      parent_hub_id,
      cluster_sort_order,
      slug
    ) VALUES (
      '中小企業向けAI受託開発・AIアプリ開発のご案内',
      '※ダミーコンテンツ: 管理画面から内容を編集してください。',
      '<p>このページは「AI受託開発 / AIアプリ開発」関連コンテンツのハブページとして利用する想定のサンプルです。</p>',
      'Queue株式会社',
      NULL,
      NULL,
      ARRAY['AI受託開発', 'AIアプリ開発'],
      'published',
      NOW(),
      'hub',
      NULL,
      NULL,
      'ai-jutaku'
    )
    RETURNING id INTO hub_id;
  END IF;

  -- サブページを3件作成（既に slug が存在する場合はスキップ）
  IF NOT EXISTS (SELECT 1 FROM news_articles WHERE slug = 'internal-gpt') THEN
    INSERT INTO news_articles (
      title,
      summary,
      content,
      source_name,
      source_url,
      image_url,
      tags,
      status,
      published_at,
      page_type,
      parent_hub_id,
      cluster_sort_order,
      slug
    ) VALUES (
      '社内GPT構築（Internal GPT）',
      '※ダミーコンテンツ: 管理画面から内容を編集してください。',
      '<p>社内ナレッジやドキュメントを活用した Internal GPT の構築ユースケースを紹介するためのサンプルページです。</p>',
      'Queue株式会社',
      NULL,
      NULL,
      ARRAY['Internal GPT', '社内GPT', 'ナレッジ共有'],
      'published',
      NOW(),
      'sub',
      hub_id,
      1,
      'internal-gpt'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM news_articles WHERE slug = 'blog-automation') THEN
    INSERT INTO news_articles (
      title,
      summary,
      content,
      source_name,
      source_url,
      image_url,
      tags,
      status,
      published_at,
      page_type,
      parent_hub_id,
      cluster_sort_order,
      slug
    ) VALUES (
      'ブログ自動投稿AIエージェント',
      '※ダミーコンテンツ: 管理画面から内容を編集してください。',
      '<p>コンテンツ生成から投稿・分析までを自動化する「ブログ自動投稿AIエージェント」のユースケースを紹介するためのサンプルページです。</p>',
      'Queue株式会社',
      NULL,
      NULL,
      ARRAY['ブログ自動化', 'コンテンツマーケティング', 'AIエージェント'],
      'published',
      NOW(),
      'sub',
      hub_id,
      2,
      'blog-automation'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM news_articles WHERE slug = 'inventory-optimization') THEN
    INSERT INTO news_articles (
      title,
      summary,
      content,
      source_name,
      source_url,
      image_url,
      tags,
      status,
      published_at,
      page_type,
      parent_hub_id,
      cluster_sort_order,
      slug
    ) VALUES (
      '在庫最適化AIによる需要予測と発注自動化',
      '※ダミーコンテンツ: 管理画面から内容を編集してください。',
      '<p>需要予測と在庫圧縮を実現する在庫最適化AIのユースケースを紹介するためのサンプルページです。</p>',
      'Queue株式会社',
      NULL,
      NULL,
      ARRAY['在庫最適化', '需要予測', 'サプライチェーン'],
      'published',
      NOW(),
      'sub',
      hub_id,
      3,
      'inventory-optimization'
    );
  END IF;
END $$;


