import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogle } from "@langchain/google";
import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatXAI } from "@langchain/xai";

import type { LLMConfig } from "@/src/types/llm";
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
): BaseChatModel {
  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({
        model: config.model_name,
        apiKey: config.api_key,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
        useResponsesApi: true
      });
    case "openai-codex":
      return createOpenAICodexChatModel(config);
    case "anthropic":
      return new ChatAnthropic({
        model: config.model_name,
        anthropicApiKey: config.api_key,
        anthropicApiUrl: config.base_url,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
      });
    case "google":
      return new ChatGoogle({
        model: config.model_name ?? "gemini-3.7-flash",
        apiKey: config.api_key,
        endpoint: config.base_url,
        temperature: config.temperature,
        maxOutputTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
      });
    case "openrouter":
      return new ChatOpenRouter({
        model: config.model_name,
        apiKey: config.api_key,
        baseURL: config.base_url,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        topP: config.top_p,
        frequencyPenalty: config.frequency_penalty,
        presencePenalty: config.presence_penalty,
      });
    case "xai":
      return new ChatXAI({
        model: config.model_name,
        apiKey: config.api_key,
        baseURL: config.base_url,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
      });
    case "custom":
      return new ChatOpenAI({
        model: config.model_name,
        apiKey: config.api_key,
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
