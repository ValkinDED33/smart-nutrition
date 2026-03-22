/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USDA_KEY: string;
  readonly VITE_OFF_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
