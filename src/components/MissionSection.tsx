import React from 'react';
import { Target, Rocket, Gem } from 'lucide-react';

const MissionSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-navy-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Vision */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Target className="h-8 w-8 text-navy-600 mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold text-navy-800">Vision</h2>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-navy-700 mb-4">
              世界を熱狂させるプロダクトを生み出す
            </h3>
            <p className="text-lg text-navy-600 max-w-3xl mx-auto leading-relaxed">
              革新をただ追いかけるのではなく、人々の心を震わせる"本物"をつくる。<br />
              世界中が夢中になるような、そんなプロダクトを本気で創り続けます。
            </p>
          </div>

          {/* Mission */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Rocket className="h-8 w-8 text-navy-600 mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold text-navy-800">Mission</h2>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-navy-700 mb-4">
              メンバー全員が「主人公」
            </h3>
            <div className="text-lg text-navy-600 max-w-3xl mx-auto leading-relaxed space-y-4">
              <p>
                Queueに"社員"という概念はありません。<br />
                すべてのメンバーが最強の当事者であり、誰かの指示ではなく、自ら動き、自ら価値を生み出す。
              </p>
              <p className="font-semibold">
                そして何より──<br />
                お互いを本気でリスペクトすること。<br />
                リスペクトできない人間はいりません。<br />
                楽しく働けること。愛せる仲間とだけ、未来を創ります。
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Gem className="h-8 w-8 text-navy-600 mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold text-navy-800">Value（行動指針）</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-bold text-navy-800 mb-3">全員主役</h4>
                <p className="text-navy-600">指示待ち不要。自ら価値を創る「主人公」が集まる集団であること。</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-bold text-navy-800 mb-3">ガチでリスペクト</h4>
                <p className="text-navy-600">仲間をリスペクトできない人は、ここにはいられない。</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-bold text-navy-800 mb-3">おもろくやろう</h4>
                <p className="text-navy-600">「楽しい」は最強。愛せる仲間と、笑いながら世界を変える。</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-bold text-navy-800 mb-3">極めて、ぶち壊す</h4>
                <p className="text-navy-600">常識を疑え。誰もやっていないことを、誰よりもやり抜く。</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
                <h4 className="text-xl font-bold text-navy-800 mb-3">熱狂を届ける</h4>
                <p className="text-navy-600">テクノロジーのその先に、人の感情を震わせる体験を。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;