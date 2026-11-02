# ScientificRadar Web — Centralized Design Tokens (`v1.0`)

All visual layout parameters, reading column widths, typography variables, and surface colors are centralized in:
- `app/globals.css` (CSS Custom Properties on `:root`)
- `lib/design/tokens.ts` (Typed TypeScript token constants & reading width presets)

## 1. Layout & Reading Width Tokens

| CSS Custom Property | Initial Default | Purpose |
| --- | --- | --- |
| `--sr-page-max` | `1320px` | Maximum outer width for homepage grids, header, and topic listings |
| `--sr-reading-max` | `700px` | Long-form article prose measure (switchable at runtime to `600px` or `560px`) |
| `--sr-heading-max` | `880px` | Article header title (`<h1>`) and dek container max width |
| `--sr-figure-max` | `1100px` | Breakout width for wide scientific diagrams and comparison tables |
| `--sr-gutter` | `clamp(16px, 3vw, 40px)` | Fluid horizontal viewport padding |

## 2. Typography Tokens

| Token / Class | Font Family & Delivery | Role |
| --- | --- | --- |
| `--font-editorial` (`.font-editorial`) | `Merriweather` (`latin`, `latin-ext`, self-hosted at build via `next/font/google`) | Editorial headlines, subheadings (`H1`–`H3`), pull quotes, and long-form article prose |
| `--font-interface` (`.font-sans`) | `Inter` (`latin`, `latin-ext`, self-hosted at build via `next/font/google`) | Navigation, disclosure controls, timestamps, figure credits, tables, and search inputs |
| `.font-math` | `"KaTeX_Main", "Latin Modern Math", "STIX Two Math", "Cambria Math", Georgia, serif` | Mathematical notation independent of editorial body font |
| `--sr-body-size` | `clamp(17px, 1.25vw, 19px)` | Long-form reading font size |
| `--sr-prose-leading` | `1.72` | Long-form paragraph line-height |

## 3. Color Palette Tokens (60-30-10 Editorial Discipline)

| CSS Custom Property | Value | Role |
| --- | --- | --- |
| `--sr-paper` | `#FAFAF8` | Primary archival warm paper canvas (60%) |
| `--sr-surface` | `#F2F1EC` | Secondary structural callout, table caption, and card surface (30%) |
| `--sr-ink` | `#181C21` | Primary deep charcoal editorial text |
| `--sr-ink-secondary` | `#363E47` | Secondary dek and table text |
| `--sr-muted` | `#525B65` | Metadata, timestamps, and credits (WCAG AA contrast compliant) |
| `--sr-accent` | `#15747B` | Restrained scientific teal for links, kickers, and primary interactive controls (10%) |
| `--sr-accent-hover` | `#0E565C` | Darker interactive hover/active state |
| `--sr-rule` | `#DCE2E4` | Hairline structural borders |
