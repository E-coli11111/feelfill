import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

import type {
  Base64File,
  ContentRequest,
  ContentResponse,
} from '@/src/types';

import { fileAsBase64 } from '@/src/utils/encode-utils';

function isContentResponse(value: unknown): value is ContentResponse {
  if (typeof value !== 'object' || value === null) return false;

  const response = value as Record<string, unknown>;
  return response.type === 'FILL_PAGE'
    && typeof response.success === 'boolean'
    && (response.error === undefined || typeof response.error === 'string')
    && (response.data === undefined || typeof response.data === 'string');
}

function getSidepanelStatus(
  loading: boolean,
  saving: boolean,
  processing: boolean,
  enabled: boolean,
) {
  if (loading) return '正在读取状态…';
  if (saving) return '正在保存…';
  if (processing) return '正在解析文件并填充页面…';
  return enabled ? '已开启，选择需要使用的文件' : '已关闭，开启后可选择文件';
}

/** Manages the side panel state and browser API interactions. */
export function useSidepanel() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [openingSettings, setOpeningSettings] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>();
  const [userInstruction, setUserInstruction] = useState('');

  useEffect(() => {
    let active = true;

    void browser.storage.local
      .get('enabled')
      .then(({ enabled: storedEnabled }) => {
        if (active) setEnabled(storedEnabled !== false);
      })
      .catch(() => {
        if (active) setError('无法读取开关状态，请重新打开侧边栏。');
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
      if (!nextEnabled) {
        setFiles(undefined);
        setUserInstruction('');
      }
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

  const selectFile = useCallback((selectedFiles: File[]) => {
    if (!selectedFiles.length) return;

    setFiles(selectedFiles);
    setError('');
  }, []);

  const processFiles = useCallback(async () => {
    if (!files?.length) return;

    let contentResponse: unknown;
    setProcessing(true);
    setError('');

    try {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (activeTab?.id === undefined) {
        throw new Error('No active tab');
      }

      const base64Files: Base64File[] = await Promise.all(files.map(fileAsBase64));

      const message = {
        type: 'FILL_PAGE',
        files: base64Files,
        userInstruction: userInstruction.trim(),
      } satisfies ContentRequest;

      contentResponse = await browser.tabs.sendMessage(activeTab.id, message);

      if (!isContentResponse(contentResponse)) {
        setError('页面填充返回了无效响应。');
      } else if (!contentResponse.success) {
        setError(contentResponse.error ?? '页面填充失败。');
      }
    } catch (error) {
      setError('无法连接当前页面，请刷新页面后重试。');
      console.error('Error sending message to content script:', error);
    } finally {
      setProcessing(false);
    }
  }, [files, userInstruction]);

  return {
    enabled,
    error,
    files,
    loading,
    openingSettings,
    processing,
    saving,
    status: getSidepanelStatus(loading, saving, processing, enabled),
    userInstruction,
    openSettings,
    processFiles,
    selectFile,
    setUserInstruction,
    toggleEnabled,
  };
}
