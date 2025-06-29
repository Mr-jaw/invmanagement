import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js', 'framer-motion']
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
          utils: ['jspdf', 'jspdf-autotable']
        }
      }
    },
    // Enable compression
    minify: 'esbuild', // Faster than terser
    target: 'es2015',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  server: {
    // Optimize dev server
    hmr: {
      overlay: false
    },
    // Enable HTTP/2 in development
    https: false
  },
  // Enable aggressive caching
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
});