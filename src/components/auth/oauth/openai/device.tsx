

import { useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

import { useOpenaiDeviceCode } from '@/src/components/auth/oauth/openai/hooks';

interface OpenaiDeviceCodePanelProps {
  onBack: () => void;
}

/** Displays and starts the OpenAI device-code authorization flow. */
export function OpenaiDeviceCodePanel({ onBack }: OpenaiDeviceCodePanelProps) {
  const { step, code, authorize, authorizeUrl } = useOpenaiDeviceCode();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void authorize();
  }, [authorize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>OpenAI OAuth</h2>
        </CardTitle>
        <CardDescription>使用设备码登录 OpenAI。</CardDescription>
      </CardHeader>

      <CardContent aria-live="polite">
        {step === 'requesting' && <p>正在获取设备码…</p>}

        {step === 'wait' && (
          <div>
            <p>请打开 OpenAI 授权页面并输入以下设备码：</p>
            <p aria-label="设备码" className="my-4 font-mono text-xl">{code}</p>
            <a href={authorizeUrl} target="_blank" rel="noreferrer">
              打开 OpenAI 授权页面
            </a>
            <p className="mt-3 text-sm text-muted-foreground">正在等待授权完成…</p>
          </div>
        )}

        {step === 'success' && (
          <p role="status">OpenAI 授权成功。</p>
        )}

        {step === 'error' && (
          <p role="alert">授权失败，请重试。</p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          返回
        </Button>
        {step === 'error' && (
          <Button type="button" onClick={() => void authorize()}>
            重试
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default OpenaiDeviceCodePanel;
