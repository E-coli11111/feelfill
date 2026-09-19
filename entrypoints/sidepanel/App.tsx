import {
  ChevronDown,
  CircleAlert,
  FileText,
  LoaderCircle,
  Settings2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Collapsible } from 'radix-ui';

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
import { Textarea } from '@/src/components/ui/textarea';

import { useSidepanel } from './hooks';

export default function App() {
  const {
    enabled,
    error,
    files,
    loading,
    openingSettings,
    processing,
    saving,
    status,
    userInstruction,
    openSettings,
    processFiles,
    selectFile,
    setUserInstruction,
    toggleEnabled,
  } = useSidepanel();

  return (
    <main className="mx-auto w-full max-w-lg p-3 sm:p-5">
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b bg-muted/40 px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-xl tracking-tight">FeelFill</CardTitle>
              <CardDescription className="mt-1">让填写更轻松</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-5 py-5">
          <section aria-label="扩展开关" className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium leading-none">开启 FeelFill</span>
              <Switch
                checked={enabled}
                disabled={loading || saving || processing}
                aria-label="开启 FeelFill"
                onCheckedChange={(next) => void toggleEnabled(next)}
              />
            </div>
            <p role="status" className="mt-2 text-xs text-muted-foreground">{status}</p>
          </section>

          {enabled && (
            <section aria-label="上传文件" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">从文档到表单</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">添加文件，让 FeelFill 帮你完成当前页面的填写。</p>
              </div>
              <Collapsible.Root className="overflow-hidden rounded-lg border border-border bg-muted/40 transition-[border-color,box-shadow] focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
                <Collapsible.Trigger asChild>
                  <Button type="button" variant="ghost" aria-label="自定义要求" className="group h-11! w-full justify-between! rounded-none px-3.5! text-sm font-medium focus-visible:ring-inset">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal aria-hidden="true" className="size-3.5 text-primary/70" />
                    自定义要求
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-normal leading-4 text-muted-foreground">{userInstruction.trim() ? '已添加' : '可选'}</span>
                    <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </span>
                  </Button>
                </Collapsible.Trigger>
                <Collapsible.Content>
                <label htmlFor="user-instruction" className="sr-only">自定义要求</label>
                <Textarea
                  id="user-instruction"
                  aria-describedby="instruction-help"
                  className="block min-h-24 resize-y rounded-none border-0! px-3.5! py-3! text-sm! leading-relaxed shadow-none! placeholder:text-muted-foreground/70 focus-visible:ring-0!"
                  value={userInstruction}
                  disabled={processing}
                  placeholder="例如：优先使用护照上的英文姓名"
                  onChange={(event) => setUserInstruction(event.target.value)}
                />
                <p id="instruction-help" className="px-3.5 pb-3 text-[11px] leading-relaxed text-muted-foreground">
                  可选，将作为本次文档解析的补充要求。
                </p>
                </Collapsible.Content>
              </Collapsible.Root>
              <Uploader
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={processing}
                text={files && files.length > 0 ? '重新选择文件' : '点击上传文件'}
                onChange={selectFile}
              />
              <p className="text-center text-xs text-muted-foreground">支持 PDF、Word、JPG、PNG</p>
              {files && files.length > 0 && (
                <>
                  <div role="status" className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                    <FileText aria-hidden="true" className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 space-y-1">
                      {files.map((file) => (
                        <p key={file.name} className="break-all">已选择：{file.name}</p>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    disabled={processing}
                    className="w-full"
                    size="lg"
                    onClick={() => void processFiles()}
                  >
                    {processing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
                    {processing ? '正在解析并填充…' : '解析并填充'}
                  </Button>
                </>
              )}
            </section>
          )}

          {!enabled && !loading && (
            <div className="space-y-3 px-2 py-6 text-center">
              <FileText aria-hidden="true" className="mx-auto size-8 text-primary/60" />
              <h2 className="text-base font-semibold">少一点重复，多一点轻松</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">开启 FeelFill，上传文档，即可提取信息并填写网页表单。</p>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/30 px-5 py-3">
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
