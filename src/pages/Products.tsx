
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

const Products = () => {
  useEffect(() => {
    document.title = "製品一覧 | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">製品一覧</h1>
              <p className="text-lg text-navy-100 max-w-2xl mx-auto">
                Queue株式会社のAI駆動製品ラインナップをご紹介します。
                最先端技術で様々なビジネス課題を解決します。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 md:py-24">
          <Container>
            <div className="space-y-24">
              {/* Workmate Product */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <h2 className="text-3xl font-bold mb-3 text-navy-800">Workmate（ワークメイト）</h2>
                  <p className="text-lg font-medium text-navy-600 mb-6">
                    社内の問い合わせ対応を、AIが24時間即答する
                  </p>
                  <p className="text-navy-600 mb-6">
                    SlackやWebチャットに組み込むだけで、マニュアル・議事録・ナレッジを瞬時に学習。<br />
                    社内の「これってどうなってたっけ？」を最速で解決し、問い合わせ業務を最大80％削減。<br />
                    MCP（Multi-Channel Protocol）対応で、Notion・freee・Google Workspaceなど外部連携も自由自在。
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-navy-50 p-6 rounded-lg">
                      <h3 className="font-bold text-navy-800 mb-2">企業向けメリット</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-navy-700 mr-2 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-600">問い合わせ業務を最大80％削減</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-navy-700 mr-2 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-600">24時間365日の自動対応</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-navy-700 mr-2 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-600">外部ツール連携で導入簡単</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-navy-50 p-6 rounded-lg">
                      <h3 className="font-bold text-navy-800 mb-2">従業員向けメリット</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-navy-700 mr-2 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-600">Slack/チャットで即座に回答</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-navy-700 mr-2 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-600">ナレッジ検索の手間なし</span>
                        </li>
                        <li className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-navy-700 mr-2 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-600">業務効率が大幅に向上</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button asChild className="bg-navy-800 hover:bg-navy-700">
                      <Link to="/product/workmate">詳細を見る</Link>
                    </Button>
                    
                    <Button variant="outline" className="border-navy-300 text-navy-700 hover:bg-navy-50">
                      <Link to="/consultation">お問い合わせ</Link>
                    </Button>
                  </div>
                </div>
                
                <div className="order-1 lg:order-2 bg-navy-50 p-8 rounded-xl">
                  <div className="aspect-video bg-navy-200 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src="/work_mate.png" 
                      alt="Workmate製品イメージ" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              {/* Prompty Product */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="bg-navy-50 p-8 rounded-xl">
                  <div className="aspect-video bg-navy-200 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src="/prompty_logo.avif" 
                      alt="Prompty製品イメージ" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold mb-3 text-navy-800">Prompty</h2>
                  <p className="text-lg font-medium text-navy-600 mb-6">
                    生成AI活用を、もっと自由に。もっと創造的に。
                  </p>
                  <p className="text-navy-600 mb-6">
                    ChatGPTなどの生成AIを活用した"プロンプト（指示文）"を売買・共有できるプラットフォーム。
                    AIを使いこなすにはプロンプトの質がすべて。Promptyでは、優れたプロンプトを使えば、誰でもプロのようなアウトプットが可能になります。
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-navy-50 p-4 rounded-lg">
                      <h3 className="font-bold text-navy-800 mb-2">プロンプトマーケット</h3>
                      <p className="text-sm text-navy-600">
                        デザイン・マーケ・コーディング・企画など、目的別に最適なプロンプトを検索＆活用。
                      </p>
                    </div>
                    
                    <div className="bg-navy-50 p-4 rounded-lg">
                      <h3 className="font-bold text-navy-800 mb-2">収益化</h3>
                      <p className="text-sm text-navy-600">
                        自作のプロンプトを販売して副収入を得ることも可能。
                      </p>
                    </div>
                    
                    <div className="bg-navy-50 p-4 rounded-lg">
                      <h3 className="font-bold text-navy-800 mb-2">使いやすいUI</h3>
                      <p className="text-sm text-navy-600">
                        検索性、保存機能、タグ分類で誰でも簡単に目的のプロンプトにたどり着けます。
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button asChild className="bg-navy-800 hover:bg-navy-700">
                      <Link to="/product/prompty">詳細を見る</Link>
                    </Button>
                    
                    <Button variant="outline" className="border-navy-300 text-navy-700 hover:bg-navy-50">
                      <Link to="/consultation">お問い合わせ</Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Future Product Placeholder */}
              <div className="border border-dashed border-navy-300 rounded-xl p-10 text-center">
                <h3 className="text-2xl font-bold mb-3 text-navy-700">Coming Soon</h3>
                <p className="text-navy-600 mb-6 max-w-lg mx-auto">
                  新しいAIプロダクトを開発中です。最新情報をお届けするにはニュースレターにご登録ください。
                </p>
                <Button asChild variant="outline" className="border-navy-300 text-navy-700 hover:bg-navy-50">
                  <Link to="/contact">ニュースレターに登録する</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;
