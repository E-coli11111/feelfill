import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import Switch from '@/src/components/switch';
import Uploader from '@/src/components/uploader';

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingSettings, setOpeningSettings] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File>();

  useEffect(() => {
    let active = true;
    void browser.storage.local.get('enabled').then(({ enabled }) => {
      if (active) setEnabled(enabled !== false);
    }).catch(() => {
      if (active) setError('无法读取开关状态，请重新打开弹窗。');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function toggleEnabled(next: boolean) {
    setSaving(true);
    setError('');
    try {
      await browser.storage.local.set({ enabled: next });
      setEnabled(next);
      if (!next) setFile(undefined);
    } catch {
      setError('未能保存开关状态，请重试。');
    } finally {
      setSaving(false);
    }
  }

  async function openSettings() {
    setOpeningSettings(true);
    setError('');
    try {
      await browser.runtime.openOptionsPage();
    } catch {
      setError('无法打开设置，请重试。');
    } finally {
      setOpeningSettings(false);
    }
  }

  return (
    <main className="rounded-md mx-auto w-full max-w-[440px] p-5 max-[320px]:p-4">
      <header className="mb-6 flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 18V6h10M7 12h7M15 17l2 2 4-5" />
          </svg>
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">FeelFill</h1>
          <p className="text-xs leading-5 text-slate-500">让填写更轻松</p>
        </div>
      </header>

      <section aria-label="扩展开关" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <Switch enabled={enabled} disabled={loading || saving} onChange={(next) => void toggleEnabled(next)} text="开启 FeelFill" />
        <p role="status" className="mt-2 text-xs leading-5 text-slate-500">
          {loading ? '正在读取状态…' : saving ? '正在保存…' : enabled ? '已开启，选择需要使用的文件' : '已关闭，开启后可选择文件'}
        </p>
      </section>

      {enabled && (
        <section aria-label="上传文件" className="mt-4">
          <Uploader multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" text={file ? '重新选择文件' : '点击上传文件'} onChange={(files) => { if (files[0]) setFile(files[0]); }} />
          <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">支持 PDF、Word、JPG、PNG</p>
          {file && <p role="status" className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700 [overflow-wrap:anywhere]">已选择：{file.name}</p>}
        </section>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}

      <footer className="mt-5 border-t border-slate-200 pt-3">
        <button type="button" disabled={openingSettings} onClick={() => void openSettings()} className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-50">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" fill="currentColor" /><circle cx="15" cy="17" r="3" fill="currentColor" />
          </svg>
          {openingSettings ? '正在打开…' : '打开设置'}
        </button>
      </footer>
    </main>
  );
}

