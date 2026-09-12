import type { OAuthAuthAdapter } from '@/src/types/auth';

// OpenAI default authentication url
const AUTH_BASE_URL = "https://auth.openai.com";

// Urls for device code auth
const DEVICE_USER_CODE_URL = `${AUTH_BASE_URL}/api/accounts/deviceauth/usercode`;
const DEVICE_AUTH_URL = `${AUTH_BASE_URL}/codex/device`;
const NOT_IMPLEMENTED_ERROR = 'OpenAI OAuth credential exchange is not implemented.';

/** Authentication adapter skeleton for the OpenAI Codex OAuth flow. */
export class OpenAICodexDeviceCodeOAuthAdapter implements OAuthAuthAdapter {
  public readonly type = 'oauth' as const;
  public readonly provider = 'openai-codex' as const;
  public readonly authorizeUrl = DEVICE_AUTH_URL;

  /** Starts the OpenAI Codex OAuth authorization flow. */
  async fetchDeviceCode(): Promise<string> {
    // fetch device auth
    const response = await fetch(DEVICE_USER_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: 'openai-codex feelfill', // TODO: Replace with actual client ID if needed
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

    return userCodeData.user_code;
  }

  async authorize(_options: unknown): Promise<unknown> {
    throw new Error(NOT_IMPLEMENTED_ERROR);
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
    throw new Error(NOT_IMPLEMENTED_ERROR);
  }
}
