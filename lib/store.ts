// Server-only: persists the pad to data.json.
import fs from 'node:fs';
import path from 'node:path';
import type { Pad } from './pad';

const DATA = path.join(process.cwd(), 'data.json');

export const readPad = (): Pad => {
  try {
    const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    if (typeof d?.text === 'string') return d;
  } catch { /* first run */ }
  return { text: '', at: 0 };
};

export const writePad = (pad: Pad) => fs.writeFileSync(DATA, JSON.stringify(pad));
