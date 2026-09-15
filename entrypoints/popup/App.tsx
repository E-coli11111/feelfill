import { CircleAlert, FileText, Settings2, Sparkles } from 'lucide-react';

import Uploader from '@/src/components/uploader';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Switch } from '@/src/components/ui/switch';

import { usePopup } from './hooks';

export default function App() {
  const {
    enabled,
    error,
    file,
    loading,
    openingSettings,
    saving,
    status,
    openSettings,
    selectFile,
    toggleEnabled,
  } = usePopup();

  return (
    <main className="w-full p-4">
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle>FeelFill</CardTitle>
              <CardDescription className="mt-1">让填写更轻松</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 py-5">
          <section aria-label="扩展开关" className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium leading-none">开启 FeelFill</span>
              <Switch
                checked={enabled}
                disabled={loading || saving}
                aria-label="开启 FeelFill"
                onCheckedChange={(next) => void toggleEnabled(next)}
              />
            </div>
            <p role="status" className="mt-2 text-xs text-muted-foreground">{status}</p>
          </section>

          {enabled && (
            <section aria-label="上传文件" className="space-y-3">
              <Uploader
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                text={file ? '重新选择文件' : '点击上传文件'}
                onChange={selectFile}
              />
              <p className="text-center text-xs text-muted-foreground">支持 PDF、Word、JPG、PNG</p>
              {file && (
                <div role="status" className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                  <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-all">已选择：{file.name}</span>
                </div>
              )}
            </section>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t py-3">
          <Button
            type="button"
            variant="ghost"
            disabled={openingSettings}
            onClick={() => void openSettings()}
            className="w-full"
          >
            <Settings2 aria-hidden="true" className="size-4" />
            {openingSettings ? '正在打开…' : '打开设置'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

