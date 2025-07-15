
import React, { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  company: z.string().min(1, "会社名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
  service: z.string().min(1, "興味のあるサービスを選択してください"),
  message: z.string().min(10, "10文字以上入力してください").max(1000, "1000文字以内で入力してください"),
});

const Consultation = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    document.title = "無料相談予約 | Queue株式会社";
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      service: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Supabaseのconsultation_requestsテーブルにデータを挿入
      const { data, error } = await supabase
        .from('consultation_requests')
        .insert([
          {
            name: values.name,
            company: values.company,
            email: values.email,
            phone: values.phone,
            service: values.service as 'ai_development' | 'prompt_engineering' | 'prototype' | 'other',
            message: values.message,
            status: 'pending'
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      console.log("Form submitted successfully:", data);
      
      // 成功メッセージを表示
      toast({
        title: "送信完了",
        description: "無料相談のお申し込みを受け付けました。担当者より折り返しご連絡いたします。",
      });
      
      // フォームをリセット
      form.reset();
      
    } catch (error) {
      console.error("Error submitting form:", error);
      
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-16 md:py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">無料相談予約</h1>
              <p className="text-lg text-navy-100">
                AIプロジェクトについてのご相談は無料で承ります。
                お気軽にお問い合わせください。
              </p>
            </div>
          </Container>
        </section>
        
        <section className="py-16 md:py-20 bg-navy-50">
          <Container>
            <div className="max-w-3xl mx-auto">
              <Card className="border-none shadow-lg overflow-hidden">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-8 text-center gradient-text">無料相談フォーム</h2>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>お名前 <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="山田 太郎" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>会社名 <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="株式会社〇〇" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>メールアドレス <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>電話番号 <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="03-XXXX-XXXX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="service"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>興味のあるサービス <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="">選択してください</option>
                                <option value="ai_development">AI受託開発</option>
                                <option value="prompt_engineering">プロンプトエンジニアリング</option>
                                <option value="prototype">高速プロトタイピング</option>
                                <option value="other">その他</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>メッセージ <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="お問い合わせの内容、具体的なご要望などをご記入ください。" 
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="text-center pt-4">
                        <Button 
                          type="submit" 
                          className="bg-navy-800 hover:bg-navy-700 px-8 py-6 text-base"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "送信中..." : "送信する"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <div className="mt-12 bg-white rounded-lg p-8 shadow-md border border-navy-100">
                <h3 className="text-xl font-bold mb-4 text-navy-800">相談予約の流れ</h3>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="bg-navy-800 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-medium text-navy-800">フォーム送信</h4>
                      <p className="text-navy-600">上記フォームに必要事項をご記入の上、送信してください。</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="bg-navy-800 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-medium text-navy-800">担当者からの連絡</h4>
                      <p className="text-navy-600">1営業日以内に、担当者からメールまたはお電話でご連絡いたします。</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="bg-navy-800 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-medium text-navy-800">ミーティングの日程調整</h4>
                      <p className="text-navy-600">ご都合の良い日時でオンラインまたは対面でのミーティングを設定します。</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="bg-navy-800 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">4</div>
                    <div>
                      <h4 className="font-medium text-navy-800">無料相談</h4>
                      <p className="text-navy-600">ご要望をヒアリングし、最適なソリューションをご提案いたします。</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </Container>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Consultation;
