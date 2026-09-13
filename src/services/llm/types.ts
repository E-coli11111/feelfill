/** Supported language model provider identifiers. */
export type LLMProvider =
  | 'openai'
  | 'openai-codex'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'xai'
  | 'custom';

/** Configuration used to create a language model provider. */
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

/** Description of a fillable field identified in webpage HTML. */
export interface InputField {
  type: string;
  required: boolean;
  description?: string;
}

/** Value extracted from a document for a fillable webpage field. */
export interface FilledInputField {
  value: string;
  found: boolean;
  evidence: string;
}

/** Collection of fillable fields identified in webpage HTML. */
export interface ParsedInputFieldResult {
  field: Record<string, InputField>;
}

/** Collection of document values extracted for fillable webpage fields. */
export interface FilledInputFieldResult {
  field: Record<string, FilledInputField>;
}

/** Storage contract for serialized provider authentication credentials. */
export interface BaseStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
}

