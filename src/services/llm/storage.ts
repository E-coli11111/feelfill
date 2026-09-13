import type { BaseStorage } from '@/src/services/llm/types';

/** Prefix used to isolate authentication entries from other extension storage. */
export const AUTH_STORAGE_PREFIX = 'llmAuth:';

function toStorageKey(key: string): string {
  if (!key) {
    throw new Error('Auth storage key must not be empty');
  }

  return `${AUTH_STORAGE_PREFIX}${encodeURIComponent(key)}`;
}

function fromStorageKey(storageKey: string): string | null {
  if (!storageKey.startsWith(AUTH_STORAGE_PREFIX)) {
    return null;
  }

  try {
    return decodeURIComponent(storageKey.slice(AUTH_STORAGE_PREFIX.length));
  } catch {
    return null;
  }
}

/**
 * Persists serialized authentication values in extension-local browser storage.
 *
 * Values remain strings so callers can own their credential JSON schema and
 * migrations. Each logical key is stored separately to avoid overwriting
 * unrelated credentials during concurrent writes.
 */
export class BrowserStorage implements BaseStorage {
  /**
   * Reads a serialized authentication value.
   *
   * @param key Logical credential key, usually a provider ID.
   * @returns The stored value, or `null` when the entry is absent or invalid.
   */
  async get(key: string): Promise<string | null> {
    const storageKey = toStorageKey(key);
    const stored = await browser.storage.local.get(storageKey);
    const value = stored[storageKey];
    return typeof value === 'string' ? value : null;
  }

  /**
   * Saves a serialized authentication value.
   *
   * @param key Logical credential key, usually a provider ID.
   * @param value Serialized credential JSON.
   */
  async set(key: string, value: string): Promise<void> {
    await browser.storage.local.set({ [toStorageKey(key)]: value });
  }

  /**
   * Removes one authentication entry.
   *
   * @param key Logical credential key to remove.
   */
  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(toStorageKey(key));
  }

  /**
   * Lists all logical authentication keys in deterministic order.
   *
   * @returns Stored logical keys without the internal namespace prefix.
   */
  async list(): Promise<string[]> {
    const stored = await browser.storage.local.get(null);

    return Object.keys(stored)
      .map(fromStorageKey)
      .filter((key): key is string => key !== null)
      .sort();
  }
}
