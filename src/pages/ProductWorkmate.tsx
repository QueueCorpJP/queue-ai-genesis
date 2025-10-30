
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const ProductWorkmate = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-navy-800">
              Workmate（ワークメイト）<span className="text-navy-500">ai</span>
            </h1>
            <p className="text-2xl md:text-3xl mb-8 text-navy-600 font-medium">
              社内の問い合わせ対応を、AIが24時間即答する
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
                  Workmate（ワークメイト）は、社内ナレッジ即答AIプラットフォームです。
                  SlackやWebチャットに組み込むだけで、マニュアル・議事録・ナレッジを瞬時に学習し、
                  社内の「これってどうなってたっけ？」を最速で解決。問い合わせ業務を最大80％削減し、
                  MCP（Multi-Channel Protocol）対応で、Notion・freee・Google Workspaceなど外部連携も自由自在です。
                </p>

                {/* Product Image Placeholder */}
                <div className="mb-12 rounded-lg overflow-hidden border border-navy-200">
                  <AspectRatio ratio={16/9}>
                    <div className="w-full h-full bg-navy-100 flex items-center justify-center">
                      <p className="text-navy-500 text-lg">Workmate（ワークメイト）ai Platform Image</p>
                    </div>
                  </AspectRatio>
                </div>
              </div>
            </div>

            {/* Employee Benefits */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-navy-800 flex items-center">
                従業員にとってのメリット
              </h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex">
                    
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">Slack/チャットで即座に回答</h3>
                      <p className="text-navy-600">普段使っているSlackやチャットツールで質問するだけで、すぐに答えが返ってくる。</p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="text-2xl mr-3">🔍</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">ナレッジ検索の手間なし</h3>
                      <p className="text-navy-600">マニュアルを探し回る必要なし。AIが瞬時に最適な回答を見つけて教えてくれる。</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">業務効率が大幅に向上</h3>
                      <p className="text-navy-600">「これってどうなってたっけ？」の時間が激減。本来の業務に集中できる。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Benefits */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-navy-800 flex items-center">
                <span className="text-3xl mr-2">💼</span> 企業にとってのメリット
              </h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex">
                    <span className="text-2xl mr-3">📉</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">問い合わせ業務を最大80％削減</h3>
                      <p className="text-navy-600">社内の問い合わせ対応にかかる時間とコストを大幅に削減。人的リソースを有効活用。</p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="text-2xl mr-3">🌙</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">24時間365日の自動対応</h3>
                      <p className="text-navy-600">深夜や休日でも、AIが自動で回答。従業員の疑問を即座に解決。</p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="text-2xl mr-3">🔗</span>
                    <div>
                      <h3 className="font-bold text-navy-800 mb-2">外部ツール連携で導入簡単</h3>
                      <p className="text-navy-600">Notion・freee・Google Workspaceなど、既存ツールとシームレスに連携。導入も簡単。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-navy-800 flex items-center">
                すべての従業員と企業にとって"得"がある問い合わせ体験へ
              </h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-8">
                  <p className="text-navy-700 leading-relaxed">
                    従業員の疑問は瞬時に解決され、本来の業務に集中できる。<br/>
                    企業は問い合わせ対応コストを大幅削減し、効率化を実現する。<br/>
                    Workmate（ワークメイト）は、社内コミュニケーションの常識を変える「新しい循環」をつくります。
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
                Workmate（ワークメイト）について詳しく相談する
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

export default ProductWorkmate;
