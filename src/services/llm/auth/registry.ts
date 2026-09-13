import { ApiKeyAuth } from '@/src/services/llm/auth/api-auth';
import type {
  AuthMethodRegistry,
} from '@/src/services/llm/auth/types';

import { OpenAICodexDeviceCodeOAuth } from '@/src/services/llm/auth/oauth/openai';

/** Authentication adapters currently available to provider panels. */
export const SUPPORTED_AUTH_METHODS = {
  apiKey: {
    "openai": new ApiKeyAuth("openai"),
    "anthropic": new ApiKeyAuth("anthropic"),
    "google": new ApiKeyAuth("google"),
    "openrouter": new ApiKeyAuth("openrouter"),
    "xai": new ApiKeyAuth("xai"),
    "custom": new ApiKeyAuth("custom", true),
  },
  oauth: {
    openai: new OpenAICodexDeviceCodeOAuth(),
  },
} satisfies AuthMethodRegistry;
