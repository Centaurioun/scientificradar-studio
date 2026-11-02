# Evidence index

Screenshots Brave/Playwright disposable context'lerinden üretildi. Browser görüntülerinde yalnızca public seed/demo içerik var; cookie, token, personal record veya gerçek manuscript bulunmuyor.

| Evidence | Ne gösteriyor |
| --- | --- |
| `screenshots/F-001-article-tiptap.png` | Desktop, light theme, Tiptap makalesi ve inspector paneli. |
| `screenshots/F-002-article-ckeditor.png` | Desktop, light theme, CKEditor manuscript görünüyor; dev Next overlay `1 Issue` göstergesi F-001 console durumuyla eşleşiyor. |
| `screenshots/F-004-clean-tiptap.png` | Temiz Tiptap context; editor body görünür. |
| `screenshots/F-004-clean-ckeditor.png` | Temiz CKEditor context; body görünür ve dev overlay görünür. |
| `screenshots/production-art-quantum-repeater.png` | Production CKE; seed article content görünüyor, test output'unda console error yok. |
| `screenshots/production-art-solid-state-electrolyte.png` | Production CKE; farklı seeded body görünür. |
| `screenshots/production-art-denisovan-introgression.png` | Production CKE; farklı seeded body görünür. |
| `screenshots/F-003-theme-dark.png` | Theme toggle sonrasında dark mode Tiptap ekranı. |
| `screenshots/ckeditor-dark.png` | CKEditor v49.0.1 toolbar dark mode altında. |
| `screenshots/mobile-article.png` | 390×844 mobile viewport; article ve inspector stacked, yatay overflow ölçülmedi. |
| `screenshots/reader-preview.png` | Editor route içinden gerçek Reader Preview paneli/noindex demo göstergesi. |
| `screenshots/F-005-disposable-ckeditor-edit.png` | Disposable marker yazıldıktan sonra CKEditor edit yüzeyi. |
| `screenshots/tab-Taxonomy.png` | Taxonomy paneli açıldı. |
| `screenshots/tab-Sources--1-.png` | Sources paneli açıldı. |
| `screenshots/tab-Figure.png` | Figure paneli açıldı. |
| `screenshots/tab-SEO.png` | SEO paneli ve audit özeti açıldı. |
| `screenshots/tab-History--3-.png` | History paneli açıldı; restore mutation çalıştırılmadı. |

Temporary console/route JSON ve scripts `/tmp/sr-browser-results.json`, `/tmp/sr-isolate-results.json`, `/tmp/sr-prod-check.json`, `/tmp/sr-adversarial.json` ve `/tmp/sr-*` altındaydı; bunlar Git'e eklenmedi. Direct route resultleri ve özetler `ROUTE_AND_CONTROL_COVERAGE.csv` ve bu raporlara kaydedildi.

Source evidence spans (denetlenen SHA):

- CKEditor dış sync effect ve dependency listesi: `components/editor/article-ckeditor.tsx:446-488`.
- Workspace `availableSources`, `trustedImageSources`, `onSyncJson` props: `components/editor/article-workspace.tsx:1024-1050`.
- Engine switch ve URL query state: `components/editor/article-workspace.tsx:155-169`, `972-1023`.
- CKEditor dynamic client import/loading UI: `components/editor/article-workspace.tsx:42-51`.
