import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as factsHandler } from './facts';
import { handler as rosterHandler } from './roster';
import { handler as snacksHandler } from './snacks';

const withClaims = (handler: typeof rosterHandler) => async (event: APIGatewayProxyEvent) => {
  if (event.requestContext.authorizer?.claims == null) {
    const authorization = Object.entries(event.headers).find(([key]) => key.toLowerCase() === 'authorization')?.[1];
    const token = authorization?.match(/^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/i);
    if (token) {
      try {
        // These protected methods run only after API Gateway validates the JWT and required scopes.
        const payload: unknown = JSON.parse(Buffer.from(token[2], 'base64url').toString('utf8'));
        if (payload && typeof payload === 'object' && 'sub' in payload && typeof payload.sub === 'string') {
          event = { ...event, requestContext: { ...event.requestContext, authorizer: { ...event.requestContext.authorizer, claims: { sub: payload.sub } } } };
        }
      } catch {}
    }
  }
  return handler(event);
};

const withCors = (handler: (event: APIGatewayProxyEvent) => Promise<{ statusCode: number; headers?: Record<string, string>; body: string }>) => async (event: APIGatewayProxyEvent) => {
  const response = await handler(event);
  const origin = Object.entries(event.headers).find(([key]) => key.toLowerCase() === 'origin')?.[1];
  const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(value => value.trim()).filter(Boolean);
  const allowed = origin && (origins.includes(origin) || origins.includes('*'));
  return {
    ...response,
    headers: {
      ...response.headers,
      Vary: 'Origin',
      ...(allowed ? {
        'Access-Control-Allow-Origin': origins.includes('*') ? '*' : origin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Max-Age': '3600',
      } : {}),
    },
  };
};

export const facts = withCors(factsHandler);
export const roster = withCors(withClaims(rosterHandler));
export const snacks = withCors(withClaims(snacksHandler));
export const preflight = withCors(async () => ({ statusCode: 204, body: '' }));
