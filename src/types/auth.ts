import type { LLMProvider } from './llm';

/** Storage contract for serialized provider authentication credentials. */
export interface BaseAuthStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
}

/** Common lifecycle implemented by authentication methods. */
export interface BaseAuthAdapter {
  readonly provider: LLMProvider;
  getCredentials(): Promise<string | null>;
}

/** Contract for validating and persisting one provider's API key. */
export interface ApiKeyAuthAdapter extends BaseAuthAdapter {
  readonly type: 'api-key';
  validate(apiKey: string): Promise<void>;
  setCredentials(apiKey: string): Promise<void>;
  getCredentials(): Promise<string | null>;
  clearCredentials(): Promise<void>;
}

/** Contract for an OAuth adapter whose concrete data types are provider-specific. */
export interface OAuthAuthAdapter<
  AuthorizeOptions = unknown,
  Credential = unknown,
> extends BaseAuthAdapter {
  readonly type: 'oauth';
  authorize(options: AuthorizeOptions): Promise<Credential>;
  refresh(credential: Credential): Promise<Credential>;
  revoke?(credential: Credential): Promise<void>;
  getCredentials(): Promise<string | null>;
}
