# Reproduction guide

## Doğrulanmış development console bulgusu

1. Exact source SHA `a6e8938ce45c724be5178aac20c7089bc6864dbd` kullanın.
2. `bun install --frozen-lockfile` çalıştırın.
3. `bun run dev -- --hostname 127.0.0.1 --port 4176` başlatın.
4. Yeni, disposable Brave/Playwright context'i oluşturun; personal profile kullanmayın.
5. Dış-origin browser request'lerini abort edin.
6. `http://127.0.0.1:4176/articles/art-quantum-repeater/edit?editor=ckeditor` yükleyin.
7. 1.8 saniye sonra `.ck-editor__editable` görünürlüğünü ve içindeki manuscript text'i doğrulayın; console/server loglarını kaydedin.
8. Hata mesajı `Maximum update depth exceeded`; dev server stack'i `article-ckeditor.tsx:464` ve `article-workspace.tsx:1044` yolunu gösterir.
9. Aynı temiz context metoduyla `?editor=tiptap` kontrolü çalıştırın: bu React console hatası gözlenmedi.
10. Aynı browser executable ile production standalone kontrolü yapın: bu audit'te üç seed article için hata gözlenmedi.

## Rapor edilen semptomların yeniden kontrolü

- `/articles` sayfasından mevcut `art-quantum-repeater` demo makalesinin Edit linkini açın.
- Default Tiptap'taki manuscript text'i görün; `CKEditor 5 + Math (Pilot)` kontrolüne basın; `.ck-editor__editable` ve seeded text görünürlüğünü doğrulayın.
- `?editor=ckeditor` ile doğrudan açıp reload edin; CKE switch `aria-pressed=true` ve text görünür kalmalıdır.
- `?editor=tiptap` ile doğrudan açın; Tiptap yüzeyi görünmelidir.
- Theme düğmesine gerçek click yapın. `html.dark`, screenshot renk paleti, `/seo` navigasyonu ve reload sonrasında state'i kontrol edin.
- Article editor'da Taxonomy, Sources, Figure, SEO ve History inspector tablarına sırayla basın; her panelin farklı içeriğini gözleyin.
- Reader Preview'i açın; `Back to Editor` ve noindex demo-preview mesajının görünmesini doğrulayın.
- Disposable Playwright context'inde CKEditor'a `AUDIT-DISPOSABLE-2026-11-02` marker'ı yazıp local save acknowledgement bekleyin; Tiptap'a geçince ve reload sonrası CKEditor'a dönünce marker'ı doğrulayın. Ardından context'i kapatın.

## Güvenlik/kapsam notu

Bu adımlar yalnızca local demo IndexedDB verisini kullanır; gerçek yayın, Google/Cloudflare entegrasyonu, external publication, shared data delete/import/export akışı çalıştırılmaz. Bu audit'te malformed LaTeX, mevcut equation edit/cancel, citation/figure round-trip, role-denied transition ve external service connection **NOT TESTED — SAFETY/SCOPE RESTRICTION** olarak kalır.
