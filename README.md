# ScientificRadar Studio

*Write science. Refine with confidence. Publish with control.*

A modern, AI-assisted editorial CMS prototype for **ScientificRadar** (`scientificradar.com`), built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Tiptap**.

> **Safety & Production Isolation Notice:** This repository implements the **Gate P0 Isolated Prototype** defined in [`docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md`](docs/SCIENTIFICRADAR_STUDIO_MASTER_SPEC.md). **Production website `scientificradar.com` is completely untouched.** Selecting `Publish` updates local IndexedDB demo state only.

---

## Architecture & Module Boundaries

- **Framework:** Next.js App Router (`app/`), React Client & Server Components, TypeScript.
- **Persistence (`lib/studio-context.tsx` & `lib/seed-data.ts`):** Browser-side IndexedDB repository (`idb`) with automatic in-memory fallback and JSON snapshot export/import. Seeded with 8 illustrative English and Turkish scientific articles, 7 top-level science categories + 25 subcategories, normalized tags, author profiles, media figures, primary peer-reviewed citations, and version snapshots.
- **Pure Editorial Logic (`lib/editorial-rules.ts`):**
  - Enforces a **single rendered `<H1>`** derived strictly from the Article Title.
  - Configures Tiptap body headings to **H2 and H3 only** and automatically demotes pasted Markdown `# Heading` or HTML `<h1>` tags to `<h2>` with a visible editor notice.
  - Sanitizes pasted HTML (strips `<script>`, inline event handlers, and `javascript:`/`data:` URLs).
  - Enforces non-destructive `object-fit: contain` and position locks for scientific figures, charts, and diagrams.
  - Runs deterministic **Local Checks (not Codex)** for the *Prepare with Codex* workflow with side-by-side diff review and non-destructive version creation.

---

## Feature Status Report (P0 vs P1/P2 Gates)

| Capability | Gate | Status in This Build | Notes |
|---|---|---|---|
| Editorial Dashboard & Configurable Widgets | P0 | **Working** | Real counts from demo records; zero fake traffic or revenue charts |
| Configurable Left Sidebar (`Balanced`, `Show All`, `Minimal`) | P0 | **Working** | Individual module toggles persisted in IndexedDB; `Restore Defaults` included |
| Articles List, Search, Saved Filters, Bulk Actions, Duplicate | P0 | **Working** | Unique slug collision prevention per locale (`en` / `tr`) |
| Wide Tiptap Editor (Title = Sole H1; Body = H2/H3) | P0 | **Working** | Markdown `# H1` paste guard, safe link validator, autosave indicator |
| Collapsible Metadata Inspector & Version History | P0 | **Working** | Taxonomy, Sources/DOIs, Figure layout lock, SEO, non-destructive snapshot restore |
| Static Pages (`Editorial Policy`, `Corrections`, `About`, etc.) | P0 | **Working** | Full list, Tiptap editor, and `noindex` preview |
| Homepage Blocks & Dual Hover/Click Menus | P0 | **Working** | Reorderable hero/featured/banner blocks and interactive menu preview |
| Smart Knowledge Links (Internal + Wikipedia Popovers) | P0 | **Working** | Desktop hover, keyboard focus + `Esc` dismiss, and mobile tap popover |
| Prepare with Codex Drawer (Local Checks + Diff Review) | P0 | **Working (Local Checks)** | Runs real local deterministic checks; remote Codex clearly marked `Not Connected` |
| PostgreSQL Backend & Server-Side RBAC | P1 | **Planned (Deferred)** | Demo Role Switcher simulates Owner/Editor/Reviewer/Author in P0 |
| Cloudflare R2 & Image Transformations | P1 | **Not Connected (Truthful UI)** | Uses Local Demo Storage adapter and preset definitions |
| Codex App-Server / Sign in with ChatGPT | P2 | **Not Connected (Truthful UI)** | Adapter interface ready; no unauthorized token scraping |
| Google AdSense, GA4, Search Console, Tag Manager | P2 | **Not Connected (Truthful UI)** | Honest setup cards under `Settings → Integrations` |

---

## Runtime

Use Node.js 24.22.2 (pinned in `.nvmrc`; supported range `>=24.22.2 <25`) and Bun 1.4.0 for unit tests and package installation. Node.js runs Next.js and server-side publishing routes; Bun remains the test runner.

For standalone production build/start, private SQLite storage, reverse-proxy examples, health checks, backups and rollback, see the [Studio deployment runbook](docs/deployment-studio.md).

## Local Development & Verification Commands

```bash
# Start development server on port 3000
npm run dev

# Run deterministic unit tests (11 tests covering H1 demotion, sanitization, DOIs, roles, local checks)
npm test

# Run TypeScript compiler verification
npm run typecheck

# Run ESLint
npm run lint

# Build production bundle
npm run build
```
