import { describe, expect, it } from 'vitest';

import { SUPPORTED_MODELS } from '@/src/services/llm/registry';

describe('SUPPORTED_MODELS', () => {
  it('registers the current OpenAI general-purpose model family', () => {
    expect(SUPPORTED_MODELS.openai.map(({ id }) => id)).toEqual([
      'gpt-6-astra',
      'gpt-5.6-sol',
      'gpt-5.6-terra',
      'gpt-5.6-luna',
    ]);
  });

  it('marks every registered OpenAI model as usable for FeelFill inputs', () => {
    for (const model of SUPPORTED_MODELS.openai) {
      expect(model).toMatchObject({
        enabled: true,
        capabilities: {
          text: true,
          image: true,
          file: true,
          structured_output: true,
        },
      });
    }
    expect(SUPPORTED_MODELS.openai.filter(({ recommended }) => recommended)).toHaveLength(1);
  });
});
