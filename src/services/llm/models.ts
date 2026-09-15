import { getProviderAuthMethod, SUPPORTED_MODELS } from './registry';
import type {
  AuthenticatedLLMModels,
  LLMAuthMethod,
  LLMModel,
  LLMProvider,
} from './types';

const LLM_AUTH_METHODS = ['api-key', 'oauth'] as const satisfies readonly LLMAuthMethod[];

/**
 * Lists enabled models grouped by provider and authenticated transport.
 *
 * Providers and authentication methods without usable credentials are omitted.
 *
 * @returns Models available through the user's current authenticated transports.
 */
export async function listModels(): Promise<AuthenticatedLLMModels> {
  const availableModels: AuthenticatedLLMModels = {};
  const modelEntries = Object.entries(SUPPORTED_MODELS) as [
    LLMProvider,
    LLMModel[],
  ][];

  for (const [provider, models] of modelEntries) {
    const providerModels: Partial<Record<LLMAuthMethod, LLMModel[]>> = {};

    for (const authMethod of LLM_AUTH_METHODS) {
      const matchingModels = models.filter(
        (model) => model.enabled && model.auth_methods.includes(authMethod),
      );
      const authAdapter = getProviderAuthMethod(provider, authMethod);

      if (!authAdapter || matchingModels.length === 0) {
        continue;
      }

      try {
        const credential = await authAdapter.getProviderCredential();
        if (credential) {
          providerModels[authMethod] = matchingModels;
        }
      } catch {
        // Invalid persisted credentials are treated as unauthenticated.
      }
    }

    if (Object.keys(providerModels).length > 0) {
      availableModels[provider] = providerModels;
    }
  }

  return availableModels;
}
