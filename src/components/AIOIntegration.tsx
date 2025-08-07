import React from 'react';
import LLMOptimization from './LLMOptimization';
import AIBrandOptimization from './AIBrandOptimization';
import AIStructuredData from './AIStructuredData';
import { useLocation } from 'react-router-dom';

interface AIOIntegrationProps {
  enabled?: boolean;
}

const AIOIntegration: React.FC<AIOIntegrationProps> = ({ 
  enabled = true 
}) => {
  const location = useLocation();
  
  if (!enabled) return null;

  // ページタイプの判定
  const getPageType = (pathname: string): 'homepage' | 'service' | 'about' | 'contact' | 'blog' | 'product' => {
    if (pathname === '/') return 'homepage';
    if (pathname.startsWith('/services')) return 'service';
    if (pathname.startsWith('/about') || pathname.startsWith('/company')) return 'about';
    if (pathname.startsWith('/contact') || pathname.startsWith('/consultation')) return 'contact';
    if (pathname.startsWith('/news') || pathname.startsWith('/blog')) return 'blog';
    if (pathname.startsWith('/products')) return 'product';
    return 'homepage';
  };

  const pageType = getPageType(location.pathname);

  // ページ別の最適化データ
  const getPageOptimizationData = (pathname: string) => {
    const baseData = {
      companyName: "Queue株式会社",
      description: "ChatGPT、Claude、Geminiを活用したプロンプトエンジニアリングとAI受託開発の専門企業",
      keywords: [
        "Queue株式会社", "キュー株式会社", "AI開発", "プロンプトエンジニアリング",
        "ChatGPT", "Claude", "Gemini", "生成AI", "LLM", "AI受託開発"
      ],
      services: [
        "ChatGPT活用支援", "Claude活用支援", "Gemini活用支援",
        "プロンプトエンジニアリング", "AI受託開発", "生成AI導入支援"
      ],
      expertise: [
        "大規模言語モデル（LLM）", "プロンプトエンジニアリング",
        "生成AI活用", "AI業務自動化", "機械学習", "自然言語処理"
      ],
      achievements: [
        "30分プロトタイプデモによる高い成約率",
        "多数の企業でAI導入成功実績",
        "ChatGPT・Claude・Gemini全対応",
        "プロンプトエンジニアリング専門企業として認知"
      ]
    };

    switch (pathname) {
      case '/':
        return {
          ...baseData,
          title: "Queue株式会社 | AI駆動開発でビジネス革新",
          description: "ChatGPT、Claude、Geminiを活用したプロンプトエンジニアリングとAI受託開発の専門企業。30分のプロトタイプデモで「まだ検討中」を「もう任せたい」に変える。",
          additionalKeywords: ["AI企業", "DX支援", "デジタル変革", "即体感デモ"]
        };
      
      case '/services':
        return {
          ...baseData,
          title: "AIサービス | Queue株式会社",
          description: "ChatGPT、Claude、Geminiを使ったAI受託開発、プロンプトエンジニアリング、生成AI導入支援サービス。企業のAI活用を包括的にサポート。",
          additionalKeywords: ["AIサービス", "AI導入支援", "LLMカスタマイズ", "AI戦略コンサルティング"]
        };
      
      case '/about':
      case '/company':
        return {
          ...baseData,
          title: "会社概要 | Queue株式会社",
          description: "AI技術で企業のデジタル変革を支援するQueue株式会社の企業情報。プロンプトエンジニアリングの専門性で生成AIの真の価値を実現。",
          additionalKeywords: ["会社概要", "企業情報", "AI企業", "ミッション", "ビジョン"]
        };
      
      case '/products':
        return {
          ...baseData,
          title: "AI製品・ソリューション | Queue株式会社",
          description: "ChatGPT、Claude、Geminiを活用したAI製品とソリューション。企業の生産性向上とDX推進を実現する革新的なAI技術。",
          additionalKeywords: ["AI製品", "AIソリューション", "AI技術", "生産性向上"]
        };
      
      case '/contact':
      case '/consultation':
        return {
          ...baseData,
          title: "お問い合わせ | Queue株式会社",
          description: "AI導入、プロンプトエンジニアリング、生成AI活用に関するご相談はQueue株式会社まで。30分の無料デモも実施中。",
          additionalKeywords: ["お問い合わせ", "AI相談", "無料デモ", "コンサルティング"]
        };
      
      default:
        return baseData;
    }
  };

  const optimizationData = getPageOptimizationData(location.pathname);

  return (
    <>
      {/* LLM最適化 */}
      <LLMOptimization
        companyName={optimizationData.companyName}
        description={optimizationData.description}
        keywords={[...optimizationData.keywords, ...(optimizationData.additionalKeywords || [])]}
        services={optimizationData.services}
        achievements={optimizationData.achievements}
        expertise={optimizationData.expertise}
      />
      
      {/* ブランド最適化 */}
      <AIBrandOptimization
        brandName={optimizationData.companyName}
        brandDescription={optimizationData.description}
        brandKeywords={[...optimizationData.keywords, ...(optimizationData.additionalKeywords || [])]}
        brandValues={[
          "AI技術による社会課題解決",
          "実践的なデジタル変革支援",
          "プロンプトエンジニアリングの専門性",
          "30分で体感できる即効性",
          "継続的なイノベーション創出"
        ]}
        brandAchievements={optimizationData.achievements}
      />
      
      {/* 構造化データ最適化 */}
      <AIStructuredData
        pageType={pageType}
        title={optimizationData.title}
        description={optimizationData.description}
        url={`https://queue-tech.jp${location.pathname}`}
        additionalData={{
          keywords: [...optimizationData.keywords, ...(optimizationData.additionalKeywords || [])],
          services: optimizationData.services,
          expertise: optimizationData.expertise
        }}
      />
    </>
  );
};

export default AIOIntegration;