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
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
