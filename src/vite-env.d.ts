/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OTP_API_URL?: string;
  readonly VITE_MSG91_WIDGET_ID?: string;
  readonly VITE_MSG91_TOKEN_AUTH?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_USE_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
