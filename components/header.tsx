import Image from 'next/image';
import logo from '../app/icon.svg';
import type { SyncStatus } from '../hooks/use-synced-text';

const STATUS: Record<SyncStatus, { label: string; dot: string }> = {
  synced: { label: 'Synced', dot: 'bg-green-500 ring-green-500/20' },
  saving: { label: 'Saving…', dot: 'bg-amber-500 ring-amber-500/20' },
  offline: { label: 'Offline', dot: 'bg-red-600 ring-red-600/20' },
};

export function Header({ status }: { status: SyncStatus }) {
  const s = STATUS[status];
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src={logo} alt="" width={40} height={40} priority />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Beampad</h1>
          <div className="text-[13px] text-slate-500">Type here, it appears on every device on your network</div>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500" aria-live="polite">
        <span className={`size-2 rounded-full ring-3 ${s.dot}`} />
        {s.label}
      </span>
    </header>
  );
}
