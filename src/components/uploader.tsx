import { UploadCloud } from 'lucide-react';
import { Card } from '@/src/components/ui/card';

interface UploaderProps {
  accept?: string;
  disabled?: boolean;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  text?: string;
}

export default function Uploader({
  accept,
  disabled = false,
  multiple = false,
  onChange,
  text = '选择文件',
}: UploaderProps) {
  return (
    <Card className="gap-0 overflow-hidden border-dashed py-0 shadow-none">
      <label
        className={`group flex min-h-[156px] w-full flex-col items-center justify-center gap-2 px-5 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring/40 ${
          disabled
            ? 'cursor-not-allowed bg-muted/50 text-muted-foreground'
            : 'cursor-pointer bg-card text-muted-foreground hover:bg-accent/50'
        }`}
      >
        <input
          type="file"
          aria-label={text}
          accept={accept}
          disabled={disabled}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            onChange(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = '';
          }}
        />
        <span className="flex size-10 items-center justify-center rounded-lg border bg-background shadow-xs">
          <UploadCloud aria-hidden="true" className="size-5 text-primary" />
        </span>
        <span className="text-sm font-medium text-foreground group-hover:text-primary">{text}</span>
        <span className="text-xs text-muted-foreground">
          {multiple ? '可选择多个文件' : '仅可选择一个文件'}
        </span>
      </label>
    </Card>
  );
}
