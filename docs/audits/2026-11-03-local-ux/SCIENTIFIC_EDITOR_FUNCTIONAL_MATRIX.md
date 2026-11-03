# Bilimsel editör, metadata ve rights gate işlev matrisi

Gerçek Brave'de yalnız yeni bir `[QA TEMP]` taslağı kullanıldı. Taslağa girilen içerik bilimsel iddia değildir; amaç karakter/markup ve round-trip davranışını test etmektir.

| Alan/eylem | Test verisi veya etkileşim | Görünen sonuç | Durum |
|---|---|---|---|
| Article title | `CO₂ CH₄ H₂O Fe³⁺ Ca²⁺ x² μm α β Δ` + uzun test cümlesi | Unicode doğru görünür; plain text; H1 uzunluğu gerçek dar reader'da büyür | Unicode geçer; sub/sup semantic metadata controls missing |
| Abstract/summary | Aynı semboller | Unicode doğru ve refresh'ten sonra saklı | Unicode geçer; inline sub/sup formatting affordance yok |
| Generated slug | Test başlığından otomatik | `CO₂→co`, `CH₄→ch`, `H₂O→ho`, `Fe³⁺→fe`, `Ca²⁺→ca`, `x²→x` | P2 öneri: okunur, deterministik transliteration (ör. co2/ch4/h2o/fe3-ca2-x2) ve editable slug |
| Locale, author/category/tags/series/SEO/canonical | Metadata yüzeyi göründü; değerleri test taslağı için değiştirilmedi | Bu alanlar için end-to-end save/preview testi yapılmadı | Untested |
| Unicode symbol picker | Palette açıldı, Unicode örnekleri görüntülendi, kapatıldı | Sembol palette var | Geçti (UI açılışı); insertion/save round-trip tested değil |
| Tiptap sub/sup | Kaydedilmiş toolbar support, direct inline command bu pass'te tam round-trip olmadı | Kaynakta editor engine desteği var; bu canlı oturum UI state'inden exact formatting round-trip kanıtlanmıyor | Kısmi/untested |
| CKEditor 5 + Math | QA tablosu/caption'ı bulunan makalede engine geçişi | Caption ve 4×4 tablo CKEditor görünümünde de, Tiptap'e dönünce de durdu | Kısmi geçti |
| LaTeX | Inline/Block LaTeX composer açıldı; preview semantic sub/sup gösterdi; cancel | Composer UI hazır; publish veya persistence gözlenmedi | UI geçti, fidelity unverified |
| Table | Tiptap'e `Insert Scientific Table`; 4×4; test caption | Caption `<caption>` olarak reader snapshot'ında; table refresh ve engine switch'ten kaldı | Geçti bu boş hücre örneği; uzun veri/responsive tablo testi eksik |
| Figure | Mevcut seed NIRSpec grafiği yalnız QA taslağına bağlandı | Alt text, caption, credit/license reader'da görünür; inspector “layout locked” ve alt-text review kontrolü gösterdi | Görünüm geçti; rights approval ayrı ve eksik |
| SEO/canonical | Slug reader test bağlantısında gösterildi | Locale-prefix örneği gösterimi gerçek Web canonical route `/article/[slug]` ile farklı; eski bulgu: UI hint tutarsız | SRS-UX-08; slug kayboldu/route 404 edildiği ileri sürülmüyor |
| Reader date/status | Taslak v5 / DRAFT editör durumu, preview metadata | Reader Preview `Published Nov 3, 2026` tarihini gösterdi | Yeni SRS-UX-11 P2: draft preview'da publication wording/date yanıltıcı |
| Figure rights gate | Publish (Demo) → Figure Rights → Go to Field | 1 blocker, 5 warning, 14 pass, 2 unverified; rights evidence/reviewer alanı yok; inspector'a dönüyor | SRS-UX-04 Confirmed missing resolution workflow |
| Media caption editor | Media Library mevcut caption kontrolü | tek satır input gözlendi | SRS-UX-07; çok uzun caption obscuration/wrapping ayrıca ölçülmedi |

## İstenen format seti için kanıt sınırı

CO₂, CH₄, H₂O, Fe³⁺, Ca²⁺, x², μm, α, β ve Δ test başlığı ve summary'de birlikte görüntülendi; table caption'ında da aynı Unicode dizisi görüldü. Bu nedenle Unicode karakter giriş/render kapasitesi doğrulandı. Alanların semantik `<sub>`/`<sup>` markup'ı, paste/undo, SEO title/description, figure alt text ve caption'in tümünde eşit olduğu doğrulanmadı. Özel karakterlerin düz metin olarak saklanması, okunabilir formata otomatik slug üretimi ihtiyacını ortadan kaldırmaz.

LaTeX testinde girilen örnek composer preview'unda alt/üst indis semantiği çıktı; test Cancel ile sonlandırıldı. Storage, CKEditor↔Tiptap conversion, web-render CSS, accessible math speech ve gerçek citation anchors test edilmedi. Bu nedenle “scientific math supported” genel iddiası değil, “composer opens and preview renders a small sample” sonucu çıkarılır.

## Rights üçlü durumu

1. **Alt-text accessibility review:** Inspector'da ayrı kontrol görünür (“Figure alt text & axes human-verified”).
2. **Attribution and licence metadata:** Figure alanlarında credit/license bilgisi bulunabilir; seed varlıkta CC BY 4.0 görünür.
3. **Actual rights approval + evidence:** UI'da reviewer/date/evidenceRef alanı görünmedi. Gate `rightsVerified` ister.

İlk iki kayıt üçüncü durumu kendiliğinden ispatlamaz. Public export `UNVERIFIED_MEDIA_RIGHTS` guard'ı gevşetilmemelidir.

