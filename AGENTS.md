# ScientificRadar — Agent Instructions

These instructions apply to this repository. Existing code, tests, approved specifications, and repository-specific instructions remain authoritative; Framer is an optional experimental tool, not a source of truth.

**Repository role:** ScientificRadar Studio — editorial administration and scientific content workflows. Keep editor behavior and existing content models authoritative.

## Framer Experimental Design Environment

**Purpose:** Explore and evaluate UI/UX ideas without creating a production dependency on Framer or Unframer.

- **Framer editor / MCP project:** https://framer.com/projects/boKLyC3EXgf7Nhs9yoC7
- **Published visual reference:** https://invigorated-technology-885071.framer.app/
- **Related repositories:**
  - Public website: https://github.com/Centaurioun/ScientificRadar-web
  - Editorial CMS: https://github.com/Centaurioun/scientificradar-studio

**Important context (verified 2026-11-07):** The existing Framer project contains an older **Denzel** blog template with demonstration content. It is **not** ScientificRadar's approved brand, canonical design, production website, or current CMS. Its published URL is a historical experimental reference only.

### Recommended experimental workflow

1. When a task would benefit from prototyping, inspect the existing ScientificRadar implementation and approved design decisions **first**. Do not initiate unrelated redesigns.
2. Use the **official Framer MCP integration**, when connected and authorized, to inspect editable layers, component variants, colors, typography, spacing, breakpoints, and screenshots. Verify permissions; do not assume an MCP connection can write.
3. Develop isolated design explorations in Framer only when requested. Compare desktop, tablet, and mobile states; assess usability, accessibility, readability, and feasibility.
4. Inspect the published Framer preview with browser tools when useful, but do not treat “View Page Source” as the original, maintainable React/Next.js source.
5. Document reusable design decisions (components, tokens, dimensions, interaction states, responsive behavior) and **reimplement approved ideas** as native, maintainable React/Next.js code in the correct ScientificRadar repository.
6. Make application changes on a separate Git branch/PR with relevant review, tests, and visual verification. Do not merge or deploy without the owner's authorization.

### Non-negotiable boundaries

- **No required Framer or Unframer dependency** in the deployed ScientificRadar application; experimentation must remain disposable.
- **Do not migrate** ScientificRadar Studio's scientific editor, content model, editorial workflow, or data persistence to Framer. Do not replace the website's existing Next.js architecture.
- **Do not assume automatic synchronization** between Framer, ScientificRadar Web, and ScientificRadar Studio. Any integration requires its own explicit design and authorization.
- **Do not reuse** the Denzel theme's third-party branding, article content, imagery, or other assets without verifying applicable rights.
- **Never change** `scientificradar.com` DNS, Cloudflare settings, domain connections, hosting, or “Auto connect” as part of a Framer experiment.
- **Do not publish** the Framer project, alter live domain routing, activate paid services, subscribe to export tools, or incur costs without explicit owner approval. The old Framer project may still have `scientificradar.com` listed as a pending custom domain.
- **Never commit** Framer credentials, project API keys, MCP secrets, or other sensitive tokens. Do not send private scientific manuscripts, unpublished CMS content, or credentials to third-party export services without authorization.
- Framer-generated ideas must still meet ScientificRadar's standards for responsive accessibility, clean maintainable code, provenance, accurate scientific metadata, security, and test coverage.

This document **does not** authorize changes to Framer, application code, GitHub branches, production settings, or billing on its own; actions require task-specific instructions.
