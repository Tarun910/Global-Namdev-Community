import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {otpServerPlugin} from './server/vite-otp-plugin';
import {supabaseProxyPlugin} from './server/vite-supabase-proxy';

export default defineConfig(() => {
  return {
    appType: 'spa' as const,
    plugins: [react(), tailwindcss(), otpServerPlugin(), supabaseProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('country-state-city')) return 'geo-data';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'leaflet';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('jspdf')) return 'jspdf';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('bcryptjs')) return 'bcrypt';
            if (id.includes('motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
