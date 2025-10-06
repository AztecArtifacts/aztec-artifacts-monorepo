export function resolveDefaultBaseUrl(): string {
  // Use Vite environment variable if set
  const envValue = import.meta.env?.VITE_INSPECTOR_BASE_URL;
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    return envValue.trim();
  }

  // Default based on environment
  if (import.meta.env?.MODE === 'production') {
    return 'https://api.aztec-artifacts.org/v1';
  }

  return 'http://localhost:8080';
}
