import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createLocalApi } from '../local/server';

let server: Server;
let base: string;
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
const issuer = 'https://otters.auth0.com/';
const audience = 'https://otters.api';
async function token(claims: Record<string, unknown> = {}) {
  return new SignJWT({ sub: 'auth0|ranger', scope: 'openid feed:otters', ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer(issuer)
    .setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(privateKey);
}
beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...await exportJWK(pair.publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
  server = createLocalApi({ domain: 'otters.auth0.com', audience, key: createLocalJWKSet({ keys: [jwk] }) });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

describe('local JWT/CORS boundary', () => {
  it('requires configuration', () => {
    expect(() => createLocalApi({ domain: '', audience: '' })).toThrow('AUTH0_DOMAIN and AUTH0_AUDIENCE');
  });
  it('serves public facts with allowed-origin CORS without a token', async () => {
    const res = await fetch(`${base}/otters/facts`, { headers: { Origin: 'http://localhost:3000' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect((await res.json()).facts.length).toBeGreaterThan(0);
  });
  it.each([undefined, 'Bearer nonsense', 'Basic abc'])('returns gateway-style 401 for %s', async authorization => {
    const res = await fetch(`${base}/otters`, { headers: { Origin: 'http://localhost:3000', ...(authorization ? { Authorization: authorization } : {}) } });
    expect(res.status).toBe(401);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(await res.json()).toEqual({ message: 'Unauthorized' });
  });
  it.each([{ aud: 'wrong' }, { iss: 'https://wrong.example/' }, { exp: 1 }, { nbf: 9999999999 }, { iat: 9999999999 }])('rejects invalid claims %j', async claims => {
    const jwt = await new SignJWT({ sub: 'auth0|ranger', iss: issuer, aud: audience, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, ...claims }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(privateKey);
    expect((await fetch(`${base}/otters`, { headers: { Authorization: `Bearer ${jwt}` } })).status).toBe(401);
  });
  it('rejects a signature from another key', async () => {
    const other = await generateKeyPair('RS256');
    const jwt = await new SignJWT({ sub: 'intruder' }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(other.privateKey);
    expect((await fetch(`${base}/otters`, { headers: { Authorization: `Bearer ${jwt}` } })).status).toBe(401);
  });
  it('calls the same roster handler with verified claims', async () => {
    const res = await fetch(`${base}/otters`, { headers: { Authorization: `Bearer ${await token({ scope: 'openid' })}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ caller: 'auth0|ranger', otters: expect.arrayContaining([expect.objectContaining({ id: 'miso' })]) });
  });
  it('requires a token and exact feeding scope for POST', async () => {
    const request = (authorization?: string) => fetch(`${base}/otters/miso/snacks`, { method: 'POST', headers: authorization ? { Authorization: authorization } : {}, body: '{"snack":"clam"}' });
    expect((await request()).status).toBe(401);
    const forbidden = await request(`Bearer ${await token({ scope: 'openid feed:otters:other' })}`);
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ message: 'Forbidden' });
    const ok = await request(`Bearer ${await token()}`);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ caller: 'auth0|ranger', otterId: 'miso' });
  });
  it('preserves snack handler validation and unknown-otter errors', async () => {
    const headers = { Authorization: `Bearer ${await token()}` };
    expect((await fetch(`${base}/otters/miso/snacks`, { method: 'POST', headers })).status).toBe(400);
    expect((await fetch(`${base}/otters/gone/snacks`, { method: 'POST', headers, body: '{}' })).status).toBe(404);
  });
  it('answers allowed preflights before authentication', async () => {
    const res = await fetch(`${base}/otters/miso/snacks`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET,POST,OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toBe('authorization,content-type');
    expect(res.headers.get('access-control-max-age')).toBe('3600');
  });
  it.each(['https://untrusted.example', 'null', ''])('does not grant CORS to origin %s', async origin => {
    const res = await fetch(`${base}/otters`, { method: 'OPTIONS', headers: origin ? { Origin: origin } : {} });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});
