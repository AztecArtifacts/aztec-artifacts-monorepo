import { BASE_URL } from '@aztec-artifacts/client';

declare global {
  interface Window {
    __INSPECTOR_BASE_URL__?: string;
  }
}

export function resolveDefaultBaseUrl(): string {
  const runtimeValue = typeof window !== 'undefined' ? window.__INSPECTOR_BASE_URL__ : undefined;
  if (runtimeValue && runtimeValue.trim().length > 0) {
    return runtimeValue.trim();
  }

  const envValue = import.meta.env?.VITE_INSPECTOR_BASE_URL;
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    return envValue.trim();
  }

  return BASE_URL;
}
