import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { BrowserStorage } from '@/src/services/llm/storage';

describe('BrowserAuthStorage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('stores, lists, and removes namespaced authentication values', async () => {
    const storage = new BrowserStorage();
    await fakeBrowser.storage.local.set({ enabled: true });

    await storage.set('openai-codex', '{"type":"oauth"}');
    await storage.set('custom/provider', 'secret');

    expect(await storage.get('openai-codex')).toBe('{"type":"oauth"}');
    expect(await storage.list()).toEqual(['custom/provider', 'openai-codex']);

    await storage.remove('openai-codex');
    expect(await storage.get('openai-codex')).toBeNull();
    expect((await fakeBrowser.storage.local.get('enabled')).enabled).toBe(true);
  });

  it('rejects empty logical keys', async () => {
    const storage = new BrowserStorage();
    await expect(storage.get('')).rejects.toThrow('Auth storage key must not be empty');
  });
});
