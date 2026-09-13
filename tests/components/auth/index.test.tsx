import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AuthPanel from '@/src/components/auth';
import { SUPPORTED_AUTH_METHODS } from '@/src/services/llm/auth/registry';

describe('AuthPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the login status for every registered panel', async () => {
    vi.spyOn(
      SUPPORTED_AUTH_METHODS.oauth.openai,
      'getCredentials',
    ).mockResolvedValue('stored credential');

    render(<AuthPanel />);

    expect(screen.getByText('正在检查登录状态…')).toBeInTheDocument();
    expect(await screen.findByText('已登录')).toBeInTheDocument();
    expect(screen.getByText('OAuth')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新登录' })).toBeEnabled();
  });

  it('opens the registered provider panel for login', async () => {
    vi.spyOn(
      SUPPORTED_AUTH_METHODS.oauth.openai,
      'getCredentials',
    ).mockResolvedValue(null);
    const user = userEvent.setup();

    render(<AuthPanel />);

    await user.click(await screen.findByRole('button', { name: '登录' }));

    expect(screen.getByRole('button', { name: '返回登录方式' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '使用设备码授权' })).toBeInTheDocument();
  });

  it('isolates errors while reading a login status', async () => {
    vi.spyOn(
      SUPPORTED_AUTH_METHODS.oauth.openai,
      'getCredentials',
    ).mockRejectedValue(new Error('read failed'));

    render(<AuthPanel />);

    await waitFor(() => {
      expect(screen.getByText('无法获取登录状态')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '登录' })).toBeEnabled();
  });
});
