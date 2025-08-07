import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ProcessFlowSection: React.FC = () => {
  const steps = [
    {
      number: "①",
      title: "無料相談 or お問い合わせ（まずはお気軽に）",
      description: "お求めの内容が明確でなくても問題ありません。\n「こんなことできますか？」というふわっとしたご相談でも大歓迎です。"
    },
    {
      number: "②",
      title: "打ち合わせ日程の調整",
      description: "フォーム送信後、1営業日以内に担当者よりご連絡いたします。\nご都合の良い日程で、初回打ち合わせの調整を行います。"
    },
    {
      number: "③",
      title: "初回打ち合わせ＋即体感デモ（30〜60分）",
      description: "お客様の課題感をヒアリングしたうえで、**その場で「こういうことができます」**という\nイメージデモ（AI・自動化・Webなど）をご提示します。"
    },
    {
      number: "④",
      title: "要件ヒアリング・詳細詰め",
      description: "イメージが固まった段階で、必要な機能・業務フローなどの詳細をヒアリングし、要件を一緒に整理します。"
    },
    {
      number: "⑤",
      title: "見積書のご提示",
      description: "要件に基づいた**具体的な見積書（スケジュール・費用・体制）**をお送りします。\n内容にご納得いただければ、契約に進みます。"
    },
    {
      number: "⑥",
      title: "ご契約・開発開始",
      description: "NDAや準委任／請負契約の締結後、開発をスタートします。\n※契約書の雛形もこちらで用意可能です。"
    },
    {
      number: "⑦",
      title: "週次ミーティングによる進行管理",
      description: "開発中は週1回の定例ミーティングを実施。\n認識のズレを防ぎ、スムーズかつ柔軟に開発を進めます。"
    }
  ];

  return (
    <section className="section bg-navy-50 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            ✅ ご依頼から開発までの流れ
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="border-none bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-navy-800 mb-3">
                      {step.title}
                    </h3>
                    <div className="text-navy-600 leading-relaxed whitespace-pre-line">
                      {step.description.split(/(\*\*.*?\*\*)/).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className="font-bold text-navy-800">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center bg-white p-8 rounded-2xl shadow-sm border border-navy-100 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-navy-800 mb-4">
            ✅ 最後に一言（安心感を伝える）
          </h3>
          <p className="text-navy-600 text-lg leading-relaxed">
            Queueは「スピード感」と「伴走」を大切にしています。<br />
            まずはお気軽にご相談ください。その場で未来の一歩を、一緒に描きましょう。
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-navy-100/50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-navy-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
    </section>
  );
};

export default ProcessFlowSection;