import { MAX_CHARS, type Pad } from '../../../lib/pad';
import { readPad, storage, writePad } from '../../../lib/store';

export const dynamic = 'force-dynamic';

const headers = { 'x-storage': storage };

// 'fetch failed' alone says nothing; include the cause (e.g. 'getaddrinfo ENOTFOUND …', 'WRONGPASS').
const describe = (e: unknown) =>
  e instanceof Error ? [e.message, (e.cause as Error | undefined)?.message].filter(Boolean).join(': ') : 'Storage error';

export async function GET() {
  try {
    return Response.json(await readPad(), { headers });
  } catch (e) {
    console.error('readPad failed:', e); // shows up in Vercel → Logs
    return Response.json({ error: describe(e) }, { status: 500, headers });
  }
}

export async function PUT(req: Request) {
  if (Number(req.headers.get('content-length')) > MAX_CHARS * 4) {
    return Response.json({ error: 'Too large' }, { status: 413, headers });
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.text !== 'string') return Response.json({ error: 'Bad request' }, { status: 400, headers });
  if (body.text.length > MAX_CHARS) return Response.json({ error: 'Too large' }, { status: 413, headers });

  // ponytail: last write wins; two people typing at the same moment overwrite each other — use a CRDT (Yjs) if that matters
  const pad: Pad = { text: body.text, at: Date.now() };
  try {
    await writePad(pad);
  } catch (e) {
    console.error('writePad failed:', e);
    return Response.json({ error: describe(e) }, { status: 500, headers });
  }
  return Response.json(pad, { headers });
}
