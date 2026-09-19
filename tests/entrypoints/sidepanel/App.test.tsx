import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from '@/entrypoints/sidepanel/App';

describe('Side panel', () => {
  beforeEach(() => { fakeBrowser.reset(); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('reads, saves and restores the enabled state', async () => {
    await fakeBrowser.storage.local.set({ enabled: false });
    const user = userEvent.setup();
    const view = render(<App />);
    const toggle = screen.getByRole('switch', { name: '开启 FeelFill' });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole('heading', { name: '少一点重复，多一点轻松' })).toBeInTheDocument();
    expect(screen.queryByLabelText('点击上传文件')).not.toBeInTheDocument();
    await user.click(toggle);
    expect(await screen.findByLabelText('点击上传文件')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '少一点重复，多一点轻松' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '自定义要求' }));
    expect(screen.getByRole('textbox', { name: '自定义要求' })).toHaveAccessibleDescription('可选，将作为本次文档解析的补充要求。');
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

  it('waits for confirmation before sending the selected file for filling', async () => {
    const user = userEvent.setup();
    const queryTabs = vi.spyOn(browser.tabs, 'query').mockImplementation(async () => [{ id: 7 }]);
    const sendToContent = vi.spyOn(browser.tabs, 'sendMessage').mockImplementation(async () => ({
      type: 'FILL_PAGE',
      success: true,
    }));

    render(<App />);
    const file = new File(['fixture'], '资料.pdf', { type: 'application/pdf' });
    await user.click(await screen.findByRole('button', { name: '自定义要求' }));
    const instruction = await screen.findByRole('textbox', { name: '自定义要求' });
    await user.type(instruction, '  优先使用护照上的英文姓名。  ');
    await user.click(screen.getByRole('button', { name: '自定义要求' }));
    await user.upload(await screen.findByLabelText('点击上传文件'), file);

    expect(sendToContent).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '解析并填充' }));
    await waitFor(() => expect(sendToContent).toHaveBeenCalledOnce());
    expect(queryTabs).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(sendToContent).toHaveBeenCalledWith(7, {
      type: 'FILL_PAGE',
      userInstruction: '优先使用护照上的英文姓名。',
      files: [{
        content: 'Zml4dHVyZQ==',
        name: '资料.pdf',
        type: 'application/pdf',
      }],
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the custom instruction when disabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: '自定义要求' }));
    const instruction = await screen.findByRole('textbox', { name: '自定义要求' });
    await user.type(instruction, '仅填写必填字段');
    await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(screen.getByRole('switch')).toBeEnabled());
    await user.click(screen.getByRole('switch'));

    const disclosure = await screen.findByRole('button', { name: '自定义要求' });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    await user.click(disclosure);
    expect(await screen.findByRole('textbox', { name: '自定义要求' })).toHaveValue('');
  });

  it('expands with the keyboard and preserves instructions when collapsed', async () => {
    const user = userEvent.setup();
    render(<App />);
    const disclosure = await screen.findByRole('button', { name: '自定义要求' });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: '自定义要求' })).not.toBeInTheDocument();
    disclosure.focus();
    await user.keyboard('{Enter}');
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await user.type(screen.getByRole('textbox', { name: '自定义要求' }), '仅填写必填字段');
    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(disclosure).toHaveTextContent('已添加');
    expect(screen.queryByRole('textbox', { name: '自定义要求' })).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.getByRole('textbox', { name: '自定义要求' })).toHaveValue('仅填写必填字段');
  });

  it('shows an error returned by the content script', async () => {
    const user = userEvent.setup();
    vi.spyOn(browser.tabs, 'query').mockImplementation(async () => [{ id: 7 }]);
    vi.spyOn(browser.tabs, 'sendMessage').mockImplementation(async () => ({
      type: 'FILL_PAGE',
      success: false,
      error: '没有成功填充任何字段',
    }));

    render(<App />);
    const file = new File(['fixture'], '资料.pdf', { type: 'application/pdf' });
    await user.upload(await screen.findByLabelText('点击上传文件'), file);
    await user.click(screen.getByRole('button', { name: '解析并填充' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('没有成功填充任何字段');
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
