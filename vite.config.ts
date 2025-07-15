import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Disable componentTagger in development to prevent service worker issues
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent service worker registration issues
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@supabase/postgrest-js'],
    exclude: [],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  ssr: {
    noExternal: ['@supabase/supabase-js', '@supabase/postgrest-js'],
  },
}));
