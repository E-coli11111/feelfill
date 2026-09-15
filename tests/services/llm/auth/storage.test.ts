import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { getStorage } from '@/src/services/llm/storage';

describe('BrowserStorage string values', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns the same shared instance', () => {
    expect(getStorage()).toBe(getStorage());
  });

  it('uses consumer-defined keys without transforming them', async () => {
    const storage = getStorage();
    await fakeBrowser.storage.local.set({ enabled: true });

    await storage.set('openai-codex', '{"type":"oauth"}');
    await storage.set('custom/provider', 'secret');

    expect(await storage.get('openai-codex')).toBe('{"type":"oauth"}');
    expect(await storage.list()).toEqual(['custom/provider', 'openai-codex']);

    await storage.remove('openai-codex');
    expect(await storage.get('openai-codex')).toBeNull();
    expect((await fakeBrowser.storage.local.get('enabled')).enabled).toBe(true);
  });

  it('rejects empty storage keys', async () => {
    const storage = getStorage();
    await expect(storage.get('')).rejects.toThrow('Storage key must not be empty');
  });
});
