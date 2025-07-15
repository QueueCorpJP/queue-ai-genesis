
import React from 'react';

const WhyQueueSection: React.FC = () => {
  const advantages = [
    {
      title: "1/3デモ戦略",
      description: "プロジェクト費用の1/3でまず動くプロトタイプを作成。投資リスクを抑えながら方向性の確認が可能です。",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-navy-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "アジャイル週次ミーティング",
      description: "毎週の進捗確認と方向性調整で、要件変化に柔軟に対応。常に価値のある成果物を提供します。",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-navy-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "AIスペシャリストチーム",
      description: "AI研究者、エンジニア、UXデザイナーがチームを組み、最先端技術で実用的なソリューションを構築します。",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-navy-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <section id="why-queue" className="section bg-navy-50 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            なぜQueueを選ぶか
          </h2>
          <p className="text-navy-600 max-w-2xl mx-auto">
            私たちは従来の開発手法を革新し、AI技術の力を最大限に活用した
            新しい価値提供モデルを確立しています。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {advantages.map((item, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="mb-6 transform transition-transform duration-500 group-hover:scale-110">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">{item.title}</h3>
              <p className="text-navy-600">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:w-1/3">
              <div className="bg-navy-100 rounded-full p-6 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-navy-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="md:w-2/3 md:pl-10">
              <h3 className="text-2xl font-bold text-navy-800 mb-4">
                信頼の品質保証
              </h3>
              <p className="text-navy-600 mb-4">
                すべてのプロジェクトに品質保証プロセスを適用。コードレビュー、自動テスト、
                セキュリティチェックを徹底し、堅牢なシステムを提供します。
              </p>
              <p className="text-navy-600">
                開発完了後もサポート期間を設け、運用開始後の安定稼働をサポートします。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-navy-100/50 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-navy-200/30 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
    </section>
  );
};

export default WhyQueueSection;
