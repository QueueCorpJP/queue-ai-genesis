
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const CaseStudies: React.FC = () => {
  useEffect(() => {
    document.title = "導入事例 | Queue株式会社";
    // Ensure page starts at the top
    window.scrollTo(0, 0);
  }, []);

  const caseStudies = [
    {
      id: 1,
      client: "マネーフォワード社",
      industry: "金融テック",
      title: "AIによる不正検知システムの構築",
      challenge: "増加する決済詐欺に対して、従来の規則ベースでは検知しきれない高度な不正取引への対応が課題でした。",
      solution: "取引パターン学習型の AI モデルを開発し、リアルタイムでの不正検知システムを実装。さらに、検知精度を継続的に向上させる自己学習の仕組みも構築しました。",
      results: [
        "不正検知率が前年比35%向上", 
        "誤検知率を60%削減", 
        "処理速度が10倍に向上",
        "導入から3ヶ月で投資回収を達成"
      ],
      technologies: ["深層学習", "リアルタイムデータ処理", "異常検知アルゴリズム"],
      testimonial: {
        quote: "Queue社のAIソリューションは我々の期待を遥かに超える成果をもたらしました。特に、誤検知の大幅な削減により、お客様体験の向上にも繋がっています。",
        author: "取締役 CTO",
        company: "マネーフォワード株式会社"
      },
      imageUrl: "/images/fintech-case.jpg"
    },
    {
      id: 2,
      client: "ZOZOテクノロジーズ社",
      industry: "小売業",
      title: "パーソナライズド商品推薦エンジンの開発",
      challenge: "数百万点の商品と数千万人のユーザーデータから、各顧客に最適な商品を推薦するシステムの構築が必要でした。",
      solution: "ユーザー行動履歴と商品特性を組み合わせた独自のアルゴリズムを開発。さらに、セッション内行動にリアルタイムで対応する推薦システムを実装しました。",
      results: [
        "コンバージョン率が22%向上", 
        "客単価が15%増加", 
        "リピート率が30%向上",
        "アプリ内滞在時間が2倍に増加"
      ],
      technologies: ["協調フィルタリング", "コンテンツベース推薦", "強化学習"],
      testimonial: {
        quote: "Queue社のAIチームは技術力だけでなく、ビジネス課題への深い理解を持って開発に取り組んでくれました。その結果、数字に表れる成果を出すことができました。",
        author: "執行役員 AIソリューション部長",
        company: "ZOZOテクノロジーズ株式会社"
      },
      imageUrl: "/images/retail-case.jpg"
    },
    {
      id: 3,
      client: "医療法人 健心会",
      industry: "ヘルスケア",
      title: "医療画像診断支援AIの開発",
      challenge: "放射線科医の不足と診断業務の負担増加に対して、診断精度を落とさずに業務効率化が求められていました。",
      solution: "CTスキャンとMRI画像に特化した機械学習モデルを構築。異常検出と優先順位付けを自動化し、放射線科医の診断ワークフローを最適化しました。",
      results: [
        "診断精度が医師単独より12%向上", 
        "診断時間を平均40%短縮", 
        "希少疾患の発見率向上",
        "専門医の労働時間を週あたり約10時間削減"
      ],
      technologies: ["畳み込みニューラルネットワーク", "画像セグメンテーション", "転移学習"],
      testimonial: {
        quote: "AI支援により、私たち医師はより複雑な症例に集中できるようになりました。何より患者さんへの診断結果を早く届けられることが大きな価値です。",
        author: "放射線科 部長",
        company: "医療法人 健心会"
      },
      imageUrl: "/images/healthcare-case.jpg"
    }
  ];

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-white">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="bg-navy-800 text-white py-20 md:py-28">
          <Container>
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
                  実績が語る、AI実装の力
                </span>
              </h1>
              <p className="text-lg md:text-xl text-navy-100 max-w-3xl mx-auto">
                Queue株式会社がこれまでに実現してきたAI導入事例をご紹介します。
                各業界における課題解決とビジネス成果の実例をご覧ください。
              </p>
            </div>
          </Container>
        </section>

        {/* Case Studies Grid */}
        <section className="py-16 md:py-24">
          <Container>
            <motion.div 
              className="max-w-6xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              {caseStudies.map((caseStudy) => (
                <motion.div
                  key={caseStudy.id}
                  className="mb-20 bg-white rounded-3xl shadow-xl overflow-hidden"
                  variants={itemVariants}
                >
                  <div className="grid md:grid-cols-12 gap-0">
                    {/* Left colored section */}
                    <div className="md:col-span-5 lg:col-span-4 bg-navy-700 text-white p-8 md:p-10">
                      <div className="h-full flex flex-col justify-between">
                        <div>
                          <Badge className="mb-4 bg-navy-500 text-white hover:bg-navy-400">
                            {caseStudy.industry}
                          </Badge>
                          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                            {caseStudy.title}
                          </h2>
                          <p className="text-navy-200 mb-6">
                            クライアント: {caseStudy.client}
                          </p>
                        </div>
                        
                        <div className="bg-navy-600 p-6 rounded-xl mt-auto">
                          <p className="text-navy-100 text-sm">テクノロジー</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {caseStudy.technologies.map((tech, idx) => (
                              <Badge key={idx} className="bg-navy-400 hover:bg-navy-300 text-white">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right content section */}
                    <div className="md:col-span-7 lg:col-span-8 p-8 md:p-10">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-navy-700 mb-2">課題</h3>
                          <p className="text-navy-600">{caseStudy.challenge}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-navy-700 mb-2">ソリューション</h3>
                          <p className="text-navy-600">{caseStudy.solution}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-navy-700 mb-2">成果</h3>
                          <ul className="space-y-2">
                            {caseStudy.results.map((result, idx) => (
                              <li key={idx} className="flex items-start">
                                <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="text-navy-700">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Testimonial */}
                        <div className="border-t border-navy-100 pt-6 mt-8">
                          <blockquote className="italic text-navy-600 mb-4">
                            "{caseStudy.testimonial.quote}"
                          </blockquote>
                          <div className="flex items-center">
                            <div>
                              <p className="font-semibold text-navy-800">
                                {caseStudy.testimonial.author}
                              </p>
                              <p className="text-sm text-navy-500">
                                {caseStudy.testimonial.company}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <div className="text-center mt-16">
              <p className="text-navy-600 mb-8">
                AIの導入でビジネスを変革する準備はできていますか？
                Queue株式会社があなたのビジネスに最適なAIソリューションをご提案します。
              </p>
              <a 
                href="/consultation" 
                className="inline-flex items-center justify-center px-8 py-3 bg-navy-700 text-white rounded-full hover:bg-navy-600 transition-colors shadow-lg hover:shadow-xl"
              >
                無料相談を予約する
              </a>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CaseStudies;
