"""Generate branded, self-contained diagram-design HTML sources; export with the skill scripts."""
from pathlib import Path
import re

DOCS = Path(__file__).resolve().parent


def icon(name, x, y, size=40):
    source = (DOCS / 'icons' / f'{name}.svg').read_text()
    source = re.sub(r'<title>.*?</title>', '', source)
    return source.replace('<svg ', f'<svg x="{x}" y="{y}" width="{size}" height="{size}" aria-hidden="true" ', 1)


def page(title, svg, width):
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><style>
:root{{--paper:#f8f5ec;--ink:#183e36;--muted:#53665c;--accent:#d67742}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}}
.frame{{max-width:100%;min-width:0}}.diagram-container{{width:100%;overflow-x:auto}}
.diagram-container>svg{{width:100%;min-width:{width}px;display:block}}
svg text{{fill:#183e36;font-family:Arial,Helvetica,sans-serif}}.title{{font-family:Georgia,serif;font-size:40px}}
.name{{font-size:20px;font-weight:600}}.body{{font-size:16px}}.tech{{font-family:monospace;font-size:13px}}
.eyebrow{{font-family:monospace;font-size:11px;letter-spacing:1.6px;fill:#53665c}}
.edge-label{{font-family:monospace;font-size:11px;letter-spacing:.5px;fill:#265b47}}
.edge{{fill:none;stroke:#265b47;stroke-width:2;marker-end:url(#arrow)}}
.return{{stroke-dasharray:5 4}}.node{{fill:#fffdf5;stroke:#d9ddcc;stroke-width:1.5}}
@media print{{.diagram-container{{overflow-x:visible}}.diagram-container>svg{{min-width:0}}}}
</style></head><body><main class="frame"><div class="diagram-container">{svg}</div></main></body></html>'''


architecture = '''<svg viewBox="0 0 1280 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="architecture-title architecture-desc">
<title id="architecture-title">Otter Ops: from sign-in to snack time</title>
<desc id="architecture-desc">The Next.js browser signs in with Auth0, obtains an access token for https://otters.api, and fetches API Gateway directly. CORS allows the web origin. Facts bypass JWT authorization. Roster needs a verified JWT; snacks additionally require feed:otters. Invalid credentials return 401; missing scope returns 403, without invoking Lambda.</desc>
<defs><marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0 8 3 0 6Z" fill="#265b47" /></marker></defs>
<rect width="1280" height="1000" fill="#f8f5ec" />
<text x="48" y="44" class="eyebrow">OTTER OPS / ARCHITECTURE / 01</text>
<text x="48" y="96" class="title">From sign-in to snack time.</text>
<text x="1232" y="92" text-anchor="end" class="tech">Auth0 + AWS API Gateway + CDK</text>

<rect x="392" y="224" width="400" height="496" rx="8" fill="#183e36" fill-opacity=".02" stroke="#53665c" stroke-dasharray="6 4" />
<text x="1232" y="264" text-anchor="end" class="eyebrow">AWS / NODE 22 LAMBDA HANDLERS</text>

<!-- Connectors precede nodes. Auth0's token returns to the browser, not to AWS. -->
<path class="edge" d="M112 344V264" />
<path class="edge return" d="M208 264V344" />
<path class="edge" d="M272 380H432" />
<path class="edge" d="M752 356H960" />
<path class="edge" d="M512 408V504" />
<path class="edge" d="M752 548H960" />
<path class="edge" d="M752 608H880Q888 608 888 616V708Q888 716 896 716H960" />
<path class="edge return" d="M600 656V800" />

<!-- Labels live beside their connector, on opaque paper with a visible gap. -->
<rect x="48" y="292" width="54" height="20" fill="#f8f5ec" /><text x="75" y="306" text-anchor="middle" class="edge-label">LOGIN</text>
<rect x="218" y="292" width="112" height="20" fill="#f8f5ec" /><text x="274" y="306" text-anchor="middle" class="edge-label">ACCESS TOKEN</text>
<rect x="280" y="348" width="144" height="24" fill="#f8f5ec" /><text x="352" y="364" text-anchor="middle" class="edge-label">DIRECT FETCH</text>
<rect x="796" y="324" width="156" height="24" fill="#f8f5ec" /><text x="874" y="340" text-anchor="middle" class="edge-label">PUBLIC BYPASS</text>
<rect x="524" y="444" width="116" height="24" fill="#f8f5ec" /><text x="582" y="460" text-anchor="middle" class="edge-label">PROTECTED</text>
<rect x="800" y="516" width="144" height="24" fill="#f8f5ec" /><text x="872" y="532" text-anchor="middle" class="edge-label">JWT VALID</text>
<rect x="760" y="576" width="120" height="24" fill="#f8f5ec" /><text x="820" y="592" text-anchor="middle" class="edge-label">SCOPE VALID</text>
<rect x="612" y="748" width="80" height="24" fill="#f8f5ec" /><text x="652" y="764" text-anchor="middle" class="edge-label">REJECT</text>

<rect class="node" x="48" y="144" width="224" height="120" rx="6" />
{{AUTH0}}<text x="120" y="184" class="name">Auth0</text>
<text x="68" y="216" class="tech">aud: https://otters.api</text><text x="68" y="240" class="body">Login → access token</text>

<rect class="node" x="48" y="344" width="224" height="160" rx="6" />
<g transform="translate(68 400)" fill="none" stroke="#183e36" stroke-width="2"><rect x="0" y="0" width="32" height="22" rx="2" /><path d="M-4 28h40M10 22v6m12-6v6" /></g>
<text x="116" y="420" class="name">Browser</text><text x="68" y="452" class="body">Next.js · localhost / Vercel</text><text x="68" y="480" class="tech">SDK: getAccessToken()</text>

{{GATEWAY}}<text x="472" y="264" class="name">API Gateway HTTP API</text>
<rect class="node" x="432" y="304" width="320" height="104" rx="6" />
<text x="452" y="336" class="name">CORS preflight</text><text x="452" y="364" class="body">Allow the configured web origins</text><text x="452" y="388" class="tech">OPTIONS · no token required</text>
<rect x="432" y="504" width="320" height="152" rx="6" fill="#eeefdf" stroke="#265b47" stroke-width="2" />
<text x="452" y="536" class="name">Auth0 JWT authorizer</text><text x="452" y="564" class="tech">Auth0 JWKS · RS256 signature</text><text x="452" y="588" class="tech">iss: https://AUTH0_DOMAIN/</text><text x="452" y="612" class="tech">aud: https://otters.api</text><text x="452" y="636" class="tech">POST scope: feed:otters</text>

<rect class="node" x="960" y="304" width="272" height="104" rx="6" />{{FACTS}}
<text x="1032" y="340" class="name">Facts · public</text><text x="980" y="380" class="tech">GET /otters/facts</text>
<rect class="node" x="960" y="504" width="272" height="104" rx="6" />{{ROSTER}}
<text x="1032" y="540" class="name">Roster · JWT</text><text x="980" y="580" class="tech">GET /otters · caller: sub</text>
<rect class="node" x="960" y="664" width="272" height="104" rx="6" />{{SNACKS}}
<text x="1032" y="700" class="name">Snacks · scoped</text><text x="980" y="740" class="tech">POST /otters/{id}/snacks</text>

<rect x="432" y="800" width="320" height="92" rx="6" fill="#f4e5d7" stroke="#d67742" stroke-width="2" />
<text x="452" y="832" class="name">401 / 403 · request stops</text><text x="452" y="860" class="body">No Lambda invocation</text>
<text x="48" y="580" class="body">The browser calls AWS directly.</text><text x="48" y="608" class="body">Next.js manages the Auth0 session;</text><text x="48" y="636" class="body">it does not proxy the otter API.</text>
<text x="808" y="824" class="body">401 · missing, expired or invalid JWT</text><text x="808" y="852" class="body">403 · valid JWT, missing feeding scope</text><text x="808" y="888" class="tech">Response returns to the browser.</text>
<path d="M48 928H1232" stroke="#d9ddcc" />
<text x="48" y="956" class="tech">→ request</text><text x="208" y="956" class="tech">⇢ return / rejection</text><text x="520" y="956" class="tech">CDK provisions API Gateway + Lambda.</text>
<text x="48" y="984" class="eyebrow">CORS CONTROLS BROWSER ACCESS. JWT AUTHORIZATION CONTROLS API ACCESS.</text>
</svg>'''
for placeholder, name, x, y, size in [
    ('AUTH0', 'auth0', 68, 160, 36), ('GATEWAY', 'api-gateway', 416, 240, 40),
    ('FACTS', 'lambda', 980, 320, 36), ('ROSTER', 'lambda', 980, 520, 36), ('SNACKS', 'lambda', 980, 680, 36),
]:
    architecture = architecture.replace('{{' + placeholder + '}}', icon(name, x, y, size))
(DOCS / 'architecture.html').write_text(page('Otter Ops architecture', architecture, 1280))

rest_architecture = architecture.replace('architecture-title', 'architecture-rest-title').replace('architecture-desc', 'architecture-rest-desc')
rest_architecture = rest_architecture.replace('API Gateway HTTP API', 'API Gateway REST API')
rest_architecture = rest_architecture.replace('OTTER OPS / ARCHITECTURE / 01', 'OTTER OPS / REST ARCHITECTURE / 02')
rest_architecture = rest_architecture.replace('CORS preflight', 'CORS · Lambda adapter')
rest_architecture = rest_architecture.replace('OPTIONS · no token required', 'OPTIONS · 204 · no token required')
rest_architecture = rest_architecture.replace('CDK provisions API Gateway + Lambda.', 'REST claims: authorizer.claims.sub')
(DOCS / 'architecture-rest.html').write_text(page('Otter Ops REST architecture', rest_architecture, 1280))

marks = (DOCS.parent / 'web/app/marks.tsx').read_text()
otter = marks.split("kind === 'otter' ? <>")[1].split('</>')[0]
for jsx, xml in [('strokeWidth', 'stroke-width'), ('strokeLinecap', 'stroke-linecap')]:
    otter = otter.replace(jsx, xml)
og = f'''<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="og-title og-desc">
<title id="og-title">Otter Ops — Little paws. Proper permissions.</title><desc id="og-desc">Secure an AWS API Gateway HTTP API with an Auth0 JWT authorizer. Auth0 + AWS API Gateway + CDK.</desc>
<rect width="1200" height="630" fill="#f8f5ec" />
<path d="M800 0h400v630H800c150-180-150-300 0-630Z" fill="#dbe6c8" />
<path d="M966-40c-250 250 210 410-40 710" fill="none" stroke="#a9c9bf" stroke-width="130" />
<path d="M966-40c-250 250 210 410-40 710" fill="none" stroke="#83a89b" stroke-width="2" stroke-dasharray="8 8" />
<text x="64" y="68" class="eyebrow">FIELD STATION / 01 · AN AUTH0 + AWS EXAMPLE</text>
<text x="64" y="164" style="font:64px Georgia,serif">Otter Ops</text>
<text x="64" y="252" style="font:52px Georgia,serif">Little paws.</text><text x="64" y="316" style="font:italic 52px Georgia,serif;fill:#537758">Proper permissions.</text>
<text x="64" y="384" style="font:22px Arial,sans-serif">Secure an AWS API Gateway HTTP API</text><text x="64" y="416" style="font:22px Arial,sans-serif">with an Auth0 JWT authorizer.</text>
<g transform="translate(850 192) rotate(-14 120 120) scale(2)" fill="none">{otter}</g>
<rect x="64" y="480" width="584" height="64" rx="6" fill="#183e36" />
<text x="88" y="520" style="font:22px Arial,sans-serif;fill:#f8f5ec">Auth0 + AWS API Gateway + CDK</text>
<text x="64" y="592" class="eyebrow">PUBLIC FACTS. PROTECTED OTTERS. SCOPED SNACKS.</text>
<rect x="868" y="464" width="248" height="40" rx="4" fill="#f8f5ec" stroke="#183e36" /><text x="992" y="489" text-anchor="middle" class="tech">JWT CHECKPOINT / VERIFIED</text>
</svg>'''
(DOCS / 'og.html').write_text(page('Otter Ops social image', og, 1200))
print('Generated architecture.html (1280x1000) and og.html (1200x630).')
