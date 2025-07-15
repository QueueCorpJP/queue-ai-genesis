
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
            src="/public/Queue.png" 
            alt="Queue Logo" 
            className="h-14 md:h-20 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link to="/services" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Services
          </Link>
          <Link to="/why-queue" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Why Queue?
          </Link>
          <Link to="/products" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Products
          </Link>
          <Link to="/case-studies" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Case Studies
          </Link>
          <Link to="/company" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Company
          </Link>
          <Link to="/contact" className="text-navy-700 hover:text-navy-900 transition-colors text-sm lg:text-base">
            Contact
          </Link>
        </nav>

        {/* CTA Button - Desktop */}
        <div className="hidden md:block">
          <Button asChild className="bg-navy-800 hover:bg-navy-700 text-white rounded-full px-5 py-2 text-sm">
            <Link to="/consultation">お問い合わせ</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-navy-800 p-2 z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <div 
        className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="container mx-auto px-6 py-20">
          <nav className="flex flex-col space-y-6">
            <Link
              to="/services"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/why-queue"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Why Queue?
            </Link>
            <Link
              to="/products"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/case-studies"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Case Studies
            </Link>
            <Link
              to="/company"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Company
            </Link>
            <Link
              to="/contact"
              className="text-navy-800 text-2xl font-semibold hover:text-navy-600 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>

            <div className="pt-6">
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
