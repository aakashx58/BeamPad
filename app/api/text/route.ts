import { networkOf } from '../../../lib/network';
import { MAX_CHARS, type Pad, type PadResponse } from '../../../lib/pad';
import { readPad, storage, writePad } from '../../../lib/store';

export const dynamic = 'force-dynamic';

const headers = { 'x-storage': storage };

// 'fetch failed' alone says nothing; include the cause (e.g. 'getaddrinfo ENOTFOUND …', 'WRONGPASS').
const describe = (e: unknown) =>
  e instanceof Error ? [e.message, (e.cause as Error | undefined)?.message].filter(Boolean).join(': ') : 'Storage error';

const noNetwork = () => Response.json({ error: 'Could not determine your network' }, { status: 400, headers });

export async function GET(req: Request) {
  const network = networkOf(req);
  if (!network) return noNetwork();
  try {
    const body: PadResponse = { ...(await readPad(network)), network };
    return Response.json(body, { headers });
  } catch (e) {
    console.error('readPad failed:', e); // shows up in Vercel → Logs
    return Response.json({ error: describe(e) }, { status: 500, headers });
  }
}

export async function PUT(req: Request) {
  const network = networkOf(req);
  if (!network) return noNetwork();
  if (Number(req.headers.get('content-length')) > MAX_CHARS * 4) {
    return Response.json({ error: 'Too large' }, { status: 413, headers });
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.text !== 'string') return Response.json({ error: 'Bad request' }, { status: 400, headers });
  if (body.text.length > MAX_CHARS) return Response.json({ error: 'Too large' }, { status: 413, headers });

  // ponytail: last write wins; two people typing at the same moment overwrite each other — use a CRDT (Yjs) if that matters
  const pad: Pad = { text: body.text, at: Date.now() };
  try {
    await writePad(network, pad);
  } catch (e) {
    console.error('writePad failed:', e);
    return Response.json({ error: describe(e) }, { status: 500, headers });
  }
  const res: PadResponse = { ...pad, network };
  return Response.json(res, { headers });
}
