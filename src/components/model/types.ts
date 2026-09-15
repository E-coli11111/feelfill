import type {
  AuthenticatedLLMModels,
  LLMAuthMethod,
  LLMConfig,
  LLMProvider,
} from '@/src/services/llm/types';

/** Provider, authentication method, and model selected in settings. */
export interface ModelSelection {
  provider: LLMProvider;
  auth_method: LLMAuthMethod;
  model_name: string;
}

/** Lifecycle states exposed by the model settings hook. */
export type ModelSettingsStatus =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'saved'
  | 'error';

/** State and actions returned by the model settings hook. */
export interface UseModelSettingsResult {
  availableModels: AuthenticatedLLMModels;
  selection: ModelSelection | null;
  status: ModelSettingsStatus;
  error: string | null;
  selectProvider(provider: LLMProvider): void;
  selectAuthMethod(authMethod: LLMAuthMethod): void;
  selectModel(modelName: string): void;
  reload(): Promise<void>;
  save(): Promise<void>;
}

/** Props accepted by the model settings panel. */
export interface ModelPanelProps {
  onRequestAuthentication?: () => void;
}

/** Validated configuration retained while editing the model selection. */
export type LoadedModelConfig = LLMConfig | null;
