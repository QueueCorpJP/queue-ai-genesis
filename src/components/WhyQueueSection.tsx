import React from 'react';

const WhyQueueSection: React.FC = () => {
  const advantages = [
    {
      title: "実運用に強い\"現場型\"AIエンジニアチーム",
      subtitle: "1.",
      description: "Queueのエンジニアは、PoC止まりではなく「業務で本当に使えるAI」を開発・運用することに特化した実践型チームです。自然言語処理・画像解析・レコメンドなど多様な分野に対応し、社内に実装ノウハウと業務設計力が蓄積されています。",
      features: [
        "ChatGPT / Claude / Gemini 等のAPI活用 + RAG構成の知見も豊富",
        "Supabase / BigQuery / GCPなど本番運用に耐えるインフラ設計も一気通貫で対応",
        "クライアントの業務要件に沿った「AI導入 × ビジネス設計」を支援"
      ],
      conclusion: "だから解ける課題が違う：既製APIやノーコードツールでは届かない\"リアルな現場課題\"に踏み込めます。",
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-navy-700 rounded"></div>
          </div>
        </div>
      )
    },
    {
      title: "初回商談で\"動くプロトタイプ\"を提示",
      subtitle: "2.",
      description: "Queueでは、ヒアリングしたその日 or 翌営業日には、Google Meet や Zoom で実際に動作するAIチャットボットのプロトタイプを提示可能。「こんな感じです」が\"見える\"初回商談を徹底しています。",
      features: [
        "ヒアリング内容から即座にMVP（最小構成）を構築・共有",
        "「とりあえず話してみたら、もう動いてた」と驚かれるスピード感",
        "技術仕様の前に「使う側の目線で体験できる」商談設計"
      ],
      conclusion: "だから発注判断が早い：「説明」ではなく「体験」で納得してもらえる営業フローを実現。",
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      title: "開発〜運用まで一気通貫、\"最短\"のスピードで価値提供",
      subtitle: "3.",
      description: "Queueでは、要件定義から設計・開発・運用までを内製体制で担うことで、案件ごとの難易度や要件に応じて最適なスピードと品質のバランスを設計しています。小規模PoCであれば最短1週間〜のプロトタイプ提供も可能で、早期にユーザー価値を届ける設計思想を重視しています。",
      features: [
        "案件規模や要件に応じて開発計画を柔軟に最適化",
        "自社開発のMCPチャットボット「Workmate」など再利用可能な基盤も活用",
        "アジャイル開発体制により、改善サイクルも高速に実行可能"
      ],
      conclusion: "だから\"待たせない\"開発ができる：「すぐ出す」「しっかり仕上げる」を両立できる現実的な開発体制。",
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-1 h-6 bg-white rounded-full"></div>
            <div className="w-1 h-4 bg-white rounded-full mt-2"></div>
            <div className="w-1 h-5 bg-white rounded-full mt-1"></div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="why-queue" className="section bg-navy-50 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            ✅ Queueが選ばれる3つの理由
          </h2>
          <p className="text-navy-600 max-w-3xl mx-auto">
            既製APIやノーコードツールでは届かない\"リアルな現場課題\"を解決する、
            実運用に特化したAI開発チームです。
          </p>
        </div>

        <div className="space-y-12">
          {advantages.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
                <div className="sm:flex-shrink-0 transform transition-transform duration-500 hover:scale-110">
                {item.icon}
              </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-navy-800">{item.subtitle}</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-navy-800">{item.title}</h3>
            </div>
                  <p className="text-navy-600 mb-4 sm:mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {item.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        <div className="w-2 h-2 bg-navy-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <span className="text-navy-600 text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="bg-navy-50 p-3 sm:p-4 rounded-lg border-l-4 border-navy-600">
                    <p className="text-navy-700 font-medium text-sm sm:text-base">
                      {item.conclusion}
              </p>
            </div>
          </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-navy-100/50 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-navy-200/30 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
    </section>
  );
};

export default WhyQueueSection;