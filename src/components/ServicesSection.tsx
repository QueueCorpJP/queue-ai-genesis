
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ServicesSection: React.FC = () => {
  const services = [
    {
      title: "AI受託開発",
      description: "企業独自のAIソリューションを開発。データ分析から実装、デプロイまで一貫して提供します。",
      features: ["カスタムAIモデル開発", "データ前処理・最適化", "企業システム連携", "継続的な改善サポート"]
    },
    {
      title: "高速プロトタイピング",
      description: "アイデアを最短3日でプロトタイプに。クイックな市場検証を可能にします。",
      features: ["最短3日で初期デモ", "アジャイル開発プロセス", "ユーザーフィードバック組込み", "段階的な改善"]
    },
    {
      title: "生成AIソリューション",
      description: "最新の生成AIを活用し、コンテンツ作成やデータ分析の自動化を実現します。",
      features: ["GPT・LLM活用開発", "画像生成AI連携", "マルチモーダルAI実装", "業務プロセス自動化"]
    }
  ];

  return (
    <section id="services" className="section bg-white relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            サービス
          </h2>
          <p className="text-navy-600 max-w-2xl mx-auto">
            Queueは最先端のAI技術と迅速な開発プロセスを組み合わせ、
            お客様のビジネス課題を解決する最適なソリューションを提供します。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="border border-navy-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <CardHeader className="border-b border-navy-50 bg-navy-50/30">
                <CardTitle className="text-xl text-navy-800">{service.title}</CardTitle>
                <CardDescription className="text-navy-600">{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
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
                      <span className="text-navy-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-navy-100/30 rounded-full blur-3xl"></div>
    </section>
  );
};

export default ServicesSection;
