import { useState } from 'react';

import type { BaseAuthPanelProps } from '@/src/components/auth/types';
import { Button } from '@/src/components/ui/button';
import type { OpenAICodexOAuth } from '@/src/services/llm/auth/oauth/openai';

import { OpenaiBrowserOAuthPanel } from './browser';
import { OpenaiDeviceCodePanel } from './device';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

/** Displays the available OpenAI OAuth login flows and their active panel. */
export function OpenaiOAuthPanel({ authorizeMethod }: BaseAuthPanelProps) {
  const [view, setView] = useState<'overview' | 'browser' | 'device'>('overview');
  const adapter = authorizeMethod as OpenAICodexOAuth;

  return (
    <>
      {view === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>OpenAI</h2>
            </CardTitle>
            <CardDescription>
              通过 OpenAI OAuth 授权 FeelFill 使用模型服务。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">请选择登录方式：</p>
            <p className="text-sm text-muted-foreground">
              浏览器登录操作更直接；设备码适合无法完成浏览器回调的环境。
            </p>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button type="button" onClick={() => setView('browser')}>
              使用浏览器登录
            </Button>
            <Button type="button" onClick={() => setView('device')}>
              使用设备码授权
            </Button>
          </CardFooter>
        </Card>
      )}

      {view === 'browser' && (
        <OpenaiBrowserOAuthPanel
          adapter={adapter}
          onBack={() => setView('overview')}
        />
      )}

      {view === 'device' && (
        <OpenaiDeviceCodePanel
          adapter={adapter}
          onBack={() => setView('overview')}
        />
      )}
    </>
  );
}

export default OpenaiOAuthPanel;
