# DOM and Layout Map

## Evidence boundary

Quanta Magazine's article route loaded in isolated Chromium and Playwright. Knowable Magazine remained at a 403 Cloudflare verification page, so no Knowable page structure is asserted. Measurements below describe the captured route and width settings, not every template on either site.

REA launch evidence: Quanta desktop `ev_c706695240da8462a198d60557a6be8e708616409bf5b8a082928ac2ca836d6c`. Playwright direct measurements: Chrome 155, Playwright 1.64.1. No user-profile CDP session was attached.

## Semantic tree and observable regions

```text
body
├── header[fixed; 80 px desktop/tablet, 60 px mobile]
│   └── .nav__inner
│       ├── brand/home link
│       ├── navigation and utility controls
│       └── button[aria-label="open the menu"][aria-haspopup="menu"]
├── main
│   └── div.post                         # no <article> in this sample
│       ├── fixed utility/progress region
│       ├── themed story region
│       │   ├── title/header wrapper     # max width 760 px
│       │   │   └── h1
│       │   ├── story media and metadata
│       │   └── .post__content[flex row → column]
│       │       ├── aside (rail)         # desktop only
│       │       ├── section[reading]     # 688 px outer / 560 px prose
│       │       │   ├── p, h2, h3, lists
│       │       │   └── embedded figures/media between text blocks
│       │       └── aside (anchor rail)  # desktop only
│       ├── newsletter section
│       ├── category / recommendation section
│       ├── comments section
│       └── next-story region
└── footer
```

The diagram is a reduced map: it intentionally omits third-party widgets and non-content utility controls. It expresses observed DOM order, not source component ownership.

## Landmark and content observations

| Observation | Result | Confidence |
|---|---:|---|
| `<main>` elements | 1 | High, captured route |
| `<article>` elements inside `.post` | 0 | High, captured route |
| `<h1>` | 1 | High |
| `<h2>` / `<h3>` | 8 / 7 | High |
| `<figure>` / `<figcaption>` | 12 / 7 | High counts; nested figure wrappers mean not equal to unique image stories |
| `<video>` / `<img>` in `.post` | 2 / 13 | High for this route; some assets may be hidden/lazy |
| `<aside>` in `.post` | 5 total; two layout rails | High for DOM count; role of each inferred from position/classes |
| `<time>`, `<address>`, `[rel=author]`, author/date itemprop | 0 | High for selectors queried; author information may still be plain text |
| `doi.org` links | 4 | High for captured route; does not establish a formal reference list |
| IDs in `.post` | 19 | High; likely supports in-page anchors, but exact intended mapping requires interaction testing |

A single ordered list (`<ol>`) and other lists occur in the post. Do not label the ordered list as a bibliography without inspecting its content semantics. The runtime document metadata declares Open Graph type `article`; that metadata does not compensate for the absence of a semantic `<article>` element in this sample.

## Geometry and flow

- Desktop 1440: title width 760 px, positioned x=340; article content wrapper x=140, width 1160; reading section x=376, width 688 with 64 px horizontal padding; actual prose x=440, width 560. Two side rails each measure 236 px at x=140 and x=1064.
- Tablet 1024: title width remains 760 px at x=132; reading section remains 688 px outer with 560 px prose; wrapper fills viewport. Side rails are not presented as visible in the sampled first body view.
- Mobile 390: title width 350 px at x=20; article wrapper becomes a column; reading width 390 px with 20 px padding, giving 350 px prose; side rails have `display:none`.
- Stress 320: title width 280 px at x=20; prose width 280 px; document reports `scrollWidth=326`, six pixels beyond viewport. Hidden tooltip descendants are positioned outside the viewport; attribution to one tooltip is plausible but not proven.
- Width sweep: the first sampled change from row to column occurs between 600 and 540 px; header height also changes 80→60 px in that interval. Tested widths were 600 and 540, so the exact CSS breakpoint is unknown.
- Figure wrappers can span the viewport and may nest a constrained inner figure. Captions use `<figcaption>` for seven of the twelve nodes in this route; at least some visible media have no caption node. Verify a figure's actual purpose and alternative text before reproducing the pattern.

## Header/menu DOM state

The menu control is a button labelled “open the menu” and declares `aria-haspopup="menu"`. A `div[role=menu]` exists in the DOM even while initially hidden (`visibility:hidden`, `opacity:0`). On click it becomes visible as a 1440×900 or 390×844 fixed panel after its opacity transition. It contains 24 link/button-like descendants in the inspected route. These facts do not prove that the `menu` role is used according to the ARIA menu keyboard pattern; treat that as an accessibility concern for the original implementation.

## Responsive order

The story's logical order remains title → story body/media → newsletter → category/recommendations → comments → next story → footer at tested widths. Rails are removed from visual flow at 390 px; the central body becomes the only column. The standalone media remains in editorial sequence, and recommendations/comments stay after the full body rather than moving above it.

## Original semantic target

For ScientificRadar, prefer `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`, `<figure>`, `<figcaption>`, `<time>`, `<address>`, `<ol>/<li>`, and `<footer>` where the content supports those meanings. Use `aria-label` to distinguish multiple nav regions. Expose menu state with `aria-expanded` and `aria-controls` rather than relying on visual opacity alone.
