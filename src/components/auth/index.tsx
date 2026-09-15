import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { SUPPORTED_AUTH_METHODS } from '@/src/services/llm/registry';
import type { AuthMethodRegistry } from '@/src/services/llm/auth/types';
import type { LLMProvider } from '@/src/services/llm/types';

import {
  AUTH_KIND_LABELS,
  PROVIDER_LABELS,
  STATUS_LABELS,
  SUPPORTED_AUTH_PANELS,
} from './constants';
import type {
  AuthKind,
  AuthPanelGroup,
  AuthPanelRegistry,
  AuthStatus,
  RegisteredAuthPanel,
} from './types';

function getRegisteredAuthPanels(): RegisteredAuthPanel[] {
  const panelRegistry: AuthPanelRegistry = SUPPORTED_AUTH_PANELS;
  const methodRegistry: AuthMethodRegistry = SUPPORTED_AUTH_METHODS;

  return (Object.keys(panelRegistry) as AuthKind[]).flatMap((kind) => {
    const panels: AuthPanelGroup = panelRegistry[kind];
    const methods = methodRegistry[kind];

    return (Object.keys(panels) as LLMProvider[]).flatMap((provider) => {
      const Panel = panels[provider];
      const authorizeMethod = methods[provider];

      if (!Panel) {
        return [];
      }

      return [{
        id: `${kind}:${provider}`,
        kind,
        provider,
        Panel,
        authorizeMethod,
      }];
    });
  });
}

/** Displays registered login methods and opens their provider-specific panels. */
export function AuthPanel() {
  const panels = useMemo(getRegisteredAuthPanels, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AuthStatus>>(() =>
    Object.fromEntries(panels.map(({ id }) => [id, 'loading'])),
  );

  const refreshStatuses = useCallback(async () => {
    setStatuses(Object.fromEntries(panels.map(({ id }) => [id, 'loading'])));

    const results = await Promise.all(
      panels.map(async ({ id, authorizeMethod }) => {
        if (!authorizeMethod) {
          return [id, 'unavailable'] as const;
        }

        try {
          const credential = await authorizeMethod.getCredentials();
          return [id, credential ? 'authenticated' : 'unauthenticated'] as const;
        } catch {
          return [id, 'error'] as const;
        }
      }),
    );

    setStatuses(Object.fromEntries(results));
  }, [panels]);

  useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);

  const selected = panels.find(({ id }) => id === selectedId);

  if (selected?.authorizeMethod) {
    const { Panel, provider, authorizeMethod } = selected;

    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelectedId(null);
            void refreshStatuses();
          }}
        >
          返回登录方式
        </Button>
        <Panel provider={provider} authorizeMethod={authorizeMethod} />
      </div>
    );
  }

  if (panels.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无可用的登录方式。</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {panels.map(({ id, kind, provider }) => {
        const status = statuses[id] ?? 'loading';

        return (
          <Card key={id}>
            <CardHeader>
              <CardTitle>
                <h2>{PROVIDER_LABELS[provider]}</h2>
              </CardTitle>
              <CardDescription>{AUTH_KIND_LABELS[kind]}</CardDescription>
            </CardHeader>
            <CardContent>
              <p role="status" className="text-sm">
                {STATUS_LABELS[status]}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                disabled={status === 'loading' || status === 'unavailable'}
                onClick={() => setSelectedId(id)}
              >
                {status === 'authenticated'
                  ? '重新登录'
                  : status === 'unavailable'
                    ? '不可用'
                    : '登录'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export default AuthPanel;
