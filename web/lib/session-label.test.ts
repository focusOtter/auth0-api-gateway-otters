import { describe, expect, it } from 'vitest';
import { sessionLabel } from './session-label';

const token = (claims: unknown) => `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.c2ln`;

describe('sessionLabel', () => {
  it('shows session loading and logged-out states regardless of token claims', () => {
    const ranger = token({ scope: 'feed:otters' });
    expect(sessionLabel(true, true, ranger)).toBe('Checking session');
    expect(sessionLabel(false, false, ranger)).toBe('Visitor mode');
  });
  it.each([
    { scope: 'openid feed:otters profile' },
    { scope: 'openid\tfeed:otters\nemail', name: 'Rivière' },
    { permissions: ['read:otters', 'feed:otters'] },
  ])('labels a caller with the feeding permission as a ranger: %j', claims => {
    expect(sessionLabel(false, true, token(claims))).toBe('Ranger on duty');
  });
  it.each([
    {}, null, [], { scope: '' }, { scope: 'openid profile' },
    { scope: 'feed:otters:other' }, { scope: ['feed:otters'] },
    { permissions: 'feed:otters' }, { permissions: [] }, { permissions: [42] },
  ])('uses a neutral signed-in label without the exact permission: %j', claims => {
    expect(sessionLabel(false, true, token(claims))).toBe('Visitor');
  });
  it.each([undefined, '', 'garbage', 'a.b.c', 'a.%%%.c', 'a.e30.c.extra',
    `e30.${Buffer.from('{').toString('base64url')}.c2ln`,
  ])('safely handles missing or malformed tokens: %j', accessToken => {
    expect(sessionLabel(false, true, accessToken)).toBe('Visitor');
  });
});
