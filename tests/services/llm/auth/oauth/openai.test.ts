import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { OpenAICodexDeviceCodeOAuth } from '@/src/services/llm/auth/oauth/openai';

const AUTHORIZE_URL = 'https://auth.openai.com/codex/device';

describe('OpenAICodexDeviceCodeOAuth', () => {
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
    const adapter = new OpenAICodexDeviceCodeOAuth();

    const authorization = adapter.authorize({ onDeviceCode });
    await vi.advanceTimersByTimeAsync(0);

    expect(onDeviceCode).toHaveBeenCalledWith('ABCD-EFGH', AUTHORIZE_URL);

    await vi.advanceTimersByTimeAsync(1_000);
    await authorization;

    expect(fetchMock).toHaveBeenCalledTimes(3);
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
    const adapter = new OpenAICodexDeviceCodeOAuth();

    const authorization = adapter.authorize({ onDeviceCode: vi.fn() });
    const rejection = expect(authorization).rejects.toThrow(
      'Device code expired before authorization was completed.',
    );
    await vi.advanceTimersByTimeAsync(1_000);

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
