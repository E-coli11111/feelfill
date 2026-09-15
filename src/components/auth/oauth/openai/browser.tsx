import { useEffect, useRef } from 'react';

import { useOpenaiBrowserOAuth } from '@/src/components/auth/oauth/openai/hooks';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { OpenAICodexOAuth } from '@/src/services/llm/auth/oauth/openai';

interface OpenaiBrowserOAuthPanelProps {
  adapter: OpenAICodexOAuth;
  onBack: () => void;
}

/** Displays and starts the OpenAI browser authorization flow. */
export function OpenaiBrowserOAuthPanel({
  adapter,
  onBack,
}: OpenaiBrowserOAuthPanelProps) {
  const { step, authorizeUrl, authorize } = useOpenaiBrowserOAuth(adapter);
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
        <CardDescription>使用浏览器登录 OpenAI。</CardDescription>
      </CardHeader>

      <CardContent aria-live="polite">
        {step === 'opening' && <p>正在打开 OpenAI 登录页面…</p>}

        {step === 'wait' && (
          <div>
            <p>请在新打开的标签页中完成 OpenAI 登录和授权。</p>
            {authorizeUrl && (
              <a href={authorizeUrl} target="_blank" rel="noreferrer">
                未自动打开？重新打开登录页面
              </a>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              正在等待浏览器授权完成…
            </p>
          </div>
        )}

        {step === 'success' && <p role="status">OpenAI 授权成功。</p>}

        {step === 'error' && (
          <p role="alert">浏览器授权失败或已取消，请重试。</p>
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

export default OpenaiBrowserOAuthPanel;
