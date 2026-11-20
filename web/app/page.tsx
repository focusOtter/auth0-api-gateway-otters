'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAccessToken, useUser } from '@auth0/nextjs-auth0';
import { RiverMark } from './marks';

type Otter = { id: string; name: string; species: string; river: string; favoriteSnack: string };
type Result = { label: string; status: number | null; body: unknown };
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export default function Home() {
  const { user, isLoading } = useUser();
  const [facts, setFacts] = useState<string[]>([]);
  const [otters, setOtters] = useState<Otter[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(path: string, authenticated = false, snack?: string) {
    setBusy(true);
    const method = snack ? 'POST' : 'GET';
    try {
      if (!apiUrl) throw new Error('Set NEXT_PUBLIC_API_URL to your deployed API Gateway URL, then restart the web app.');
      const headers: Record<string, string> = {};
      if (authenticated) headers.Authorization = `Bearer ${await getAccessToken()}`;
      if (snack) headers['Content-Type'] = 'application/json';
      const response = await fetch(`${apiUrl}${path}`, { method, headers, ...(snack ? { body: JSON.stringify({ snack }) } : {}) });
      const text = await response.text();
      let body;
      try { body = JSON.parse(text); } catch { body = text; }
      setResult({ label: `${method} ${path}`, status: response.status, body });
      if (response.ok && path === '/otters/facts') setFacts(body.facts);
      if (response.ok && path === '/otters') setOtters(body.otters);
    } catch (error) {
      setResult({ label: `${method} ${path}`, status: null, body: { error: error instanceof Error ? error.message : 'Request failed. Check your network and API CORS origins.' } });
    } finally { setBusy(false); }
  }

  return (
    <main>
      <header className="nav shell">
        <Link className="brand" href="/" aria-label="Otter Ops home"><span aria-hidden="true"><RiverMark /></span> OTTER OPS<span className="edition">FIELD STATION / 01</span></Link>
        <div className="account"><span className="session"><i />{isLoading ? 'Checking session' : user ? 'Ranger on duty' : 'Visitor mode'}</span><a className="button small" href={user ? '/auth/logout' : '/auth/login'}>{user ? 'Sign out ↗' : 'Ranger sign in ↗'}</a></div>
      </header>

      <section className="hero shell">
        <div><p className="eyebrow">A SMALL RIVER. A STRONG SECURITY BOUNDARY.</p><h1>Little paws.<br />Proper <em>permissions.</em></h1><p className="intro">Welcome to Otter Ops. Meet the raft, deliver a snack, and see how Auth0 + AWS API Gateway keep our river in good hands.</p><a className="text-link" href="#station">Explore the field station <span aria-hidden="true">↓</span></a></div>
        <div className="river-art" role="img" aria-label="An otter floating in a river, protected by a JWT checkpoint"><span className="map-label">THE AUTHORIZED WATERWAY</span><div className="river-line one" /><div className="river-line two" /><span className="reed left"><RiverMark kind="reed" /></span><span className="floating-otter"><RiverMark /></span><span className="reed right"><RiverMark kind="reed" /></span><span className="checkpoint">✓ JWT CHECKPOINT</span><span className="coordinates">45° RIVER NORTH / ALL PAWS WELCOME</span></div>
      </section>

      <div className="flow"><div className="shell"><span>01 <b>Sign in with Auth0</b></span><span aria-hidden="true">→</span><span>02 <b>Browser gets an access token</b></span><span aria-hidden="true">→</span><span>03 <b>Gateway checks the JWT</b></span></div></div>

      <section className="shell station" id="station">
        <div className="section-heading"><div><p className="eyebrow">THE FIELD STATION</p><h2>A little curiosity goes a long way.</h2></div><span className="stamp">LIVE API EXPLORER</span></div>
        <div className="explorer-grid">
          <article className="facts card"><span className="tag">PUBLIC · NO TOKEN</span><span className="card-icon" aria-hidden="true"><RiverMark kind="shell" /></span><h3>River-side wisdom</h3><p>No secret handshake here. This endpoint is open to every curious visitor.</p><button disabled={busy} onClick={() => call('/otters/facts')}>Discover otter facts ↗</button>{facts.length > 0 && <ul className="facts-list">{facts.map(fact => <li key={fact}>{fact}</li>)}</ul>}<code>GET /otters/facts</code></article>
          <article className="roster card"><div className="card-top"><span className="tag">PROTECTED · JWT REQUIRED</span><span aria-hidden="true">↗</span></div><h3>Meet your river crew.</h3><p>The roster needs a valid access token. Feeding time needs one more thing: the <code>feed:otters</code> scope.</p>{user ? <button disabled={busy} onClick={() => call('/otters', true)}>Load the raft ↗</button> : <a className="button" href="/auth/login">Sign in to meet the raft ↗</a>}<div className="roster-preview" aria-hidden="true"><span><RiverMark /></span><span><RiverMark kind="shell" /></span><span><RiverMark kind="reed" /></span><p>Three personalities.<br />One very hungry raft.</p></div><code>GET /otters · POST /otters/&#123;id&#125;/snacks</code></article>
        </div>

        {user && otters.length > 0 && <div className="otter-grid">{otters.map(otter => <article className="otter-card" key={otter.id}><span className="otter-mark" aria-hidden="true"><RiverMark /></span><p className="eyebrow">{otter.river}</p><h3>{otter.name}</h3><p>{otter.species}</p><button disabled={busy} onClick={() => call(`/otters/${otter.id}/snacks`, true, otter.favoriteSnack)}>Feed a snack · {otter.favoriteSnack} ↗</button></article>)}</div>}

        <section className="console-grid" aria-label="Authorization experiment"><div className="challenge"><span className="eyebrow">TRY THE LOCK, NOT JUST THE KEY</span><h3>No token? No otters.</h3><p>Call the protected roster without credentials. Expect a <strong>401 Unauthorized</strong> from the gateway, before Lambda ever runs. A valid token without the feeding scope gets a 403 on snack duty.</p><button className="outline" disabled={busy} onClick={() => call('/otters')}>Call without token ↗</button><p className="fine">Requests go directly from this browser to API Gateway. No Next.js API proxy. Tokens are never displayed.</p></div><div className="terminal"><div className="terminal-bar"><span><i /> REQUEST LOG</span><span>{busy ? 'PADDLING…' : 'READY'}</span></div><div aria-live="polite" aria-busy={busy}><div className="request-label">{result?.label ?? 'Waiting for your first expedition…'}</div>{result && <><span className={`status ${result.status && result.status < 300 ? 'success' : ''}`}>{result.status ?? 'NETWORK / CLIENT ERROR'}</span><pre>{JSON.stringify(result.body, null, 2)}</pre></>}{!result && <p className="terminal-hint">Pick an endpoint above.<br />The river will respond here.</p>}</div></div></section>
      </section>
      <footer className="shell"><Link className="brand" href="/"><RiverMark /> OTTER OPS</Link><p>Built for curious minds. Secured for hungry otters.</p><span>AUTH0 × AWS</span></footer>
    </main>
  );
}
