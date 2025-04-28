// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Node.js の 'path' モジュールをインポート

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Debug environment loading
  console.log('Vite Mode:', mode);
  console.log('Stripe Key Exists:', !!env.VITE_STRIPE_PUBLISHABLE_KEY);
  console.log('Supabase URL Exists:', !!env.VITE_SUPABASE_URL);

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'], // 既存の設定はそのまま維持
    },
    resolve: {
      alias: {
        // '@' エイリアスを './src' ディレクトリにマッピング
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Improve chunking for better code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-components': ['@radix-ui/react-icons', '@radix-ui/react-label', '@radix-ui/react-popover'],
          }
        }
      }
    },
    // Make env variables available to the client
    define: {
      // Vite already exposes env vars with the VITE_ prefix via import.meta.env
      // This is just for additional process.env compatibility if needed
      'process.env': env
    }
  };
});