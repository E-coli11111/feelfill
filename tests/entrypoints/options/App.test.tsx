import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from '@/entrypoints/options/App';

const oauthMocks = vi.hoisted(() => ({
  authorize: vi.fn().mockResolvedValue(undefined),
  step: 'wait' as 'requesting' | 'wait' | 'success' | 'error',
}));

vi.mock('@/src/components/auth/oauth/openai/hooks', () => ({
  useOpenaiDeviceCode: () => ({
    step: oauthMocks.step,
    code: 'ABCD-EFGH',
    authorizeUrl: 'https://example.test/device',
    authorize: oauthMocks.authorize,
  }),
}));

describe('Options', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    oauthMocks.authorize.mockClear();
    oauthMocks.step = 'wait';
  });

  it('shows authentication as the active settings section', () => {
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '鉴权' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'OpenAI' })).toBeInTheDocument();
  });

  it('collapses and expands the settings sidebar', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const sidebar = container.querySelector('[data-slot="sidebar"]');

    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await user.click(screen.getByRole('button', { name: '切换设置导航' }));
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });

  it('starts authorization whenever the device-code panel is entered', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: '登录' }));
    await user.click(screen.getByRole('button', { name: '使用设备码授权' }));
    await waitFor(() => expect(oauthMocks.authorize).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText('设备码')).toHaveTextContent('ABCD-EFGH');

    await user.click(screen.getByRole('button', { name: '返回' }));
    await user.click(screen.getByRole('button', { name: '使用设备码授权' }));
    await waitFor(() => expect(oauthMocks.authorize).toHaveBeenCalledTimes(2));
  });

  it('allows retrying a failed authorization', async () => {
    oauthMocks.step = 'error';
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: '登录' }));
    await user.click(screen.getByRole('button', { name: '使用设备码授权' }));
    await waitFor(() => expect(oauthMocks.authorize).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert')).toHaveTextContent('授权失败');

    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(oauthMocks.authorize).toHaveBeenCalledTimes(2);
  });
});
