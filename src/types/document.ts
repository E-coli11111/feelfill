export interface InputField {
  type: string;
  required: boolean;
  description?: string;
}

export interface FilledInputField {
  value: string;
  found: boolean;
  evidence: string;
}

export interface ParsedInputFieldResult {
  field: Record<string, InputField>;
}

export interface FilledInputFieldResult {
  field: Record<string, FilledInputField>;
}