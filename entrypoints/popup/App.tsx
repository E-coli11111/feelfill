import { useEffect, useState } from 'react';
import Switch from '@/src/components/switch';
import Uploader from '@/src/components/uploader';

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

  /*
  * Fill input element in current webpage with the provided file.
  */
  async function fillInputElement(files: File[]) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      console.error('No active tab found');
      return;
    }

    const result = await browser.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_HTML',
    });

    const html = result.html;

    await browser.runtime.sendMessage({
      type: 'FILL',
      html,
      files,
    });
  }

  return (
    <main>
      <div className="brand">FillFeel</div>
      <Switch enabled={enabled} onChange={toggleEnabled} text="启用扩展" />
      {enabled && <Uploader 
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        text="上传文件"
        onChange={fillInputElement}
      />}
      
    </main>
  );
}

