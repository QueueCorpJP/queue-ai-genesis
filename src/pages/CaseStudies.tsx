import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CaseStudies: React.FC = () => {
  useEffect(() => {
    document.title = "導入事例 | Queue株式会社";
    window.scrollTo(0, 0);
  }, []);

  const caseStudies = [
    {
      industry: "マッチングプラットフォーム",
      title: "AIエージェントによるユーザー対応とマッチング最適化",
      client: "大手出会い系・風俗マッチングプラットフォーム運営企業",
      technology: [
        "会話型AIエージェント（NLP）",
        "行動パターン分析",
        "マッチング最適化アルゴリズム"
      ],
      challenge: "ユーザー増加に伴い、カスタマーサポートの負荷が急増。加えて、希望条件にマッチしない提案が多く、成約率の低下が課題でした。",
      solution: "・24時間対応のAIチャットエージェントを導入し、利用者の質問対応・登録支援・マッチング条件の最適化を自動化。\n・行動履歴から「本音に近いニーズ」を抽出し、AIによるレコメンド精度を継続的に学習・向上。",
      results: [
        "対応コストを75%削減",
        "マッチング成約率を28%改善",
        "ユーザー継続率が1.6倍に向上"
      ],
      comment: "AIエージェントの導入で運営コストが大きく下がり、ユーザー満足度も明確に向上しました。Queueのチームは、業界特有の課題にも理解が深く、非常に頼もしいパートナーです。",
      commentAuthor: "プラットフォーム事業責任者"
    },
    {
      industry: "航空業界",
      title: "設備点検の自動化＋OCRによる書類処理AI",
      client: "航空機整備会社（国内大手）",
      technology: [
        "現場業務AIエージェント（音声入力→自動記録）",
        "OCR＋NLPによる帳票の構造化",
        "保守記録の自動分類AI"
      ],
      challenge: "日々の点検報告書の手書き・転記作業が非効率で、人的ミスや確認遅れが安全性リスクに直結していた。",
      solution: "・整備士がスマホに話しかけるだけで、点検記録をAIが即座に構造化・登録。\n・過去のPDF・紙帳票をOCRで読み取り、自動でデータベース化。報告漏れや点検抜けの検出にも活用。",
      results: [
        "点検報告作成時間を80%短縮",
        "転記ミス・確認漏れの件数がゼロに",
        "定期点検の遅延がほぼ解消"
      ],
      comment: "Queue社のAI導入により、整備現場のオペレーションは根本から変わりました。現場スタッフの定着率にも良い影響が出ています。",
      commentAuthor: "航空整備統括マネージャー"
    },
    {
      industry: "AIアバター接客システム",
      title: "Web接客をAIアバターが完全代替",
      client: "大手美容医療系サービス事業者",
      technology: [
        "3D AIアバター（音声対話＋表情生成）",
        "対話ログのリアルタイム分析",
        "質問意図の自動分類・ナレッジ連携"
      ],
      challenge: "店舗・クリニックごとに接客品質がばらつき、初回来店前の不安が成約率の障壁となっていた。",
      solution: "・ユーザーがWebサイト上でアバターと自然対話。質問意図をAIが解釈し、予約誘導・施術内容の案内まで一気通貫で自動化。\n・会話ログはCRMと自動連携し、マーケ施策にも活用。",
      results: [
        "Web接客→予約率が2.3倍に向上",
        "人件費換算で年間600万円以上の削減",
        "ユーザー満足度アンケートで90%以上が「不安が解消された」と回答"
      ],
      comment: "AIアバターによって『店舗に行く前の安心感』を創出できたことが、私たちにとって最大の価値でした。",
      commentAuthor: "事業開発本部 本部長"
    },
    {
      industry: "BPO業務代行会社",
      title: "社内業務のAIエージェント自動化",
      client: "中堅BPOサービス企業（人材・事務代行）",
      technology: [
        "AIワークフローエージェント",
        "RAG（検索拡張生成）によるマニュアル対応AI",
        "Google Workspace / Notion連携"
      ],
      challenge: "日々の進捗報告や社内問い合わせ対応など、単純作業にリソースが割かれ、社員の負担が増大。",
      solution: "・社内ポータルに常駐するAIエージェントを設置し、社員からの質問に24時間対応。\n・各種マニュアル・書類から自動検索し、RAGで正確に回答。\n・報告・進捗入力などの定型業務も自動化。",
      results: [
        "社員1人あたり月10時間の作業削減",
        "社内問い合わせ件数が50%以上削減",
        "顧客対応品質の向上にも波及"
      ],
      comment: "AIによる業務代行は「手段」ではなく「文化」となりつつあります。Queueの提案は、単なる自動化にとどまらず、業務構造の再設計そのものでした。",
      commentAuthor: "業務推進部マネージャー"
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  実績が語る、AI実装の力
              </h1>
              <p className="text-xl text-navy-100 max-w-3xl mx-auto">
                Queue株式会社がこれまでに実現してきたAI導入事例をご紹介します。各業界における課題解決とビジネス成果の実例をご覧ください。
              </p>
            </div>
          </Container>
        </section>

        {/* Case Studies Section */}
        <section className="py-16 md:py-24 bg-navy-50 relative overflow-hidden">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                導入事例
                          </h2>
              <p className="text-navy-600 max-w-4xl mx-auto text-lg">
                Queueは多様な業界において、AIエージェント・OCR・アバター等の先進技術を活用し、<strong>業務の自動化と顧客体験の最適化</strong>を実現しています。
                          </p>
                        </div>
                        
            <div className="space-y-12">
              {caseStudies.map((caseStudy, index) => (
                <Card 
                  key={index} 
                  className="border-none bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                >
                  <CardHeader className="bg-gradient-to-r from-navy-50 to-navy-100/50 border-b border-navy-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className="inline-block bg-navy-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-3">
                          {caseStudy.industry}
                        </span>
                        <CardTitle className="text-2xl text-navy-800 mb-2">{caseStudy.title}</CardTitle>
                        <p className="text-navy-600 font-medium">クライアント：{caseStudy.client}</p>
                          </div>
                        </div>
                  </CardHeader>
                    
                  <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-bold text-navy-800 mb-3 text-lg flex items-center">
                            <div className="w-2 h-2 bg-navy-600 rounded-full mr-3"></div>
                            テクノロジー
                          </h4>
                          <ul className="space-y-2 ml-5">
                            {caseStudy.technology.map((tech, i) => (
                              <li key={i} className="text-navy-700 flex items-start">
                                <span className="text-navy-400 mr-2">•</span>
                                {tech}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-navy-800 mb-3 text-lg flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            課題
                          </h4>
                          <p className="text-navy-700 leading-relaxed ml-5">{caseStudy.challenge}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-navy-800 mb-3 text-lg flex items-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                            ソリューション
                          </h4>
                          <p className="text-navy-700 leading-relaxed ml-5 whitespace-pre-line">{caseStudy.solution}</p>
                        </div>
                                </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-navy-600 to-navy-800 p-6 rounded-2xl text-white">
                          <h4 className="font-bold mb-4 text-xl">成果</h4>
                          <ul className="space-y-3">
                            {caseStudy.results.map((result, i) => (
                              <li key={i} className="flex items-start">
                                <div className="w-2 h-2 bg-white rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                                <span className="font-medium text-lg">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-navy-50 p-6 rounded-2xl border-l-4 border-navy-600">
                          <h4 className="font-bold text-navy-800 mb-3 text-lg">クライアントの声</h4>
                          <blockquote className="text-navy-700 italic mb-3 leading-relaxed">
                            "{caseStudy.comment}"
                          </blockquote>
                          <cite className="text-navy-600 font-medium text-sm">
                            — {caseStudy.commentAuthor}
                          </cite>
                            </div>
                          </div>
                        </div>
                  </CardContent>
                </Card>
              ))}
                  </div>

            <div className="mt-16 text-center bg-gradient-to-br from-white to-navy-50 p-12 rounded-3xl shadow-lg border border-navy-100">
              <h3 className="text-2xl font-bold text-navy-800 mb-4">
                AI導入や業務自動化を検討中の方は、まずはご相談を。
              </h3>
              <p className="text-navy-600 text-lg mb-8 max-w-2xl mx-auto">
                実現可能性や参考事例など、初回商談でご説明いたします。
              </p>
              
              <Button 
                className="bg-navy-800 hover:bg-navy-700 text-white px-8 py-6 text-lg rounded-full group shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  // スムーズスクロールでContactセクションへ移動、またはContact ページへ遷移
                  window.location.href = '/contact';
                }}
              >
                無料相談を申し込む
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <p className="text-navy-500 text-sm mt-6">
                ※ お客様の課題に合わせた最適なソリューションをご提案いたします
              </p>
            </div>
          </Container>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-navy-100/50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-navy-200/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CaseStudies;