
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Careers = () => {
  useEffect(() => {
    document.title = "採用情報 | Queue株式会社";
  }, []);

  const positions = [
    {
      title: "AI エンジニア",
      type: "正社員",
      location: "東京（リモート可）",
      description: "最先端のAI技術を活用したプロダクト開発を行うエンジニアを募集しています。自然言語処理や機械学習の知識を活かし、革新的なソリューションを一緒に作り上げましょう。",
      requirements: [
        "機械学習・深層学習の基礎知識",
        "Python経験2年以上",
        "PyTorchまたはTensorFlowの使用経験",
        "英語でのドキュメント読解能力"
      ],
      preferred: [
        "大規模言語モデル（LLM）のチューニング経験",
        "クラウドAIサービス（AWS、GCP、Azure）の利用経験",
        "自然言語処理関連のプロジェクト実績"
      ]
    },
    {
      title: "フロントエンドエンジニア",
      type: "正社員",
      location: "東京（リモート可）",
      description: "ユーザー体験を重視した先進的なウェブアプリケーションを開発するフロントエンドエンジニアを募集しています。モダンなフロントエンド技術を駆使して、革新的なプロダクトづくりに参加してください。",
      requirements: [
        "HTML, CSS, JavaScript/TypeScriptの実務経験2年以上",
        "React, Next.js などのモダンフレームワークの使用経験",
        "レスポンシブデザインの実装経験",
        "Git によるバージョン管理経験"
      ],
      preferred: [
        "Tailwind CSSの使用経験",
        "アクセシビリティに関する知識と実践経験",
        "WebGLやThree.jsなどを用いた3Dコンテンツ開発経験"
      ]
    },
    {
      title: "プロンプトエンジニア",
      type: "正社員 / 契約社員",
      location: "リモート",
      description: "生成AIを活用したプロダクト開発を支援するプロンプトエンジニアを募集しています。クライアントのニーズに合わせた効果的なプロンプト設計を通じて、AIシステムの性能を最大化するお仕事です。",
      requirements: [
        "ChatGPTなどのLLMを活用した実務経験",
        "効果的なプロンプト設計の知識と経験",
        "基本的な自然言語処理の理解",
        "コミュニケーション能力と課題解決能力"
      ],
      preferred: [
        "プロンプトエンジニアリングの体系的な知識",
        "複数のLLMでの開発経験（GPT-4, Claude, Llama等）",
        "AIツール開発の経験"
      ]
    }
  ];

  const benefits = [
    "リモートワーク可能（フルリモートも相談可）",
    "フレックスタイム制度",
    "書籍購入支援制度",
    "技術勉強会・カンファレンス参加費補助",
    "通信費補助（月5,000円まで）",
    "副業OK（当社業務に関連しない範囲）"
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">採用情報</h1>
              <p className="text-xl text-navy-100 mb-8">
                Queueの未来を一緒に創り上げる仲間を募集しています
              </p>
              <p className="text-navy-200">
                AI駆動で、圧倒的スピードと品質を提供するQueueで、あなたの才能を発揮しませんか？
                私たちは最新技術への情熱と、革新的なソリューションへの探求心を持つ方を歓迎します。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 bg-navy-50">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-12 text-center gradient-text">募集ポジション</h2>
              
              <div className="space-y-8">
                {positions.map((position, index) => (
                  <Card key={index} className="overflow-hidden border-none shadow-md">
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-navy-100">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <h3 className="text-2xl font-bold text-navy-800">{position.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-navy-100 text-navy-700">
                              {position.type}
                            </Badge>
                            <Badge variant="outline" className="bg-navy-100 text-navy-700">
                              {position.location}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-navy-600">{position.description}</p>
                      </div>
                      <div className="p-6">
                        <div className="mb-6">
                          <h4 className="font-semibold mb-2 text-navy-800">必須スキル・経験</h4>
                          <ul className="list-disc pl-5 text-navy-600 space-y-1">
                            {position.requirements.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mb-6">
                          <h4 className="font-semibold mb-2 text-navy-800">歓迎スキル・経験</h4>
                          <ul className="list-disc pl-5 text-navy-600 space-y-1">
                            {position.preferred.map((pref, i) => (
                              <li key={i}>{pref}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-center">
                          <Button asChild className="bg-navy-800 hover:bg-navy-700">
                            <a href="#application-form">応募する</a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </section>
        
        <section className="py-16">
          <Container>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center gradient-text">福利厚生</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border border-navy-100 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-navy-700 text-center">{benefit}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card className="border-navy-200 shadow-md" id="application-form">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-navy-800 text-center">応募フォーム</h2>
                  <p className="text-navy-600 text-center mb-8">
                    以下のメールアドレスに履歴書と職務経歴書をお送りください。<br />
                    ※件名に「応募ポジション名」を明記してください。
                  </p>
                  
                  <div className="text-center">
                                    <a href="mailto:queue@queue-tech.jp" className="text-xl font-medium text-navy-700 hover:text-navy-900 transition-colors">
                  queue@queue-tech.jp
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Careers;
