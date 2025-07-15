
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const ProductPrompty = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-navy-800">
              Prompty<span className="text-navy-500">（プロンプティ）</span>
            </h1>
            <p className="text-2xl md:text-3xl mb-8 text-navy-600 font-medium">
              生成AI活用を、もっと自由に。もっと創造的に。
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-navy-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
              <div className="p-8">
                <p className="text-lg text-navy-700 mb-8 leading-relaxed">
                  Promptyは、ChatGPTなどの生成AIを活用した<strong>"プロンプト（指示文）"を売買・共有できるプラットフォーム</strong>です。
                  AIを使いこなすにはプロンプトの質がすべて。Promptyでは、優れたプロンプトを使えば、誰でもプロのようなアウトプットが可能になります。
                </p>

                {/* Product Image Placeholder */}
                <div className="mb-12 rounded-lg overflow-hidden border border-navy-200">
                  <AspectRatio ratio={16/9}>
                    <div className="w-full h-full bg-navy-100 flex items-center justify-center">
                      <p className="text-navy-500 text-lg">Prompty Platform Image</p>
                    </div>
                  </AspectRatio>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-navy-800">主な特徴：</h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex">
                    <span className="text-2xl mr-3">💡</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">即戦力のプロンプトが集まるマーケット</h3>
                      <p className="text-navy-600">デザイン・マーケ・コーディング・企画など、目的別に最適なプロンプトを検索＆活用。</p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">プロンプト投稿で収益化</h3>
                      <p className="text-navy-600">自作のプロンプトを販売して副収入を得ることも可能。</p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="text-2xl mr-3">✨</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">使いやすさにこだわったUI</h3>
                      <p className="text-navy-600">検索性、保存機能、タグ分類で誰でも簡単に目的のプロンプトにたどり着けます。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-navy-800">活用シーン</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <div className="p-6">
                    <h3 className="font-bold text-navy-800 mb-2">クリエイティブ業界</h3>
                    <p className="text-navy-600">デザイナー、ライター、マーケターなど、専門的なアイデア出しやコンテンツ制作に。</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <div className="p-6">
                    <h3 className="font-bold text-navy-800 mb-2">IT・開発</h3>
                    <p className="text-navy-600">プログラミングのコード生成や、技術文書作成など、開発プロセスの効率化に。</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <div className="p-6">
                    <h3 className="font-bold text-navy-800 mb-2">教育</h3>
                    <p className="text-navy-600">学習コンテンツの作成や、カスタマイズされた教材開発など、教育の質向上に。</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <div className="p-6">
                    <h3 className="font-bold text-navy-800 mb-2">ビジネス全般</h3>
                    <p className="text-navy-600">企画書作成、プレゼン資料、市場分析など、ビジネスドキュメントの品質向上に。</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="mb-12">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8">
                  <p className="text-navy-700 leading-relaxed text-center text-lg font-medium">
                    生成AIを"ツール"ではなく"パートナー"に。<br/>
                    Promptyが、あなたの創造性を一段引き上げます。
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Button 
                className="rounded-full bg-navy-800 hover:bg-navy-700 text-white px-8 py-6 text-lg group"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Promptyについて詳しく相談する
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProductPrompty;
