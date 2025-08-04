
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MissionSection from '@/components/MissionSection';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Link, Mail, Phone, Users, Star, Flag, Book, CheckCircle } from 'lucide-react';

const Company = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Queue株式会社",
    "alternateName": ["キュー株式会社", "キュー", "Queue"],
    "url": "https://queue-tech.jp",
    "logo": "https://queue-tech.jp/Queue.png",
    "description": "AI駆動開発でビジネスを革新するテクノロジー企業",
    "foundingDate": "2020",
    "industry": "人工知能・ソフトウェア開発",
    "numberOfEmployees": "10-50",
    "areaServed": "JP",
    "serviceType": ["AI開発", "プロンプトエンジニアリング", "プロトタイプ制作", "DX支援"],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Japanese", "English"],
      "url": "https://queue-tech.jp/contact"
    },
    "sameAs": ["https://github.com/QueueCorpJP"],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "JP",
      "addressRegion": "東京都"
    }
  };

  useEffect(() => {
    document.title = "会社概要 | Queue株式会社 - AI駆動で、圧倒的スピードと品質を";
    
    // Update meta description for this specific page
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Queue株式会社の会社概要。ミッション・ビジョン・バリューと共に、所在地、代表者、設立日、資本金など企業情報を掲載。');
    
    // Update canonical URL
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://queue-tech.jp/company');
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title="会社概要 | Queue株式会社 - AI駆動開発のテクノロジー企業"
        description="キュー株式会社の会社概要。AI駆動開発でビジネスを革新するテクノロジー企業として、ミッション・ビジョン・バリューと共に企業情報をご紹介します。"
        keywords="会社概要,Queue株式会社,キュー株式会社,企業情報,AI企業,テクノロジー企業,AI駆動開発,会社案内,企業理念,ミッション,ビジョン"
        canonicalUrl="/company"
        structuredData={structuredData}
      />
      
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-navy-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-navy-600/30 rounded-full blur-3xl"></div>
          
          <Container className="relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                会社概要
              </h1>
              <p className="text-xl md:text-2xl text-navy-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Queue株式会社は、AI技術をコアとした革新的なソリューションを提供し、<br />
                企業のデジタルトランスフォーメーションを加速させます。
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="/Queue.png"
                  alt="Queue Logo"
                  className="h-16 w-auto opacity-90"
                />
              </div>
            </div>
          </Container>
        </section>
        
        <Container className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            
            {/* Company Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              {/* Company Logo & Name */}
              <div className="bg-gradient-to-br from-white to-navy-50 p-8 rounded-2xl shadow-lg border border-navy-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <img
                    src="/Queue.png"
                    alt="Queue Logo"
                    className="h-12 w-auto mr-4"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-navy-800">Queue株式会社</h2>
                    <p className="text-navy-600">Queue Corporation</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-navy-600 mr-3" />
                    <div>
                      <span className="font-medium text-navy-800">代表取締役社長：</span>
                      <span className="text-navy-600 ml-2">谷口 太一(ジョン)</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-navy-600 mr-3" />
                    <div>
                      <span className="font-medium text-navy-800">設立：</span>
                      <span className="text-navy-600 ml-2">2024年4月</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-navy-600 mr-3" />
                    <div>
                      <span className="font-medium text-navy-800">資本金：</span>
                      <span className="text-navy-600 ml-2">115万円</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="bg-gradient-to-br from-navy-800 to-navy-900 p-8 rounded-2xl shadow-lg text-white hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold mb-6 text-white">お問い合わせ</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-navy-200 mr-3 mt-1" />
                    <div>
                      <p className="font-medium text-navy-100 mb-1">所在地</p>
                      <p className="text-navy-200 text-sm leading-relaxed">
                        〒104-0061<br />
                        東京都中央区銀座８丁目17-5<br />
                        THE HUB 銀座 OCT
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-navy-200 mr-3" />
                    <div>
                      <p className="font-medium text-navy-100 mb-1">メール</p>
                      <a href="mailto:queue@queue-tech.jp" className="text-navy-200 hover:text-white transition-colors">
                        queue@queue-tech.jp
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-navy-200 mr-3" />
                    <div>
                      <p className="font-medium text-navy-100 mb-1">電話</p>
                      <a href="tel:0353242678" className="text-navy-200 hover:text-white transition-colors">
                        03-5324-2678
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map */}
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center gradient-text">アクセス</h2>
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-navy-100">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-navy-800 mb-2">THE HUB 銀座 OCT</h3>
                  <p className="text-navy-600">
                    〒104-0061 東京都中央区銀座8-17-5 THE HUB 銀座 OCT
                  </p>
                  <p className="text-sm text-navy-500 mt-2">
                    東京メトロ銀座線・日比谷線・丸ノ内線「銀座駅」徒歩7分<br />
                    JR「新橋駅」徒歩8分
                  </p>
                </div>
                <div className="rounded-lg overflow-hidden shadow-md relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.0666!2d139.7644!3d35.6704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDQwJzEzLjQiTiAxMznCsDQ1JzUxLjgiRQ!5e0!3m2!1sja!2sjp!4v1647933600000!5m2!1sja!2sjp"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Queue株式会社 所在地"
                    className="w-full h-96 md:h-[400px]"
                  ></iframe>
                  {/* Fallback link if map doesn't load */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 opacity-0 hover:opacity-95 transition-opacity duration-200">
                    <a 
                      href="https://maps.google.com/maps?q=東京都中央区銀座8-17-5+THE+HUB+銀座+OCT&hl=ja"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-navy-700 text-white px-6 py-3 rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>Google Mapsで開く</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            
            {/* Business Areas */}
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center gradient-text">事業内容</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-navy-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center mb-6">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-navy-800">AI受託開発</h3>
                  <p className="text-navy-600 leading-relaxed">
                    最新のAI技術を活用したカスタムソリューションの企画・設計・開発。
                    企業のニーズに合わせた高品質なAIシステムをスピーディに提供します。
                  </p>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-navy-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center mb-6">
                    <Book className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-navy-800">自社プロダクト開発</h3>
                  <p className="text-navy-600 leading-relaxed">
                    Prompty、Workmate aiをはじめとする革新的なAIプロダクトの開発・運営。
                    高度なプロンプトエンジニアリングと生成AIを組み合わせた独自のソリューションを提供します。
                  </p>
                </div>
              </div>
            </div>
            
            {/* Philosophy */}
            <div className="bg-gradient-to-br from-navy-50 via-white to-navy-100 p-12 rounded-3xl shadow-lg mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center gradient-text">企業理念</h2>
              
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4 text-navy-800">
                    「Queue」は"知識のレイヤー"も運ぶベルトコンベア
                  </h3>
                  <p className="text-lg text-navy-700 leading-relaxed">
                    私たちが扱うのはコードだけではありません。<br />
                    プロジェクトごとのナレッジ、データセット、失敗と学習――<br />
                    それらもすべて、ひとつずつキューへ載せて次へ渡しています。
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/70 p-6 rounded-xl">
                    <h4 className="font-bold text-navy-800 mb-3">コミットごとに増える"知識パケット"</h4>
                    <p className="text-navy-700 text-sm leading-relaxed">
                      Git の履歴、議事録、ユーザーインサイト…すべてが小さなパケットとして先頭へ送られ、
                      後続のタスクがそれを必ず参照できる流れを構築。
                    </p>
                  </div>
                  
                  <div className="bg-white/70 p-6 rounded-xl">
                    <h4 className="font-bold text-navy-800 mb-3">データを貯め込まず"流す"思想</h4>
                    <p className="text-navy-700 text-sm leading-relaxed">
                      倉庫にしまい込むのではなく、常に動くベルトの上で次工程が加工・検証。
                      溜め込まず流すことで、データは腐らず、意思決定の鮮度を保ちます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
        
        {/* Mission, Vision, Value Section - 会社概要の後に移動 */}
        <MissionSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Company;
