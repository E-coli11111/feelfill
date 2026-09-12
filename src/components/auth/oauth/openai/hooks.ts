import { useCallback, useMemo, useState } from 'react';

import { OpenAICodexDeviceCodeOAuthAdapter } from '@/src/services/llm/auth/oauth/openai';

export type OpenaiDeviceCodeStep = 'requesting' | 'wait' | 'success' | 'error';

/** Manages the UI state of the OpenAI device-code authorization flow. */
export function useOpenaiDeviceCode() {
  const [step, setStep] = useState<OpenaiDeviceCodeStep>('requesting');
  const [code, setCode] = useState<string | null>(null);

  const adapter = useMemo(
    () => new OpenAICodexDeviceCodeOAuthAdapter(),
    [],
  );
  const authorizeUrl = adapter.authorizeUrl;

  const authorize = useCallback(async () => {
    setStep('requesting');
    setCode(null);

    try {
      const result = await adapter.fetchDeviceCode();
      setCode(result.user_code);
      setStep('wait');

      await adapter.authorize(result);
      setStep('success');
    } catch {
      setStep('error');
    }
  }, [adapter]);

  return { step, code, authorizeUrl, authorize };
}
