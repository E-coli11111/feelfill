import { useCallback, useEffect, useState } from 'react';

import { listModels } from '@/src/services/llm/models';
import { getStorage } from '@/src/services/llm/storage';
import type {
  AuthenticatedLLMModels,
  LLMAuthMethod,
  LLMModel,
  LLMProvider,
} from '@/src/services/llm/types';

import type {
  LoadedModelConfig,
  ModelSelection,
  UseModelSettingsResult,
} from './types';

const AUTH_METHOD_ORDER = ['api-key', 'oauth'] as const satisfies readonly LLMAuthMethod[];
const storage = getStorage();

function getFirstSelection(
  availableModels: AuthenticatedLLMModels,
  preferred?: ModelSelection | null,
): ModelSelection | null {
  const providers = Object.keys(availableModels) as LLMProvider[];
  const providerOrder = preferred && providers.includes(preferred.provider)
    ? [preferred.provider, ...providers.filter((provider) => provider !== preferred.provider)]
    : providers;

  for (const provider of providerOrder) {
    const methods = availableModels[provider];
    if (!methods) {
      continue;
    }

    const methodOrder = preferred?.provider === provider
      && preferred.auth_method in methods
      ? [
          preferred.auth_method,
          ...AUTH_METHOD_ORDER.filter((method) => method !== preferred.auth_method),
        ]
      : AUTH_METHOD_ORDER;

    for (const authMethod of methodOrder) {
      const models = methods[authMethod];
      if (!models || models.length === 0) {
        continue;
      }

      const preferredModel = preferred?.provider === provider
        && preferred.auth_method === authMethod
        ? models.find((model) => model.id === preferred.model_name)
        : undefined;

      return {
        provider,
        auth_method: authMethod,
        model_name: preferredModel?.id ?? models[0]!.id,
      };
    }
  }

  return null;
}

function getModelsForSelection(
  availableModels: AuthenticatedLLMModels,
  provider: LLMProvider,
  authMethod: LLMAuthMethod,
): LLMModel[] {
  return availableModels[provider]?.[authMethod] ?? [];
}

/** Loads authenticated models and persists the user's selected model. */
export function useModelSettings(): UseModelSettingsResult {
  const [availableModels, setAvailableModels] = useState<AuthenticatedLLMModels>({});
  const [selection, setSelection] = useState<ModelSelection | null>(null);
  const [loadedConfig, setLoadedConfig] = useState<LoadedModelConfig>(null);
  const [status, setStatus] = useState<UseModelSettingsResult['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [models, config] = await Promise.all([
        listModels(),
        storage.getLLMConfig(),
      ]);
      const preferred = config?.model_name
        ? {
            provider: config.provider,
            auth_method: config.auth_method,
            model_name: config.model_name,
          }
        : null;

      setAvailableModels(models);
      setLoadedConfig(config);
      setSelection(getFirstSelection(models, preferred));
      setStatus('ready');
    } catch {
      setAvailableModels({});
      setSelection(null);
      setError('无法读取模型设置，请稍后重试。');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectProvider = useCallback((provider: LLMProvider) => {
    setSelection((current) => getFirstSelection(
      { [provider]: availableModels[provider] },
      current?.provider === provider ? current : null,
    ));
    setStatus('ready');
    setError(null);
  }, [availableModels]);

  const selectAuthMethod = useCallback((authMethod: LLMAuthMethod) => {
    setSelection((current) => {
      if (!current) {
        return null;
      }

      const models = getModelsForSelection(
        availableModels,
        current.provider,
        authMethod,
      );
      if (models.length === 0) {
        return current;
      }

      return {
        provider: current.provider,
        auth_method: authMethod,
        model_name: models[0]!.id,
      };
    });
    setStatus('ready');
    setError(null);
  }, [availableModels]);

  const selectModel = useCallback((modelName: string) => {
    setSelection((current) => current
      ? { ...current, model_name: modelName }
      : null);
    setStatus('ready');
    setError(null);
  }, []);

  const save = useCallback(async () => {
    if (!selection) {
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const config = {
        ...loadedConfig,
        ...selection,
      };
      await storage.setLLMConfig(config);
      setLoadedConfig(config);
      setStatus('saved');
    } catch {
      setError('保存模型设置失败，请重试。');
      setStatus('error');
    }
  }, [loadedConfig, selection]);

  return {
    availableModels,
    selection,
    status,
    error,
    selectProvider,
    selectAuthMethod,
    selectModel,
    reload,
    save,
  };
}
