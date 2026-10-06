'use client';

import { useEffect, useRef, useState } from 'react';
import type { Pad } from '../lib/pad';

export type SyncStatus = 'synced' | 'saving' | 'offline';

const SAVE_DELAY_MS = 400;
// ponytail: polling; switch to Server-Sent Events if many devices or instant updates matter
const POLL_MS = 1500;

/**
 * Keeps one text in sync with /api/text across devices.
 * Local typing is saved after a short pause; remote changes are applied only
 * when this device has nothing unsaved, so a user's typing is never overwritten.
 */
export function useSyncedText() {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('synced');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latest = useRef('');   // what's in the box right now
  const version = useRef(0);   // `at` of the newest server state we've seen
  const dirty = useRef(false); // local edits not yet saved
  const saving = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Replace the box with remote text, keeping the cursor where it was.
  const apply = (remote: string) => {
    const el = inputRef.current;
    const sel = el && document.activeElement === el ? [el.selectionStart, el.selectionEnd] : null;
    latest.current = remote;
    setText(remote);
    if (el && sel) requestAnimationFrame(() => el.setSelectionRange(sel[0], sel[1]));
  };

  const pull = async () => {
    try {
      const pad: Pad = await (await fetch('/api/text', { cache: 'no-store' })).json();
      setLoaded(true);
      setStatus(s => (s === 'offline' ? 'synced' : s));
      if (dirty.current || pad.at <= version.current) return;
      version.current = pad.at;
      apply(pad.text);
    } catch {
      setStatus('offline');
    }
  };

  // One save in flight at a time; if the user kept typing meanwhile, save again.
  const flush = async () => {
    if (saving.current || !dirty.current) return;
    saving.current = true;
    const value = latest.current;
    try {
      const res = await fetch('/api/text', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      version.current = ((await res.json()) as Pad).at;
      if (latest.current === value) {
        dirty.current = false;
        setStatus('synced');
      }
    } catch {
      setStatus('offline'); // stays dirty; the poll retries
    } finally {
      saving.current = false;
    }
    if (dirty.current && latest.current !== value) flush();
  };

  const edit = (value: string) => {
    latest.current = value;
    setText(value);
    dirty.current = true;
    setStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  useEffect(() => {
    pull();
    // Skip polls while the tab is hidden (saves Redis/Vercel quota), catch up when it's shown.
    const t = setInterval(() => {
      if (dirty.current) flush();
      else if (!document.hidden) pull();
    }, POLL_MS);
    const onVisible = () => !document.hidden && pull();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { text, edit, loaded, status, inputRef };
}
