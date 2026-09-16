import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogle } from "@langchain/google";
import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatXAI } from "@langchain/xai";

import type { LLMConfig } from "@/src/services/llm/types";
import { getProviderAuthMethod } from "@/src/services/llm/registry";
import { createOpenAICodexChatModel } from "./openai-codex";

/**
 * Creates a LangChain chat model for the configured language model provider.
 *
 * @param config Provider credentials and generation settings.
 * @returns A chat model configured for the selected provider.
 * @throws If the selected provider is unsupported.
 */
export function createLLMProvider(
  config: LLMConfig,
  credential: string,
): BaseChatModel {
  if (config.provider === "openai" && config.auth_method === "oauth") {
    return createOpenAICodexChatModel(config, credential);
  }

  if (config.auth_method !== "api-key") {
    throw new Error(
      `Unsupported authentication method for LLM provider: ${config.provider}/${config.auth_method}`,
    );
  }

  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({
        model: config.model?.id,
        apiKey: credential,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
        useResponsesApi: true
      });
    case "anthropic":
      return new ChatAnthropic({
        model: config.model?.id,
        anthropicApiKey: credential,
        anthropicApiUrl: config.base_url,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
      });
    case "google":
      return new ChatGoogle({
        model: config.model?.id ?? "gemini-3.7-flash",
        apiKey: credential,
        endpoint: config.base_url,
        temperature: config.temperature,
        maxOutputTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
      });
    case "openrouter":
      return new ChatOpenRouter({
        model: config.model?.id,
        apiKey: credential,
        baseURL: config.base_url,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
      });
    case "xai":
      return new ChatXAI({
        model: config.model?.id,
        apiKey: credential,
        baseURL: config.base_url,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
      });
    case "custom":
      return new ChatOpenAI({
        model: config.model?.id,
        apiKey: credential,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
        configuration: config.base_url
          ? { baseURL: config.base_url }
          : undefined,
      });
    default:
      throw new Error(`Unsupported LLM provider: ${String(config.provider)}`);
  }
}

/**
 * Resolves the configured provider's credential through its auth adapter and
 * creates a ready-to-use LangChain chat model.
 *
 * @param config Provider and generation settings stored by the extension.
 * @returns A provider client configured with the separately stored credential.
 * @throws If no usable credential has been configured for the provider.
 */
export async function createAuthenticatedLLMProvider(
  config: LLMConfig,
): Promise<BaseChatModel> {
  const authMethod = getProviderAuthMethod(config.provider, config.auth_method);
  if (!authMethod) {
    throw new Error(
      `Unsupported authentication method for LLM provider: ${config.provider}/${config.auth_method}`,
    );
  }
  const credential = await authMethod.getCredentials();

  if (!credential) {
    throw new Error(
      `No credentials configured for LLM provider: ${config.provider}/${config.auth_method}`,
    );
  }

  return createLLMProvider(config, credential);
}
