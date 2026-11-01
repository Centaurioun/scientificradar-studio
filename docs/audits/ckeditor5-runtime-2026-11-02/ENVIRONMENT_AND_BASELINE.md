# Ortam ve kaynak baseline

## Kaynak doğrulaması

| Alan | Kanıt / sonuç |
| --- | --- |
| Repository | `https://github.com/Centaurioun/scientificradar-studio` |
| `origin` | Fetch/push URL `https://github.com/Centaurioun/scientificradar-studio` |
| Fetch sonrası `origin/main` | `a6e8938ce45c724be5178aac20c7089bc6864dbd` |
| İlgili commit | `feat(editor): integrate CKEditor 5 with KaTeX support` |
| Önceki gözlenen SHA | `bd684716c8ff21b8cf8121a4a7077156272f6dd8`; yeni runtime entegrasyonu bu incelemede sonraki `a6e8938…` commit'inde bulundu. |
| CKEditor runtime | `components/editor/article-ckeditor.tsx`; `components/editor/article-workspace.tsx` tarafından `next/dynamic` ile client-only yükleniyor. |
| Math ve HTML köprüsü | `lib/ckeditor/ckeditor5-math/`, `lib/ckeditor/ckeditor-html-bridge.ts`, `lib/ckeditor/scientific-ckeditor-plugins.ts` |
| Engine kontrolü | Workspace'te `Tiptap 3 (Baseline)` / `CKEditor 5 + Math (Pilot)`; `?editor=ckeditor` ve `?editor=tiptap` seçimi |
| Dependency | `ckeditor5: 49.0.1` — frozen lockfile install sonrası kurulu sürüm doğrulandı. |
| Integration raporu | `docs/google-ai-reports/CKEDITOR_INTEGRATION_AUDIT.md` |

Fetch ve commit doğrulaması mevcut kirli ana checkout'ta yalnızca Git metadata işlemi yaptı. Kaynak test/inceleme checkout'u, kirli primary checkout'tan ayrı `/Users/yusuf/.codex/worktrees/scientificradar-ckeditor-forensic-20261102` worktree'sinde `a6e8938…` SHA'sından oluşturuldu. Branch: `audit/ckeditor5-runtime-forensic-2026-11-02`.

## Makine ve araçlar

| Bileşen | Gözlenen sürüm |
| --- | --- |
| macOS | 27.0.1 (`26A434`) |
| Node.js | 26.12.1; repository dokümanındaki pin 26.13.0'dan farklı |
| Bun | 1.4.0 (`34cbb9a40`) |
| Next.js | 16.4.3 |
| React / React DOM | 19.3.1 |
| TypeScript | 6.0.3 |
| CKEditor | 49.0.1 |
| Playwright | 1.64.1 |
| Brave | 156.1.98.60; Playwright browser engine `156.0.8078.48` olarak raporladı |
| Playwright-managed Chromium | Chromium revision 1248, `Google Chrome for Testing` binary |

## Yerel çalışma güvenliği ve sapmalar

- Ana checkout başlangıçta `main` üzerinde, `origin/main`'den 67 commit gerideydi. Başlangıçta mevcut değişiklikler `.gitignore`, `.trail/`, `AGENTS.md`, `opencode.json` idi; hiçbirini sıfırlamadım veya üzerine yazmadım.
- İzole worktree'de doğru komut `bun install --frozen-lockfile` exit 0 ile tamamlandı; 1,134 paket kuruldu. `ckeditor5@49.0.1` orada doğrulandı.
- İlk frozen install çağrısı yanlışlıkla ana checkout çalışma dizininden başlatıldı; bu işlem eski `main` bağımlılıklarını ana checkout'un göz ardı edilen `node_modules` alanına kurmuş olabilir. Daha sonra exact audit worktree'sinde doğru lockfile install ayrıca çalıştırıldı. Tracked ana checkout dosyalarının mevcut diff'ine dokunulmadı; başlangıçtaki dirty içerikler aynen duruyor. Başlangıçta `node_modules`'ın olup olmadığı kaydedilmemişti, bu nedenle o ignored dizin silinmedi.
- Bun, shell `PATH` içinde değildi; sonraki komutlar `/Users/yusuf/.bun/bin` eklenerek çalıştırıldı.
- Build/dev Next.js `tsconfig.json`, `next-env.d.ts` ve generated `AGENTS.md` üzerinde geçici değişiklik/artefakt oluşturdu. Bu iki tracked dosya `HEAD` içerikleriyle geri yüklendi; generated dosyalar kaldırıldı. Final worktree'de yalnızca audit docs/evidence bulunuyor.
- Yalnızca audit'e ait 4175/4176/4177 localhost süreçleri başlatılıp kapatıldı. Her Playwright context'i yeniydi; personal Brave profili/tabs kullanılmadı. Browser dış-origin istekleri abort edildi.
- Disposable yazım ve storage kontrolleri geçici Playwright context'inde yapıldı; browser context kapatılınca IndexedDB fixture kalıcı bırakılmadı.
