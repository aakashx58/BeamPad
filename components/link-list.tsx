const URL_RE = /https?:\/\/[^\s<>"']+/g;

/** Lists the unique http(s) links found in the text as tappable cards. */
export function LinkList({ text }: { text: string }) {
  const links = [...new Set(text.match(URL_RE) ?? [])];
  if (!links.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[13px] font-semibold tracking-wider text-slate-500 uppercase">Links · {links.length}</h2>
      <div className="flex flex-col gap-2">
        {links.map(url => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-indigo-600 shadow-card transition-colors hover:border-indigo-600"
          >
            {url}
          </a>
        ))}
      </div>
    </section>
  );
}
