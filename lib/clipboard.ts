export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // The clipboard API needs HTTPS outside localhost (e.g. http://192.168.x.x), so fall back.
    const t = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}
