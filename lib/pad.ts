// Shared by the API route and the browser — must not import Node modules.
export type Pad = { text: string; at: number };

/** What /api/text returns: the pad plus which network it belongs to ('lan' when self-hosted). */
export type PadResponse = Pad & { network: string };

export const MAX_CHARS = 1_000_000;
