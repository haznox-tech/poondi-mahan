import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import prerender from './scripts/prerender.js'

function seoPrerenderPlugin() {
  return {
    name: 'seo-prerender-plugin',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      await prerender();
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seoPrerenderPlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-helmet-async')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('swiper')) {
              return 'vendor-swiper';
            }
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }
            return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})

