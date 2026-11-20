import { describe, expect, it } from 'vitest';
import { handler as facts } from '../lambda/facts';
import { handler as roster } from '../lambda/roster';
import { handler as snacks } from '../lambda/snacks';
import type { JwtEvent } from '../lambda/http';

const event = (body?: string, id = 'miso', sub: string | undefined = 'auth0|river') => ({
  body, pathParameters: { id }, isBase64Encoded: false,
  requestContext: { authorizer: { jwt: { claims: { sub }, scopes: ['feed:otters'] } } },
}) as unknown as JwtEvent;

describe('otter handlers', () => {
  it('serves public facts without an event or token', async () => {
    expect(JSON.parse((await facts()).body).facts.length).toBeGreaterThan(0);
  });
  it('returns roster and caller', async () => {
    const response = await roster(event());
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ caller: 'auth0|river', otters: expect.arrayContaining([expect.objectContaining({ id: 'miso' })]) });
  });
  it('rejects a missing caller', async () => {
    const missing = event();
    delete missing.requestContext.authorizer.jwt.claims.sub;
    expect((await roster(missing)).statusCode).toBe(401);
    expect((await snacks(missing)).statusCode).toBe(401);
  });
  it('feeds an otter and includes caller', async () => {
    expect(JSON.parse((await snacks(event('{"snack":"crab"}'))).body)).toMatchObject({ caller: 'auth0|river', otterId: 'miso', message: expect.stringContaining('crab') });
  });
  it('accepts API Gateway base64 bodies', async () => {
    const input = event(Buffer.from('{"snack":"clam"}').toString('base64'));
    input.isBase64Encoded = true;
    expect((await snacks(input)).statusCode).toBe(200);
  });
  it.each([undefined, '', '{', 'null', '[]', '{}', '{"snack":7}', '{"snack":"   "}', JSON.stringify({ snack: 'x'.repeat(81) })])('rejects invalid body %s', async body => {
    expect((await snacks(event(body))).statusCode).toBe(400);
  });
  it('returns 404 for unknown or absent otters', async () => {
    expect((await snacks(event('{"snack":"crab"}', 'missing'))).statusCode).toBe(404);
    const input = event();
    delete input.pathParameters;
    expect((await snacks(input)).statusCode).toBe(404);
  });
});
