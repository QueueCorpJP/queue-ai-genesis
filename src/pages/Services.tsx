import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';

const Services = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AI・DX・Webシステム開発サービス",
    "provider": {
      "@type": "Organization",
      "name": "Queue株式会社",
      "url": "https://queue-tech.jp"
    },
    "description": "AI開発から業務DX・自動化・Webシステム構築まで一気通貫で支援するテクノロジーパートナー",
    "serviceType": [
      "AIエージェント受託開発",
      "業務DX・自動化開発", 
      "Webサービス・業務システム開発",
      "プロンプトエンジニアリング支援",
      "高速プロトタイピング",
      "AI導入コンサルティング",
      "AI教育・実践トレーニング",
      "自社製AIプロダクト提供"
    ],
    "areaServed": "JP"
  };

  useEffect(() => {
    document.title = "Queue株式会社のサービス | AI・DX・Web開発の一気通貫支援";
  }, []);

  const services = [
    {
      title: "AI受託開発（AIエージェント / RAG / 機械学習）",
      color: "from-navy-500 to-navy-700",
      description: "LangChainやLangGraphを用いた業務自動化AIエージェントで、PoCで終わらせず実務に組み込まれるAIプロダクトを構築します。",
      features: [
        "LangChain / LangGraphによる業務自動化エージェント開発",
        "RAG（Retrieval-Augmented Generation）による社内文書検索AI", 
        "ChatGPT / Claude / Gemini API連携による高度な推論処理",
        "画像解析・音声認識・レコメンドなどのML実装"
      ]
    },
    {
      title: "業務DX・自動化開発（ノーコード連携／業務フロー改善）",
      color: "from-emerald-500 to-emerald-700",
      description: "\"AIを使わずとも\"圧倒的に業務改善できる領域に対し、堅実かつスピーディーに対応。",
      features: [
        "Slack / Notion / Google Workspaceと連携した業務オートメーション",
        "Excel業務のWebアプリ化",
        "社内申請・報告フローのデジタル化",
        "営業活動の自動化（顧客管理、日報Bot、メール連携）"
      ]
    },
    {
      title: "Webサービス・業務システム開発",
      color: "from-blue-500 to-blue-700",
      description: "SaaS、社内ポータル、管理画面、帳票出力など、柔軟な業務アプリを構築可能。",
      features: [
        "フロント：React / Next.js / Flutter Web",
        "バックエンド：Node.js / Python / Supabase / Firebase",
        "データ基盤：BigQuery / Google Sheets / Notion DB / PostgreSQL"
      ]
    },
    {
      title: "プロンプトエンジニアリング支援（生成AI特化）",
      color: "from-purple-500 to-purple-700",
      description: "社内でプロンプトを育てていくための運用支援も可能です。",
      features: [
        "業務特化型プロンプト設計（FAQ、営業、コンテンツ生成）",
        "複数モデル（GPT-4 / Claude / Gemini）の適用比較",
        "マルチチャネル向けテンプレート化（Slack / LINE / Web）"
      ]
    },
    {
      title: "高速プロトタイピング & PoC開発",
      color: "from-orange-500 to-orange-700",
      description: "「とりあえず相談してみたら、次の日にはもう動いてた」と言われるスピードが強みです。",
      features: [
        "最短数日でのMVP構築",
        "MCPチャットボット「Workmate」を活用した即日動作デモ",
        "KGI/KPI設計から本導入まで一貫支援"
      ]
    },
    {
      title: "AI導入コンサルティング／内製化支援",
      color: "from-teal-500 to-teal-700",
      description: "\"なんとなくのAI活用\"ではなく、成果から逆算した技術戦略を描きます。",
      features: [
        "課題のAI化可能性評価",
        "導入ステップの整理と体制構築支援",
        "経営層／現場向けの説明資料作成サポート"
      ]
    },
    {
      title: "AI教育・実践トレーニング",
      color: "from-indigo-500 to-indigo-700",
      description: "社内PoC作成ハンズオン付き研修プログラムも提供可能",
      features: [
        "社内エンジニア向けの実践型AI講座（RAG、LangChain、プロンプト）",
        "非エンジニア向け：生成AIリテラシー研修／業務活用ワークショップ"
      ]
    },
    {
      title: "自社製AIプロダクト提供（Workmateなど）",
      color: "from-rose-500 to-rose-700",
      description: "Slack、Notion、Googleカレンダー連携など多チャネル対応",
      features: [
        "MCPチャットボット「Workmate」：社内外の情報を横断検索",
        "ドキュメント検索AI、業務フロー対応Bot、ナレッジ即答エージェントなど"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Queue株式会社のサービス | AI・DX・Web開発の一気通貫支援"
        description="Queue株式会社は、AI開発だけでなく、業務DX・業務自動化・Webシステム構築まで一気通貫で支援するテクノロジーパートナーです。課題整理から要件設計・実装・運用のすべてを伴走します。"
        keywords="AI開発,業務DX,自動化開発,Webシステム開発,プロンプトエンジニアリング,高速プロトタイピング,AI導入コンサルティング,Queue株式会社"
        canonicalUrl="/services"
        structuredData={structuredData}
      />
      
      <Navbar />
      
      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="bg-navy-50 py-12 md:py-16">
          <Container>
            <div className="max-w-4xl mx-auto text-center px-4">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-navy-800">
                🛠️ Queue株式会社のサービス
              </h1>
              <p className="text-sm md:text-base text-navy-600 max-w-3xl mx-auto leading-relaxed">
                Queueは、AI開発だけでなく、業務DX・業務自動化・Webシステム構築まで一気通貫で支援するテクノロジーパートナーです。
                単なる開発にとどまらず、「課題整理 → 要件設計 → 実装 → 運用」のすべてを伴走します。
              </p>
            </div>
          </Container>
        </section>
        
        {/* Services Grid */}
        <section className="py-12 md:py-16">
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className={`w-12 h-12 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <div className="w-2.5 h-2.5 bg-navy-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <span className="text-navy-500 font-medium text-xs sm:text-sm">{index + 1}.</span>
                      <h3 className="text-lg sm:text-xl font-bold text-navy-800 mt-1 leading-snug">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-navy-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-navy-700 text-sm sm:text-base leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <p className="text-navy-600 text-sm sm:text-base leading-relaxed">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Value Proposition Table */}
        <section className="bg-gray-50 py-12 md:py-16">
          <Container>
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-navy-800">
                ✨ 一貫対応で提供する価値
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-navy-800 text-white">
                      <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left font-semibold">項目</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left font-semibold">対応範囲</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-navy-800">戦略設計</td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-navy-600">ビジネス課題 × 技術適用の企画・設計</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-navy-800">技術実装</td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-navy-600">AI / Web / DXツールなど複合的な開発力</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-navy-800">スピード</td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-navy-600">初回商談でのプロトタイプ提示が可能</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-navy-800">継続運用</td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-navy-600">モニタリング・改善・社内定着支援まで</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-navy-50">
          <Container>
            <div className="text-center max-w-3xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-navy-800">
                「AIだけでなく、現場のシステムや運用も含めて相談したい」
              </h2>
              <p className="text-sm md:text-base text-navy-600 mb-6 md:mb-8 leading-relaxed">
                という方に、Queueは最適なパートナーです。まずは無料相談で、貴社の課題をお聞かせください。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a 
                  href="/consultation" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-navy-800 text-white font-semibold rounded-md hover:bg-navy-700 transition-colors"
                >
                  無料相談を申し込む
                </a>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-navy-200 text-navy-800 font-semibold rounded-md hover:bg-white/60 transition-colors"
                >
                  お問い合わせ
                </a>
              </div>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Services;