import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ServicesSection: React.FC = () => {
  const services = [
    {
      title: "Web受託開発",
      color: "from-navy-500 to-navy-700",
      description: "クライアントのニーズに合わせたWebアプリケーション開発を手掛けています。企画から実装まで一気通貫でサポートします。",
      features: [
        "芸能事務所向けファンギフトアプリケーション開発",
        "企画から実装まで一気通貫サポート",
        "クライアントニーズに完全対応したカスタム開発"
      ]
    },
    {
      title: "AIコンサルティング",
      color: "from-emerald-500 to-emerald-700",
      description: "企業の課題解決に向けたAI導入のコンサルティングを提供します。現状の業務フローに合わせた最適なAI活用法を提案します。",
      features: [
        "既存社内チャットボット機能改善コンサルティング",
        "業務フロー分析とAI導入戦略策定",
        "ROI最大化のためのAI活用法提案"
      ]
    },
    {
      title: "Web制作",
      color: "from-blue-500 to-blue-700",
      description: "企業の顔となるWebサイト制作を行います。デザインからコーディング、CMS導入まで、クライアントのビジネス成長に貢献する魅力的なウェブサイトを構築します。",
      features: [
        "企業ブランディングに特化したデザイン設計",
        "レスポンシブ対応・SEO最適化",
        "CMS導入による更新性向上"
      ]
    },
    {
      title: "AI受託開発",
      color: "from-purple-500 to-purple-700",
      description: "業務効率化や新規事業創出のためのAIアプリケーションをオーダーメイドで開発します。クライアントの具体的な要望を形にします。",
      features: [
        "AIエージェントによるブログ投稿自動化",
        "業務効率化AI開発",
        "新規事業創出支援AIソリューション"
      ]
    },
    {
      title: "AI顧問",
      color: "from-orange-500 to-orange-700",
      description: "継続的なAI活用を顧問としてサポートします。事業フェーズに合わせた実践的なアドバイスを提供します。",
      features: [
        "看護人材紹介会社におけるAI活用法提案",
        "画像仕分けシステム提案・導入支援",
        "事業フェーズに応じた戦略的アドバイス"
      ]
    }
  ];

  return (
    <section id="services" className="section bg-white relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-navy-800">
            🛠️ Queue株式会社のサービス
          </h2>
          <p className="text-navy-600 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            Queueは、Web開発からAI活用まで幅広い技術領域でクライアントのビジネス成長を支援するテクノロジーパートナーです。
            企画から実装、運用まで一気通貫でサポートし、お客様の課題解決に最適なソリューションを提供します。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {services.map((service, index) => (
            <Card key={index} className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <CardHeader className="border-b border-gray-100 bg-white pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <div className="w-2 h-2 bg-navy-400 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-navy-500 font-medium text-xs sm:text-sm">{index + 1}.</span>
                    <CardTitle className="text-base sm:text-lg text-navy-800 mt-1 leading-snug">{service.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-navy-600 text-sm sm:text-base leading-relaxed">{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 sm:space-y-2.5">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-navy-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-navy-700 text-sm sm:text-base leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA to full services page */}
        <div className="text-center">
          <div className="bg-navy-50 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-navy-800 mb-3 sm:mb-4">
              その他のサービスも充実
            </h3>
            <p className="text-navy-600 text-sm sm:text-base leading-relaxed mb-5 sm:mb-6">
              SESサービス（AIが使えるPM・バックエンドエンジニア派遣）など、
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