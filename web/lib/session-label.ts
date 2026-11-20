// Decoded claims affect presentation only; API Gateway enforces authorization.
export function sessionLabel(isLoading: boolean, signedIn: boolean, token?: string): string {
  if (isLoading) return 'Checking session';
  if (!signedIn) return 'Visitor mode';
  try {
    if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return 'Visitor';
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), char => char.charCodeAt(0))));
    if (claims && typeof claims === 'object') {
      const scoped = 'scope' in claims && typeof claims.scope === 'string' && claims.scope.split(/\s+/).includes('feed:otters');
      const permitted = 'permissions' in claims && Array.isArray(claims.permissions) && claims.permissions.includes('feed:otters');
      if (scoped || permitted) return 'Ranger on duty';
    }
  } catch {}
  return 'Visitor';
}
