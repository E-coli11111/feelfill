import { useState } from 'react';

import type { BaseAuthPanelProps } from '@/src/components/auth/types';

import { OpenaiDeviceCodePanel } from './device';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

/** Props accepted by the OpenAI OAuth authentication panel. */
export interface OpenaiOAuthPanelProps extends BaseAuthPanelProps {
  onBack?: () => void;
}

export function OpenaiOAuthPanel(_props: OpenaiOAuthPanelProps) {
  const [view, setView] = useState<'overview' | 'device'>('overview');

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
          <CardContent>
            <p className="text-sm">授权方式：设备码</p>
          </CardContent>
          <CardFooter>
            <Button type="button" onClick={() => setView('device')}>
              使用设备码授权
            </Button>
          </CardFooter>
        </Card>
      )}

      {view === 'device' && (
        <OpenaiDeviceCodePanel onBack={() => setView('overview')} />
      )}
    </>
  );
}

export default OpenaiOAuthPanel;
