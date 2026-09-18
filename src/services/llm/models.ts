import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  type BaseMessage,
  type BaseMessageChunk,
} from '@langchain/core/messages';
import type { ZodType } from 'zod';

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
        const credential = await authAdapter.getCredentials();
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

/**
 * Invokes a chat model and optionally requests a schema-validated response.
 *
 * Structured output uses LangChain's provider-specific implementation. When
 * streaming is enabled, each parsed chunk is treated as a cumulative snapshot
 * and the final snapshot is validated after the stream completes.
 *
 * @param model The configured chat model.
 * @param messages Messages sent to the model.
 * @param supportsStreaming Whether plain-text responses should be streamed.
 * @param outputSchema Optional schema describing the structured response.
 * @returns JSON text for structured output, otherwise the model response text.
 */
export async function invokeModel(
  model: BaseChatModel,
  messages: BaseMessage[],
  supportsStreaming: boolean,
  outputSchema?: ZodType<Record<string, unknown>>,
): Promise<string> {
  if (outputSchema) {
    const structuredModel = model.withStructuredOutput(outputSchema, {
      method: "jsonMode",
    });
    let structuredResponse: Record<string, unknown> | undefined;
    if (!supportsStreaming) {
      structuredResponse = await structuredModel.invoke(messages);
    } else {
      const stream = await structuredModel.stream(messages);

      for await (const chunk of stream) {
        structuredResponse = chunk;
      }
    }

    if (!structuredResponse) {
      throw new Error('LLM returned an empty structured output stream');
    }

    return JSON.stringify(outputSchema.parse(structuredResponse));
  }

  let response: BaseMessageChunk | undefined;
  if (!supportsStreaming) {
    response = await model.invoke(messages);
  } else {
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      response = response ? response.concat(chunk) : chunk;
    }

    if (!response) {
      throw new Error('LLM returned an empty stream');
    }
  }

  return response.text;
}
