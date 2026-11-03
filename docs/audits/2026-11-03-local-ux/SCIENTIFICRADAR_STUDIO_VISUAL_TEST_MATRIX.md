# Yerel görsel ve davranış test matrisi

**Uygulama kaynağı:** `057986ec4b6a2241c8210fa42eafda46ec49588f`
**Local:** `http://localhost:3000` dev sunucusu (PID 61204, preview worktree); yalıtılmış Playwright contexts.
**Not:** screenshot'lar yerel gerçek arayüzden alınmıştır. Dashboard görseli aynı SHA üzerindeki önceki isolated inspect'ten; preview görselleri 2026-11-03 04:17'de oluşturuldu.

## Görsel kanıt

| Dosya | Senaryo | Gözlem |
|---|---|---|
| [dashboard-320.png](evidence/dashboard-320.png) | Dashboard, 320 px | Üst “New Page” / “New Article” eylemleri sağ tarafta kesiliyor. |
| [embedded-preview-390-body.png](evidence/embedded-preview-390-body.png) | Desktop içi 390 px simülasyon | Body paragrafı sıfır genişliğe düştüğü için harf başına satır oluşturuyor. |
| [real-browser-390.png](evidence/real-browser-390.png) | Gerçek browser 390 px | Gerçek mobil viewport tek kolon, normal satır genişliği. |
| [real-browser-320.png](evidence/real-browser-320.png) | Gerçek browser 320 px | Gerçek dar mobil viewport tek kolon, normal satır genişliği. |

## Sayısal viewport matrisi

| Viewport/kip | Sayfa yatay taşması | İç reader ölçüsü | Sonuç |
|---|---|---|---|
| 1440×900 desktop | Yok | 1240 px grid, 220/736/220; body 700 px | Normal Web reader görünümü |
| 1440×900 + embedded 768 | Yok | 686 px grid, 220/182/220 | Çok dar center, desktop TOC devam ediyor |
| 1440×900 + embedded 390 | Yok | 308 px grid, 220/0/220; body 0 px | **P0 hata** |
| 1440×900 + embedded 320 | Yok | 238 px grid, 220/0/220; body 0 px | **P0 hata** |
| Gerçek 390×844 | Yok | 358 px, tek kolon | Reader geçer; Studio panelinin tüm işlevleri bu ölçümde kapsamlı denetlenmedi |
| Gerçek 320×700 | Yok | 288 px, tek kolon | Reader geçer; dashboard eylemleri ayrı kusurlu |

`scrollWidth === clientWidth` sayfa seviyesinde taşma olmadığını gösterir. Embedded preview içindeki center 0 olduğundan içerik kendi alanında taşma/katlanma belirtileri gösterebilir; bu ölçüm page-level overflow anlamına gelmez.

## Articles tablosu yatay scroll matrisi

| Viewport | Main wrapper | X-scroll kabı | Intrinsic tablo | Yaklaşık sağa scroll |
|---:|---:|---:|---:|---:|
| 1920 px | 1280 px | 1216 px | 1387 px | 173 px |
| 1600 px | 1280 px | 1216 px | 1387 px | 173 px |
| 1440 px | 1200 px | 1136 px | 1387 px | 251–253 px |
| 1280 px | 1040 px | 976 px | 1387 px | 411–413 px |
| 1024 px | 784 px | 720 px | 1387 px | 667 px |
| 768 px | — | 720 px | 1387 px | 667 px |
| 390 px | — | 358 px | 1387 px | 1029–1031 px |
| 320 px | — | 288 px | 1387 px | 1099–1101 px |

Bir kaç piksel fark DOM border, scrollbar ve client ölçümünün rounding'inden kaynaklanıyor. Makale tablosu kendi `overflow-x-auto` kabında; document scroll genişliği viewport'a eşit. Bu matris makale listesi içindir, Web reader içindeki içerik tablolarının görsel QA'sı değildir.

## Bölüm bazlı gezinme / inceleme durumu

| Alan | İnceleme | Kanıt/sınır |
|---|---|---|
| Dashboard ve sidebar | Dashboard 320 screenshot; sidebar'ın mobil davranışı route/DOM'da gözlendi | Eylem kesilmesi var. Bütün menü dalları etkileşimle tek tek tamamlanmadı. |
| Articles listing/search | Listing DOM, ölçüm, gerçek seeded satırlar; kaynak badge kodu | Search akışının tüm varyasyonları kapsam dışı. |
| Article editor | Editor source ve seeded article üzerinde UI inspect | Tiptap body sub/sup var; CKEditor tüm özellik/console kombinasyonları exhaustive değil. |
| Article Preview | Desktop, real 390/320 ve embedded 768/390/320 | Ana responsive P0 tekrarlanabilir. |
| Viewport controls | 560/600/700 ölçü seçenekleri kontrol edildi | İçerik genişliği seçimi layout çökmesini düzeltmiyor. |
| Figures/media | Media list, caption/alt/credit/license alanları; inspector figure alanı | Rights evidence UI yok; gerçek üretim medyası/harici image endpoint kullanılmadı. |
| Citations/DOI | Model, article listing badge, serializer ve test sözleşmesi | Sayaç source count; eksik DOI dağılımı tam sayılmadı. |
| Mathematics | Tiptap sub/sup toolbar ve plain metadata alanları | Büyük sembol paleti, KaTeX/Math runtime ve her denklem browser render'i ayrı test edilmedi. |
| Tables | Mevcut testte 3×3 insertion/caption; reader overflow wrapper bulundu | Geniş içerik tablosu olmadığı için narrow render **doğrulanmadı**. |
| SEO/Editorial Quality | Findings navigation ve slug/source/sözleşme kodu inspect | Her denetim kuralının örnek makalede sonuçları exhaustive değil. |
| Categories/tags | Editör inspector/source üzerinde mevcut taxonomy görünümü | Her CRUD senaryosu ayrı QA edilmedi. |
| Media Library | Local list/form akışı ve screenshot/source | Caption tek satır; hak kanıtı girişi yok. |
| Calendar/workflow | Route/source taraması ve var olan smoke coverage | Her tarih/sürükle-bırak/status geçişi gözlemlenmedi. |
| Settings/integrations | Yerel settings page inspected | Provider “check” gerçek ağ kontrolü değil; bu prototype açıklanıyor. |

## Console, network ve test sinyali

- O gözlem sırasında yakalanan uygulama `pageerror` sayısı: 0 (kısa route pass; genel hata-free sertifikası değildir).
- Integrations düğmesi ağ çağrısı yapmıyor; hassas credential/host eklenmedi.
- E2E mevcut smoke testi viewport ölçüsünü ve media query'yi kontrol ediyor; bu, overflow/reader layout kontrolü değildir.
- E2E bilimsel editör testi 3×3 insert ve caption'ı doğruluyor; geniş mobil tablo çizimini doğrulamıyor.
- Playwright bağımsız tekrarı 35/35 passed, 0 failed, 0 skipped, exit 0 ile tamamlandı (19.5 s). İki `NO_COLOR`/`FORCE_COLOR` uyarısı görüldü; test sonucu etkilenmedi.
