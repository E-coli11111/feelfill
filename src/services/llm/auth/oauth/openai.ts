import type { OAuthAuthAdapter } from '@/src/types/auth';
import { BrowserAuthStorage } from '@/src/services/llm/auth/storage';

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'; // TODO: Replace with actual client ID if needed
// OpenAI default authentication url
const AUTH_BASE_URL = "https://auth.openai.com";

// Urls for device code auth
const DEVICE_USER_CODE_URL = `${AUTH_BASE_URL}/api/accounts/deviceauth/usercode`;
const DEVICE_AUTH_URL = `${AUTH_BASE_URL}/codex/device`;
const DEVICE_TOKEN_URL = `${AUTH_BASE_URL}/api/accounts/deviceauth/token`;
const DEVICE_ACCESS_TOKEN_URL = `${AUTH_BASE_URL}/oauth/token`;
const DEVICE_REDIRECT_URI = `${AUTH_BASE_URL}/deviceauth/callback`;
const NOT_IMPLEMENTED_ERROR = 'OpenAI OAuth credential exchange is not implemented.';

/** Authentication adapter skeleton for the OpenAI Codex OAuth flow. */
export class OpenAICodexDeviceCodeOAuthAdapter implements OAuthAuthAdapter {
  public readonly type = 'oauth' as const;
  public readonly provider = 'openai-codex' as const;
  public readonly authorizeUrl = DEVICE_AUTH_URL;
  private readonly storage = new BrowserAuthStorage();

  /** Starts the OpenAI Codex OAuth authorization flow. */
  async fetchDeviceCode(): Promise<{
    device_auth_id: string;
    user_code: string;
    expires_at: number;
    interval: number;
  }> {
    // fetch device auth
    const response = await fetch(DEVICE_USER_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initiate device code flow: ${response.statusText}`);
    }
    
    const userCodeData = (await response.json()) as {
      device_auth_id: string;
      user_code: string;
      expires_at: number;
      interval: number;
    };

    return userCodeData;
  }

  /** Waits for the user to authorize the device code. */
  async waitForUserAuthorization(options: {
    device_auth_id: string;
    user_code: string;
    expires_at: number;
    interval: number;
  }): Promise<{
    authorization_code: string;
    code_challenge: string;
    code_verifier: string;
  }> {
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        if (Date.now() >= options.expires_at * 1000) {
          clearInterval(timer);
          reject(new Error('Device code expired before authorization was completed.'));
        }

        // Poll for authorization status
        const response = await fetch(DEVICE_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_auth_id: options.device_auth_id,
            user_code: options.user_code,
          }),
        });
        console.log('response', await response.clone().json());

        if (response.ok) {
          // Stop polling and return the token
          clearInterval(timer);
          const tokenData = await response.json();
          resolve(tokenData);
        }
        
      }, options.interval * 1000);
    });
  }

  /** Exchanges a device code for an access token. */
  async exchangeDeviceCodeForToken(
    authorization_code: string,
    code_verifier: string
  ): Promise<{
    access_token: string;
    id_token: string;
    refresh_token?: string;
  }> {
    const response = await fetch(DEVICE_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: authorization_code,
        redirect_uri: DEVICE_REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: code_verifier,
      }).toString(),
    });
    console.log('exchangeDeviceCodeForToken response', await response.clone().json());
    if (!response.ok) {
      throw new Error(`Failed to exchange device code for token: ${response.statusText}`);
    }

    return await response.json();
  }

  /** Authorizes the user with the OpenAI Codex using device code. */
  async authorize(options: {
    device_auth_id: string;
    user_code: string;
    expires_at: number;
    interval: number;
  }): Promise<void> {
    const authToken = await this.waitForUserAuthorization(options);

    const access_token = await this.exchangeDeviceCodeForToken(
      authToken.authorization_code,
      authToken.code_verifier,
    );

    await this.storage.set('openai:access_token', JSON.stringify(access_token));
  }

  /** Refreshes an existing OpenAI Codex OAuth credential. */
  async refresh(_credential: unknown): Promise<unknown> {
    throw new Error(NOT_IMPLEMENTED_ERROR);
  }

  /** Revokes an existing OpenAI Codex OAuth credential. */
  async revoke(_credential: unknown): Promise<void> {
    throw new Error(NOT_IMPLEMENTED_ERROR);
  }

  /** Returns the serialized OpenAI Codex OAuth credential. */
  async getCredentials(): Promise<string | null> {
    return await this.storage.get('openai:access_token');
  }
}
