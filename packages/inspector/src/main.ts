import './polyfills';

import {
  type ApiContractArtifact,
  type ApiContractInstance,
  type ContractAddressesResponse,
  type PaginationParams,
  RawApiClient,
  type TokensResponse,
} from '@aztec-artifacts/client';
import { resolveDefaultBaseUrl } from './config';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type CacheSelection = RequestCache;

interface ConnectionSettings {
  baseUrl: string;
  cacheMode: CacheSelection;
}

type SerializablePayload =
  | { kind: 'tokens'; value: TokensResponse }
  | { kind: 'addresses'; value: ContractAddressesResponse }
  | { kind: 'contract'; value: ApiContractInstance }
  | { kind: 'artifact'; value: ApiContractArtifact }
  | { kind: 'info'; value: Record<string, JsonValue> }
  | { kind: 'error'; value: string };

const DEFAULT_BASE_URL = resolveDefaultBaseUrl();
const DEFAULT_CACHE_MODE: CacheSelection = 'no-store';
const CACHE_OPTIONS: CacheSelection[] = ['default', 'no-store', 'reload', 'no-cache', 'force-cache', 'only-if-cached'];
const STORAGE_KEY = 'aztec-artifacts-inspector-settings';
const isBrowser = typeof window !== 'undefined';

function parseCacheMode(value: unknown): CacheSelection {
  if (typeof value !== 'string') {
    return DEFAULT_CACHE_MODE;
  }
  return CACHE_OPTIONS.includes(value as CacheSelection) ? (value as CacheSelection) : DEFAULT_CACHE_MODE;
}

function loadStoredSettings(): ConnectionSettings {
  if (!isBrowser) {
    return { baseUrl: DEFAULT_BASE_URL, cacheMode: DEFAULT_CACHE_MODE };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { baseUrl: DEFAULT_BASE_URL, cacheMode: DEFAULT_CACHE_MODE };
    }
    const parsed = JSON.parse(raw) as Partial<ConnectionSettings>;
    const baseUrl =
      typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim().length > 0 ? parsed.baseUrl.trim() : DEFAULT_BASE_URL;
    const cacheMode = parseCacheMode(parsed.cacheMode);
    return { baseUrl, cacheMode };
  } catch {
    return { baseUrl: DEFAULT_BASE_URL, cacheMode: DEFAULT_CACHE_MODE };
  }
}

function persistSettings(settings: ConnectionSettings) {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore persistence failures (e.g. private browsing)
  }
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Inspector UI is missing element #${id}.`);
  }
  return element as T;
}

const connectionForm = getRequiredElement<HTMLFormElement>('connection-form');
const baseUrlInput = getRequiredElement<HTMLInputElement>('base-url');
const cacheModeSelect = getRequiredElement<HTMLSelectElement>('cache-mode');
const applySettingsButton = getRequiredElement<HTMLButtonElement>('apply-settings');
const loadTokensButton = getRequiredElement<HTMLButtonElement>('load-tokens');
const loadAddressesButton = getRequiredElement<HTMLButtonElement>('load-addresses');
const loadContractButton = getRequiredElement<HTMLButtonElement>('load-contract');
const loadArtifactButton = getRequiredElement<HTMLButtonElement>('load-artifact');
const tokensLimitInput = getRequiredElement<HTMLInputElement>('tokens-limit');
const tokensCursorInput = getRequiredElement<HTMLInputElement>('tokens-cursor');
const addressesLimitInput = getRequiredElement<HTMLInputElement>('addresses-limit');
const addressesCursorInput = getRequiredElement<HTMLInputElement>('addresses-cursor');
const contractAddressInput = getRequiredElement<HTMLInputElement>('contract-address');
const includeArtifactSelect = getRequiredElement<HTMLSelectElement>('include-artifact');
const artifactIdInput = getRequiredElement<HTMLInputElement>('artifact-id');
const statusElement = getRequiredElement<HTMLSpanElement>('status');
const outputElement = getRequiredElement<HTMLPreElement>('output');

const storedSettings = loadStoredSettings();
baseUrlInput.placeholder = DEFAULT_BASE_URL;
baseUrlInput.value = storedSettings.baseUrl;
cacheModeSelect.value = storedSettings.cacheMode;

let currentClient = new RawApiClient({ baseUrl: storedSettings.baseUrl });
let currentCacheMode: RequestCache | undefined =
  storedSettings.cacheMode === 'default' ? undefined : storedSettings.cacheMode;

updateStatus(`Connected to ${storedSettings.baseUrl} (cache: ${storedSettings.cacheMode})`);

applySettingsButton.addEventListener('click', (event) => {
  event.preventDefault();
  connectionForm.requestSubmit();
});

connectionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const baseUrl = baseUrlInput.value.trim() || DEFAULT_BASE_URL;
  const nextCacheSelection = parseCacheMode(cacheModeSelect.value);
  applySettings(baseUrl, nextCacheSelection);
});

function applySettings(baseUrl: string, cacheModeSelection: CacheSelection) {
  baseUrlInput.value = baseUrl;
  cacheModeSelect.value = cacheModeSelection;
  currentClient = new RawApiClient({ baseUrl });
  currentCacheMode = cacheModeSelection === 'default' ? undefined : cacheModeSelection;
  persistSettings({ baseUrl, cacheMode: cacheModeSelection });
  updateStatus(`Connected to ${baseUrl} (cache: ${cacheModeSelection})`);
  writeOutput({
    kind: 'info',
    value: {
      message: 'Connection settings updated',
      baseUrl,
      cacheMode: cacheModeSelection,
    },
  });
}

function updateStatus(message: string) {
  statusElement.textContent = message;
}

function writeOutput(data: SerializablePayload) {
  const now = new Date().toISOString();
  const payload: Record<string, JsonValue> = {
    timestamp: now,
    kind: data.kind,
    payload: serializeJson(data.value),
  };
  outputElement.textContent = JSON.stringify(payload, null, 2);
}

function serializeJson(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeJson(item));
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    const result: Record<string, JsonValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = serializeJson(nested);
    }
    return result;
  }
  return String(value) as JsonValue;
}

function parseNumber(input: HTMLInputElement): number | undefined {
  const raw = input.value.trim();
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function runAction(button: HTMLButtonElement, label: string, handler: () => Promise<SerializablePayload>) {
  button.disabled = true;
  updateStatus(`${label}…`);
  try {
    const result = await handler();
    writeOutput(result);
    updateStatus(`${label} complete.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeOutput({ kind: 'error', value: message });
    updateStatus(`${label} failed.`);
  } finally {
    button.disabled = false;
  }
}

function getRequestOptions() {
  return currentCacheMode ? { cache: currentCacheMode } : undefined;
}

loadTokensButton.addEventListener('click', () => {
  void runAction(loadTokensButton, 'Fetching tokens', async () => {
    const params: PaginationParams = {};
    const limit = parseNumber(tokensLimitInput);
    const cursor = parseNumber(tokensCursorInput);
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (cursor !== undefined) {
      params.cursor = cursor;
    }
    const response = await currentClient.getTokens(
      Object.keys(params).length ? params : undefined,
      getRequestOptions(),
    );
    return { kind: 'tokens', value: response } satisfies SerializablePayload;
  });
});

loadAddressesButton.addEventListener('click', () => {
  void runAction(loadAddressesButton, 'Fetching contract addresses', async () => {
    const params: PaginationParams = {};
    const limit = parseNumber(addressesLimitInput);
    const cursor = parseNumber(addressesCursorInput);
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (cursor !== undefined) {
      params.cursor = cursor;
    }
    const response = await currentClient.getContractAddresses(
      Object.keys(params).length ? params : undefined,
      getRequestOptions(),
    );
    return { kind: 'addresses', value: response } satisfies SerializablePayload;
  });
});

loadContractButton.addEventListener('click', () => {
  const address = contractAddressInput.value.trim();
  if (!address) {
    writeOutput({ kind: 'error', value: 'Please provide a contract address.' });
    updateStatus('Contract address is required.');
    return;
  }
  const includeArtifact = includeArtifactSelect.value === 'true';
  void runAction(loadContractButton, 'Fetching contract', async () => {
    const response = await currentClient.getContractRaw(address, includeArtifact, getRequestOptions());
    return { kind: 'contract', value: response } satisfies SerializablePayload;
  });
});

loadArtifactButton.addEventListener('click', () => {
  const identifier = artifactIdInput.value.trim();
  if (!identifier) {
    writeOutput({
      kind: 'error',
      value: 'Please provide an artifact or contract class identifier.',
    });
    updateStatus('Artifact identifier is required.');
    return;
  }
  void runAction(loadArtifactButton, 'Fetching artifact', async () => {
    const response = await currentClient.getArtifactRaw(identifier, getRequestOptions());
    return { kind: 'artifact', value: response } satisfies SerializablePayload;
  });
});
