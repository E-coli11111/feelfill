import { useState } from 'react';

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fillfeel-root">
      {open && (
        <div className="fillfeel-card">
          <strong>FillFeel</strong>
          <p>这是注入当前网页的 React 组件。</p>
        </div>
      )}
      <button className="fillfeel-button" onClick={() => setOpen((value) => !value)} aria-label="打开 FillFeel">
        F
      </button>
    </div>
  );
}

