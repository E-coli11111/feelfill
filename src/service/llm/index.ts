import { HumanMessage, SystemMessage } from "@langchain/core/messages";


import type { ParsedInputFieldResult } from "@/src/types/document";
import type { LLMConfig, LLMProvider } from "@/src/types/llm";
import { fileAsBase64 } from "@/src/utils/file_utils";
import { buildParseDocumentPrompt, buildParseHtmlPrompt } from "./prompt";
import { createLLMProvider } from "./provider";

/**
 * Uses LLM to identify fillable fields in webpage HTML.
 *
 * @param html The webpage HTML snapshot to analyze.
 * @returns The message returned by the language model.
 */
export async function parseHTMLField(html: string) {
  const stored = await browser.storage.local.get("llmConfig");
  const llmConfig = stored.llmConfig as LLMConfig;

  const llmProvider = createLLMProvider(llmConfig);
  const prompt = buildParseHtmlPrompt(html);
  const response = await llmProvider.invoke([
    new SystemMessage(prompt),
  ]);
  return response;
}

/**
 * Uses LLM to extract requested webpage field values from a document.
 *
 * @param field Definitions of the webpage fields to extract from the document.
 * @param files The user-provided documents or images to analyze.
 * @returns The message returned by the language model.
 * @throws If the configured provider does not support document parsing.
 */
export async function parseDocumentField(field: ParsedInputFieldResult, files: File[]) {
  const stored = await browser.storage.local.get("llmConfig");
  const llmConfig = stored.llmConfig as LLMConfig;

  if (llmConfig.provider !== "openai") {
    throw new Error(`Unsupported LLM provider: ${llmConfig.provider} (only "openai" is supported for document parsing yet)`);
  }

  const llmProvider = createLLMProvider(llmConfig);
  const prompt = buildParseDocumentPrompt(field);

  // Handle file input
  const attachments = [];
  for (const file of files) {
    const base64File = await fileAsBase64(file);
    const mimeType = file.type || "application/octet-stream";
    const attachmentType = mimeType.startsWith("image/") ? "image" as const : "file" as const;

    const attachment = {
      type: attachmentType,
      data: base64File,
      mimeType,
      metadata: { filename: file.name },
    };
    attachments.push(attachment);
  }

  // TODO: Structure output
  const response = await llmProvider.invoke([
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
  ]);
  return response;
}
