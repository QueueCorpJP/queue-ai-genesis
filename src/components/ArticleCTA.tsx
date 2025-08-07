import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, ArrowRight, Users, CheckCircle } from 'lucide-react';

interface ArticleCTAProps {
  articleId: string;
  variant?: 'default' | 'compact' | 'sidebar';
  className?: string;
}

export const ArticleCTA: React.FC<ArticleCTAProps> = ({ 
  articleId, 
  variant = 'default',
  className = '' 
}) => {
  const navigate = useNavigate();

  const trackCTAClick = async (ctaType: string = 'consultation') => {
    try {
      // IPアドレスとユーザーエージェントを取得
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      
      // CTAクリックを記録
      await supabase.from('cta_clicks').insert({
        article_id: articleId,
        cta_type: ctaType,
        ip_address: ip,
        user_agent: navigator.userAgent,
        referrer_url: window.location.href,
        clicked_at: new Date().toISOString()
      });


    } catch (error) {
      console.error('Failed to track CTA click:', error);
    }
  };

  const handleConsultationClick = async () => {
    await trackCTAClick('consultation');
    navigate('/consultation');
  };

  const handleContactClick = async () => {
    await trackCTAClick('contact');
    navigate('/contact');
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-white p-4 rounded-lg border border-navy-200 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-navy-50 border border-navy-100 rounded-full p-2">
              <MessageCircle className="w-4 h-4 text-navy-700" />
            </div>
            <span className="text-sm font-medium text-navy-700">
              この記事について相談したい方は
            </span>
          </div>
          <Button 
            onClick={handleConsultationClick}
            size="sm"
            className="bg-navy-700 hover:bg-navy-600 w-full sm:w-auto"
          >
            無料相談
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Card className={`p-4 bg-white text-navy-800 border border-navy-200 sticky top-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="bg-navy-50 border border-navy-100 rounded-full p-3 w-fit mx-auto">
            <MessageCircle className="w-6 h-6 text-navy-700" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">無料相談受付中</h3>
            <p className="text-sm text-navy-600 mb-4">
              この記事に関するご質問やAI導入のご相談をお気軽にどうぞ
            </p>
          </div>
          <Button 
            onClick={handleConsultationClick}
            className="w-full bg-navy-800 text-white hover:bg-navy-700 font-semibold"
          >
            今すぐ相談する
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={`p-6 sm:p-8 bg-white border border-navy-200 ${className}`}>
      <div className="text-center space-y-5 sm:space-y-6">
        <div className="bg-navy-50 border border-navy-100 rounded-full p-3 sm:p-4 w-fit mx-auto">
          <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-navy-700" />
        </div>
        
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-navy-800 mb-2 sm:mb-3">
            この記事について相談してみませんか？
          </h3>
          <p className="text-navy-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed px-1">
            AIソリューション導入に関するご質問や、具体的な実装についてのご相談を
            <strong className="text-navy-800">無料</strong>で承っています。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-8 py-2 sm:py-4">
          <div className="flex items-center gap-2 text-sm sm:text-base text-navy-700">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span>相談無料</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base text-navy-700">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-navy-600" />
            <span>専門チームが対応</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base text-navy-700">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-navy-600" />
            <span>オンライン対応可</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
          <Button 
            onClick={handleConsultationClick}
            size="lg"
            className="bg-navy-800 hover:bg-navy-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold w-full sm:w-auto"
          >
            無料相談を申し込む
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            onClick={handleContactClick}
            variant="outline"
            size="lg"
            className="border-navy-300 text-navy-800 hover:bg-navy-50 px-6 py-3 w-full sm:w-auto"
          >
            お問い合わせ
          </Button>
        </div>

        <p className="text-xs sm:text-sm text-gray-500">
          ※ 相談内容に応じて、最適なソリューションをご提案いたします
        </p>
      </div>
    </Card>
  );
};

export default ArticleCTA; 