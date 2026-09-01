import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'fillfeel-content-ui',
      position: 'overlay',
      anchor: 'body',
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);
        const root = ReactDOM.createRoot(wrapper);
        root.render(<App />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    const { enabled } = await browser.storage.local.get('enabled');
    if (enabled !== false) ui.mount();

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes.enabled) return;

      if (changes.enabled.newValue === false) {
        ui.remove();
      } else if (!ui.mounted) {
        ui.mount();
      }
    });
  },
});
