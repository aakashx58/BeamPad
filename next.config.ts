import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `next dev` blocks its dev resources for any origin but localhost; allow LAN IPs
  // so phones/laptops on the same Wi-Fi can use the dev server too.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
};

export default nextConfig;
