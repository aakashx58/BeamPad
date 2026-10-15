# Architecture

Beampad is one Next.js app: a React page plus one API route. Text is stored per network, so devices behind the same router share a pad.

```
Browser (React)                     Server (Next.js route)             Storage
┌──────────────────────┐  GET/PUT  ┌─────────────────────────┐        ┌─────────────────────┐
│ page.tsx             │ ────────► │ app/api/text/route.ts   │ ─────► │ lib/store.ts        │
│ useSyncedText hook   │ ◄──────── │  networkOf(req) → id    │ ◄───── │  Redis  (Vercel)    │
│  poll 1.5s, save 0.4s│  JSON     │  readPad / writePad     │        │  data.json (local)  │
└──────────────────────┘           └─────────────────────────┘        └─────────────────────┘
```

## Files

| File | Role |
|---|---|
| `app/page.tsx` | Page: header, editor, link list. All state comes from `useSyncedText`. |
| `hooks/use-synced-text.ts` | Client sync: debounced save, polling, conflict rule, status (`synced` / `saving` / `offline`). |
| `app/api/text/route.ts` | `GET` reads the pad, `PUT` writes it. Validates size and body. Sends `x-storage` header (`redis` or `file`) to show which backend is active. |
| `lib/network.ts` | Maps a request to a pad id (see below). |
| `lib/store.ts` | `readPad` / `writePad`: Redis when configured, `data.json` otherwise. |
| `lib/pad.ts` | Shared types (`Pad`, `PadResponse`) and `MAX_CHARS` (1,000,000). |
| `components/*`, `lib/clipboard.ts` | UI pieces: editor, header, link cards, toast, dialog, copy helper. |

## How a pad is chosen

`networkOf(req)` in `lib/network.ts`:

- **Self-hosted** (`VERCEL` not set): always `'lan'`. One pad for everyone who can reach the server. Client IP headers are not trusted here.
- **On Vercel:** the client IP from `x-real-ip` / `x-forwarded-for` (set by Vercel's edge). IPv4 is used as is. IPv6 is cut to its `/64` prefix, because devices on one network share it. No IP means the request is refused with 400.

The id becomes the Redis key `beampad:pad:<id>`.

## Storage

| Environment | Backend | Why |
|---|---|---|
| Vercel | Upstash Redis (`KV_REST_API_*` or `UPSTASH_REDIS_REST_*`) | Serverless: disk is read-only and memory isn't shared between requests. |
| Local / own server | `data.json` in the working directory | No setup. |

Redis keys expire 7 days after the last edit. On Vercel without Redis, `writePad` throws a clear error and the route returns 500.

## Sync protocol

A pad is `{ text, at }`, where `at` is the server time of the last write.

- **Save:** 400 ms after the user stops typing, `PUT { text }`. One save in flight at a time. If the user kept typing, save again.
- **Poll:** `GET` every 1.5 s. Skipped while the tab is hidden, and run again when it becomes visible.
- **Conflict rule:** a remote change is applied only when the device has no unsaved edits and `at` is newer than what it has seen. Typing is never overwritten, and the cursor position is kept.
- **Failures:** the status becomes `offline`, the text stays dirty, and the next poll retries.

## Known limits

- Last write wins. Two people typing at the same moment overwrite each other (a CRDT such as Yjs would fix it).
- Polling, not push. Server-Sent Events would give instant updates.
- A dual-stack network can reach the server over IPv4 from one device and IPv6 from another, which splits it into two pads.
- Anyone on the same public IP shares the pad. There is no auth.

## Scaling path

The server keeps no state, so it already scales horizontally: any number of instances can run behind a load balancer, and Redis is the only shared part. Do the steps below only when the current step stops being enough.

| Step | Trigger | Change |
|---|---|---|
| 0. Today | Hobby use | Vercel + Upstash free tier, polling every 1.5 s. |
| 1. Cut request volume | Redis quota or Vercel invocations run out | Poll slower while the tab is idle. ~~Unchanged polls return 304 (`?since=<at>`), so the text isn't re-sent.~~ Done. Still reads Redis each poll. |
| 2. Push instead of poll | Many devices, or updates must be instant | Server-Sent Events on one route, with Redis pub/sub (or Upstash QStash) fanning out changes. Needs a long-lived runtime (Node server, Fly, Railway), not serverless. |
| 3. Safe concurrent edits | Several people type at once | Store a CRDT (Yjs) or send diffs with a version check (`SET` only if `at` matches) instead of last-write-wins. |
| 4. Bigger Redis | Free tier too small | Paid Upstash, or self-hosted Redis. Keys are already independent (`beampad:pad:<network>`), so they shard by key with no code change. |
| 5. Other hosts | Leaving Vercel | ~~Config flag instead of hard-coded Vercel.~~ Done: set `PER_NETWORK=1` on any host behind a proxy that sets `x-real-ip` / `x-forwarded-for`. |
| 6. Abuse control | Public traffic | Per-IP rate limit (`@upstash/ratelimit`) on `PUT`. `MAX_CHARS` already caps size. |

What stays the same at any scale: one pad per network id, the `{ text, at }` shape, and the client's rule never to overwrite unsaved typing.
