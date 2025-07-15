
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Company from "./pages/Company";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Consultation from "./pages/Consultation";
import News from "./pages/News";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import NotFound from "./pages/NotFound";
import ProductWorkmate from "./pages/ProductWorkmate";
import ProductPrompty from "./pages/ProductPrompty";
import CaseStudies from "./pages/CaseStudies";
import ScrollToTop from "./components/ScrollToTop";
import Services from "./pages/Services";
import WhyQueue from "./pages/WhyQueue";
import Products from "./pages/Products";
import ChatBot from "./components/ChatBot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/company" element={<Company />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/news" element={<News />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/workmate" element={<ProductWorkmate />} />
            <Route path="/products/prompty" element={<ProductPrompty />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/services" element={<Services />} />
            <Route path="/why-queue" element={<WhyQueue />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
