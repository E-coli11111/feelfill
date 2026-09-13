import { useCallback, useMemo, useState } from 'react';

import { OpenAICodexDeviceCodeOAuth } from '@/src/services/llm/auth/oauth/openai';

export type OpenaiDeviceCodeStep = 'requesting' | 'wait' | 'success' | 'error';

/** Manages the UI state of the OpenAI device-code authorization flow. */
export function useOpenaiDeviceCode() {
  const [step, setStep] = useState<OpenaiDeviceCodeStep>('requesting');
  const [code, setCode] = useState<string | null>(null);

  const adapter = useMemo(
    () => new OpenAICodexDeviceCodeOAuth(),
    [],
  );
  const authorizeUrl = adapter.authorizeUrl;

  const authorize = useCallback(async () => {
    setStep('requesting');
    setCode(null);

    try {
      await adapter.authorize({
        onDeviceCode: (userCode) => {
          setCode(userCode);
          setStep('wait');
        },
      });
      setStep('success');
    } catch {
      setStep('error');
    }
  }, [adapter]);

  return { step, code, authorizeUrl, authorize };
}
