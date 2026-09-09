import { useEffect, useState } from 'react';

interface SwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  text?: string;
}

export default function Switch(props: SwitchProps) {

  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.enabled}
      aria-label={props.text ?? '开关'}
      className="inline-flex cursor-pointer items-center gap-[8px] border-0 bg-transparent p-0"
      onClick={() => {
        const newEnabled = !props.enabled;
        props.onChange(newEnabled);
      }}
    >
      {props.text && <span className="text-[14px] text-slate-700">{props.text}</span>}
      <span
        aria-hidden="true"
        className={`relative inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-full transition-colors ${
          props.enabled ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${
            props.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
    </button>
  );
}
