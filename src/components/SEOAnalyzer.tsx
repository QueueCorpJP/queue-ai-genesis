import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Search, FileText, Image, Link } from 'lucide-react';

interface SEOAnalyzerProps {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  image?: string;
  url?: string;
}

interface SEOScore {
  score: number;
  issues: {
    type: 'error' | 'warning' | 'success';
    message: string;
    category: 'title' | 'content' | 'meta' | 'structure' | 'keywords';
  }[];
}

const SEOAnalyzer: React.FC<SEOAnalyzerProps> = ({
  title,
  content,
  summary,
  tags,
  image,
  url
}) => {
  const [seoScore, setSeoScore] = useState<SEOScore>({ score: 0, issues: [] });

  useEffect(() => {
    analyzeSEO();
  }, [title, content, summary, tags, image, url]);

  const analyzeSEO = () => {
    const issues: SEOScore['issues'] = [];
    let score = 0;

    // Title Analysis
    if (title.length === 0) {
      issues.push({
        type: 'error',
        message: 'タイトルが設定されていません',
        category: 'title'
      });
    } else if (title.length < 30) {
      issues.push({
        type: 'warning',
        message: 'タイトルが短すぎます (30文字以上推奨)',
        category: 'title'
      });
      score += 5;
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        message: 'タイトルが長すぎます (60文字以下推奨)',
        category: 'title'
      });
      score += 5;
    } else {
      issues.push({
        type: 'success',
        message: 'タイトルの長さが適切です',
        category: 'title'
      });
      score += 15;
    }

    // Description Analysis
    if (summary.length === 0) {
      issues.push({
        type: 'error',
        message: '概要（メタディスクリプション）が設定されていません',
        category: 'meta'
      });
    } else if (summary.length < 120) {
      issues.push({
        type: 'warning',
        message: '概要が短すぎます (120文字以上推奨)',
        category: 'meta'
      });
      score += 5;
    } else if (summary.length > 160) {
      issues.push({
        type: 'warning',
        message: '概要が長すぎます (160文字以下推奨)',
        category: 'meta'
      });
      score += 5;
    } else {
      issues.push({
        type: 'success',
        message: '概要の長さが適切です',
        category: 'meta'
      });
      score += 15;
    }

    // Content Analysis
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({
        type: 'warning',
        message: 'コンテンツが短すぎます (300単語以上推奨)',
        category: 'content'
      });
      score += 5;
    } else if (wordCount > 2000) {
      issues.push({
        type: 'success',
        message: 'コンテンツが十分な長さです',
        category: 'content'
      });
      score += 20;
    } else {
      issues.push({
        type: 'success',
        message: 'コンテンツの長さが適切です',
        category: 'content'
      });
      score += 15;
    }

    // Header Structure Analysis
    const headers = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headers.length === 0) {
      issues.push({
        type: 'warning',
        message: 'ヘッダー構造が不足しています (H1, H2, H3の使用推奨)',
        category: 'structure'
      });
      score += 5;
    } else {
      issues.push({
        type: 'success',
        message: `ヘッダーが適切に使用されています (${headers.length}個)`,
        category: 'structure'
      });
      score += 10;
    }

    // Keywords Analysis
    if (tags.length === 0) {
      issues.push({
        type: 'warning',
        message: 'タグ（キーワード）が設定されていません',
        category: 'keywords'
      });
    } else if (tags.length < 3) {
      issues.push({
        type: 'warning',
        message: 'タグが少なすぎます (3個以上推奨)',
        category: 'keywords'
      });
      score += 5;
    } else if (tags.length > 10) {
      issues.push({
        type: 'warning',
        message: 'タグが多すぎます (10個以下推奨)',
        category: 'keywords'
      });
      score += 5;
    } else {
      issues.push({
        type: 'success',
        message: `タグが適切に設定されています (${tags.length}個)`,
        category: 'keywords'
      });
      score += 15;
    }

    // Image Analysis
    if (!image) {
      issues.push({
        type: 'warning',
        message: 'アイキャッチ画像が設定されていません',
        category: 'meta'
      });
    } else {
      issues.push({
        type: 'success',
        message: 'アイキャッチ画像が設定されています',
        category: 'meta'
      });
      score += 10;
    }

    // Internal Links Analysis
    const internalLinks = content.match(/\[.*?\]\(\/.*?\)/g) || [];
    if (internalLinks.length === 0) {
      issues.push({
        type: 'warning',
        message: '内部リンクが不足しています',
        category: 'structure'
      });
    } else {
      issues.push({
        type: 'success',
        message: `内部リンクが適切に設定されています (${internalLinks.length}個)`,
        category: 'structure'
      });
      score += 10;
    }

    setSeoScore({ score: Math.min(score, 100), issues });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '優秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '改善が必要';
    return '要改善';
  };

  const categorizeIssues = (category: string) => {
    return seoScore.issues.filter(issue => issue.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'title': return <FileText className="w-4 h-4" />;
      case 'content': return <FileText className="w-4 h-4" />;
      case 'meta': return <Search className="w-4 h-4" />;
      case 'structure': return <TrendingUp className="w-4 h-4" />;
      case 'keywords': return <Search className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          SEO分析
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">総合スコア</span>
            <span className={`text-lg font-bold ${getScoreColor(seoScore.score)}`}>
              {seoScore.score}/100 ({getScoreLabel(seoScore.score)})
            </span>
          </div>
          <Progress value={seoScore.score} className="h-2" />
        </div>

        {/* Issues by Category */}
        <div className="space-y-4">
          {['title', 'meta', 'content', 'structure', 'keywords'].map(category => {
            const categoryIssues = categorizeIssues(category);
            if (categoryIssues.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {getCategoryIcon(category)}
                  <span className="capitalize">
                    {category === 'title' && 'タイトル'}
                    {category === 'meta' && 'メタ情報'}
                    {category === 'content' && 'コンテンツ'}
                    {category === 'structure' && '構造'}
                    {category === 'keywords' && 'キーワード'}
                  </span>
                </div>
                <div className="space-y-1">
                  {categoryIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      {issue.type === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                      {issue.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                      {issue.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                      <span className={
                        issue.type === 'error' ? 'text-red-700' :
                        issue.type === 'warning' ? 'text-yellow-700' :
                        'text-green-700'
                      }>
                        {issue.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* SEO Tips */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">SEO最適化のヒント</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• タイトルには重要なキーワードを含める</li>
            <li>• 概要は読者の関心を引く内容にする</li>
            <li>• 適切なヘッダー構造（H1, H2, H3）を使用する</li>
            <li>• 内部リンクで関連記事につなげる</li>
            <li>• 画像にはaltテキストを設定する</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SEOAnalyzer; 