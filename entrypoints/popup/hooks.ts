import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

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
  const [file, setFile] = useState<File>();

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
      if (!nextEnabled) setFile(undefined);
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

  const selectFile = useCallback((files: File[]) => {
    const [selectedFile] = files;
    if (selectedFile) setFile(selectedFile);
  }, []);

  return {
    enabled,
    error,
    file,
    loading,
    openingSettings,
    saving,
    status: getPopupStatus(loading, saving, enabled),
    openSettings,
    selectFile,
    toggleEnabled,
  };
}
