// Run: npm test  (Node runs TypeScript directly)
import assert from 'node:assert/strict';
import test from 'node:test';
import { networkId, networkOf } from './network.ts';

const req = (h: Record<string, string>) => new Request('http://x/api/text', { headers: h });

test('IPv4: the public address is the network', () => {
  assert.equal(networkId('203.0.113.7'), '203.0.113.7');
  assert.equal(networkId('::ffff:203.0.113.7'), '203.0.113.7');
});

test('IPv6: devices on one network share the /64 prefix', () => {
  const laptop = networkId('2001:db8:abcd:12:1a2b:3c4d:5e6f:7');
  const phone = networkId('2001:db8:abcd:12::99');
  assert.equal(laptop, '2001:db8:abcd:12::/64');
  assert.equal(phone, laptop);
  assert.notEqual(networkId('2001:db8:abcd:13::1'), laptop);
  assert.equal(networkId('2001:0db8:0:0:0:0:0:1'), '2001:db8:0:0::/64');
  assert.equal(networkId('fe80::1%eth0'), 'fe80:0:0:0::/64');
});

test('self-hosted ignores (spoofable) headers: one LAN pad', () => {
  delete process.env.VERCEL;
  assert.equal(networkOf(req({ 'x-forwarded-for': '8.8.8.8' })), 'lan');
});

test('on Vercel: uses edge-set headers, fails closed without them', () => {
  process.env.VERCEL = '1';
  assert.equal(networkOf(req({ 'x-real-ip': '198.51.100.4' })), '198.51.100.4');
  assert.equal(networkOf(req({ 'x-forwarded-for': '198.51.100.4, 10.0.0.1' })), '198.51.100.4');
  assert.equal(networkOf(req({})), null);
  delete process.env.VERCEL;
});
