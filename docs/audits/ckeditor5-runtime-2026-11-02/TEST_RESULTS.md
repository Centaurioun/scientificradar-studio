# Test ve komut sonuçları

Tüm başarılı uygulama kontrolleri exact audit SHA `a6e8938ce45c724be5178aac20c7089bc6864dbd` worktree'sinde çalıştı. Shell PATH'e `/Users/yusuf/.bun/bin` eklendi. Hatalı ilk çağrılar ve yeniden koşulan doğru çağrılar ayrı kaydedilmiştir.

| Komut / deneme | Çalışma dizini ve runtime | Exit / sayım | Sonuç |
| --- | --- | --- | --- |
| `git fetch origin` | primary checkout; Git metadata | 0 | `origin/main=a6e8938ce45c724be5178aac20c7089bc6864dbd` |
| `bun install --frozen-lockfile` (ilk yanlış cwd) | `/Users/yusuf/Repos/scientificradar-studio`, Node 26.12.1/Bun 1.4.0 | 0; eski main dependency graph | İstenmeden primary checkout'ta çalıştı; ignored `node_modules` etkilenmiş olabilir. Kaynak diff'i eişlenmedi; mevcut başlangıç dirty dosyaları korundu. |
| `bun install --frozen-lockfile` (doğru run) | audit worktree, Node 26.12.1/Bun 1.4.0 | 0; 1,134 packages | `ckeditor5@49.0.1` ve lockfile bağımlılıkları kuruldu. |
| `bun run test:unit` — PATH'siz çağrı | audit worktree | 127 | Shell `bun` bulamadı; test başlamadı. |
| `bun run test:unit` — dependencies eksik ara deneme | audit worktree; ilk install yanlış cwd'deydi | 1; 12 pass, 5 test file import errors | Eksik yerel `node_modules` nedeniyle geçersiz setup denemesi; sonuç suite kabulü değildir. |
| `bun run test:unit` — doğru kurulum sonrası | audit worktree; Bun 1.4.0 | **0; 61 pass / 0 fail, 8 dosya** | PASS |
| `bun run typecheck` — PATH'siz çağrı | audit worktree | 127 | Shell `bun` bulamadı; tekrarlandı. |
| `bun run typecheck` — doğru kurulum sonrası | audit worktree; Node 26.12.1, TS 6.0.3 | **0** | PASS |
| `bun run lint` — PATH'siz çağrı | audit worktree | 127 | Shell `bun` bulamadı; tekrarlandı. |
| `bun run lint` — doğru kurulum sonrası | audit worktree; ESLint 10.14.0 | **0** | 0 error, bir `@next/next/no-img-element` warning: `components/editor/article-workspace.tsx:1669`. |
| `bun run build` | audit worktree; Next.js 16.4.3, Node 26.12.1 | **0** | 27 route prerendered/generated. Next geçici `tsconfig.json`/`next-env.d.ts` değişikliği yaptı; exact `HEAD` sürümleri geri kondu. |
| `bun run test:e2e:install` | audit worktree; Playwright 1.64.1 | **0** | Playwright Chromium kurulum komutu başarılı. |
| `bun run test:e2e` (repo config Brave seçti) | audit worktree; Brave 156.1.98.60; prod server 4175 | **130**; Playwright **35 test passed** mesajı verdi | Son test sonrası Playwright process shutdown'da takıldı; final summary ancak Ctrl-C ile alındı. Clean suite exit olarak kabul edilmedi. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='<Playwright 1248 Chrome for Testing path>' bun run test:e2e` | audit worktree; managed Chromium 1248 | **0; 35 passed** (`18.8s`) | Aynı suite clean completion. |
| Temporary browser diagnostics | Brave headless fresh contexts; dev 4176 / standalone prod 4177 | routes/interaction outputs; app-level fail only F-001 dev console | Temporary scripts `/tmp`'dadır; product/test files edit edilmedi. Details in coverage/evidence index. |

## Test evidence interpretation

- Unit tests, typecheck, lint, build ve managed Chromium Playwright suite başarılıdır; bunlar CKEditor her UI control'ünün işlevsel olduğunu kanıtlamaz.
- Mevcut 35 E2E testin esas kapsamı persistence/security/editorial rules ve Tiptap smoke/scientific-editor workflows'dür. Bu suite CKEditor integration UI'sını kapsamlı regression matrix olarak test etmiyor.
- Brave suite'te 35 pass mesajı, process exit 130 sebebiyle command-level clean pass değildir. Aynı suite managed Chromium'da 35/35 exit 0 tamamlandı.
- Browser manual actions, test counts'a eklenmemiş ayrı gözlemlerdir.
- `bun install` yanlış cwd ile bir kez çalıştı; installed dependency output'u doğru audit worktree run'ından ayrı tutulmalıdır.
