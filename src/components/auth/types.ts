import type { LLMProvider } from '@/src/services/llm/types';
import type { ApiKeyAuthAdapter, OAuthAuthAdapter } from '@/src/services/llm/auth/types';

/** Props shared by every provider-specific authentication panel. */
export interface BaseAuthPanelProps {
  provider: LLMProvider;
  authorizeMethod: ApiKeyAuthAdapter | OAuthAuthAdapter<never>;
}
