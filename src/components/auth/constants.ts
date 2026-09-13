import type { ComponentType } from 'react';

import type { LLMProvider } from '@/src/services/llm/types';

import { OpenaiOAuthPanel } from './oauth/openai';
import type { BaseAuthPanelProps } from './types';

/** A provider-indexed collection of authentication UI components. */
export type AuthPanelGroup = Partial<
  Record<LLMProvider, ComponentType<BaseAuthPanelProps>>
>;

/** Authentication UI components grouped by authorization mechanism. */
export interface AuthPanelRegistry {
  apiKey: AuthPanelGroup;
  oauth: AuthPanelGroup;
}

/** Provider authentication panels currently exposed by the settings UI. */
export const SUPPORTED_AUTH_PANELS = {
  apiKey: {
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
