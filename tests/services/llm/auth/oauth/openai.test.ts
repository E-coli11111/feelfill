import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { OpenAICodexOAuth } from '@/src/services/llm/auth/oauth/openai';
import type { OpenAICodexOAuthCredential } from '@/src/services/llm/auth/oauth/types';
import type { BaseStorage } from '@/src/services/llm/types';

const AUTHORIZE_URL = 'https://auth.openai.com/codex/device';

describe('OpenAICodexOAuth device-code flow', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('runs the complete device-code flow from authorize', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        device_auth_id: 'device-auth-id',
        user_code: 'ABCD-EFGH',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        interval: 1,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authorization_code: 'authorization-code',
        code_challenge: 'code-challenge',
        code_verifier: 'code-verifier',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        access_token: 'access-token',
        id_token: 'id-token',
        refresh_token: 'refresh-token',
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const onDeviceCode = vi.fn();
    const adapter = new OpenAICodexOAuth();

    const authorization = adapter.authorize({ method: 'device-code', onDeviceCode });
    await vi.advanceTimersByTimeAsync(0);

    expect(onDeviceCode).toHaveBeenCalledWith('ABCD-EFGH', AUTHORIZE_URL);

    await vi.advanceTimersByTimeAsync(1_000);
    await expect(authorization).resolves.toEqual({
      access_token: 'access-token',
      id_token: 'id-token',
      refresh_token: 'refresh-token',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const exchangeBody = new URLSearchParams(
      (fetchMock.mock.calls[2]![1] as RequestInit).body as string,
    );
    expect(exchangeBody.get('grant_type')).toBe('authorization_code');
    expect(exchangeBody.get('redirect_uri')).toBe(
      'https://auth.openai.com/deviceauth/callback',
    );
    expect(exchangeBody.get('code_verifier')).toBe('code-verifier');
    expect(await adapter.getCredentials()).toBe(JSON.stringify({
      access_token: 'access-token',
      id_token: 'id-token',
      refresh_token: 'refresh-token',
    }));
  });

  it('stops without polling after the device code expires', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      device_auth_id: 'device-auth-id',
      user_code: 'EXPIRED',
      expires_at: Math.floor(Date.now() / 1000),
      interval: 1,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new OpenAICodexOAuth();

    const authorization = adapter.authorize({
      method: 'device-code',
      onDeviceCode: vi.fn(),
    });
    const rejection = expect(authorization).rejects.toThrow(
      'Device code expired before authorization was completed.',
    );
    await vi.advanceTimersByTimeAsync(1_000);

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

function createStorageMock(): BaseStorage & {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
  };
}

function createTabsMock() {
  type UpdatedListener = Parameters<typeof browser.tabs.onUpdated.addListener>[0];
  type RemovedListener = Parameters<typeof browser.tabs.onRemoved.addListener>[0];
  const updatedListeners = new Set<UpdatedListener>();
  const removedListeners = new Set<RemovedListener>();
  const tab = { id: 1 };
  const create = vi.fn().mockResolvedValue(tab);
  const remove = vi.fn().mockResolvedValue(undefined);

  const tabs = {
    create,
    remove,
    onUpdated: {
      addListener: (listener: UpdatedListener) => updatedListeners.add(listener),
      removeListener: (listener: UpdatedListener) => updatedListeners.delete(listener),
    },
    onRemoved: {
      addListener: (listener: RemovedListener) => removedListeners.add(listener),
      removeListener: (listener: RemovedListener) => removedListeners.delete(listener),
    },
  } as unknown as typeof browser.tabs;

  return {
    tabs,
    create,
    remove,
    emitUpdated(url: string): void {
      for (const listener of updatedListeners) {
        listener(1, { url }, { ...tab, url } as Parameters<UpdatedListener>[2]);
      }
    },
  };
}

const CREDENTIAL: OpenAICodexOAuthCredential = {
  access_token: 'access-token',
  id_token: 'id-token',
  refresh_token: 'refresh-token',
};

describe('OpenAICodexOAuth browser flow', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a PKCE authorize tab, captures the localhost callback, and stores tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(CREDENTIAL), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const storage = createStorageMock();
    const tabsMock = createTabsMock();
    const adapter = new OpenAICodexOAuth(storage, tabsMock.tabs);
    const onAuthorizeUrl = vi.fn();

    const authorization = adapter.authorize({
      method: 'browser',
      onAuthorizeUrl,
      timeoutMs: 10_000,
    });
    await vi.waitFor(() => expect(onAuthorizeUrl).toHaveBeenCalledOnce());

    const authorizeUrl = new URL(onAuthorizeUrl.mock.calls[0]![0] as string);
    expect(authorizeUrl.origin).toBe('https://auth.openai.com');
    expect(authorizeUrl.pathname).toBe('/oauth/authorize');
    expect(authorizeUrl.searchParams.get('response_type')).toBe('code');
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
      'http://localhost:1455/auth/callback',
    );
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authorizeUrl.searchParams.get('scope')).toContain('offline_access');

    const callbackUrl = new URL('http://localhost:1455/auth/callback');
    callbackUrl.searchParams.set('code', 'authorization-code');
    callbackUrl.searchParams.set('state', authorizeUrl.searchParams.get('state') as string);

    tabsMock.emitUpdated(callbackUrl.toString());
    await expect(authorization).resolves.toEqual(CREDENTIAL);

    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]!;
    expect(request[0]).toBe('https://auth.openai.com/oauth/token');
    const body = new URLSearchParams((request[1] as RequestInit).body as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('authorization-code');
    expect(body.get('redirect_uri')).toBe('http://localhost:1455/auth/callback');
    expect(body.get('code_verifier')).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(storage.set).toHaveBeenCalledWith(
      'llmAuth:openai%3Aoauth',
      JSON.stringify(CREDENTIAL),
    );
    expect(tabsMock.remove).toHaveBeenCalledWith(1);
  });

  it('rejects a callback whose state does not match without exchanging tokens', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const tabsMock = createTabsMock();
    const adapter = new OpenAICodexOAuth(createStorageMock(), tabsMock.tabs);
    const onAuthorizeUrl = vi.fn();

    const authorization = adapter.authorize({
      method: 'browser',
      onAuthorizeUrl,
      timeoutMs: 10_000,
    });
    const rejection = expect(authorization).rejects.toThrow(
      'OpenAI OAuth callback state did not match.',
    );
    await vi.waitFor(() => expect(onAuthorizeUrl).toHaveBeenCalledOnce());
    tabsMock.emitUpdated(
      'http://localhost:1455/auth/callback?code=authorization-code&state=wrong',
    );

    await rejection;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes tokens and revokes the refresh token with runtime validation', async () => {
    const refreshedCredential: OpenAICodexOAuthCredential = {
      access_token: 'refreshed-access-token',
      id_token: 'refreshed-id-token',
      refresh_token: 'refreshed-refresh-token',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(refreshedCredential), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const storage = createStorageMock();
    const adapter = new OpenAICodexOAuth(storage);

    await expect(adapter.refresh(CREDENTIAL)).resolves.toEqual(refreshedCredential);
    const refreshBody = new URLSearchParams(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(refreshBody.get('grant_type')).toBe('refresh_token');
    expect(refreshBody.get('refresh_token')).toBe('refresh-token');

    await adapter.revoke(refreshedCredential);
    expect(fetchMock.mock.calls[1]![0]).toBe('https://auth.openai.com/oauth/revoke');
    expect(JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string)).toEqual({
      token: 'refreshed-refresh-token',
      token_type_hint: 'refresh_token',
      client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
    });
    expect(storage.remove).toHaveBeenCalledWith('llmAuth:openai%3Aoauth');
    expect(storage.remove).toHaveBeenCalledWith('llmAuth:openai-codex%3Aaccess_token');
  });

  it('exposes only the validated access token to the provider layer', async () => {
    const storage = createStorageMock();
    storage.get.mockResolvedValue(JSON.stringify(CREDENTIAL));
    const adapter = new OpenAICodexOAuth(storage);

    await expect(adapter.getProviderCredential()).resolves.toBe('access-token');

    storage.get.mockResolvedValue('{invalid json');
    await expect(adapter.getProviderCredential()).rejects.toThrow(
      'Stored OpenAI Codex OAuth credential is invalid.',
    );
  });

  it('migrates the legacy Codex-specific storage key on read', async () => {
    const storage = createStorageMock();
    storage.get.mockImplementation(async (key: string) => (
      key === 'llmAuth:openai-codex%3Aaccess_token' ? JSON.stringify(CREDENTIAL) : null
    ));
    const adapter = new OpenAICodexOAuth(storage);

    await expect(adapter.getCredentials()).resolves.toBe(JSON.stringify(CREDENTIAL));
    expect(storage.set).toHaveBeenCalledWith(
      'llmAuth:openai%3Aoauth',
      JSON.stringify(CREDENTIAL),
    );
    expect(storage.remove).toHaveBeenCalledWith('llmAuth:openai-codex%3Aaccess_token');
  });
});
