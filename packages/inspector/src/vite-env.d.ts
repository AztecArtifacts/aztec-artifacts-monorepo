/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_INSPECTOR_BASE_URL?: string;
  }
}
