import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

import type {
  ContentRequest,
  ContentResponse,
} from '@/src/types';

function isContentResponse(value: unknown): value is ContentResponse {
  if (typeof value !== 'object' || value === null) return false;

  const response = value as Record<string, unknown>;
  return response.type === 'FILL_PAGE'
    && typeof response.success === 'boolean'
    && (response.error === undefined || typeof response.error === 'string')
    && (response.data === undefined || typeof response.data === 'string');
}

function getPopupStatus(loading: boolean, saving: boolean, enabled: boolean) {
  if (loading) return '正在读取状态…';
  if (saving) return '正在保存…';
  return enabled ? '已开启，选择需要使用的文件' : '已关闭，开启后可选择文件';
}

/** Manages the popup state and browser API interactions. */
export function usePopup() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingSettings, setOpeningSettings] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>();

  useEffect(() => {
    let active = true;

    void browser.storage.local
      .get('enabled')
      .then(({ enabled: storedEnabled }) => {
        if (active) setEnabled(storedEnabled !== false);
      })
      .catch(() => {
        if (active) setError('无法读取开关状态，请重新打开弹窗。');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleEnabled = useCallback(async (nextEnabled: boolean) => {
    setSaving(true);
    setError('');

    try {
      await browser.storage.local.set({ enabled: nextEnabled });
      setEnabled(nextEnabled);
      if (!nextEnabled) setFiles(undefined);
    } catch {
      setError('未能保存开关状态，请重试。');
    } finally {
      setSaving(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    setOpeningSettings(true);
    setError('');

    try {
      await browser.runtime.openOptionsPage();
    } catch {
      setError('无法打开设置，请重试。');
    } finally {
      setOpeningSettings(false);
    }
  }, []);

  const selectFile = useCallback(async (files: File[]) => {
    console.log('Selected files Test');
    if (!files.length) return;

    setFiles(files);
    setError('');

    let contentResponse: unknown;

    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (activeTab?.id === undefined) {
        throw new Error('No active tab');
      }

      const message = {
        type: 'FILL_PAGE',
        files,
      } satisfies ContentRequest;

      contentResponse = await browser.tabs.sendMessage(activeTab.id, message);

      if (!isContentResponse(contentResponse)) {
        setError('页面填充返回了无效响应。');
      } else if (!contentResponse.success) {
        setError(contentResponse.error ?? '页面填充失败。');
      }
    } catch(error) {
      setError('无法连接当前页面，请刷新页面后重试。');
      console.error('Error sending message to content script:', error);
      return;
    }
  }, []);

  return {
    enabled,
    error,
    files,
    loading,
    openingSettings,
    saving,
    status: getPopupStatus(loading, saving, enabled),
    openSettings,
    selectFile,
    toggleEnabled,
  };
}
