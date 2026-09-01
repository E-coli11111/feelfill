import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function Options() {
  const [enabled, setEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void browser.storage.local.get('enabled').then(({ enabled }) => setEnabled(enabled !== false));
  }, []);

  async function save() {
    await browser.storage.local.set({ enabled });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <main>
      <h1>FillFeel 设置</h1>
      <section>
        <label>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          在网页上显示 FillFeel 按钮
        </label>
        <button onClick={save}>{saved ? '已保存 ✓' : '保存设置'}</button>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Options /></React.StrictMode>,
);

