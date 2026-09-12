import type {
  ApiKeyAuthAdapter,
  BaseAuthStorage,
} from '@/src/types/auth';
import type { LLMProvider } from '@/src/types/llm';
import { BrowserAuthStorage } from './storage';

// Creates a storage key for a provider's API key.
function createStorageKey(provider: LLMProvider): string {
  return `${provider}:api-key`;
}

/** Manages a provider API key using the configured authentication storage. */
export class ApiKeyAuth implements ApiKeyAuthAdapter {
  public readonly type = 'api-key' as const;
  public readonly provider: LLMProvider;

  private readonly storage: BaseAuthStorage;
  private readonly storageKey: string;

  /**
   * Creates an API-key authentication adapter for one provider.
   *
   * @param provider Provider whose API key is managed.
   * @param storage Storage used to persist the API key.
   */
  constructor(
    provider: LLMProvider,
    storage: BaseAuthStorage = new BrowserAuthStorage(),
  ) {
    this.provider = provider;
    this.storage = storage;
    this.storageKey = createStorageKey(provider);
  }

  /**
   * Validates an API key before it crosses the storage boundary.
   *
   * This only performs local structural validation. Verifying that the key is
   * accepted by a provider belongs to a provider-specific connectivity check.
   *
   * @param apiKey API key supplied by the user.
   * @throws If the API key is empty or contains only whitespace.
   */
  async validate(apiKey: string): Promise<void> {
    if (!apiKey.trim()) {
      throw new Error('API key must not be empty');
    }

    // TODO: Add provider-specific validation for API key format.
  }

  /**
   * Validates and persists an API key.
   *
   * @param apiKey API key supplied by the user.
   */
  async setCredentials(apiKey: string): Promise<void> {
    await this.validate(apiKey);
    await this.storage.set(this.storageKey, apiKey);
  }

  /** Returns the stored API key, or `null` when none is configured. */
  async getCredentials(): Promise<string | null> {
    return this.storage.get(this.storageKey);
  }

  /** Removes the stored API key for this provider. */
  async clearCredentials(): Promise<void> {
    await this.storage.remove(this.storageKey);
  }
}
