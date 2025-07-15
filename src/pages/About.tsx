
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
  useEffect(() => {
    document.title = "ご紹介 | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-24">
          <Container>
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Queue株式会社について</h1>
              <p className="text-xl text-navy-100">
                AI駆動で、圧倒的スピードと品質を。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 md:py-24">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center gradient-text">企業理念</h2>
                
                <Card className="border-none bg-navy-50 shadow-sm">
                  <CardContent className="p-8">
                    <div className="prose mx-auto text-navy-800">
                      <p className="text-lg font-medium text-navy-800 mb-6 text-center">
                        「Queue」は"知識のレイヤー"も運ぶベルトコンベア
                      </p>
                      
                      <p>
                        私たちが扱うのはコードだけではありません。<br />
                        プロジェクトごとの ナレッジ、データセット、失敗と学習――<br />
                        それらもすべて、ひとつずつキューへ載せて次へ渡しています。
                      </p>
                      
                      <h4 className="text-xl font-semibold mt-8 mb-4">コミットごとに増える"知識パケット"</h4>
                      <p>
                        Git の履歴、議事録、ユーザーインサイト…<br />
                        すべてが小さなパケットとして先頭へ送られ、<br />
                        後続のタスクがそれを 必ず参照できる 流れを構築。
                      </p>
                      <p>
                        「前の自分たちが得た学び」を ゼロ距離 で受け取れる――<br />
                        そんな リアルタイム知識継承レーン が Queue です。
                      </p>
                      
                      <h4 className="text-xl font-semibold mt-8 mb-4">データを貯め込まず"流す"思想</h4>
                      <p>
                        倉庫にしまい込むのではなく、<br />
                        常に動くベルト の上で次工程が加工・検証。
                      </p>
                      <p>
                        溜め込まず流すことで、<br />
                        データは腐らず、意思決定の鮮度 を保ちます。
                      </p>
                      
                      <h4 className="text-xl font-semibold mt-8 mb-4">ML パイプラインとしての Queue</h4>
                      <p>
                        ログ→前処理→学習→推論――<br />
                        これもキューイングされたステージの連鎖。
                      </p>
                      <p>
                        各ステージのアウトプットが次のインプットになり、<br />
                        同じレールをぐるぐる回る "知識の螺旋階段" を形成します。
                      </p>
                      
                      <h4 className="text-xl font-semibold mt-8 mb-4">"積み重ね"と"順番"のハーモニー</h4>
                      <p>
                        レイヤーが増えるほど列は長くなる。<br />
                        でも 順番が守られている から、<br />
                        後から来たメンバーも迷わず最適な段にアクセスできる。
                      </p>
                      <p>
                        Stack（積層） と Queue（順序）――<br />
                        二つのデータ構造を暗示する名前でもあるのです。
                      </p>
                      
                      <p className="text-lg font-medium mt-8">
                        過去の学びを "止めず、詰まらせず、次へ"<br />
                        だからこそ Queue。<br />
                        伸び続ける列の中で、知識は粒度を変えながら未来へ運ばれ、<br />
                        いつかあなたのプロジェクトの番が来たとき、<br />
                        その全てをバックボーンにして次のブレイクスルーを生み出します。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center gradient-text">私たちの強み</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="border border-navy-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-16 w-16 rounded-lg bg-navy-100 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-navy-600">1</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-navy-800">1/3デモ戦略</h3>
                      <p className="text-navy-600">
                        プロジェクト開始からわずか1/3の期間でワーキングデモをご提供。
                        素早くプロジェクトの方向性を確認し、臨機応変に調整することが可能です。
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-navy-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-16 w-16 rounded-lg bg-navy-100 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-navy-600">2</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-navy-800">AI特化開発</h3>
                      <p className="text-navy-600">
                        最新のAI技術に特化したエンジニアチームが、最適なソリューションを構築。
                        常に最先端の技術動向を取り入れ、革新的なプロダクト開発を実現します。
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-navy-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-16 w-16 rounded-lg bg-navy-100 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-navy-600">3</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-navy-800">アジャイル開発</h3>
                      <p className="text-navy-600">
                        週次レビューによる柔軟な開発サイクルを採用。
                        変化する要件にも迅速に対応し、価値あるプロダクトを継続的に提供します。
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center gradient-text">会社情報</h2>
                
                <Button asChild size="lg" className="bg-navy-800 hover:bg-navy-700">
                  <Link to="/company">会社概要を見る</Link>
                </Button>
              </div>
              
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-8 text-center gradient-text">お問い合わせ</h2>
                
                <p className="text-navy-600 mb-8">
                  AI開発でお困りのことがございましたら、お気軽にご相談ください。<br />
                  初回相談は無料で承っております。
                </p>
                
                <Button asChild size="lg" className="bg-navy-800 hover:bg-navy-700">
                  <Link to="/consultation">無料相談を予約する</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
