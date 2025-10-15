
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductsSection: React.FC = () => {
  return (
    <section id="products" className="py-20 bg-navy-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-navy-800">プロダクト</h2>
          <p className="text-lg text-navy-600 max-w-2xl mx-auto">
            AI時代の新しいビジネスモデルを創出する、Queueの革新的プロダクト
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* App Exit Product */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center mr-3">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-emerald-700 rounded"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-navy-800">App Exit（アップエグジット）</h3>
              </div>
              <p className="font-medium text-navy-700 mb-3">開発者の努力を眠らせない。あなたのプロダクトに、次の経営者を。</p>
              <p className="text-navy-600 mb-6">
                個人・法人・開発チームが保有するアプリ・SaaS・AIツール・Webサービスを、<strong>安全・迅速・公正</strong>に売買できるプラットフォーム。<br />
                Queue株式会社が運営する、日本初の<strong>"プロダクト流通インフラ"</strong>です。<br />
                上場企業基準の安心で、マイクロM&Aをもっと身近に。
              </p>
              <Link to="/products">
                <Button
                  variant="outline"
                  className="w-full border-navy-300 text-navy-800 hover:bg-navy-100"
                >
                  詳細を見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Workmate Product (was AdGenome) */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center mr-3">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-navy-700 rounded"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-navy-800">Workmate（ワークメイト）</h3>
              </div>
              <p className="font-medium text-navy-700 mb-3">社内の問い合わせ対応を、AIが24時間即答する</p>
              <p className="text-navy-600 mb-6">
                SlackやWebチャットに組み込むだけで、マニュアル・議事録・ナレッジを瞬時に学習。<br />
                社内の「これってどうなってたっけ？」を最速で解決し、問い合わせ業務を最大80％削減。<br />
                MCP（Multi-Channel Protocol）対応で、Notion・freee・Google Workspaceなど外部連携も自由自在。
              </p>
              <a href="https://www.workmate-ai.com/" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="w-full border-navy-300 text-navy-800 hover:bg-navy-100"
                >
                  詳細を見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
