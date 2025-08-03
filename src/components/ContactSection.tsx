
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ContactSection: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    company: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      company: '',
      email: '',
      message: ''
    };

    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください';
    }

    if (!formData.company.trim()) {
      newErrors.company = '会社名を入力してください';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'お問い合わせ内容を入力してください';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Supabaseのcontact_requestsテーブルにデータを挿入
      const { data, error } = await supabase
        .from('contact_requests')
        .insert([
          {
            name: formData.name,
            company: formData.company,
            email: formData.email,
            phone: formData.phone || null,
            message: formData.message,
            status: 'pending'
          }
        ])
        .select();

      if (error) {
        throw error;
      }


      
      // 成功メッセージを表示
      toast({
        title: "お問い合わせありがとうございます",
        description: "担当者より3営業日以内にご連絡いたします。",
      });
      
      // フォームをリセット
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        message: ''
      });
      
    } catch (error) {
      
      toast({
        title: "エラーが発生しました",
        description: "送信に失敗しました。時間をおいて再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section bg-white relative">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            お問い合わせ
          </h2>
          <p className="text-navy-600 max-w-2xl mx-auto">
            プロジェクトのご相談やサービスに関するお問い合わせは、
            以下のフォームからお気軽にご連絡ください。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2">
            <Card className="border border-navy-100 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-navy-800">お問い合わせフォーム</CardTitle>
                <CardDescription>
                  以下のフォームにご記入いただくか、右側の連絡先までご連絡ください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-navy-700">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="山田 太郎"
                        className={`border-navy-200 ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium text-navy-700">
                        会社名 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="株式会社〇〇"
                        className={`border-navy-200 ${errors.company ? 'border-red-500' : ''}`}
                      />
                      {errors.company && (
                        <p className="text-red-500 text-sm">{errors.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-navy-700">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className={`border-navy-200 ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-navy-700">
                        電話番号
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="03-1234-5678"
                        className="border-navy-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-navy-700">
                      お問い合わせ内容 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="ご質問やプロジェクトの概要をご記入ください"
                      className={`min-h-32 border-navy-200 ${errors.message ? 'border-red-500' : ''}`}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm">{errors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-navy-800 hover:bg-navy-700 text-white rounded-full py-6"
                  >
                    {isSubmitting ? '送信中...' : '送信する'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="bg-navy-50 p-6 rounded-2xl mb-6">
              <h3 className="text-xl font-bold text-navy-800 mb-4">連絡先</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-navy-600 mr-3" />
                  <a href="mailto:queue@queue-tech.jp" className="text-navy-700 hover:text-navy-900 hover:underline">
                    queue@queue-tech.jp
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-navy-600 mr-3" />
                  <a href="tel:0366870550" className="text-navy-700 hover:text-navy-900 hover:underline">
                    03-6687-0550
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-navy-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-navy-800 mb-4">所在地</h3>
              <address className="text-navy-600 not-italic mb-4">
                〒104-0061<br />
                東京都中央区銀座8-17-5<br />
                THE HUB 銀座 OCT
              </address>
              
              {/* Google Maps */}
              <div className="relative aspect-[4/3] bg-navy-200 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.0666!2d139.7644!3d35.6704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDQwJzEzLjQiTiAxMznCsDQ1JzUxLjgiRQ!5e0!3m2!1sja!2sjp!4v1647933600000!5m2!1sja!2sjp"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Queue株式会社 所在地"
                  className="w-full h-full"
                ></iframe>
                
                {/* Fallback link if map doesn't load */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 opacity-0 hover:opacity-95 transition-opacity duration-200">
                  <a 
                    href="https://maps.google.com/maps?q=東京都中央区銀座8-17-5+THE+HUB+銀座+OCT&hl=ja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-navy-700 text-white px-4 py-2 rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Google Mapsで開く</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-navy-100/30 rounded-full blur-3xl"></div>
    </section>
  );
};

export default ContactSection;
