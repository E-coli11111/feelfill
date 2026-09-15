import type { ComponentType } from 'react';

import type { LLMProvider } from '@/src/services/llm/types';
import type { ApiKeyAuthAdapter, OAuthAuthAdapter } from '@/src/services/llm/auth/types';

/** Props shared by every provider-specific authentication panel. */
export interface BaseAuthPanelProps {
  provider: LLMProvider;
  authorizeMethod: ApiKeyAuthAdapter | OAuthAuthAdapter<never>;
}

/** A provider-indexed collection of authentication UI components. */
export type AuthPanelGroup = Partial<
  Record<LLMProvider, ComponentType<BaseAuthPanelProps>>
>;

/** Authentication UI components grouped by authorization mechanism. */
export interface AuthPanelRegistry {
  'api-key': AuthPanelGroup;
  oauth: AuthPanelGroup;
}

/** Authentication mechanism keys supported by the authentication panel registry. */
export type AuthKind = keyof AuthPanelRegistry;

/** Login states displayed by the aggregate authentication panel. */
export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'unavailable'
  | 'error';

/** A provider panel paired with its matching authorization adapter. */
export interface RegisteredAuthPanel {
  id: string;
  kind: AuthKind;
  provider: LLMProvider;
  Panel: ComponentType<BaseAuthPanelProps>;
  authorizeMethod?: BaseAuthPanelProps['authorizeMethod'];
}
