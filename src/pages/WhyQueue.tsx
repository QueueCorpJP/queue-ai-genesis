import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';

const WhyQueue = () => {
  useEffect(() => {
    document.title = "Queueが選ばれる3つの理由 | Queue株式会社";
  }, []);

  const reasons = [
    {
      title: "実運用に強い\"現場型\"AIエンジニアチーム",
      subtitle: "1.",
      icon: (
        <div className="w-12 h-12 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-navy-400 rounded-full"></div>
        </div>
      ),
      description: "Queueのエンジニアは、PoC止まりではなく「業務で本当に使えるAI」を開発・運用することに特化した実践型チームです。自然言語処理・画像解析・レコメンドなど多様な分野に対応し、社内に実装ノウハウと業務設計力が蓄積されています。",
      features: [
        "ChatGPT / Claude / Gemini 等のAPI活用 + RAG構成の知見も豊富",
        "Supabase / BigQuery / GCPなど本番運用に耐えるインフラ設計も一気通貫で対応",
        "クライアントの業務要件に沿った「AI導入 × ビジネス設計」を支援"
      ],
      conclusion: "だから解ける課題が違う：既製APIやノーコードツールでは届かない\"リアルな現場課題\"に踏み込めます。",
      image: "/first.png"
    },
    {
      title: "初回商談で\"動くプロトタイプ\"を提示",
      subtitle: "2.",
      icon: (
        <div className="w-12 h-12 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center">
          <div className="w-5 h-0.5 bg-navy-400 rounded"></div>
        </div>
      ),
      description: "Queueでは、ヒアリングしたその日 or 翌営業日には、Google Meet や Zoom で実際に動作するAIチャットボットのプロトタイプを提示可能。「こんな感じです」が\"見える\"初回商談を徹底しています。",
      features: [
        "ヒアリング内容から即座にMVP（最小構成）を構築・共有",
        "「とりあえず話してみたら、もう動いてた」と驚かれるスピード感",
        "技術仕様の前に「使う側の目線で体験できる」商談設計"
      ],
      conclusion: "だから発注判断が早い：「説明」ではなく「体験」で納得してもらえる営業フローを実現。",
      image: "/second.png"
    },
    {
      title: "開発〜運用まで一気通貫、\"最短\"のスピードで価値提供",
      subtitle: "3.",
      icon: (
        <div className="w-12 h-12 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center">
          <div className="flex gap-0.5 items-end">
            <div className="w-0.5 h-5 bg-navy-400 rounded"></div>
            <div className="w-0.5 h-3.5 bg-navy-400 rounded"></div>
            <div className="w-0.5 h-4.5 bg-navy-400 rounded"></div>
          </div>
        </div>
      ),
      description: "Queueでは、要件定義から設計・開発・運用までを内製体制で担うことで、案件ごとの難易度や要件に応じて最適なスピードと品質のバランスを設計しています。小規模PoCであれば最短1週間〜のプロトタイプ提供も可能で、早期にユーザー価値を届ける設計思想を重視しています。",
      features: [
        "案件規模や要件に応じて開発計画を柔軟に最適化",
        "自社開発のMCPチャットボット「Workmate」など再利用可能な基盤も活用",
        "アジャイル開発体制により、改善サイクルも高速に実行可能"
      ],
      conclusion: "だから\"待たせない\"開発ができる：「すぐ出す」「しっかり仕上げる」を両立できる現実的な開発体制。",
      image: "/third.png"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 md:pt-24">
        <section className="bg-navy-50 py-12 md:py-16">
          <Container>
            <div className="max-w-4xl mx-auto text-center px-4">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-navy-800">
                ✅ Queueが選ばれる3つの理由
              </h1>
              <p className="text-sm md:text-base text-navy-600 max-w-3xl mx-auto leading-relaxed">
                既製APIやノーコードツールでは届かない\"リアルな現場課題\"を解決する、
                実運用に特化したAI開発チームです。初回商談で動くプロトタイプを体験いただき、
                最短1週間から価値提供を開始します。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-12 md:py-16">
          <Container>
            {reasons.map((reason, index) => (
              <div key={index} className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center ${index < reasons.length - 1 ? 'mb-12 md:mb-20' : ''}`}>
                <div className={index % 2 === 1 ? 'order-2 md:order-1' : ''}>
                  <div className="bg-navy-50 p-5 sm:p-7 md:p-8 rounded-2xl">
                    <div className="aspect-video bg-navy-200 rounded-xl flex items-center justify-center overflow-hidden">
                      <img 
                        src={reason.image} 
                        alt={reason.title} 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                
                <div className={index % 2 === 1 ? 'order-1 md:order-2' : ''}>
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {reason.icon}
                    <div>
                      <span className="text-xl sm:text-2xl font-bold text-navy-800">{reason.subtitle}</span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-navy-800 leading-snug">{reason.title}</h2>
                    </div>
                  </div>
          
                  <p className="text-sm sm:text-base text-navy-600 mb-5 sm:mb-6 leading-relaxed">
                    {reason.description}
                  </p>
                  
                  <ul className="space-y-3 mb-5 sm:mb-6">
                    {reason.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-navy-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-navy-700 text-sm sm:text-base leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="bg-navy-50 p-4 rounded-lg border border-navy-100">
                    <p className="text-navy-700 text-sm sm:text-base leading-relaxed">
                      {reason.conclusion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-navy-50">
          <Container>
            <div className="text-center max-w-3xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-navy-800">
                まずは無料デモで体験してください
              </h2>
              <p className="text-sm md:text-base text-navy-600 mb-6 md:mb-8 leading-relaxed">
                ヒアリング当日または翌営業日には、実際に動作するプロトタイプをお見せします。
                「説明」ではなく「体験」で、Queueの実力をご確認ください。
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

export default WhyQueue;