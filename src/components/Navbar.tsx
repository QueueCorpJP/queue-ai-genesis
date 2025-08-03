
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when switching to desktop view
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-4 md:py-6'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 z-50" onClick={() => setIsMobileMenuOpen(false)}>
          <img 
            src="/Queue.png" 
            alt="Queue Logo" 
            className="h-14 md:h-20 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link to="/services" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            AI開発サービス
          </Link>
          <Link to="/why-queue" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Queue選択の理由
          </Link>
          <Link to="/products" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            AI製品・ソリューション
          </Link>
          <Link to="/case-studies" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            事例・実績
          </Link>
          <Link to="/news" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            ニュース・ブログ
          </Link>
          <Link to="/company" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            会社概要
          </Link>
          <Link to="/contact" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            お問い合わせ
          </Link>
        </nav>

        {/* CTA Button - Desktop */}
        <div className="hidden md:block">
          <Button asChild className="bg-navy-800 hover:bg-navy-700 text-white rounded-full px-5 py-2 text-sm">
            <Link to="/consultation">お問い合わせ</Link>
          </Button>
        </div>

        {/* Mobile Menu Button - hide when menu is open */}
        <button
          className={`md:hidden text-navy-800 p-2 z-50 transition-opacity ${
            isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <div 
        className={`fixed inset-0 w-full h-full bg-white mobile-menu-overlay transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
        style={{ 
          backgroundColor: '#ffffff',
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        {/* Close Button - positioned at top right of overlay */}
        <button
          className="absolute top-4 right-4 text-navy-800 p-2 z-50 bg-white rounded-full shadow-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="w-full h-full px-6 py-20 bg-white" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
          <nav className="flex flex-col space-y-6 bg-white w-full">
            <Link
              to="/services"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              AI開発サービス
            </Link>
            <Link
              to="/why-queue"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Queue選択の理由
            </Link>
            <Link
              to="/products"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              AI製品・ソリューション
            </Link>
            <Link
              to="/case-studies"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              事例・実績
            </Link>
            <Link
              to="/news"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ニュース・ブログ
            </Link>
            <Link
              to="/company"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              会社概要
            </Link>
            <Link
              to="/contact"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 hover:bg-gray-50 transition-colors p-4 rounded-lg bg-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              お問い合わせ
            </Link>

            <div className="pt-6 bg-white">
              <Button 
                asChild 
                className="w-full bg-navy-800 hover:bg-navy-700 text-white rounded-full text-lg py-6"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link to="/consultation">お問い合わせ</Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
