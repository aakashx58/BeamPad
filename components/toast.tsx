'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type Toast = (message: string) => void;

const ToastContext = createContext<Toast | null>(null);

/** Usage: `const toast = useToast(); toast('Copied');` */
export function useToast(): Toast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ message: '', show: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback<Toast>(message => {
    setState({ message, show: true });
    clearTimeout(timer.current);
    // Hide but keep the text, so it doesn't vanish mid fade-out.
    timer.current = setTimeout(() => setState(s => ({ ...s, show: false })), 1600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="status"
        className={`pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[10px] bg-slate-900 px-4 py-2.5 text-sm text-slate-50 transition duration-200 ${
          state.show ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      >
        {state.message}
      </div>
    </ToastContext.Provider>
  );
}
