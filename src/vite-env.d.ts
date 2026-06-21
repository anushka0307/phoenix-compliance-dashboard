/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: "production" | "development" | "staging" | "demo" | "presentation";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
