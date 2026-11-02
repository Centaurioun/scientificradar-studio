# Evidence index and private artifact hashes

Third-party screenshots and full Playwright metadata are intentionally excluded from public Git. They are stored on the research host at:

`/tmp/scientificradar-reference-evidence-2026-11-02/`

They are available only in that local environment; they are not embedded or linked as public artifacts. The public ledger contains safe measurements, evidence IDs, methods, viewport, timestamps and screenshot hashes. The selected screenshots are local inspection records, not assets for a new website.

## Environment

- Playwright 1.64.1; Google Chrome headless 155.0.8059.80; macOS host; DPR 1; locale `en-US`; empty isolated browser contexts; service workers blocked; time zone Europe/Istanbul.
- Primary run UTC time `2026-11-02T01:24:33Z` (04:24:33 Europe/Istanbul); interaction run `2026-11-02T01:25:02Z` (04:25:02 Europe/Istanbul).
- Evidence class: `PLAYWRIGHT` for all browser outputs. REA tools were available but not connected due the mission's missing exact CDP authorization; no user tabs or authenticated profile were inspected.

## Knowable blocked captures

Each attempted Knowable page was captured at desktop, tablet, mobile and 320 px stress widths. The screenshots show the Cloudflare verification page only, and must never be interpreted as the magazine layout. Top-image SHA-256 values:

| ID | Local file | SHA-256 |
|---|---|---|
| BK-001 | `knowable-home-desktop-top.png` | `00c1560b6256e077392664b94feebf756e37a2d8e8cc7b144a3734213fb2b114` |
| BK-002 | `knowable-home-tablet-top.png` | `68a8b85146ae461f019947b9d61edb0fd1a653e5ad39d9ad35453d8abbbb20bb` |
| BK-003 | `knowable-home-mobile-top.png` | `eef0fbba2f3cff2e5cbde1c0f9bbf737d6f3cf1064315398cd73e72e7afe1f88` |
| BK-004 | `knowable-home-stress-top.png` | `5e6ec542c2ec93d2e000b8d278da7ebdb068f66b1c1fb2f6143fa4a3d21ea87b` |
| BK-005 | `knowable-article-desktop-top.png` | `0f7b7b7100e3d496e92511d736f673365887405ad33eb6ed64e29f0fda7d1102` |
| BK-006 | `knowable-article-tablet-top.png` | `77bcb616de12472d27cbb68ccdd415fb423e22b35fa8279cf593244020ad96cb` |
| BK-007 | `knowable-article-mobile-top.png` | `108f85b8e31685d3c5d1bf87fc6ed291d86198c159ca203bef258712812e638d` |
| BK-008 | `knowable-article-stress-top.png` | `2f638e191281dd8d036e9e6d743a2f8a93836caf7d38727d1cdbf2a7c48f8f2d` |

The attempted Knowable article and homepage requests remained on the user-provided URLs. No article text, protected source or media download was retained. Additional private middle/end viewport screenshots exist; their repeated challenge content is not needed for public evidence.

## Quanta captures

Evidence IDs PW-001 through PW-004 map to `quanta-article-{desktop,tablet,mobile,stress}` and contain DOM/computed-style/resource metadata. The SHA-256 below is the **top viewport screenshot**. Each local context also has a middle and end screenshot, all top/middle/end files share the `quanta-article-{viewport}-{position}.png` convention.

| ID | Viewport | Top SHA-256 |
|---|---|---|
| PW-001 | 1440×900 | `85461d54734c36c8fe42ead0b75e86b6a73bf33a6f993f0e08a39bef3e060c63` |
| PW-002 | 1024×768 | `021f27d7516d1cbabb151d2d207d533c4b8bef4e41eaf1e2bf7fb4ae86f13cae` |
| PW-003 | 390×844 | `890b4f0edfe9ec263829a60692f9099facc2714f80157a97691b81ab5ddbbdd9` |
| PW-004 | 320×700 | `df84f57e81ec4dd1d59210bae311adc9c02901f13c57e14191635244c32cb556` |

Private bounded JSON records:

- `playwright-report.json` — hashed screenshots, viewport geometry, sampled styles, short labels/lengths, element counts and response metadata. SHA-256: `9a9001850447192d9d3e3678c15bea3234e245b5f4a19d03a13fded2b1d28a49`.
- `interactions-report.json` — menu, cookie-choice and keyboard interaction sequence summaries; SHA-256: `ec65003bc5307410eb8d2eb694789d6a24f5d09d31f4e6a97585882ee12253f3`.
- `semantics-report.json` — per-viewport article structural/link/figure metrics; SHA-256: `77a2e8da5ab6a3e6c58c4126edec3d6997ed5989bc8d10a5c757d3c5bec9ae1e`.

SHA-256 is a local integrity check, not a signature or proof that a third party can retrieve those private files. Only safe measurement summaries and their hashes are committed.
