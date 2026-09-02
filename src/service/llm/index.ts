import { buildParseDocumentPrompt } from "./prompt";

export async function parseDocumentField() {
  const llmConfig = await browser.storage.local.get("llmConfig");
  const llmProvider = createLLMProvider(llmConfig.llmConfig);
  const prompt = buildParseDocumentPrompt(field);
  const response = await llmProvider.invoke(prompt);
  return response;
}