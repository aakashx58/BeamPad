// Server-only: works out which network a request comes from, so each network gets its own pad.
//
// Devices behind the same router share one public IPv4 address (NAT), or one /64 prefix on IPv6.
// Visitors from any other network get a different id, so they never see this network's text.

// Per-network pads are on when deployed behind a trusted proxy (Vercel, or PER_NETWORK=1 on any other host).
export const perNetwork = () => process.env.PER_NETWORK === '1' || !!process.env.VERCEL;

/** The pad id for this request, or null if the network can't be determined (fail closed). */
export function networkOf(req: Request): string | null {
  // Self-hosted (`npm start` at home): one pad for everyone who can reach this server.
  // Client IP headers can't be trusted here — any client can send its own X-Forwarded-For.
  if (!perNetwork()) return 'lan';

  // Behind a trusted proxy these headers are set by the proxy and overwrite anything the client sent.
  const ip = (req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0])?.trim();
  return ip ? networkId(ip) : null;
}

// ponytail: a dual-stack network can reach us over IPv4 from one device and IPv6 from another,
// splitting it into two pads; pairing codes/rooms would fix that if it shows up in practice
export function networkId(ip: string): string {
  ip = ip.replace(/^::ffff:/, '').replace(/%.*$/, ''); // IPv4-mapped IPv6, zone id
  if (!ip.includes(':')) return ip; // IPv4: the router's public address

  // IPv6: every device has its own address, but they share the first 64 bits.
  const [head, tail = ''] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const full = [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  return full.slice(0, 4).map(x => parseInt(x, 16).toString(16)).join(':') + '::/64';
}
