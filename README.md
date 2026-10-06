<p align="center">
  <img src="app/icon.svg" width="72" height="72" alt="Beampad logo">
</p>

<h1 align="center">Beampad</h1>

<p align="center">A shared notepad for your local network.<br>
Type on one device, and it shows up on every other device on the same Wi-Fi.</p>

---

Beampad is one text box that every device on your network shares. Paste a link on your laptop and open it on your phone, or type a note on your phone and copy it on your PC. There's no account, no cloud and no Share button: text saves as you type.

## Features

- **Automatic sync.** Text saves about half a second after you stop typing, and other devices pick it up within about 1.5 seconds.
- **Your typing is never overwritten.** Changes from other devices wait until this device has saved its own edits, and your cursor stays where it was.
- **Link list.** Every `http(s)` link in the text appears under the editor as a card you can tap.
- **Live status.** The header shows *Synced*, *Saving…* or *Offline*. Unsaved text is kept and retried after a connection drop.
- **Copy and Clear.** Copy works over plain `http` on a LAN. Clear asks for confirmation first, because it clears every device.
- **Works on phones.** The layout fits the screen, and the app can be added to the home screen with its own icon.
- **Keeps text through restarts.** Text is saved to `data.json` on the machine running the server.

## Tech stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | React 19, [Tailwind CSS 4](https://tailwindcss.com) |
| Language | TypeScript |
| Storage | A JSON file on disk, with no database |
| Runtime dependencies | `next`, `react`, `react-dom` only |

## Getting started

**Requirements:** [Node.js](https://nodejs.org) 20.9 or newer.

```bash
npm install
npm run build
npm start
```

Next prints two addresses:

```
- Local:    http://localhost:3000
- Network:  http://192.168.1.81:3000   ← open this on your other devices
```

Open the **Network** address on any phone, tablet or computer connected to the **same Wi-Fi**.

### Allow it through the firewall (Windows)

If other devices can't connect, Windows Firewall is blocking them. This usually happens when the Wi-Fi network is set to *Public*. Fix it in one of two ways:

- **Set the network to Private:** Settings → Network & internet → Wi-Fi → your network → **Private network**, then allow Node.js when Windows asks.
- **Or open the port.** Run this once in PowerShell **as Administrator**:
  ```powershell
  New-NetFirewallRule -DisplayName "Beampad 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
  ```

### Add it to your phone's home screen

Open the Network address on your phone, then:

- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** ⋮ menu → *Add to Home screen*

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server that reloads on save. Reachable from the LAN (see `next.config.ts`). |
| `npm run build` | Production build. Run it again after changing the code. |
| `npm start` | Runs the production build. Use this for everyday use. |

To use a different port, run `npm start -- -p 4000`, or set the `PORT` environment variable.

### VS Code

`.vscode/launch.json` adds these options to the **Run and Debug** panel (F5):

| Configuration | Use it for |
|---|---|
| Next.js: debug server-side | Breakpoints in `app/api/**` and `lib/store.ts` |
| Next.js: debug client-side | Breakpoints in components. Start the dev server first. |
| Next.js: debug full stack | Both at once, opens Chrome |
| Beampad: run production | Build and start for everyday use |

## Project structure

```
app/
  page.tsx               Page: puts Header, Editor and LinkList together
  layout.tsx             HTML shell, font, toast and dialog providers
  globals.css            Tailwind import and theme tokens
  api/text/route.ts      GET / PUT for the shared text
  icon.svg               Logo, browser tab icon and manifest icon
  apple-icon.png         iOS home-screen icon
  manifest.ts            Web app manifest (Add to Home Screen)
components/
  header.tsx             Logo, title, sync status
  editor.tsx             Text box, character count, Copy and Clear
  link-list.tsx          Links found in the text
  dialog.tsx             Confirm dialog service: useDialog().confirm()
  toast.tsx              Toast service: useToast()
  ui/button.tsx          Shared button variants
hooks/
  use-synced-text.ts     All sync logic: load, debounced save, retry, cursor keeping
lib/
  pad.ts                 Shared type and size limit (browser and server)
  store.ts               Server only: reads and writes data.json
  clipboard.ts           Copy to clipboard, with a fallback for plain http
```

## How sync works

```
 Device A                         Server                         Device B
 ────────                         ──────                         ────────
 types… (400 ms pause)
 PUT /api/text {text} ─────────►  saves { text, at } to data.json
                                  ◄───────────── GET /api/text (every 1.5 s)
                                  { text, at } ─────────────────► newer `at` and no unsaved edits?
                                                                  → replace text, keep cursor
```

- Each save stores the text with a timestamp (`at`). A device applies server text only when its `at` is newer than the last one it saw.
- A device with **unsaved edits never accepts remote text**. It saves first, so its typing isn't lost.
- Only one save runs at a time. Text typed during a save is sent right after it finishes.
- When a save fails, the text stays marked as unsaved and the next poll tries again.

## API

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/text` | none | `{ "text": string, "at": number }` |
| `PUT` | `/api/text` | `{ "text": string }` | `{ "text": string, "at": number }` |

`PUT` returns `400` when `text` is missing or isn't a string, and `413` above 1,000,000 characters. The limit is set in `lib/pad.ts`.

## Limitations

These are deliberate trade-offs to keep the app small:

- **No authentication.** Anyone on your network can read and edit the text. Don't run it on public or shared Wi-Fi with anything sensitive.
- **Last write wins.** If two people type at the same moment, the later save replaces the earlier one. Real-time merging would need a CRDT library such as [Yjs](https://yjs.dev).
- **Polling, not push.** Updates arrive within about 1.5 seconds. Server-Sent Events would make them instant.
- **Plain HTTP.** Browsers limit the clipboard API outside `localhost`, so Copy falls back to an older method. Keyboard paste (Ctrl+V or long-press) always works.
- **One machine, one file.** The text lives in `data.json` next to the app, which is listed in `.gitignore`. Delete the file to reset.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Phone can't connect, page never loads | Windows Firewall. See [Allow it through the firewall](#allow-it-through-the-firewall-windows). Also check the phone is on Wi-Fi, not mobile data. |
| `http://0.0.0.0:3000` doesn't open | `0.0.0.0` means "every network on this PC"; it isn't an address you can visit. Use the `192.168.x.x` address. |
| **401** or **404** errors, nothing saves | A static file server (`serve`, `npx serve`, Live Server) is running instead of the app. Stop it and run `npm start`. |
| Stuck on *Loading…* in dev mode over the LAN | `next dev` blocks other devices unless they're listed in `allowedDevOrigins` in `next.config.ts`. Add your network's address range there, or use `npm start`. |
| Port 3000 already in use | Stop the other process, or run `npm start -- -p 4000`. |
