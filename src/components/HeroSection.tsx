
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const HeroSection: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden pt-16 md:pt-20">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30" style={{ filter: 'brightness(1.2)' }}
        >
          <source src="/queue.mp4" type="video/mp4" />
        </video>
      </div>
      
      <div className="container mx-auto relative z-10 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight gradient-text drop-shadow-lg">
            AI駆動で、圧倒的スピードと品質を。
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-navy-600 mb-8 md:mb-10 max-w-2xl mx-auto px-2 drop-shadow-lg">
            最先端のAI技術とアジャイル開発で、アイデアを最短で形にします。
            Queueは開発初期段階から価値を提供する「1/3デモ戦略」で、
            お客様のビジネス成功に貢献します。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className={`rounded-full bg-navy-800 hover:bg-navy-700 text-white ${
                isMobile ? 'px-6 py-5 text-base' : 'px-8 py-6 text-lg'
              } group`}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              無料相談を予約する
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              variant="outline" 
              className={`rounded-full border-navy-300 text-navy-800 ${
                isMobile ? 'px-6 py-5 text-base' : 'px-8 py-6 text-lg'
              } hover:bg-navy-50`}
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              サービスを見る
            </Button>
          </div>
          
          {/* Temporarily commented out - 信頼のパートナー section */}
          {/* <div className="mt-12 md:mt-20 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            <p className="text-sm text-navy-500 font-medium">信頼のパートナー</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-70">
              {/* Company logos would go here */}
              {/* <div className="w-28 h-12 md:w-36 md:h-14 bg-navy-200 rounded animate-pulse-slow"></div>
              <div className="w-28 h-12 md:w-36 md:h-14 bg-navy-200 rounded animate-pulse-slow"></div>
              <div className="w-28 h-12 md:w-36 md:h-14 bg-navy-200 rounded animate-pulse-slow"></div>
            </div>
          </div> */}
        </div>
      </div>
      
      {/* Decorative elements - made more subtle on mobile */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-r from-navy-200/20 to-navy-300/20 rounded-full blur-3xl"></div>
      <div className="absolute -top-32 -left-32 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-navy-100/10 to-navy-200/10 rounded-full blur-3xl"></div>
    </section>
  );
};

export default HeroSection;
