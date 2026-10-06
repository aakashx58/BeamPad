import { MAX_CHARS, type Pad } from '../../../lib/pad';
import { readPad, writePad } from '../../../lib/store';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(readPad());
}

export async function PUT(req: Request) {
  if (Number(req.headers.get('content-length')) > MAX_CHARS * 4) {
    return Response.json({ error: 'Too large' }, { status: 413 });
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.text !== 'string') return Response.json({ error: 'Bad request' }, { status: 400 });
  if (body.text.length > MAX_CHARS) return Response.json({ error: 'Too large' }, { status: 413 });

  // ponytail: last write wins; two people typing at the same moment overwrite each other — use a CRDT (Yjs) if that matters
  const pad: Pad = { text: body.text, at: Date.now() };
  writePad(pad);
  return Response.json(pad);
}
