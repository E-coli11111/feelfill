import {
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

import type {
  ParsedInputFieldResult,
  FilledInputFieldResult,
} from "@/src/services/llm/types";

import type { Base64File } from '@/src/types';

import { fileAsBase64 } from "@/src/utils/encode-utils";
import { buildParseDocumentPrompt, buildParseHtmlPrompt } from "./prompt";
import { createAuthenticatedLLMProvider } from "./provider";
import { getStorage } from './storage';
import { invokeModel } from './models';
import {
  filledInputFieldResultSchema,
  parsedInputFieldResultSchema,
} from './schemas';

const storage = getStorage();

export { listModels } from './models';

/**
 * Uses LLM to identify fillable fields in webpage HTML.
 *
 * @param html The webpage HTML snapshot to analyze.
 * @returns The message returned by the language model.
 */
export async function parseHTMLField(html: string): Promise<ParsedInputFieldResult> {
  const llmConfig = await storage.getLLMConfig();
  if (!llmConfig) {
    throw new Error('LLM configuration is not set');
  }

  const llmProvider = await createAuthenticatedLLMProvider(llmConfig);
  const prompt = buildParseHtmlPrompt(html);
  console.log('LLM prompt for parseHTMLField:', prompt);
  try {
    const response = await invokeModel(
      llmProvider,
      [new SystemMessage(prompt)],
      llmConfig.model?.capabilities.stream === true,
      parsedInputFieldResultSchema,
    );
    return parsedInputFieldResultSchema.parse(JSON.parse(response));
  }catch (error) {
    console.error('Error invoking LLM provider for parseHTMLField:', error);
    throw error;
  }
}

/**
 * Uses LLM to extract requested webpage field values from a document.
 *
 * @param field Definitions of the webpage fields to extract from the document.
 * @param files The user-provided documents or images to analyze. (base64 encoded)
 * @returns The message returned by the language model.
 * @throws If the configured provider does not support document parsing.
 */
export async function parseDocumentField(field: ParsedInputFieldResult, files: Base64File[]): Promise<FilledInputFieldResult> {
  const llmConfig = await storage.getLLMConfig();
  if (!llmConfig) {
    throw new Error('LLM configuration is not set');
  }

  if (llmConfig.provider !== "openai") {
    throw new Error(`Unsupported LLM provider: ${llmConfig.provider} (only "openai" is supported for document parsing yet)`);
  }

  const llmProvider = await createAuthenticatedLLMProvider(llmConfig);
  const prompt = buildParseDocumentPrompt(field);
  console.log("files:", files);
  // Handle file input
  const attachments = [];
  for (const file of files) {
    const mimeType = file.type || "application/octet-stream";
    const attachmentType = mimeType.startsWith("image/") ? "image" as const : "file" as const;

    const attachment = {
      type: attachmentType,
      data: file.content,
      mimeType,
      metadata: { filename: file.name },
    };
    attachments.push(attachment);
  }

  const response = await invokeModel(
    llmProvider,
    [
      new SystemMessage(prompt),
      new HumanMessage({
        contentBlocks: [
          {
            type: "text",
            text: "以下是用户提供的文档，请根据提示提取指定字段：",
          },
          ...attachments
        ]
      }),
    ],
    llmConfig.model?.capabilities.stream === true,
    filledInputFieldResultSchema,
  );

  return filledInputFieldResultSchema.parse(JSON.parse(response));
}
