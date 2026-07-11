import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { createOtpMiddleware } from './otp-handler.mjs';

export function otpServerPlugin(): Plugin {
  return {
    name: 'gnc-otp-server',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      process.env.MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || env.MSG91_AUTH_KEY || '';
      process.env.VITE_MSG91_WIDGET_ID =
        process.env.VITE_MSG91_WIDGET_ID || env.VITE_MSG91_WIDGET_ID || '';
      process.env.VITE_MSG91_TOKEN_AUTH =
        process.env.VITE_MSG91_TOKEN_AUTH || env.VITE_MSG91_TOKEN_AUTH || '';
    },
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      process.env.MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || env.MSG91_AUTH_KEY || '';
      process.env.VITE_MSG91_WIDGET_ID =
        process.env.VITE_MSG91_WIDGET_ID || env.VITE_MSG91_WIDGET_ID || '';
      process.env.VITE_MSG91_TOKEN_AUTH =
        process.env.VITE_MSG91_TOKEN_AUTH || env.VITE_MSG91_TOKEN_AUTH || '';
      server.middlewares.use(createOtpMiddleware());
    },
    configurePreviewServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      process.env.MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || env.MSG91_AUTH_KEY || '';
      process.env.VITE_MSG91_WIDGET_ID =
        process.env.VITE_MSG91_WIDGET_ID || env.VITE_MSG91_WIDGET_ID || '';
      process.env.VITE_MSG91_TOKEN_AUTH =
        process.env.VITE_MSG91_TOKEN_AUTH || env.VITE_MSG91_TOKEN_AUTH || '';
      server.middlewares.use(createOtpMiddleware());
    },
  };
}
