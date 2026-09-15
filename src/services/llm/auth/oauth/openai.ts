import { z } from 'zod';

import type { OAuthAuthAdapter } from '@/src/services/llm/auth/types';
import type {
  OpenAICodexBrowserAuthorizeOptions,
  OpenAICodexDeviceCodeAuthorizeOptions,
  OpenAICodexOAuthAuthorizeOptions,
  OpenAICodexOAuthCredential,
} from '@/src/services/llm/auth/oauth/types';
import { getStorage } from '@/src/services/llm/storage';
import type { BaseStorage } from '@/src/services/llm/types';
import {
  createPkce,
  createRandomBase64Url,
} from '@/src/utils/encode-utils';

import { createResponseError } from '@/src/utils/response-utils';

const LIFE_SCIENCES_STATE_SUFFIX = '.onboarding_entrypoint=life_sciences';

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const AUTH_BASE_URL = 'https://auth.openai.com';
const EXCHANGE_TOKEN_URL = `${AUTH_BASE_URL}/oauth/token`;
const DEVICE_USER_CODE_URL = `${AUTH_BASE_URL}/api/accounts/deviceauth/usercode`;
const DEVICE_AUTHORIZE_URL = `${AUTH_BASE_URL}/codex/device`;
const DEVICE_TOKEN_URL = `${AUTH_BASE_URL}/api/accounts/deviceauth/token`;
const DEVICE_REDIRECT_URI = `${AUTH_BASE_URL}/deviceauth/callback`;
const BROWSER_REDIRECT_URI = 'http://localhost:1455/auth/callback';
const BROWSER_AUTHORIZE_URL = `${AUTH_BASE_URL}/oauth/authorize`;
const REVOKE_URL = `${AUTH_BASE_URL}/oauth/revoke`;
const BROWSER_AUTH_TIMEOUT_MS = 15 * 60 * 1000;
const BROWSER_AUTH_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'api.connectors.read',
  'api.connectors.invoke',
];

interface DeviceCodeResponse {
  device_auth_id: string;
  user_code: string;
  expires_at: number;
  interval: number;
}

interface DeviceAuthorizationResponse {
  authorization_code: string;
  code_challenge: string;
  code_verifier: string;
}

const oauthCredentialSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

/** Returns the URL when it exactly matches the expected OAuth callback route. */
function parseMatchingCallbackUrl(
  url: string,
  redirectUri: string,
): URL | null {
  try {
    const parsed = new URL(url);
    const expected = new URL(redirectUri);
    return parsed.origin === expected.origin && parsed.pathname === expected.pathname
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** Checks the callback state, including OpenAI's life-sciences onboarding suffix. */
function isValidOAuthState(actual: string | null, expected: string): boolean {
  return actual === expected || actual === `${expected}${LIFE_SCIENCES_STATE_SUFFIX}`;
}

/** Validates an unknown value as an OpenAI Codex OAuth credential. */
function parseOpenAICodexOAuthCredential(
  credential: unknown,
): OpenAICodexOAuthCredential {
  return oauthCredentialSchema.parse(credential);
}

/** Parses and validates a successful OpenAI Codex token response. */
async function parseOpenAICodexTokenResponse(
  response: Response,
  action: string,
): Promise<OpenAICodexOAuthCredential> {
  if (!response.ok) {
    throw await createResponseError(response, action);
  }

  return parseOpenAICodexOAuthCredential(await response.json());
}

/**
 * Authorizes OpenAI Codex through either device-code or browser PKCE OAuth.
 *
 * Both entry flows share token exchange, validation, persistence, refresh,
 * revocation, and credential retrieval in this adapter.
 */
export class OpenAICodexOAuth implements OAuthAuthAdapter<
  OpenAICodexOAuthAuthorizeOptions,
  OpenAICodexOAuthCredential
> {
  public readonly type = 'oauth' as const;
  public readonly provider = 'openai' as const;
  public readonly authorizeUrl = DEVICE_AUTHORIZE_URL;

  private readonly storage: BaseStorage;
  private readonly tabs: typeof browser.tabs;

  private readonly storageKey = `llmAuth:${encodeURIComponent(`${this.provider}:oauth`)}`;

  /** Creates a unified adapter backed by extension-local storage. */
  constructor(
    storage: BaseStorage = getStorage(),
    tabs: typeof browser.tabs = browser.tabs,
  ) {
    this.storage = storage;
    this.tabs = tabs;
  }

  /** Runs the selected authorization flow and persists the resulting tokens. */
  async authorize(
    options: OpenAICodexOAuthAuthorizeOptions,
  ): Promise<OpenAICodexOAuthCredential> {
    const credential = options.method === 'device-code'
      ? await this.authorizeWithDeviceCode(options)
      : await this.authorizeWithBrowser(options);

    await this.setCredential(credential);
    return credential;
  }

  /** Refreshes and persists a previously issued Codex OAuth credential. */
  async refresh(
    credential: OpenAICodexOAuthCredential,
  ): Promise<OpenAICodexOAuthCredential> {
    const current = parseOpenAICodexOAuthCredential(credential);
    const response = await fetch(EXCHANGE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        refresh_token: current.refresh_token,
      }).toString(),
    });

    const refreshed = await parseOpenAICodexTokenResponse(
      response,
      'refresh OpenAI OAuth token',
    );
    await this.setCredential(refreshed);
    return refreshed;
  }

  /** Revokes the refresh token and clears the locally persisted credential. */
  async revoke(credential: OpenAICodexOAuthCredential): Promise<void> {
    const current = parseOpenAICodexOAuthCredential(credential);

    try {
      const response = await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: current.refresh_token,
          token_type_hint: 'refresh_token',
          client_id: CLIENT_ID,
        }),
      });

      if (!response.ok) {
        throw await createResponseError(response, 'revoke OpenAI OAuth token');
      }
    } finally {
      await this.storage.remove(this.storageKey);
    }
  }

  /** Returns the serialized Codex OAuth credential, if one is stored. */
  async getCredentials(): Promise<string | null> {
    const serialized = await this.storage.get(this.storageKey);

    if (!serialized) {
      return null;
    }

    let credential: unknown;
    try {
      credential = JSON.parse(serialized);
    } catch {
      throw new Error('Stored OpenAI Codex OAuth credential is invalid.');
    }

    try {
      return parseOpenAICodexOAuthCredential(credential).access_token;
    } catch {
      throw new Error('Stored OpenAI Codex OAuth credential is invalid.');
    }
  }

  private async setCredential(
    credential: OpenAICodexOAuthCredential,
  ): Promise<void> {
    await this.storage.set(this.storageKey, JSON.stringify(credential));
  }

  private async authorizeWithDeviceCode(
    options: OpenAICodexDeviceCodeAuthorizeOptions,
  ): Promise<OpenAICodexOAuthCredential> {
    const deviceCode = await this.fetchDeviceCode();
    options.onDeviceCode(deviceCode.user_code, DEVICE_AUTHORIZE_URL);
    const authorization = await this.waitForDeviceAuthorization(deviceCode);

    return this.exchangeAuthorizationCode(
      authorization.authorization_code,
      authorization.code_verifier,
      DEVICE_REDIRECT_URI,
      'exchange OpenAI OAuth device code',
    );
  }

  private async authorizeWithBrowser(
    options: OpenAICodexBrowserAuthorizeOptions,
  ): Promise<OpenAICodexOAuthCredential> {
    const { codeVerifier, codeChallenge } = await createPkce();
    const state = createRandomBase64Url(32);
    const authorizeUrl = this.buildBrowserAuthorizeUrl(codeChallenge, state);
    const tab = await this.tabs.create({ active: true, url: authorizeUrl });

    if (tab.id === undefined) {
      throw new Error('OpenAI OAuth login tab did not receive an ID.');
    }

    const callback = this.waitForBrowserAuthorizationCallback(
      tab.id,
      state,
      options.timeoutMs ?? BROWSER_AUTH_TIMEOUT_MS,
    );
    options.onAuthorizeUrl?.(authorizeUrl);

    return this.exchangeAuthorizationCode(
      await callback,
      codeVerifier,
      BROWSER_REDIRECT_URI,
      'exchange OpenAI OAuth authorization code',
    );
  }

  private async fetchDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await fetch(DEVICE_USER_CODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID }),
    });

    if (!response.ok) {
      throw await createResponseError(response, 'initiate OpenAI device-code flow');
    }

    return await response.json() as DeviceCodeResponse;
  }

  private waitForDeviceAuthorization(
    options: DeviceCodeResponse,
  ): Promise<DeviceAuthorizationResponse> {
    return new Promise((resolve, reject) => {
      const poll = async (): Promise<void> => {
        if (Date.now() >= options.expires_at * 1000) {
          reject(new Error('Device code expired before authorization was completed.'));
          return;
        }

        try {
          const response = await fetch(DEVICE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_auth_id: options.device_auth_id,
              user_code: options.user_code,
            }),
          });

          if (response.ok) {
            resolve(await response.json() as DeviceAuthorizationResponse);
            return;
          }

          setTimeout(() => void poll(), options.interval * 1000);
        } catch (error) {
          reject(error);
        }
      };

      setTimeout(() => void poll(), options.interval * 1000);
    });
  }

  private buildBrowserAuthorizeUrl(codeChallenge: string, state: string): string {
    const url = new URL(BROWSER_AUTHORIZE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', BROWSER_REDIRECT_URI);
    url.searchParams.set('scope', BROWSER_AUTH_SCOPES.join(' '));
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('id_token_add_organizations', 'true');
    url.searchParams.set('codex_cli_simplified_flow', 'true');
    url.searchParams.set('state', state);
    url.searchParams.set('originator', 'codex_cli_rs');
    return url.toString();
  }

  private waitForBrowserAuthorizationCallback(
    tabId: number,
    expectedState: string,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const cleanup = (): void => {
        clearTimeout(timeoutId);
        this.tabs.onUpdated.removeListener(onUpdated);
        this.tabs.onRemoved.removeListener(onRemoved);
      };

      const finish = (error?: Error, authorizationCode?: string): void => {
        if (settled) return;

        settled = true;
        cleanup();
        void this.tabs.remove(tabId).catch(() => undefined);

        if (error) {
          reject(error);
          return;
        }

        resolve(authorizationCode as string);
      };

      const onUpdated = (
        updatedTabId: number,
        changeInfo: { url?: string },
      ): void => {
        if (updatedTabId !== tabId || !changeInfo.url) return;

        const callbackUrl = parseMatchingCallbackUrl(
          changeInfo.url,
          BROWSER_REDIRECT_URI,
        );
        if (!callbackUrl) return;

        if (!isValidOAuthState(callbackUrl.searchParams.get('state'), expectedState)) {
          finish(new Error('OpenAI OAuth callback state did not match.'));
          return;
        }

        const oauthError = callbackUrl.searchParams.get('error');
        if (oauthError) {
          const description = callbackUrl.searchParams.get('error_description');
          finish(new Error(description || `OpenAI OAuth failed: ${oauthError}`));
          return;
        }

        const authorizationCode = callbackUrl.searchParams.get('code');
        if (!authorizationCode) {
          finish(new Error('OpenAI OAuth callback did not contain an authorization code.'));
          return;
        }

        finish(undefined, authorizationCode);
      };

      const onRemoved = (removedTabId: number): void => {
        if (removedTabId === tabId) {
          finish(new Error('OpenAI OAuth login was cancelled.'));
        }
      };

      const timeoutId = setTimeout(() => {
        finish(new Error('OpenAI OAuth authorization timed out.'));
      }, timeoutMs);

      this.tabs.onUpdated.addListener(onUpdated);
      this.tabs.onRemoved.addListener(onRemoved);
    });
  }

  private async exchangeAuthorizationCode(
    authorizationCode: string,
    codeVerifier: string,
    redirectUri: string,
    action: string,
  ): Promise<OpenAICodexOAuthCredential> {
    const response = await fetch(EXCHANGE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }).toString(),
    });

    return parseOpenAICodexTokenResponse(response, action);
  }
}

export default OpenAICodexOAuth;
