import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import type { LLMConfig } from "@/src/types/llm";

const DEFAULT_CODEX_BASE_URL = "https://chatgpt.com/backend-api";
const OPENAI_AUTH_CLAIM = "https://api.openai.com/auth";

const codexJwtPayloadSchema = z.object({
  [OPENAI_AUTH_CLAIM]: z.object({
    chatgpt_account_id: z.string().min(1),
  }),
});

/**
 * Extracts the ChatGPT account ID embedded in a Codex OAuth access token.
 *
 * @param accessToken A JWT access token issued by the OpenAI Codex OAuth flow.
 * @returns The ChatGPT account ID required by the Codex backend.
 * @throws If the token is not a valid JWT or does not contain the required claim.
 */
export function extractCodexAccountId(accessToken: string): string {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT");
    }

    const encodedPayload = parts[1];
    if (!encodedPayload) {
      throw new Error("Missing JWT payload");
    }

    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = codexJwtPayloadSchema.parse(JSON.parse(atob(paddedBase64)));
    return payload[OPENAI_AUTH_CLAIM].chatgpt_account_id;
  } catch {
    throw new Error("OpenAI Codex access token is invalid or missing the ChatGPT account ID");
  }
}

/**
 * Resolves a configured Codex base URL to the prefix expected by the OpenAI SDK.
 *
 * The SDK appends `/responses`, so this function returns a URL ending in `/codex`.
 *
 * @param baseUrl An optional backend API root or Codex Responses endpoint.
 * @returns A normalized URL ending in `/codex`.
 */
export function resolveCodexBaseUrl(baseUrl?: string): string {
  const normalized = (baseUrl?.trim() || DEFAULT_CODEX_BASE_URL).replace(/\/+$/, "");

  if (normalized.endsWith("/codex/responses")) {
    return normalized.slice(0, -"/responses".length);
  }
  if (normalized.endsWith("/codex")) {
    return normalized;
  }
  return `${normalized}/codex`;
}

/**
 * Creates a LangChain chat model backed by the ChatGPT Codex Responses endpoint.
 *
 * `config.api_key` must contain a Codex OAuth access token, not an OpenAI Platform
 * API key. Token acquisition and refresh are intentionally handled separately.
 *
 * @param config Codex model, OAuth token, and generation settings.
 * @returns A LangChain chat model configured for the Codex Responses endpoint.
 * @throws If the model name or OAuth access token is missing or invalid.
 */
export function createOpenAICodexChatModel(config: LLMConfig): BaseChatModel {
  if (!config.api_key) {
    throw new Error("OpenAI Codex requires an OAuth access token");
  }
  if (!config.model_name) {
    throw new Error("OpenAI Codex requires a model name");
  }

  const accountId = extractCodexAccountId(config.api_key);

  return new ChatOpenAI({
    model: config.model_name,
    apiKey: config.api_key,
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    topP: config.top_p,
    frequencyPenalty: config.frequency_penalty,
    presencePenalty: config.presence_penalty,
    useResponsesApi: true,
    zdrEnabled: true,
    modelKwargs: {
      include: ["reasoning.encrypted_content"],
    },
    configuration: {
      baseURL: resolveCodexBaseUrl(config.base_url),
      defaultHeaders: {
        "chatgpt-account-id": accountId,
        "OpenAI-Beta": "responses=experimental",
        originator: "feelfill",
      },
    },
  });
}
