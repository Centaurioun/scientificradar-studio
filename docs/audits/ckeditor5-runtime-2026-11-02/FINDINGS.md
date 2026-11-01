# Bulgular

## F-001 — CKEditor mount sırasında development React update-depth hatası

- **Severity:** P2 — Medium
- **Classification:** Development-only runtime defect / CKEditor integration state synchronization; production etkisi doğrulanmadı.
- **Reproducibility:** Tekrarlanabilir. Farklı temiz Playwright context'lerinde CKEditor query/mount denemelerinde aynı hata çıktı; Tiptap clean kontrolünde hata yoktu.
- **Etkilenen route/mode:** `/articles/art-quantum-repeater/edit?editor=ckeditor`, development runtime. Kaynak stack `ArticleCKEditor` sync effect'ini gösterir.
- **Beklenen:** CKEditor client-side mount olur, içerik gösterir ve React state update-depth hatası üretmez.
- **Gözlenen:** CKEditor manuscript içeriği ve toolbar'ı görünür; aynı zamanda üç `Maximum update depth exceeded` console/Next dev overlay hatası gözlendi. Playwright pageerror/uncaught exception kaydedilmedi. Red Next issue göstergesi screenshot'ta görünür.
- **Kesin reproduction:** `bun run dev -- --hostname 127.0.0.1 --port 4176`; Brave'de yeni context aç; `/articles/art-quantum-repeater/edit?editor=ckeditor` yükle; en az 1.8 saniye bekle; browser console ve Next dev server logunu incele. Kayıtlı isolated varyant: `F-004-clean-ckeditor.png`.
- **Console/server:** `Maximum update depth exceeded. This can happen when a component calls setState inside useEffect...`; server stack `ArticleCKEditor.useEffect (components/editor/article-ckeditor.tsx:464:28)` → `onSyncJson` → `ArticleWorkspace` callback (`components/editor/article-workspace.tsx:1044:21`, `setBodyJson(nextJson)`). Local request failures dışında HTTP 4xx/5xx yok. İlk çok-route sweep'teki iki `net::ERR_ABORTED` Next router prefetch/navigation cancellation'ıydı.
- **İlgili source:** `article-ckeditor.tsx:446-468` dış HTML sync effect/dependencies; `article-workspace.tsx:1024-1050` CKEditor props ve state callback. `availableSources` her render'da `.filter()` ile; `trustedImageSources` her render'da yeni `Set` ile oluşturuluyor. Effect dependencies bu iki kimliği içeriyor ve callback her çağrıda yeni `bodyJson` nesnesini state'e veriyor.
- **Root cause:** **Trigger path confirmed; exact loop initiator unconfirmed.** Runtime stack efekt → parent setter yolunu doğrudan doğruladı. Kaynak kimliklerinin her render'da değişmesi ve `onSyncJson` state setter'ı effect'i yeniden çalıştırabilecek bir feedback yolu oluşturuyor. Effect içindeki `contentHtml !== lastEmittedHtmlRef.current` guard'ının neden her tekrarında geçildiğini doğrudan ölçmedim; CKEditor `getData()` ve canonical HTML farkını runtime'da yakalayan instrumentation eksik.
- **Confidence:** High — geliştirme ortamında hata ve stack'in gösterdiği callback yolu için. Medium — yeni Set/array identity + canonical content sync'in tam döngüyü başlattığı mekanizma için.
- **Production karşı kanıtı:** Aynı CKEditor query'si üç ayrı seed makalesi (`art-quantum-repeater`, `art-solid-state-electrolyte`, `art-denisovan-introgression`) üzerinde production standalone'da açıldı; içerik visible, console error/pageerror/request failure yok. Bu production için bu senaryolardaki riski azaltır, tüm içerikler için kabul kanıtı değildir.
- **Kanıt:** `screenshots/F-004-clean-ckeditor.png`; `screenshots/F-004-clean-tiptap.png`; `screenshots/production-art-quantum-repeater.png`; `screenshots/production-art-solid-state-electrolyte.png`; `screenshots/production-art-denisovan-introgression.png`.
- **İleriye dönük öneri:** Önce render başına prop kimliklerini ve editor canonical output/`contentHtml` değerlerini instrument edin. Sonra effect'in hangi dependency ve değer farkıyla `onSyncJson`'ı tekrarladığını ölçün. Uygulama düzeltmesi yapılacaksa state eşitliği/idempotence ve stabilize edilmiş props için regression assertions ekleyin.
- **Gelecekte eklenecek test:** Dev ve production'da temiz IndexedDB context'i ile query seçimi, CKEditor mount, sabit bekleme, console/pageerror assertion; Tiptap/CKEditor switch ve reload; canonical data representation değişmediğinde tekrar sync/state update olmaması.

## Kullanıcı tarafından bildirilen semptomların doğrulanması

| Semptom | Sonuç | Sınır |
| --- | --- | --- |
| İçerik yerine kalıcı CKEditor skeleton | **Reproduce edilmedi.** CKEditor üç production seed article'da, bir dev article'da manuscript text gösterdi. | Başka browser/IndexedDB state'i veya gerçek AI Studio export ortamı bu browser context'lerinde yoktu. |
| Dark mode tıklaması yanıtsız | **Reproduce edilmedi.** Tıklama `html.dark` sınıfını ve görünür renk paletini değiştirdi; state route/reload sonrasında kaldı. CKEditor toolbar da dark palette aldı. | OS theme override ve sistem farklılıkları denenmedi. |
| SEO/navigasyon paneli açılmıyor | **Reproduce edilmedi.** 22 route/path erişildi; beş inspector tabı panel içeriğini değiştirdi; preview ve SEO route açıldı. | Her nav/button ayrı ayrı kontrol edilmedi; tüm route'lar için auth/role varyantı test edilmedi. |
| CKEditor ↔ Tiptap metin kaybı | Disposable fixture'de **görülmedi**. CKEditor'a eklenen token local save'den sonra Tiptap görünümünde ve reload sonrası CKEditor'da kaldı. | LaTeX, citation, figure ve HTML round-trip kapsamı bu manuel write testinde yoktu. |
