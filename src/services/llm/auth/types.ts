import type { LLMProvider } from '../types';


/** Common lifecycle implemented by authentication methods. */
export interface BaseAuthAdapter {
  readonly provider: LLMProvider;
  getCredentials(): Promise<string | null>;
}

/** Contract for validating and persisting one provider's API key. */
export interface ApiKeyAuthAdapter extends BaseAuthAdapter {
  readonly type: 'api-key';
  validateCredentials(apiKey: string): Promise<void>;
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

/** Authorization adapters grouped by authentication mechanism and provider. */
export interface AuthMethodRegistry {
  apiKey: Partial<Record<LLMProvider, ApiKeyAuthAdapter>>;
  oauth: Partial<Record<LLMProvider, OAuthAuthAdapter<never>>>;
}
