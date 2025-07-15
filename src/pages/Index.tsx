
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

const Index = () => {
  useEffect(() => {
    // Set the page title
    document.title = "Queue株式会社 | AI駆動で、圧倒的スピードと品質を。";
    
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

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Particle background */}
      <ParticleBackground />

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        <HeroSection />
        
        <div className="reveal">
          <ServicesSection />
        </div>
        
        <div className="reveal">
          <WhyQueueSection />
        </div>
        
        <div className="reveal">
          <ProductsSection />
        </div>
        
        <div className="reveal">
          <CaseStudiesSection />
        </div>
        
        <div className="reveal">
          <ContactSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
