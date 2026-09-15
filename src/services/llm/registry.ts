import { ApiKeyAuth } from '@/src/services/llm/auth/api-auth';
import type {
  BaseAuthAdapter,
  AuthMethodRegistry,
} from '@/src/services/llm/auth/types';
import type {
  LLMAuthMethod,
  LLMModel,
  LLMProvider,
} from '@/src/services/llm/types';

import { OpenAICodexOAuth } from '@/src/services/llm/auth/oauth/openai';


/////////////// Authentication Adapters ///////////////
/** Authentication adapters currently available to provider panels. */
export const SUPPORTED_AUTH_METHODS = {
  'api-key': {
    openai: new ApiKeyAuth('openai'),
    anthropic: new ApiKeyAuth('anthropic'),
    google: new ApiKeyAuth('google'),
    openrouter: new ApiKeyAuth('openrouter'),
    xai: new ApiKeyAuth('xai'),
    custom: new ApiKeyAuth('custom', true),
  },
  oauth: {
    openai: new OpenAICodexOAuth(),
  },
} satisfies AuthMethodRegistry;

/** Returns the adapter associated with a provider and authentication method. */
export function getProviderAuthMethod(
  provider: LLMProvider,
  authMethod: LLMAuthMethod,
): BaseAuthAdapter | null {
  const registry: AuthMethodRegistry = SUPPORTED_AUTH_METHODS;
  return registry[authMethod][provider] ?? null;
}


/////////////// Models ///////////////

/** Current general-purpose OpenAI models supported by FeelFill. */
export const SUPPORTED_MODELS = {
  openai: [
    {
      id: 'gpt-6-astra',
      display_name: 'GPT-6 Astra',
      provider: 'openai',
      auth_methods: ['api-key', 'oauth'],
      capabilities: {
        text: true,
        image: true,
        file: true,
        structured_output: true,
      },
      context_window: 1_050_000,
      max_output_tokens: 128_000,
      enabled: true,
      recommended: true,
      description: '适合复杂推理与高质量文档字段提取。',
    },
    {
      id: 'gpt-5.6-sol',
      display_name: 'GPT-5.6 Sol',
      provider: 'openai',
      auth_methods: ['api-key', 'oauth'],
      capabilities: {
        text: true,
        image: true,
        file: true,
        structured_output: true,
      },
      context_window: 1_050_000,
      max_output_tokens: 128_000,
      enabled: true,
      description: '适合复杂的专业表单与文档处理。',
    },
    {
      id: 'gpt-5.6-terra',
      display_name: 'GPT-5.6 Terra',
      provider: 'openai',
      auth_methods: ['api-key', 'oauth'],
      capabilities: {
        text: true,
        image: true,
        file: true,
        structured_output: true,
      },
      context_window: 1_050_000,
      max_output_tokens: 128_000,
      enabled: true,
      description: '在识别质量、速度和成本之间取得平衡。',
    },
    {
      id: 'gpt-5.6-luna',
      display_name: 'GPT-5.6 Luna',
      provider: 'openai',
      auth_methods: ['api-key', 'oauth'],
      capabilities: {
        text: true,
        image: true,
        file: true,
        structured_output: true,
      },
      context_window: 1_050_000,
      max_output_tokens: 128_000,
      enabled: true,
      description: '适合成本敏感的高频字段识别任务。',
    },
  ],
} satisfies Partial<Record<LLMProvider, LLMModel[]>>;
