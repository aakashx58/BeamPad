'use client';

import { copyText } from '../lib/clipboard';
import { MAX_CHARS } from '../lib/pad';
import { useDialog } from './dialog';
import { useToast } from './toast';
import { Button } from './ui/button';

type Props = {
  text: string;
  loaded: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
};

export function Editor({ text, loaded, inputRef, onChange }: Props) {
  const dialog = useDialog();
  const toast = useToast();

  const copy = async () => {
    await copyText(text);
    toast('Copied');
  };

  const clear = async () => {
    const ok = await dialog.confirm({
      title: 'Clear the text?',
      message: 'This removes it on every device. It can’t be undone.',
      confirmText: 'Clear',
      danger: true,
    });
    if (!ok) return;
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card">
      <textarea
        ref={inputRef}
        value={text}
        onChange={e => onChange(e.target.value)}
        readOnly={!loaded}
        maxLength={MAX_CHARS}
        placeholder={loaded ? 'Type or paste anything — it syncs automatically…' : 'Loading…'}
        aria-label="Shared text"
        autoFocus
        className="min-h-48 w-full flex-1 resize-none bg-transparent p-1 outline-none placeholder:text-slate-500"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <span className="text-xs text-slate-500">{text.length.toLocaleString()} characters</span>
        <div className="flex gap-2">
          <Button onClick={copy} disabled={!text}>Copy</Button>
          <Button variant="danger-outline" onClick={clear} disabled={!text}>Clear</Button>
        </div>
      </div>
    </div>
  );
}
