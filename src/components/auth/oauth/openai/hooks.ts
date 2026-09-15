import { useCallback, useState } from 'react';

import type { OpenAICodexOAuth } from '@/src/services/llm/auth/oauth/openai';

type OpenaiDeviceCodeStep = 'requesting' | 'wait' | 'success' | 'error';
type OpenaiBrowserStep = 'opening' | 'wait' | 'success' | 'error';

/** Manages the UI state of the OpenAI device-code authorization flow. */
export function useOpenaiDeviceCode(adapter: OpenAICodexOAuth) {
  const [step, setStep] = useState<OpenaiDeviceCodeStep>('requesting');
  const [code, setCode] = useState<string | null>(null);

  const authorizeUrl = adapter.authorizeUrl;

  const authorize = useCallback(async () => {
    setStep('requesting');
    setCode(null);

    try {
      await adapter.authorize({
        method: 'device-code',
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

/** Manages the UI state of the OpenAI browser authorization flow. */
export function useOpenaiBrowserOAuth(adapter: OpenAICodexOAuth) {
  const [step, setStep] = useState<OpenaiBrowserStep>('opening');
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);

  const authorize = useCallback(async () => {
    setStep('opening');
    setAuthorizeUrl(null);

    try {
      await adapter.authorize({
        method: 'browser',
        onAuthorizeUrl: (url) => {
          setAuthorizeUrl(url);
          setStep('wait');
        },
      });
      setStep('success');
    } catch {
      setStep('error');
    }
  }, [adapter]);

  return { step, authorizeUrl, authorize };
}
