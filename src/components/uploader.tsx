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
    <label
      className={`group flex min-h-[156px] w-full flex-col items-center justify-center gap-[8px] rounded-[16px] border border-dashed px-[20px] py-[24px] text-center transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
          : 'cursor-pointer border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50/50'
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

      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="h-[32px] w-[32px] stroke-current text-slate-400 transition-colors group-hover:text-blue-500"
      >
        <path
          d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="text-[14px] font-medium text-slate-700 group-hover:text-blue-600">{text}</span>
      <span className="text-[12px] text-slate-400">
        {multiple ? '可选择多个文件' : '仅可选择一个文件'}
      </span>
    </label>
  );
}
