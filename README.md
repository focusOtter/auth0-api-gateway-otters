# Otter Ops

Blog post example. Documentation coming soon.

## Local API stand-in

Use Node 22 (`nvm use`), then `npm ci`. Copy `web/.env.example` to
`web/.env.local`, and `infra/.env.example` to `infra/.env.local`.
Fill in your Auth0 settings in both; set the web API URL to
`NEXT_PUBLIC_API_URL=http://localhost:4000`. Use the same audience in both.
Generate the web session secret with `openssl rand -hex 32`.

Configure an Auth0 Regular Web Application with callback URL
`http://localhost:3000/auth/callback` and logout URL `http://localhost:3000`.
Register an Auth0 API with RS256 signing and the `feed:otters` permission;
ensure your test user can receive that scope (including any RBAC grants).

`npm run dev` starts web on :3000 and the local API on :4000.
`npm run dev:api` starts only the API. This is a **local teaching stand-in**, not
AWS API Gateway: it uses Auth0's JWKS to validate issuer, audience, signature,
token times and feeding scope, then calls the very same Lambda handlers.
It mirrors the example's CORS policy and 401/403 responses, not all AWS behavior
(quotas, logging, deployment stages, JWT key-cache timing, etc.). It binds to loopback.
The browser still calls the API directly; Next's `proxy.ts` only hosts Auth0's
session endpoints. An OPTIONS preflight is unauthenticated; a disallowed origin
receives no allow-origin header. CORS is a browser boundary, not authentication.

For AWS, use the CDK commands and exported environment variables or context;
the local `.env.local` loader belongs to the dev server only.
