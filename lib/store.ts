// Server-only: persists the pad.
// - Redis (Upstash) when configured: required on Vercel/serverless, where the disk is read-only.
// - data.json otherwise: zero setup for running on your own machine.
import fs from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import type { Pad } from './pad';

const EMPTY: Pad = { text: '', at: 0 };

// Vercel's Upstash integration sets KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const KEY = 'beampad:pad';

const DATA = path.join(process.cwd(), 'data.json');

export async function readPad(): Promise<Pad> {
  if (redis) return (await redis.get<Pad>(KEY)) ?? EMPTY;
  try {
    const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    if (typeof d?.text === 'string') return d;
  } catch { /* first run */ }
  return EMPTY;
}

export async function writePad(pad: Pad): Promise<void> {
  if (redis) await redis.set(KEY, pad);
  else fs.writeFileSync(DATA, JSON.stringify(pad));
}
