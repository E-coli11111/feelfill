/** Supported language model provider identifiers. */
export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'xai'
  | 'custom';

/** Authentication methods that can select a provider-specific transport. */
export type LLMAuthMethod = 'api-key' | 'oauth';

/** Metadata and capabilities of a selectable language model. */
export interface LLMModel {
  /** Stable model identifier sent to the provider API. */
  id: string;

  /** Human-readable model name shown in settings. */
  display_name: string;

  /** Provider that supplies this model. */
  provider: LLMProvider;

  /** Authentication methods supported by this model transport. */
  auth_methods: LLMAuthMethod[];

  /** Model input capabilities relevant to FeelFill. */
  capabilities: {
    text: boolean;
    image: boolean;
    file: boolean;
    structured_output: boolean;
  };

  /** Maximum context size when known. */
  context_window?: number;

  /** Maximum output token count when known. */
  max_output_tokens?: number;

  /** Whether the model should be selectable. */
  enabled: boolean;

  /** Whether FeelFill recommends it by default. */
  recommended?: boolean;

  /** Optional explanation shown in the UI. */
  description?: string;
}

/** Models available through each provider's authenticated transports. */
export type AuthenticatedLLMModels = Partial<
  Record<LLMProvider, Partial<Record<LLMAuthMethod, LLMModel[]>>>
>;

/** Configuration used to create a language model provider. */
export interface LLMConfig {
  /** Authentication method used to access the provider. */
  auth_method: LLMAuthMethod;
  
  /** Optional base URL for a custom or provider-specific API endpoint. */
  base_url?: string;

  /** Optional API version required by the provider. */
  api_version?: string;

  /** Optional deployment name used by deployment-based providers. */
  deployment_name?: string;

  /** Optional model name to use for language model requests. */
  model_name?: string;

  /** Language model provider that handles requests. */
  provider: LLMProvider;

  /** Optional sampling temperature that controls response randomness. */
  temperature?: number;

  /** Optional maximum number of tokens generated in a response. */
  max_tokens?: number;

  /** Optional nucleus sampling threshold. */
  top_p?: number;

  /** Optional penalty applied according to token frequency. */
  frequency_penalty?: number;
  
  /** Optional penalty applied when tokens have already appeared. */
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

/** Storage contract for string values addressed by consumer-defined keys. */
export interface BaseStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
}
