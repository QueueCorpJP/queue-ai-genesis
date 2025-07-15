
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CaseStudiesSection: React.FC = () => {
  const caseStudies = [
    {
      industry: "金融テック",
      title: "AIによる不正検知システム",
      results: ["不正検知率が前年比35%向上", "誤検知率を60%削減", "処理速度が10倍に向上"],
      description: "大手クレジットカード会社向けに、リアルタイム不正検知AIを開発。取引データの異常を瞬時に検出し、顧客と企業の双方を保護します。"
    },
    {
      industry: "小売業",
      title: "商品推薦エンジン",
      results: ["コンバージョン率が22%向上", "客単価が15%増加", "リピート率が30%向上"],
      description: "ECサイト向けの高度な商品推薦エンジンを構築。顧客行動を分析し、パーソナライズされた商品提案でショッピング体験を向上させました。"
    },
    {
      industry: "ヘルスケア",
      title: "医療画像診断支援",
      results: ["診断精度が医師単独より12%向上", "診断時間を平均40%短縮", "希少疾患の発見率向上"],
      description: "放射線科医をサポートする画像診断AIを開発。MRIやCTスキャンの異常を高精度で検出し、医師の診断をサポートします。"
    }
  ];

  return (
    <section id="case-studies" className="section bg-navy-50 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            導入事例
          </h2>
          <p className="text-navy-600 max-w-2xl mx-auto">
            Queueは様々な業界のクライアントと協力し、AIを活用した
            革新的なソリューションを提供してきました。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {caseStudies.map((caseStudy, index) => (
            <Card 
              key={index} 
              className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col"
            >
              <CardHeader className="border-b border-navy-50 bg-navy-50/30">
                <span className="text-sm font-medium text-navy-600">{caseStudy.industry}</span>
                <CardTitle className="text-xl text-navy-800">{caseStudy.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow pt-6">
                <p className="text-navy-600 mb-6 flex-grow">{caseStudy.description}</p>
                <div className="bg-navy-50/50 p-4 rounded-xl mt-auto">
                  <h4 className="font-medium text-navy-700 mb-2">成果</h4>
                  <ul className="space-y-2">
                    {caseStudy.results.map((result, i) => (
                      <li key={i} className="flex items-start">
                        <svg 
                          className="h-5 w-5 text-navy-600 mr-2 flex-shrink-0 mt-0.5" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span className="text-navy-700">{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-navy-600 italic">
            ※ 守秘義務により、一部のプロジェクトは詳細を非公開としています。
            具体的な事例については、お問い合わせください。
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-navy-100/50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-navy-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
    </section>
  );
};

export default CaseStudiesSection;
