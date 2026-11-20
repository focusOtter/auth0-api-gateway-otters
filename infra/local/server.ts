import { createServer } from 'node:http';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { handler as facts } from '../lambda/facts';
import { handler as roster } from '../lambda/roster';
import { handler as snacks } from '../lambda/snacks';
import { json, type JwtEvent } from '../lambda/http';

type Config = { domain: string; audience: string; allowedOrigins?: string; key?: JWTVerifyGetKey };

// Local teaching stand-in, not an AWS emulator: reuse handlers and mirror JWT/CORS boundaries.
export function createLocalApi(config: Config) {
  if (!config.domain || !config.audience) throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE are required for the local API.');
  if (config.domain.includes('/') || config.domain.includes(':')) throw new Error('AUTH0_DOMAIN must be a hostname.');
  const issuer = `https://${config.domain}/`;
  const key = config.key ?? createRemoteJWKSet(new URL('.well-known/jwks.json', issuer));
  const origins = (config.allowedOrigins || 'http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean);
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Vary', 'Origin');
    if (origin && (origins.includes(origin) || origins.includes('*'))) {
      res.setHeader('Access-Control-Allow-Origin', origins.includes('*') ? '*' : origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
      res.setHeader('Access-Control-Max-Age', '3600');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const send = (response: ReturnType<typeof json>) => {
      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
    };
    try {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      if (req.method === 'GET' && pathname === '/otters/facts') { send(await facts()); return; }
      const snackRoute = req.method === 'POST' && pathname.match(/^\/otters\/([^/]+)\/snacks$/);
      if (!(req.method === 'GET' && pathname === '/otters') && !snackRoute) { send(json(404, { message: 'Not Found' })); return; }
      let payload;
      try {
        const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
        if (!token) throw new Error('Missing token');
        ({ payload } = await jwtVerify(token, key, { issuer, audience: config.audience, algorithms: ['RS256'], requiredClaims: ['exp', 'iat'] }));
        if (typeof payload.iat !== 'number' || payload.iat > Date.now() / 1000) throw new Error('Future issued-at');
      } catch {
        send(json(401, { message: 'Unauthorized' })); return;
      }
      const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : typeof payload.scp === 'string' ? payload.scp.split(' ') : [];
      if (snackRoute && !scopes.includes('feed:otters')) { send(json(403, { message: 'Forbidden' })); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) { send(json(413, { message: 'Payload Too Large' })); return; }
        chunks.push(Buffer.from(chunk));
      }
      const event = {
        version: '2.0', body: Buffer.concat(chunks).toString('utf8'), isBase64Encoded: false,
        pathParameters: snackRoute ? { id: decodeURIComponent(snackRoute[1]) } : undefined,
        requestContext: { authorizer: { jwt: { claims: payload, scopes } } },
      } as unknown as JwtEvent;
      send(snackRoute ? await snacks(event) : await roster(event));
    } catch {
      send(json(500, { message: 'Internal Server Error' }));
    }
  });
}
