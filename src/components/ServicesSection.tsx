import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ServicesSection: React.FC = () => {
  const services = [
    {
      title: "AI受託開発（AIエージェント / RAG / 機械学習）",
      color: "from-navy-500 to-navy-700",
      description: "LangChainやLangGraphを用いた業務自動化AIエージェントで、PoCで終わらせず実務に組み込まれるAIプロダクトを構築します。",
      features: [
        "LangChain / LangGraphによる業務自動化エージェント開発",
        "RAG による社内文書検索AI", 
        "ChatGPT / Claude / Gemini API連携による高度な推論処理",
        "画像解析・音声認識・レコメンドなどのML実装"
      ]
    },
    {
      title: "業務DX・自動化開発",
      color: "from-emerald-500 to-emerald-700",
      description: "\"AIを使わずとも\"圧倒的に業務改善できる領域に対し、堅実かつスピーディーに対応。",
      features: [
        "Slack / Notion / Google Workspace連携オートメーション",
        "Excel業務のWebアプリ化",
        "社内申請・報告フローのデジタル化"
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
      title: "Webサービス・業務システム開発",
      color: "from-blue-500 to-blue-700",
      description: "SaaS、社内ポータル、管理画面、帳票出力など、柔軟な業務アプリを構築可能。",
      features: [
        "React / Next.js / Flutter Web",
        "Node.js / Python / Supabase / Firebase",
        "BigQuery / Google Sheets / PostgreSQL"
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
    }
  ];

  return (
    <section id="services" className="section bg-white relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            🛠️ Queue株式会社のサービス
          </h2>
          <p className="text-navy-600 max-w-3xl mx-auto">
            Queueは、AI開発だけでなく、業務DX・業務自動化・Webシステム構築まで一気通貫で支援するテクノロジーパートナーです。
            単なる開発にとどまらず、「課題整理 → 要件設計 → 実装 → 運用」のすべてを伴走します。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <Card key={index} className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <CardHeader className="border-b border-gray-50 bg-gray-50/30 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <div className="w-5 h-5 bg-white/20 rounded-lg"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-navy-600 font-medium text-sm">✅ {index + 1}.</span>
                    <CardTitle className="text-lg text-navy-800 mt-1 leading-tight">{service.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-navy-600 italic font-medium">{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="w-2 h-2 bg-navy-600 rounded-full mt-2 flex-shrink-0 mr-3"></div>
                      <span className="text-navy-600 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA to full services page */}
        <div className="text-center">
          <div className="bg-navy-50 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-navy-800 mb-4">
              その他のサービスも充実
            </h3>
            <p className="text-navy-600 mb-6">
              プロンプトエンジニアリング支援、AI教育・実践トレーニング、自社製AIプロダクト提供など、
              さらに詳しいサービス内容をご覧いただけます。
            </p>
            <Button asChild className="bg-navy-800 hover:bg-navy-700 text-white">
              <Link to="/services">
                全サービスを見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-navy-100/30 rounded-full blur-3xl"></div>
    </section>
  );
};

export default ServicesSection;