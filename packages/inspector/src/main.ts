import './polyfills';

import {
  type ApiContractArtifact,
  type ApiContractInstance,
  type ContractAddressesResponse,
  type PaginationParams,
  RawApiClient,
  type SelectorResponse,
  type SelectorsResponse,
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
  | { kind: 'selector'; value: SelectorResponse }
  | { kind: 'selectors'; value: SelectorsResponse }
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
const loadSelectorButton = getRequiredElement<HTMLButtonElement>('load-selector');
const browseSelectorsButton = getRequiredElement<HTMLButtonElement>('browse-selectors');
const selectorsPrevButton = getRequiredElement<HTMLButtonElement>('selectors-prev');
const selectorsNextButton = getRequiredElement<HTMLButtonElement>('selectors-next');
const tokensLimitInput = getRequiredElement<HTMLInputElement>('tokens-limit');
const tokensCursorInput = getRequiredElement<HTMLInputElement>('tokens-cursor');
const addressesLimitInput = getRequiredElement<HTMLInputElement>('addresses-limit');
const addressesCursorInput = getRequiredElement<HTMLInputElement>('addresses-cursor');
const contractAddressInput = getRequiredElement<HTMLInputElement>('contract-address');
const includeArtifactSelect = getRequiredElement<HTMLSelectElement>('include-artifact');
const artifactIdInput = getRequiredElement<HTMLInputElement>('artifact-id');
const selectorInput = getRequiredElement<HTMLInputElement>('selector');
const selectorsLimitInput = getRequiredElement<HTMLInputElement>('selectors-limit');
const selectorsCursorInput = getRequiredElement<HTMLInputElement>('selectors-cursor');
const statusElement = getRequiredElement<HTMLSpanElement>('status');
const outputElement = getRequiredElement<HTMLPreElement>('output');

const storedSettings = loadStoredSettings();
baseUrlInput.placeholder = DEFAULT_BASE_URL;
baseUrlInput.value = storedSettings.baseUrl;
cacheModeSelect.value = storedSettings.cacheMode;

let currentClient = new RawApiClient({ baseUrl: storedSettings.baseUrl });
let currentCacheMode: RequestCache | undefined =
  storedSettings.cacheMode === 'default' ? undefined : storedSettings.cacheMode;

// Pagination state for selectors
const selectorsPaginationState: {
  currentCursor?: number;
  previousCursors: number[];
  nextCursor?: number;
  hasMore: boolean;
} = {
  previousCursors: [],
  hasMore: false,
};

updateStatus(`Connected to ${storedSettings.baseUrl} (cache: ${storedSettings.cacheMode})`);

// Tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');

    // Update button states
    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // Update content visibility
    tabContents.forEach((content) => {
      content.classList.remove('active');
      if (content.id === `${targetTab}-tab`) {
        content.classList.add('active');
      }
    });
  });
});

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

  // Special handling for selectors list - render as HTML table
  if (data.kind === 'selectors' && 'data' in data.value && 'pagination' in data.value) {
    const selectors = data.value;

    // Update pagination state and navigation buttons
    selectorsPaginationState.nextCursor = selectors.pagination.nextCursor;
    selectorsPaginationState.hasMore = selectors.pagination.hasMore;

    // Enable/disable navigation buttons
    selectorsPrevButton.disabled = selectorsPaginationState.previousCursors.length === 0;
    selectorsNextButton.disabled = !selectorsPaginationState.hasMore;

    // Group signatures by selector
    const selectorMap = new Map<string, string[]>();
    for (const item of selectors.data) {
      const existing = selectorMap.get(item.selector) || [];
      existing.push(item.signature);
      selectorMap.set(item.selector, existing);
    }

    // Create table HTML
    let html = `<div style="font-family: inherit; color: inherit;">
      <div style="margin-bottom: 1rem; font-weight: 600;">Selectors Response - ${now}</div>
      <table style="width: 100%;">
        <thead>
          <tr>
            <th>Selector</th>
            <th>Function Signatures</th>
          </tr>
        </thead>
        <tbody>`;

    // Render each selector with all its signatures
    for (const [selector, signatures] of selectorMap.entries()) {
      const sigList =
        signatures.length > 0
          ? `<ul style="margin: 0; padding-left: 1.5rem;">
          ${signatures.map((sig) => `<li>${sig}</li>`).join('\n')}
        </ul>`
          : '<em>No signatures</em>';

      html += `
        <tr>
          <td style="font-family: 'Courier New', monospace;">${selector}</td>
          <td>${sigList}</td>
        </tr>`;
    }

    html += `</tbody>
      </table>
      <div class="pagination-info">
        <span>Showing ${selectorMap.size} unique selectors (${selectors.data.length} total entries)</span>
        <span>Page cursor: ${selectors.pagination.cursor}</span>
        ${selectors.pagination.nextCursor !== undefined ? `<span>Next cursor: ${selectors.pagination.nextCursor}</span>` : ''}
        <span>Has more pages: ${selectors.pagination.hasMore}</span>
      </div>
    </div>`;

    outputElement.innerHTML = html;
  } else {
    // Default JSON output for other response types
    const payload: Record<string, JsonValue> = {
      timestamp: now,
      kind: data.kind,
      payload: serializeJson(data.value),
    };
    outputElement.textContent = JSON.stringify(payload, null, 2);
  }
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

loadSelectorButton.addEventListener('click', () => {
  const selector = selectorInput.value.trim();
  if (!selector) {
    writeOutput({
      kind: 'error',
      value: 'Please provide a selector.',
    });
    updateStatus('Selector is required.');
    return;
  }
  void runAction(loadSelectorButton, 'Fetching signatures', async () => {
    const response = await currentClient.getSignaturesBySelector(selector, getRequestOptions());
    return { kind: 'selector', value: response } satisfies SerializablePayload;
  });
});

browseSelectorsButton.addEventListener('click', () => {
  void runAction(browseSelectorsButton, 'Fetching selectors', async () => {
    const params: PaginationParams = {};
    const limit = parseNumber(selectorsLimitInput) || 10; // Default to 10
    const cursor = parseNumber(selectorsCursorInput);

    params.limit = limit;
    if (cursor !== undefined) {
      params.cursor = cursor;
      // Store the current cursor before fetching
      selectorsPaginationState.currentCursor = cursor;
    } else {
      // Reset pagination state when browsing without cursor
      selectorsPaginationState.previousCursors = [];
      selectorsPaginationState.currentCursor = undefined;
    }

    const response = await currentClient.getSelectors(params, getRequestOptions());
    return { kind: 'selectors', value: response } satisfies SerializablePayload;
  });
});

// Previous page handler
selectorsPrevButton.addEventListener('click', () => {
  if (selectorsPaginationState.previousCursors.length > 0) {
    // Pop the last cursor from history
    const prevCursor = selectorsPaginationState.previousCursors.pop();
    selectorsCursorInput.value = prevCursor !== undefined ? String(prevCursor) : '';
    browseSelectorsButton.click();
  }
});

// Next page handler
selectorsNextButton.addEventListener('click', () => {
  if (selectorsPaginationState.hasMore && selectorsPaginationState.nextCursor !== undefined) {
    // Push current cursor to history if it exists
    if (selectorsPaginationState.currentCursor !== undefined) {
      selectorsPaginationState.previousCursors.push(selectorsPaginationState.currentCursor);
    }
    selectorsCursorInput.value = String(selectorsPaginationState.nextCursor);
    browseSelectorsButton.click();
  }
});
