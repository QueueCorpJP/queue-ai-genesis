
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "@/contexts/AdminContext";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Company = lazy(() => import("./pages/Company"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const Consultation = lazy(() => import("./pages/Consultation"));
const Blog = lazy(() => import("./pages/News"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProductWorkmate = lazy(() => import("./pages/ProductWorkmate"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Services = lazy(() => import("./pages/Services"));
const WhyQueue = lazy(() => import("./pages/WhyQueue"));
const Products = lazy(() => import("./pages/Products"));
const ChatBot = lazy(() => import("./components/ChatBot"));
const PerformanceMonitor = lazy(() => import("./components/PerformanceMonitor"));
const AIOIntegration = lazy(() => import("./components/AIOIntegration"));

const queryClient = new QueryClient();
//h
// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
      <p className="text-gray-600">ページを読み込み中...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/company" element={<Company />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/consultation" element={<Consultation />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/news" element={<Blog />} />
              <Route path="/news/:id" element={<BlogPost />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/workmate" element={<ProductWorkmate />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/services" element={<Services />} />
              <Route path="/why-queue" element={<WhyQueue />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Suspense fallback={<div className="fixed bottom-4 right-4 text-sm text-gray-500">チャットボット読み込み中...</div>}>
            <ChatBot />
          </Suspense>
          <Suspense fallback={null}>
            <PerformanceMonitor enableReporting={false} sampleRate={0.1} />
          </Suspense>
          <Suspense fallback={null}>
            <AIOIntegration enabled={true} />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
//