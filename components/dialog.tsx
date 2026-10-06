'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type DialogService = { confirm: (options: ConfirmOptions) => Promise<boolean> };

const DialogContext = createContext<DialogService | null>(null);

/** Usage: `const dialog = useDialog(); if (await dialog.confirm({ title: 'Sure?' })) { … }` */
export function useDialog(): DialogService {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}

/** Renders one native <dialog> for the whole app (Esc, focus trap and backdrop for free). */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((ok: boolean) => void) | undefined>(undefined);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  // Resolve the pending promise exactly once, then close.
  const settle = useCallback((ok: boolean) => {
    const resolve = resolver.current;
    resolver.current = undefined;
    resolve?.(ok);
    ref.current?.close();
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false); // a new prompt cancels one that's still open
    setOptions(next);
    return new Promise<boolean>(resolve => { resolver.current = resolve; });
  }, []);

  // Open after the new content has rendered.
  useEffect(() => {
    if (options && ref.current && !ref.current.open) ref.current.showModal();
  }, [options]);

  const service = useMemo(() => ({ confirm }), [confirm]);
  const danger = options?.danger;

  return (
    <DialogContext.Provider value={service}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby="dialog-title"
        aria-describedby={options?.message ? 'dialog-message' : undefined}
        onClose={() => settle(false)} // Esc or any other close counts as cancel
        onClick={e => e.target === e.currentTarget && settle(false)} // backdrop click
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-6">
          {danger && (
            <div className="mb-4 grid size-10 place-items-center rounded-full bg-red-50 text-red-600" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>
          )}
          <h2 id="dialog-title" className="text-base font-semibold">{options?.title}</h2>
          {options?.message && <p id="dialog-message" className="mt-1 text-sm text-slate-500">{options.message}</p>}

          {/* Cancel comes first so showModal() focuses it — Enter never confirms by accident. */}
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => settle(false)}>{options?.cancelText ?? 'Cancel'}</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {options?.confirmText ?? 'Confirm'}
            </Button>
          </div>
        </div>
      </dialog>
    </DialogContext.Provider>
  );
}
