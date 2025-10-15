
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

const Products = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "AI製品・ソリューション",
    "manufacturer": {
      "@type": "Organization",
      "name": "Queue株式会社",
      "url": "https://queue-tech.jp"
    },
    "description": "App ExitやWorkmateなど、Queue株式会社が開発するAI製品とソリューション",
    "category": "AI Software",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2025-12-31",
      "seller": {
        "@type": "Organization",
        "name": "Queue株式会社"
      }
    }
  };

  useEffect(() => {
    document.title = "製品一覧 | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="AI製品・ソリューション | Queue株式会社 - App Exit & Workmate"
        description="キュー株式会社が開発するAI製品・ソリューション。App Exit（プロダクト取引プラットフォーム）、Workmate（社内問い合わせAI）など革新的な製品をご紹介します。"
        keywords="AI製品,AIソリューション,App Exit,アップエグジット,Workmate,Queue株式会社,キュー株式会社,AI技術,生成AI,プロンプトエンジニアリング,AI開発ツール,プロダクト売却,M&A,事業譲渡"
        canonicalUrl="/products"
        structuredData={structuredData}
      />
      
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">製品一覧</h1>
              <p className="text-lg text-navy-100 max-w-2xl mx-auto">
                Queue株式会社の事業をご紹介します。
                社内業務効率化からプロダクト取引まで、最先端技術で様々なビジネス課題を解決します。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 md:py-24">
          <Container>
            <div className="space-y-24">
              {/* App Exit Product */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-1 bg-emerald-50 p-8 rounded-xl">
                  <div className="aspect-video bg-emerald-200 rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-12 h-12">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      </div>
                      <p className="text-emerald-800 font-bold text-xl">App Exit</p>
                    </div>
                  </div>
                </div>
                
                <div className="order-2">
                  <h2 className="text-3xl font-bold mb-3 text-navy-800">App Exit（アップエグジット）</h2>
                  <p className="text-lg font-medium text-emerald-700 mb-4">
                    開発者の努力を眠らせない。あなたのプロダクトに、次の経営者を。
                  </p>
                  <p className="text-navy-600 mb-6">
                    個人・法人・開発チームが保有する<strong>アプリ・SaaS・AIツール・Webサービス</strong>を、<strong className="text-emerald-700">安全・迅速・公正</strong>に売買できるプラットフォーム。
                    Queue株式会社が運営する、日本初の<strong className="text-emerald-700">"プロダクト流通インフラ"</strong>です。
                  </p>
                  
                  {/* 背景 */}
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-navy-800 mb-2 flex items-center">
                      <span className="text-amber-600 mr-2">🎯</span>背景
                    </h3>
                    <ul className="space-y-2 text-sm text-navy-600">
                      <li>• 毎年数千件のプロダクトが、運用リソース不足や採算割れで閉鎖</li>
                      <li>• 企業側は「完成済みプロダクト」をPoCや新規事業素材として求めている</li>
                      <li>• しかし、既存M&A市場は小規模案件を扱わず、契約や信頼性の面で参入障壁が高い</li>
                      <li className="font-semibold text-emerald-700 mt-2">→ App Exitは、このミスマッチを解消する「マイクロM&A」の新しい仕組み</li>
                    </ul>
                  </div>
                  
                  {/* 仕組み（プロセス） */}
                  <div className="bg-emerald-50 p-6 rounded-lg mb-6">
                    <h3 className="font-bold text-navy-800 mb-4 flex items-center">
                      <span className="text-emerald-600 mr-2">⚙️</span>仕組み（プロセス）
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0">1</span>
                        <p className="text-navy-600 pt-0.5"><strong>出品登録</strong>（希望価格・技術情報入力）</p>
                      </div>
                      <div className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0">2</span>
                        <p className="text-navy-600 pt-0.5"><strong>Queueによる審査</strong>・ノンネーム化</p>
                      </div>
                      <div className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0">3</span>
                        <p className="text-navy-600 pt-0.5"><strong>NDA締結後</strong>、企業が案件を閲覧</p>
                      </div>
                      <div className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0">4</span>
                        <p className="text-navy-600 pt-0.5"><strong>条件交渉</strong> → LOI（基本合意）</p>
                      </div>
                      <div className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0">5</span>
                        <p className="text-navy-600 pt-0.5"><strong>技術・法務デューデリジェンス</strong></p>
                      </div>
                      <div className="flex items-start">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0">6</span>
                        <p className="text-navy-600 pt-0.5"><strong>契約・譲渡・決済</strong>（エスクロー方式）</p>
                      </div>
                      <p className="text-emerald-700 font-semibold mt-3 pl-9">→ すべてオンライン完結、法務〜決済までQueueが伴走。</p>
                    </div>
                  </div>
                  
                  {/* 主なユーザー層 */}
                  <div className="bg-navy-50 p-6 rounded-lg mb-6">
                    <h3 className="font-bold text-navy-800 mb-4 flex items-center">
                      <span className="mr-2">👥</span>主なユーザー層
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <span className="font-semibold text-navy-800">個人開発者：</span>
                          <span className="text-navy-600">副業・趣味開発のExitを実現</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <span className="font-semibold text-navy-800">小規模法人・スタートアップ：</span>
                          <span className="text-navy-600">非中核プロダクトを整理・資金化</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <span className="font-semibold text-navy-800">中堅企業・SIer：</span>
                          <span className="text-navy-600">新規事業PoCを低コストで獲得</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <span className="font-semibold text-navy-800">投資家・ファンド：</span>
                          <span className="text-navy-600">小規模SaaSを買収→育成→再販</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 安全・透明な取引設計 */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8">
                    <h3 className="font-bold text-navy-800 mb-4 flex items-center">
                      <span className="text-blue-600 mr-2">🛡️</span>安全・透明な取引設計
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-700"><strong>NDA必須・エスクロー決済</strong></span>
                        </div>
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-700"><strong>弁護士監修テンプレート</strong><br />（NDA／LOI／SPA）</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-700"><strong>KYC／法人登記確認</strong></span>
                        </div>
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-navy-700"><strong>通信暗号化（TLS1.3）</strong><br />＋監査ログ管理</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-blue-700 font-semibold text-sm mt-4 bg-white/50 p-3 rounded">
                      → 上場企業基準のセキュリティ体制で運用
                    </p>
                  </div>
                  
                  {/* メッセージ */}
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 p-6 rounded-xl mb-8 text-center">
                    <h3 className="font-bold text-emerald-800 mb-3 flex items-center justify-center">
                      <span className="mr-2">✨</span>メッセージ
                    </h3>
                    <p className="text-navy-700 leading-relaxed">
                      <span className="block font-semibold text-emerald-700 text-lg mb-2">開発者の努力を眠らせない。</span>
                      <span className="block font-semibold text-emerald-700 text-lg mb-2">あなたのプロダクトに、次の経営者を。</span>
                      <span className="block text-navy-600 text-sm">上場企業基準の安心で、マイクロM&Aをもっと身近に。</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-emerald-700 hover:bg-emerald-600">
                      Coming Soon
                    </Button>
                    
                    <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <Link to="/consultation">事前登録・お問い合わせ</Link>
                    </Button>
                  </div>
                </div>
              </div>

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
              
              {/* Future Product Placeholder */}
              <div className="border border-dashed border-navy-300 rounded-xl p-10 text-center">
                <h3 className="text-2xl font-bold mb-3 text-navy-700">Coming Soon</h3>
                <p className="text-navy-600 mb-6 max-w-lg mx-auto">
                  さらに新しいAIプロダクトを開発中です。最新情報をお届けするにはニュースレターにご登録ください。
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
