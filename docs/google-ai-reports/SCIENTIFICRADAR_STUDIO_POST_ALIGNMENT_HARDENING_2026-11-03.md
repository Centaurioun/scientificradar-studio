# Post-Alignment Studio Safety Corrections — 2026-11-03

Source Studio commit: `610f4d543f87581e446d0f3a08fec404c94a2014`.
Pinned Web route: `/article/[slug]` at `3b096e84023ca1ba358b7d7dd4f25f17185fc8d7`.

1. **Rights evidence:** Studio no longer equates attribution text or alt review with media permission. The optional `rightsApproval` record requires an explicit approval, reviewer, UTC timestamp and evidence ID; missing approval fails the prepublish audit. Preview labels remain empty/unverified rather than inventing a credit or Creative Commons licence. This is a local gate, not server-authenticated proof.
2. **Canonical:** Studio's publication serializer now emits the actual `https://scientificradar.com/article/{slug}` route, not a nonexistent locale/category path. No site indexability was enabled.
3. **Untrusted receipts:** Caller-supplied `serverVerified: true` no longer causes the isolated Studio serializer to publish. Authenticated backend receipt, revision/content hash and role verification are future integration requirements.

Existing published-shaped fixture data is deliberately synthetic **Web consumer test data only**, `noindex: true`, not a real Studio publishing receipt. Fabricated DOI generation was removed from the test fixture inputs. Previous M1–M7 report remains historical and its claims about rights and local receipt authorization are superseded here.

**Scope:** Studio app only. Web validator's own rights gate must be repaired separately. Do not claim production publishing is configured.

**Verification:** Review the GitHub Actions results for unit, typecheck, lint, build, Chromium E2E and CKEditor regression before merge.
