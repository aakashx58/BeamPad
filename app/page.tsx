'use client';

import { Editor } from '../components/editor';
import { Header } from '../components/header';
import { LinkList } from '../components/link-list';
import { useSyncedText } from '../hooks/use-synced-text';

export default function Home() {
  const { text, edit, loaded, status, network, inputRef } = useSyncedText();

  return (
    // Full-height column: header and links take what they need, the editor fills the rest.
    <main className="mx-auto flex min-h-dvh max-w-[760px] flex-col px-4 py-5 sm:py-8">
      <Header status={status} network={network} />
      <Editor text={text} loaded={loaded} inputRef={inputRef} onChange={edit} />
      <LinkList text={text} />
    </main>
  );
}
