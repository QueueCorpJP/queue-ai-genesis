
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';

const WhyQueue = () => {
  useEffect(() => {
    document.title = "Why Queue? | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">なぜQueue？</h1>
              <p className="text-lg text-navy-100 max-w-2xl mx-auto">
                AI開発のパートナーとして私たちが選ばれる理由をご紹介します。技術力、スピード、クオリティ、すべてにおいて最高水準を追求しています。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 md:py-24">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-navy-800">圧倒的な技術力</h2>
                <p className="text-lg text-navy-600 mb-6">
                  Queueのエンジニアチームは、AI研究の最前線で活躍してきた専門家で構成されています。最新のAI技術を理解し、実装する能力は国内トップクラス。研究開発から実用化まで、一貫して高いレベルでサポートします。
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">自然言語処理、コンピュータビジョン、強化学習など専門分野ごとのエキスパートが在籍</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">国内外のAI学会で発表実績のあるリサーチャーを抱え、最先端技術を活用</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">大企業からスタートアップまで、多様なAIプロジェクト実績</span>
                  </li>
                </ul>
              </div>
              <div className="bg-navy-50 p-8 rounded-xl">
                <div className="aspect-video bg-navy-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="/public/first.png" 
                    alt="圧倒的な技術力" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1 bg-navy-50 p-8 rounded-xl">
                <div className="aspect-video bg-navy-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="/public/second.png" 
                    alt="圧倒的なスピード" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold mb-6 text-navy-800">圧倒的なスピード</h2>
                <p className="text-lg text-navy-600 mb-6">
                  従来の開発手法に比べ、AIを活用した高速開発手法で、開発期間を大幅に短縮。プロトタイプから本番環境まで、スピーディーに構築します。時間はビジネスの成功に直結する重要な要素。Queueはそれを理解しています。
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">最短1週間でのプロトタイプ開発</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">独自の高速開発フレームワークを活用し、従来の半分の期間で開発完了</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">アジャイル開発手法で、フィードバックを素早く反映</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-navy-800">圧倒的な品質</h2>
                <p className="text-lg text-navy-600 mb-6">
                  スピードだけではなく、品質にもこだわります。厳格なテスト体制と品質管理プロセスで、高品質なAIソリューションを提供。継続的なモニタリングと改善で、長期的な価値を創出します。
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">AIモデルの精度と信頼性を徹底検証する独自のテスト手法</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">モデルドリフトを防ぐための継続的監視システム</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-navy-700 mr-2 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-navy-600">品質に関する明確なSLAを設定し、確実な品質保証</span>
                  </li>
                </ul>
              </div>
              <div className="bg-navy-50 p-8 rounded-xl">
                <div className="aspect-video bg-navy-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="/public/third.png" 
                    alt="圧倒的な品質" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhyQueue;
