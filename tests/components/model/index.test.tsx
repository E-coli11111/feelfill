import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import ModelPanel from '@/src/components/model';
import { SUPPORTED_MODELS } from '@/src/services/llm/registry';
import { getStorage } from '@/src/services/llm/storage';

describe('ModelPanel', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('requires authentication before exposing model choices', async () => {
    render(<ModelPanel />);

    expect(await screen.findByText('暂无可用模型')).toBeInTheDocument();
    expect(screen.queryByLabelText('模型')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '保存模型设置' })).not.toBeInTheDocument();
  });

  it('loads the stored selection and saves a different authenticated model', async () => {
    const storage = getStorage();
    const storedModel = SUPPORTED_MODELS.openai.find(
      (model) => model.id === 'gpt-5.6-terra',
    );
    const selectedModel = SUPPORTED_MODELS.openai.find(
      (model) => model.id === 'gpt-5.6-luna',
    );
    if (!storedModel || !selectedModel) {
      throw new Error('Expected the test models to be registered.');
    }
    await storage.set('llmAuth:openai%3Aapi-key', 'test-api-key');
    await fakeBrowser.storage.local.set({
      llmConfig: {
        auth_method: 'api-key',
        provider: 'openai',
        model: storedModel,
        temperature: 0.2,
      },
    });
    const user = userEvent.setup();

    render(<ModelPanel />);

    const modelSelect = await screen.findByLabelText('模型');
    expect(modelSelect).toHaveValue('gpt-5.6-terra');
    expect(screen.getByLabelText('服务商')).toHaveValue('openai');
    expect(screen.getByLabelText('登录方式')).toHaveValue('api-key');

    await user.selectOptions(modelSelect, 'gpt-5.6-luna');
    await user.click(screen.getByRole('button', { name: '保存模型设置' }));

    expect(await screen.findByRole('status')).toHaveTextContent('模型设置已保存。');
    await expect(fakeBrowser.storage.local.get('llmConfig')).resolves.toEqual({
      llmConfig: {
        auth_method: 'api-key',
        provider: 'openai',
        model: selectedModel,
        temperature: 0.2,
      },
    });
  });

  it('only offers authentication methods that are logged in', async () => {
    const storage = getStorage();
    await storage.set('llmAuth:openai%3Aoauth', JSON.stringify({
      access_token: 'access-token',
      id_token: 'id-token',
      refresh_token: 'refresh-token',
    }));

    render(<ModelPanel />);

    const authSelect = await screen.findByLabelText('登录方式');
    expect(authSelect).toHaveValue('oauth');
    expect(screen.getByRole('option', { name: 'OAuth' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'API Key' })).not.toBeInTheDocument();
  });

  it('shows an error when saving the model selection fails', async () => {
    const storage = getStorage();
    await storage.set('llmAuth:openai%3Aapi-key', 'test-api-key');
    const user = userEvent.setup();

    render(<ModelPanel />);
    await screen.findByLabelText('模型');
    vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(
      new Error('storage failed'),
    );

    await user.click(screen.getByRole('button', { name: '保存模型设置' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '保存模型设置失败，请重试。',
    );
  });
});
