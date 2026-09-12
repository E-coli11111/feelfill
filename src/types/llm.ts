export type LLMProvider =
  | 'openai'
  | 'openai-codex'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'xai'
  | 'custom';

export interface LLMConfig {
  base_url?: string;
  api_key?: string;
  api_version?: string;
  deployment_name?: string;
  model_name?: string;
  provider: LLMProvider;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}


