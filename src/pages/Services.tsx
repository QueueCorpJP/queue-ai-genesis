
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';

const Services = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AI開発サービス",
    "provider": {
      "@type": "Organization",
      "name": "Queue株式会社",
      "url": "https://queue-tech.jp"
    },
    "description": "AI駆動開発、プロンプトエンジニアリング、プロトタイプ制作を通じてビジネスを革新",
    "serviceType": [
      "AI受託開発",
      "プロンプトエンジニアリング", 
      "高速プロトタイピング",
      "生成AIソリューション",
      "DX支援"
    ],
    "areaServed": "JP"
  };

  useEffect(() => {
    document.title = "サービス | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="AI開発サービス | Queue株式会社 - プロンプトエンジニアリング・プロトタイプ制作"
        description="キュー株式会社のAI開発サービス。AI受託開発、プロンプトエンジニアリング、高速プロトタイピング、生成AIソリューションで企業のDXを支援します。"
        keywords="AI開発サービス,AI受託開発,プロンプトエンジニアリング,プロトタイプ制作,生成AI,DX支援,Queue株式会社,キュー株式会社,AI駆動開発"
        canonicalUrl="/services"
        structuredData={structuredData}
      />
      
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">サービス</h1>
              <p className="text-lg text-navy-100 max-w-2xl mx-auto">
                Queue株式会社は、AI技術を活用した革新的なサービスで、お客様のビジネスをサポートします。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 md:py-24">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md border border-navy-100 hover:shadow-xl transition-shadow">
                <div className="mb-4 bg-navy-50 w-14 h-14 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-navy-800">AI受託開発</h3>
                <p className="text-navy-600 mb-4">
                  お客様のビジネスニーズに合わせたカスタムAIソリューションを開発します。画像認識、自然言語処理、予測分析など、様々なAI技術を活用したサービスをご提供します。
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md border border-navy-100 hover:shadow-xl transition-shadow">
                <div className="mb-4 bg-navy-50 w-14 h-14 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-navy-800">プロンプトエンジニアリング</h3>
                <p className="text-navy-600 mb-4">
                  ChatGPTなどの生成AIを最大限に活用するためのプロンプト設計と最適化サービス。業務効率化、マーケティング、コンテンツ作成など、目的に応じた最適なプロンプトを設計します。
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md border border-navy-100 hover:shadow-xl transition-shadow">
                <div className="mb-4 bg-navy-50 w-14 h-14 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-navy-800">高速プロトタイピング</h3>
                <p className="text-navy-600 mb-4">
                  アイデアを素早く形にするための高速プロトタイピングサービス。AIを活用したアプリケーション、WebサービスのMVPを短期間で作成し、市場検証を加速します。
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md border border-navy-100 hover:shadow-xl transition-shadow">
                <div className="mb-4 bg-navy-50 w-14 h-14 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-navy-800">AI導入コンサルティング</h3>
                <p className="text-navy-600 mb-4">
                  貴社のビジネスにAIをどう活用するべきかを分析し、最適な導入戦略を提案します。既存システムとの統合から、社内教育、運用体制の構築までサポートします。
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md border border-navy-100 hover:shadow-xl transition-shadow">
                <div className="mb-4 bg-navy-50 w-14 h-14 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-navy-800">AI教育・トレーニング</h3>
                <p className="text-navy-600 mb-4">
                  AI技術の基礎から応用まで、社内エンジニアや企画担当者向けにカスタマイズした教育プログラムを提供。実践的なワークショップで即戦力を育成します。
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-md border border-navy-100 hover:shadow-xl transition-shadow">
                <div className="mb-4 bg-navy-50 w-14 h-14 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-navy-800">AI基盤製品提供</h3>
                <p className="text-navy-600 mb-4">
                  Workmate aiやPromptyなどのAI基盤製品を提供。各業界のニーズに応じたカスタマイズも可能です。データ分析、社内ナレッジ即答AI、コンテンツ生成など、様々なビジネスシーンで活用できます。
                </p>
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
