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

      console.log('CTA click tracked successfully');
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
      <div className={`bg-gradient-to-r from-navy-50 to-blue-50 p-4 rounded-lg border border-navy-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-navy-600" />
            <span className="text-sm font-medium text-navy-700">
              この記事について相談したい方は
            </span>
          </div>
          <Button 
            onClick={handleConsultationClick}
            size="sm"
            className="bg-navy-700 hover:bg-navy-600"
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
      <Card className={`p-4 bg-gradient-to-br from-navy-700 to-navy-600 text-white sticky top-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="bg-white/10 rounded-full p-3 w-fit mx-auto">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">無料相談受付中</h3>
            <p className="text-sm text-white/90 mb-4">
              この記事に関するご質問やAI導入のご相談をお気軽にどうぞ
            </p>
          </div>
          <Button 
            onClick={handleConsultationClick}
            className="w-full bg-white text-navy-700 hover:bg-gray-100 font-semibold"
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
    <Card className={`p-8 bg-gradient-to-br from-navy-50 via-blue-50 to-purple-50 border-2 border-navy-200 ${className}`}>
      <div className="text-center space-y-6">
        <div className="bg-navy-700 rounded-full p-4 w-fit mx-auto">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-navy-800 mb-3">
            この記事について相談してみませんか？
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            AIソリューション導入に関するご質問や、具体的な実装についてのご相談を
            <strong className="text-navy-700">無料</strong>で承っています。
          </p>
        </div>

        <div className="flex justify-center items-center space-x-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>相談無料</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-5 h-5 text-blue-500" />
            <span>専門チームが対応</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <span>オンライン対応可</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button 
            onClick={handleConsultationClick}
            size="lg"
            className="bg-navy-700 hover:bg-navy-600 text-white px-8 py-3 text-lg font-semibold flex-1"
          >
            無料相談を申し込む
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            onClick={handleContactClick}
            variant="outline"
            size="lg"
            className="border-navy-700 text-navy-700 hover:bg-navy-50 px-6 py-3 flex-1"
          >
            お問い合わせ
          </Button>
        </div>

        <p className="text-sm text-gray-500">
          ※ 相談内容に応じて、最適なソリューションをご提案いたします
        </p>
      </div>
    </Card>
  );
};

export default ArticleCTA; 