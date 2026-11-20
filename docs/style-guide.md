# Otter Ops — custom diagram tokens

Style gate: **(d) pasted tokens**, taken from `web/app/globals.css`.
Project-local profile; the installed diagram-design defaults are not modified.

| Role | Token |
| --- | --- |
| paper | `#f8f5ec` |
| paper-2 | `#eeefdf` |
| ink | `#183e36` |
| muted / soft | `#53665c` |
| rule | `#d9ddcc` |
| accent | `#d67742` |
| accent-tint | `#f4e5d7` |
| link | `#265b47` |
| leaf | `#deed9d` |
| title / callout | Georgia, serif; 400 / italic |
| node / body | Arial, Helvetica, sans-serif; 600 / 400 |
| technical / eyebrow | monospace; 400 |

These are the app's system font stacks, not webfont substitutions. Vendor logos
keep their official colors. Architecture: static, engineer audience, custom
1280 × 1000 fit canvas. Typography is sized for the exported wide blog figure.

## Rebuilding artwork

`python3 docs/render-artwork.py` generates the self-contained HTML sources.
With Playwright + Chromium installed in your Python environment, use the
[diagram-design skill](https://github.com/cathrynlavery/diagram-design) exporters:

```sh
python3 "$DIAGRAM_SKILL/scripts/export_png.py" docs/architecture.html docs/architecture.png 2
python3 "$DIAGRAM_SKILL/scripts/export_svg.py" docs/architecture.html docs/architecture.svg
python3 "$DIAGRAM_SKILL/scripts/export_png.py" docs/architecture-rest.html docs/architecture-rest.png 2
python3 "$DIAGRAM_SKILL/scripts/export_svg.py" docs/architecture-rest.html docs/architecture-rest.svg
python3 "$DIAGRAM_SKILL/scripts/export_png.py" docs/og.html docs/og.png 1
```

`DIAGRAM_SKILL` is the path to `skills/diagram-design` in that checkout.
