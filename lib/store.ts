// Server-only: persists one pad per network (see lib/network.ts).
// - Redis (Upstash) when configured: required on Vercel/serverless, where the disk is read-only.
// - data.json otherwise: zero setup for running on your own machine.
import fs from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import type { Pad } from './pad';

const EMPTY: Pad = { text: '', at: 0 };

// A direct Upstash setup uses UPSTASH_REDIS_REST_*; Vercel's integration uses KV_REST_API_*,
// or <PREFIX>_..._REST_API_* when a custom prefix was chosen while connecting the database.
const bySuffix = (suffix: string) => Object.entries(process.env).find(([k]) => k.endsWith(suffix))?.[1];
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? bySuffix('_REST_API_URL');
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? bySuffix('_REST_API_TOKEN');
const redis = url && token ? new Redis({ url, token }) : null;
const key = (network: string) => `beampad:pad:${network}`;
// Pads of networks that stop using the app expire, so the free Redis tier doesn't fill up.
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days after the last edit

/** Which backend is active — sent as the `x-storage` header so a deployment can be checked from outside. */
export const storage = redis ? 'redis' : 'file';

const DATA = path.join(process.cwd(), 'data.json');

export async function readPad(network: string): Promise<Pad> {
  if (redis) return (await redis.get<Pad>(key(network))) ?? EMPTY;
  // File mode only runs self-hosted, where network is always 'lan' — one pad, one file.
  try {
    const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    if (typeof d?.text === 'string') return d;
  } catch { /* first run */ }
  return EMPTY;
}

export async function writePad(network: string, pad: Pad): Promise<void> {
  if (redis) return void (await redis.set(key(network), pad, { ex: TTL_SECONDS }));
  // Vercel's disk is read-only, so the file fallback can't work there — say why instead of EROFS.
  if (process.env.VERCEL) {
    throw new Error('Redis is not configured: connect an Upstash Redis database to this Vercel project (it adds KV_REST_API_URL / KV_REST_API_TOKEN), then redeploy.');
  }
  fs.writeFileSync(DATA, JSON.stringify(pad));
}
