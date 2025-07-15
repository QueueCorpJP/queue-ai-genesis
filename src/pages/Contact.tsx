
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import { Container } from '@/components/ui/container';
import { useIsMobile } from '@/hooks/use-mobile';

const Contact = () => {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "お問い合わせ | Queue株式会社";
    
    // Add structured data for this page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "お問い合わせ | Queue株式会社",
      "description": "Queue株式会社へのお問い合わせページです。AI受託開発やコンサルティングに関するご相談は、お気軽にお問い合わせください。",
      "url": "https://queue-tech.jp/contact",
      "mainEntity": {
        "@type": "Organization",
        "name": "Queue株式会社",
        "telephone": "03-6687-0550",
        "email": "queue@queue-tech.jp"
      }
    });
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16 md:pt-0">
        <section className="bg-gradient-to-r from-navy-800 to-navy-900 py-12 md:py-16 lg:py-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center px-4">
              <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4 md:mb-6 text-white`}>
                お問い合わせ
              </h1>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} text-navy-100 max-w-2xl mx-auto`}>
                プロジェクトのご相談やサービスに関するお問い合わせは、
                お気軽にご連絡ください。担当者より3営業日以内にご返信いたします。
              </p>
            </div>
          </Container>
        </section>
        
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
