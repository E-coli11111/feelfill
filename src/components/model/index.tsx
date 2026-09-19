import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  AUTH_KIND_LABELS,
  PROVIDER_LABELS,
} from '@/src/components/auth/constants';
import type { LLMAuthMethod, LLMProvider } from '@/src/services/llm/types';

import { useModelSettings } from './hooks';
import type { ModelPanelProps } from './types';

const selectClassName = 'h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none transition-colors hover:border-ring/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

/** Displays authenticated model choices and persists the active model. */
export function ModelPanel({ onRequestAuthentication }: ModelPanelProps) {
  const {
    availableModels,
    selection,
    status,
    error,
    selectProvider,
    selectAuthMethod,
    selectModel,
    reload,
    save,
  } = useModelSettings();

  if (status === 'loading') {
    return (
      <Card aria-label="正在加载模型设置">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (status === 'error' && !selection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>无法加载模型</CardTitle>
          <CardDescription role="alert" className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" variant="outline" onClick={() => void reload()}>
            重试
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!selection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>暂无可用模型</CardTitle>
          <CardDescription>
            请先登录模型服务，登录成功后才能选择对应模型。
          </CardDescription>
        </CardHeader>
        {onRequestAuthentication && (
          <CardFooter>
            <Button type="button" onClick={onRequestAuthentication}>
              前往鉴权
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  const providers = Object.keys(availableModels) as LLMProvider[];
  const methods = Object.keys(
    availableModels[selection.provider] ?? {},
  ) as LLMAuthMethod[];
  const models = availableModels[selection.provider]?.[selection.auth_method] ?? [];
  const selectedModel = models.find((model) => model.id === selection.model.id);
  const disabled = status === 'saving';

  return (
    <Card>
      <CardHeader>
        <CardTitle>默认模型</CardTitle>
        <CardDescription>
          选择用于网页字段识别和文档内容提取的模型。
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 xl:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          服务商
          <select
            aria-label="服务商"
            className={selectClassName}
            value={selection.provider}
            disabled={disabled}
            onChange={(event) => selectProvider(event.target.value as LLMProvider)}
          >
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {PROVIDER_LABELS[provider]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          登录方式
          <select
            aria-label="登录方式"
            className={selectClassName}
            value={selection.auth_method}
            disabled={disabled}
            onChange={(event) => selectAuthMethod(event.target.value as LLMAuthMethod)}
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {AUTH_KIND_LABELS[method]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          模型
          <select
            aria-label="模型"
            className={selectClassName}
            value={selection.model.id}
            disabled={disabled}
            onChange={(event) => selectModel(event.target.value)}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.display_name}{model.recommended ? '（推荐）' : ''}
              </option>
            ))}
          </select>
        </label>

        {selectedModel?.description && (
          <p className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground xl:col-span-3">
            {selectedModel.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex-wrap gap-3">
        <Button
          type="button"
          disabled={disabled}
          onClick={() => void save()}
        >
          {disabled ? '正在保存…' : '保存模型设置'}
        </Button>
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-success'}`}
        >
          {status === 'saved' ? '模型设置已保存。' : error}
        </p>
      </CardFooter>
    </Card>
  );
}

export default ModelPanel;
