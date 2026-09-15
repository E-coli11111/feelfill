import type { LLMProvider } from '@/src/services/llm/types';

import { OpenaiOAuthPanel } from './oauth/openai';
import type {
  AuthKind,
  AuthPanelRegistry,
  AuthStatus,
} from './types';

/** User-facing labels for supported LLM providers. */
export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  openrouter: 'OpenRouter',
  xai: 'xAI',
  custom: '自定义服务',
};

/** User-facing labels for supported authentication mechanisms. */
export const AUTH_KIND_LABELS: Record<AuthKind, string> = {
  'api-key': 'API Key',
  oauth: 'OAuth',
};

/** User-facing labels for authentication states. */
export const STATUS_LABELS: Record<AuthStatus, string> = {
  loading: '正在检查登录状态…',
  authenticated: '已登录',
  unauthenticated: '未登录',
  unavailable: '登录方式尚不可用',
  error: '无法获取登录状态',
};

/** Provider authentication panels currently exposed by the settings UI. */
export const SUPPORTED_AUTH_PANELS = {
  'api-key': {
    // "openai": new ApiKeyAuth("openai"),
    // "anthropic": new ApiKeyAuth("anthropic"),
    // "google": new ApiKeyAuth("google"),
    // "openrouter": new ApiKeyAuth("openrouter"),
    // "xai": new ApiKeyAuth("xai"),
    // "custom": new ApiKeyAuth("custom", true),
  },
  oauth: {
    openai: OpenaiOAuthPanel,
  },
} satisfies AuthPanelRegistry;
