
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import WhyQueueSection from '@/components/WhyQueueSection';
import ProductsSection from '@/components/ProductsSection';
import CaseStudiesSection from '@/components/CaseStudiesSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';
import SEOHead from '@/components/SEOHead';

const Index = () => {
  useEffect(() => {
    // Reveal animation on scroll
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(element => {
      observer.observe(element);
    });

    // Clean up the observer
    return () => {
      document.querySelectorAll('.reveal').forEach(element => {
        if (observer) observer.unobserve(element);
      });
    };
  }, []);

  // 構造化データ
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Queue株式会社",
    "url": "https://queue-tech.jp",
    "description": "AI駆動開発でビジネスを革新するテクノロジー企業",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://queue-tech.jp/news?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "Organization",
      "name": "Queue株式会社",
      "alternateName": ["キュー株式会社", "キュー", "Queue"],
      "description": "AI駆動開発、プロンプトエンジニアリング、プロトタイプ制作を通じてデジタル変革を支援",
      "url": "https://queue-tech.jp",
      "logo": "https://queue-tech.jp/Queue.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Japanese", "English"]
      },
      "areaServed": "JP",
      "serviceType": ["AI開発", "プロンプトエンジニアリング", "プロトタイプ制作", "DX支援"]
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SEOHead
        title="Queue株式会社 | AI駆動で、圧倒的スピードと品質を。"
        description="キュー株式会社は、AI駆動開発でビジネスを革新します。プロンプトエンジニアリング、AI開発、プロトタイプ制作を通じて、お客様のデジタル変革を支援。AI技術で圧倒的なスピードと品質を実現します。"
        keywords="キュー株式会社,Queue株式会社,AI駆動開発,プロンプトエンジニアリング,AI開発,プロトタイプ制作,デジタル変革,DX,人工知能,機械学習,自動化,イノベーション,テクノロジー,キュー,Queue,AI受託開発,生成AI,LLM,GenAI,AI導入支援,Prompty,Workmate"
        canonicalUrl="/"
        structuredData={structuredData}
      />
      
      {/* Particle background */}
      <ParticleBackground />

      {/* Navigation */}
      <Navbar />

      {/* Main content with proper heading structure */}
      <main>
        {/* H1 is in HeroSection */}
        <HeroSection />
        
        <ServicesSection />
        <WhyQueueSection />
        <ProductsSection />
        <CaseStudiesSection />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
