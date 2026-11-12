# Bulgu kaydı ve altı çevrimli inceleme

Kaynak: `origin/main` `057986ec4b6a2241c8210fa42eafda46ec49588f`; bulgular yerel, yalıtılmış demo/seed veri ile incelendi. Bu kayıt kod değişikliği veya release onayı değildir.

| ID | Öncelik | Sınıf | Durum | Etkilenen alan | Kısa karar |
|---|---|---|---|---|---|
| SRS-UX-01 | P0 | Responsive kusur | Doğrulandı | Editör içi Web Article Preview 390/320 | Simüle edilen genişlikte orta sütun 0 px; gerçek telefon görünümünde tek sütun çalışıyor. |
| SRS-UX-02 | P1 | Responsive kusur | Doğrulandı, bu turda yeniden üretildi | Dashboard 320 px | “New Article” sağ kenarı x=345.9 px; viewport 320 px ve document scrollWidth 346 px. |
| SRS-UX-03 | P1 | Responsive kullanılabilirlik | Doğrulandı | Articles table | 1387 px tablo mobil kabuk içinde 1030+ px yatay kaydırma istiyor; document-level overflow yok. |
| SRS-UX-04 | P1 | Eksik editör iş akışı | Doğrulandı | Figure rights | Strict public export hak kanıtı yoksa engelleniyor; UI onay kanıtı girişi sunmuyor, bulgu hedefi eşleşmiyor. |
| SRS-UX-05 | P2 | Yanıltıcı sayaç | Kod yolu doğrulandı | Articles source badge | Gösterilen “DOI” sayısı kaynak kimliği sayısı; DOI metadata sayısı değil. Canlı kaynak dağılımı sayılmadı. |
| SRS-UX-06 | P2 | Eksik metadata affordance | Doğrulandı (kısmi kapsam) | Title/summary science notation | Gövde Tiptap sub/sup destekliyor; düz metin title/summary alanları desteklemiyor. Unicode girilebilir. |
| SRS-UX-07 | P2 | Editör UX | Doğrulandı | Media caption | Medya kütüphanesi caption tek satır; editör figure caption çok satır. |
| SRS-UX-08 | P2 | Yol ipucu tutarsızlığı | Doğrulandı | Slug / SEO preview | UI locale-prefixed örnek gösteriyor, Web canonical `/article/[slug]`; uzun slug kaybolduğu kanıtlanmadı. |
| SRS-UX-09 | P2 | Prototype sınırlaması ve label | Davranış bilerek disconnected; label beklentisi kusurlu | Provider integrations | “Test Connection” yerel UI state değiştiriyor, network çağrısı yapmıyor ve bunu açıklıyor. Güvenlik açığı gözlenmedi. |
| SRS-UX-10 | P2 / takip testi | Kanıt yetersiz | Bu turda üretilmedi | Bilimsel tablo dar ekranı | X-scroll sarmalayıcı var, fakat geniş tablo mobilde doğrulanmadı. |
| SRS-UX-11 | P2 | Yeni canlı bulgu | Doğrulandı | Draft Reader Preview | Editör `DRAFT · V5` derken Reader Preview “Published Nov 3, 2026” tarihi gösteriyor; draft için yayın tarihi dili yanıltıcı. |
| SRS-QA-01 | N/A | Test yürütme geçmişi | Sonraki tekrar tamamlandı | Playwright | Önceki süreç 35 pass çıktısından sonra Ctrl-C/130 ile sonlandı; yeni tekrar 35/35, exit 0. |

## Sınıflandırma

- **Doğrulanmış kusur:** kayda alınan tarayıcı ölçümü veya kaynak/arayüz davranışıyla doğrudan gösterildi.
- **Doğrulanmayan:** bu turda örnek veri veya test kapsamı ispat için yeterli değildi; varsayımla kusur yazılmadı.
- **Eksik özellik:** istenen iş akışı/alan mevcut ürün yüzeyinde yok; mevcut güvenlik politikası veya kod hatası olduğu anlamına gelmez.
- **Bilinçli prototip kısıtı:** dış sağlayıcı, auth/credential veya gerçek üretim servisi henüz yok; bu denetimde bunlar eklenmedi.
- **Kısmi kapsam:** LaTeX composer küçük bir inline örnekte preview oluşturdu; Tiptap/CKEditor geçişinde 4×4 QA tablo ve caption bu örnekte korundu. Bu, formül/citation/figure içerik sadakatinin tümüne genellenmedi.
- **Canlı metadata:** Unicode semboller plain text olarak title/summary/table caption'da görüldü. Otomatik slug bu başlık için sayısal alt/üst indis karakterlerini düşürdü (`CO₂→co`, `CH₄→ch`, `H₂O→ho`, `Fe³⁺→fe`, `Ca²⁺→ca`, `x²→x`).
- **Prototype sınırı:** Test Connection butonu yerel `no credentials or external endpoints configured` feedback'i verdi. Bu gerçek provider testi değildir; kart metni P0 sınırını açıkça anlatır.

## Altı çevrimli bağımsız inceleme

1. **Temel doğrulama:** yalnız gerçek `origin/main` SHA üzerinde ayrı worktree kuruldu; dirty ana checkout ve Web checkout korunarak current source, routes, package scripts ve test ayak izi belirlendi. Eski commit referansı güncel kabul edilmedi.
2. **Responsive tekrar üretim:** 1920/1600/1440/1280/1024/768/390/320 viewport ölçüldü; gerçek mobil ve masaüstü içi simülasyon ayrı ayrı denendi. P0 iç preview çökmesi ve makale listesi yatay kaydırması bulundu; genel document overflow olmadığı da kaydedildi.
3. **Bilimsel editoryal davranış:** body sub/sup toolbar'ı, plain text metadata, DOI modeli/sayacı, caption alanları, slug yardım metni ve gerçek Web canonical route karşılaştırıldı. Geniş tablo örneği olmadığından tablo iddiası açık bırakıldı.
4. **Haklar ve entegrasyon güvenlik sınırı:** hak modeli, fail-closed export kapısı, editör findings yönlendirmesi ve gerçek inspector tab/field listesi karşılaştırıldı. Provider buton davranışı ve network/credential yüzeyi incelendi; test için sır veya canlı endpoint kullanılmadı.
5. **Uyumluluk/yanlış pozitif kontrolü:** IndexedDB/prototip sınırları, public sözleşme route'u, mevcut overflow wrappers ve Playwright test kapsamı incelendi. Gerçek telefon görünümü düzgün olduğu için mobil okuyucu geneline kusur atfedilmedi; provider yokluğu security breach olarak etiketlenmedi.
6. **Adversarial son okuma:** her sonuç için kanıt/karşı kanıt, doğrulanmış/eksik/prototip ayrımı ve test sınırı kontrol edildi. Önceki Ctrl-C ile biten E2E çalışması pass kabul edilmedi; yeni bağımsız tekrar exit 0 ile tamamlandı.

## Canlı Brave eklentisi

`BRAVE_LIVE_INTERACTION_AUDIT.md`, `RESPONSIVE_VIEWPORT_MATRIX.md`, `FULL_NAVIGATION_COVERAGE.md`, `SCIENTIFIC_EDITOR_FUNCTIONAL_MATRIX.md` ve `CONFIRMED_DEFECTS_AND_FIX_RECOMMENDATIONS.md` aynı gün yapılan görünür Brave etkileşimlerini, yeni P2 bulgu SRS-UX-11'i ve kapsam sınırlarını ayrıntılandırır. QA-only taslak `[QA TEMP]` kaydı mevcut lokal IndexedDB'de bırakıldı; kalıcı silmenin recoverable davranışı doğrulanmadığı için silinmedi.

## Yerel doğrulama

| Kontrol | Sonuç |
|---|---|
| Unit | 75 passed, 0 failed (9 dosya) |
| TypeScript | Geçti |
| ESLint | Geçti |
| Production build | Geçti; build ortamı `tsconfig.json` / `next-env.d.ts` üretmiş/değiştirmiş, branch'e alınmadı |
| Playwright önceki deneme | 35 passed çıktısı sonrası Ctrl-C, exit 130; tamamlanmış değil |
| Playwright bağımsız tekrar | 35 passed, 0 failed, 0 skipped; exit 0 (19.5 s) |
