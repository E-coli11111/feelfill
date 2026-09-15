import { parseStoredLLMConfig } from '@/src/services/llm/config';
import type { BaseStorage, LLMConfig } from '@/src/services/llm/types';

const LLM_CONFIG_STORAGE_KEY = 'llmConfig';

function validateStorageKey(key: string): void {
  if (!key) {
    throw new Error('Storage key must not be empty');
  }
}

/** Extension-local storage operations shared by application consumers. */
export interface LLMStorage extends BaseStorage {
  getLLMConfig(): Promise<LLMConfig | null>;
  setLLMConfig(config: unknown): Promise<void>;
}

/**
 * Persists string values and model configuration in extension-local storage.
 *
 * String keys are used exactly as supplied so consumers own their namespaces.
 */
class BrowserStorage implements LLMStorage {
  /**
   * Reads a string value by its exact storage key.
   *
   * @param key Complete key defined by the consumer.
   * @returns The stored string, or `null` when absent or not a string.
   */
  async get(key: string): Promise<string | null> {
    validateStorageKey(key);
    const stored = await browser.storage.local.get(key);
    const value = stored[key];
    return typeof value === 'string' ? value : null;
  }

  /**
   * Saves a string value under the consumer's exact storage key.
   *
   * @param key Complete key defined by the consumer.
   * @param value String value to persist.
   */
  async set(key: string, value: string): Promise<void> {
    validateStorageKey(key);
    await browser.storage.local.set({ [key]: value });
  }

  /**
   * Removes one entry by its exact storage key.
   *
   * @param key Complete key defined by the consumer.
   */
  async remove(key: string): Promise<void> {
    validateStorageKey(key);
    await browser.storage.local.remove(key);
  }

  /**
   * Lists keys whose stored values are strings in deterministic order.
   *
   * @returns Complete storage keys without namespace transformation.
   */
  async list(): Promise<string[]> {
    const stored = await browser.storage.local.get(null);

    return Object.entries(stored)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([key]) => key)
      .sort();
  }

  /** Returns the validated stored LLM configuration, or `null` when unset. */
  async getLLMConfig(): Promise<LLMConfig | null> {
    const stored = await browser.storage.local.get(LLM_CONFIG_STORAGE_KEY);
    const value = stored[LLM_CONFIG_STORAGE_KEY];
    if (value === undefined) {
      return null;
    }

    return parseStoredLLMConfig(value);
  }

  /** Validates and persists the active language model configuration. */
  async setLLMConfig(config: unknown): Promise<void> {
    await browser.storage.local.set({
      [LLM_CONFIG_STORAGE_KEY]: parseStoredLLMConfig(config),
    });
  }
}

const storage = new BrowserStorage();

/** Returns the shared extension-local storage instance. */
export function getStorage(): LLMStorage {
  return storage;
}
