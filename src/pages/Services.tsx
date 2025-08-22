import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';

const Services = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Web・AI・システム開発サービス",
    "provider": {
      "@type": "Organization",
      "name": "Queue株式会社",
      "url": "https://queue-tech.jp"
    },
    "description": "Web開発からAI活用まで幅広い技術領域でクライアントのビジネス成長を支援するテクノロジーパートナー",
    "serviceType": [
      "Web受託開発",
      "AIコンサルティング", 
      "Web制作",
      "AI受託開発",
      "AI顧問",
      "SES（システムエンジニアリングサービス）"
    ],
    "areaServed": "JP"
  };

  useEffect(() => {
    document.title = "Queue株式会社のサービス | Web・AI・システム開発の総合支援";
  }, []);

  const services = [
    {
      title: "Web受託開発",
      color: "from-navy-500 to-navy-700",
      description: "クライアントのニーズに合わせたWebアプリケーション開発を手掛けています。企画から実装まで一気通貫でサポートします。",
      features: [
        "EC・オンラインストア構築・運用支援",
        "企画から実装まで一気通貫サポート",
        "クライアントニーズに完全対応したカスタム開発",
        "レスポンシブ対応・高パフォーマンス設計"
      ]
    },
    {
      title: "AIコンサルティング",
      color: "from-emerald-500 to-emerald-700",
      description: "企業の課題解決に向けたAI導入のコンサルティングを提供します。現状の業務フローに合わせた最適なAI活用法を提案します。",
      features: [
        "既存社内チャットボット機能改善コンサルティング",
        "業務フロー分析とAI導入戦略策定",
        "ROI最大化のためのAI活用法提案",
        "段階的導入によるリスク最小化"
      ]
    },
    {
      title: "Web制作",
      color: "from-blue-500 to-blue-700",
      description: "企業の顔となるWebサイト制作を行います。デザインからコーディング、CMS導入まで、クライアントのビジネス成長に貢献する魅力的なウェブサイトを構築します。",
      features: [
        "企業ブランディングに特化したデザイン設計",
        "レスポンシブ対応・SEO最適化",
        "CMS導入による更新性向上",
        "ビジネス成長を支援するサイト構築"
      ]
    },
    {
      title: "AI受託開発",
      color: "from-purple-500 to-purple-700",
      description: "業務効率化や新規事業創出のためのAIアプリケーションをオーダーメイドで開発します。クライアントの具体的な要望を形にします。",
      features: [
        "AIエージェントによるブログ投稿自動化",
        "業務効率化AI開発",
        "新規事業創出支援AIソリューション",
        "オーダーメイド開発による完全カスタマイズ"
      ]
    },
    {
      title: "AI顧問",
      color: "from-orange-500 to-orange-700",
      description: "継続的なAI活用を顧問としてサポートします。事業フェーズに合わせた実践的なアドバイスを提供します。",
      features: [
        "看護人材紹介会社におけるAI活用法提案",
        "画像仕分けシステム提案・導入支援",
        "事業フェーズに応じた戦略的アドバイス",
        "継続的なAI活用サポート・改善提案"
      ]
    },
    {
      title: "SES",
      color: "from-teal-500 to-teal-700",
      description: "クライアントのプロジェクトに対し、専門的なスキルを持つITエンジニアやプロジェクトマネージャー（PM）の技術力を提供します。",
      features: [
        "AIが使えるプロジェクトマネージャー派遣",
        "バックエンドエンジニア技術力提供",
        "開発現場ニーズに応じた人材アサイン",
        "プロジェクト成功に向けた専門技術支援"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Queue株式会社のサービス | Web・AI・システム開発の総合支援"
        description="Queue株式会社は、Web受託開発、AIコンサルティング、Web制作、AI受託開発、AI顧問、SESまで幅広い技術領域でクライアントのビジネス成長を支援するテクノロジーパートナーです。企画から実装、運用まで一気通貫でサポートします。"
        keywords="Web受託開発,AIコンサルティング,Web制作,AI受託開発,AI顧問,SES,システム開発,Queue株式会社"
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
                Queueは、Web開発からAI活用まで幅広い技術領域でクライアントのビジネス成長を支援するテクノロジーパートナーです。
                企画から実装、運用まで一気通貫でサポートし、お客様の課題解決に最適なソリューションを提供します。
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
                「Web開発からAI活用まで、総合的にサポートしてほしい」
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