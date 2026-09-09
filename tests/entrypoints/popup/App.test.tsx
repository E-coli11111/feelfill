import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from '@/entrypoints/popup/App';

describe('Popup', () => {
  beforeEach(() => { fakeBrowser.reset(); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('reads, saves and restores the enabled state', async () => {
    await fakeBrowser.storage.local.set({ enabled: false });
    const user = userEvent.setup();
    const view = render(<App />);
    const toggle = screen.getByRole('switch', { name: '开启 FeelFill' });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).not.toBeChecked();
    expect(screen.queryByLabelText('点击上传文件')).not.toBeInTheDocument();
    await user.click(toggle);
    expect(await screen.findByLabelText('点击上传文件')).toBeInTheDocument();
    expect(await fakeBrowser.storage.local.get('enabled')).toEqual({ enabled: true });
    view.unmount();
    render(<App />);
    expect(await screen.findByLabelText('点击上传文件')).toBeInTheDocument();
    await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(screen.queryByLabelText('点击上传文件')).not.toBeInTheDocument());
    expect(await fakeBrowser.storage.local.get('enabled')).toEqual({ enabled: false });
  });

  it('shows a selected file and clears it when disabled', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = await screen.findByLabelText('点击上传文件');
    const file = new File(['fixture'], '资料.pdf', { type: 'application/pdf' });
    await user.upload(input, file);
    expect(screen.getByText('已选择：资料.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(screen.queryByText('已选择：资料.pdf')).not.toBeInTheDocument());
  });

  it('reports a storage read failure without showing the uploader', async () => {
    vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(new Error('read failed'));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('无法读取开关状态');
    expect(screen.queryByLabelText('点击上传文件')).not.toBeInTheDocument();
  });

  it('keeps the previous state when saving fails and allows retry', async () => {
    await fakeBrowser.storage.local.set({ enabled: false });
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('switch');
    await waitFor(() => expect(toggle).toBeEnabled());
    vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(new Error('write failed'));
    await user.click(toggle);
    expect(await screen.findByRole('alert')).toHaveTextContent('未能保存开关状态');
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(await screen.findByLabelText('点击上传文件')).toBeInTheDocument();
  });

  it('opens the options page and reports failures', async () => {
    const open = vi.spyOn(fakeBrowser.runtime, 'openOptionsPage').mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '打开设置' }));
    expect(open).toHaveBeenCalledOnce();
    open.mockRejectedValueOnce(new Error('unavailable'));
    await user.click(screen.getByRole('button', { name: '打开设置' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('无法打开设置');
  });
});
