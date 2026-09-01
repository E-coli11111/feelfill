import { useEffect, useState } from 'react';

export default function App() {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState('正在连接…');

  useEffect(() => {
    void browser.storage.local.get('enabled').then(({ enabled }) => {
      setEnabled(enabled !== false);
    });

    void browser.runtime
      .sendMessage({ type: 'PING' })
      .then((response: { message?: string } | undefined) => {
        setStatus(response?.message ?? 'Background 无响应');
      })
      .catch(() => setStatus('Background 无响应'));
  }, []);

  async function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    await browser.storage.local.set({ enabled: next });
  }

  return (
    <main>
      <div className="brand">FillFeel</div>
      <h1>扩展已经准备好了</h1>
      <p className="description">这是一个 WXT + React + TypeScript 模板。</p>

      <button className={enabled ? 'toggle enabled' : 'toggle'} onClick={toggleEnabled}>
        <span>{enabled ? '已启用' : '已停用'}</span>
        <span className="switch" aria-hidden="true" />
      </button>

      <div className="footer">
        <span className="dot" />
        {status}
        <button className="link" onClick={() => void browser.runtime.openOptionsPage()}>
          设置
        </button>
      </div>
    </main>
  );
}

