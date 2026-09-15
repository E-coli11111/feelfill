import type {
  ApiKeyAuthAdapter,
} from '@/src/services/llm/auth/types';
import type { LLMProvider, BaseStorage } from '@/src/services/llm/types';
import { getStorage } from '../storage';

/** Manages a provider API key using the configured authentication storage. */
export class ApiKeyAuth implements ApiKeyAuthAdapter {
  public readonly type = 'api-key' as const;
  public readonly provider: LLMProvider;
  public readonly allowBaseurl: boolean = false;

  private readonly storage: BaseStorage;
  private readonly storageApiKey: string;
  private readonly storageUrlKey: string;
  

  /**
   * Creates an API-key authentication adapter for one provider.
   *
   * @param provider Provider whose API key is managed.
   * @param storage Storage used to persist the API key.
   */
  constructor(
    provider: LLMProvider,
    allowBaseurl: boolean = false,
    storage: BaseStorage = getStorage(),
  ) {
    this.provider = provider;
    this.storage = storage;
    this.storageApiKey = `llmAuth:${encodeURIComponent(`${provider}:api-key`)}`;
    this.storageUrlKey = `llmAuth:${encodeURIComponent(`${provider}:api-base`)}`;

    this.allowBaseurl = allowBaseurl;
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
  async validateCredentials(apiKey: string): Promise<void> {
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
    await this.validateCredentials(apiKey);
    await this.storage.set(this.storageApiKey, apiKey);
  }

  async setBaseUrl(baseUrl: string): Promise<void> {
    if (!this.allowBaseurl) {
      throw new Error('Base URL is not allowed for this provider');
    }

    await this.storage.set(this.storageUrlKey, baseUrl);
  }

  async getBaseUrl(): Promise<string | null> {
    if (!this.allowBaseurl) {
      throw new Error('Base URL is not allowed for this provider');
    }

    return this.storage.get(this.storageUrlKey);
  }

  /** Returns the stored API key, or `null` when none is configured. */
  async getCredentials(): Promise<string | null> {
    return this.storage.get(this.storageApiKey);
  }

  /** Removes the stored API key for this provider. */
  async clearCredentials(): Promise<void> {
    await this.storage.remove(this.storageApiKey);
  }
}
