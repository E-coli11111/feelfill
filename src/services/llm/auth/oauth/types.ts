/** Tokens persisted for an OpenAI Codex OAuth session. */
export interface OpenAICodexOAuthCredential {
  access_token: string;
  id_token: string;
  refresh_token: string;
}

/** Options for authorizing through OpenAI's device-code flow. */
export interface OpenAICodexDeviceCodeAuthorizeOptions {
  method: 'device-code';
  /** Receives the code and verification URL after a device session is created. */
  onDeviceCode: (userCode: string, authorizeUrl: string) => void;
}

/** Options for one interactive browser OAuth attempt. */
export interface OpenAICodexBrowserAuthorizeOptions {
  method: 'browser';
  /** Receives the generated authorize URL when the login attempt starts. */
  onAuthorizeUrl?: (authorizeUrl: string) => void;
  /** Maximum wait for the callback; defaults to 15 minutes. */
  timeoutMs?: number;
}

/** Options supported by the unified OpenAI Codex OAuth adapter. */
export type OpenAICodexOAuthAuthorizeOptions =
  | OpenAICodexDeviceCodeAuthorizeOptions
  | OpenAICodexBrowserAuthorizeOptions;
