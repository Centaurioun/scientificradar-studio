# Responsive ve preview matrisi — visible Brave

Tarih: 2026-11-03. Bu, görünür Brave'de gerçek Studio localhost sekmesinde yapılan kontrolün ölçüm dökümüdür. QA örneği `[QA TEMP]` başlıklı bir yerel taslaktır. Önceki turdan saklanan ekran görüntüleri `evidence/` altında; bu yeni ölçüm turu için araç destekli bir PNG çalışma alanına yazılamadı.

## Gerçek browser viewport

| Viewport | `documentElement` scrollWidth-clientWidth | Reader iç grid | Reader orta kolon | H1 yüksekliği | Görsel genişliği | Sonuç |
|---|---:|---|---:|---:|---:|---|
| 430×932 | 0 | 348px | 348px | 209px | 346px | Bir sütun okunur |
| 390×844 | 0 | 308px | 308px | 244px | 306px | Bir sütun okunur |
| 375×812 | 0 | 293px | 293px | 244px | 291px | Bir sütun okunur |
| 320×700 | 0 | 238px | 238px | 313px | 236px | Bir sütun okunur; uzun H1 çok satıra çıkıyor |
| 768×1024 | 0 | 341.938px | ~342px | 292px | 340px | İç yan bölgeler orta alanı daraltıyor |
| 1024×768 | 0 | 326.562px | ~327px | 443px | 325px | Dar okuma kolonu / uzun başlık |
| 1280×800 | 0 | 220px 0px 220px | **0px** | 492px | 309px | İçerik kolonu çökmüş |
| 1440×900 | 0 | 220px 0px 220px | **0px** | 492px | 306px | İçerik kolonu çökmüş |
| 1920×1080 | 0 | 220px 0px 220px | **0px** | 492px | 306px | İçerik kolonu çökmüş |

## Preview internal viewport, Brave dış pencere 1440×900

| İç mod | Dış client/scroll width | Grid ölçümü | Karar |
|---|---|---|---|
| Desktop | 1440 / 1440 | makale wrapper yaklaşık 1152px | Okuyucu var; kalıcı 220/568/220 kolonlar görünür |
| Tablet (768px) | 1440 / 1440 | makale wrapper yaklaşık 766px | Okuyucu görünür; dar/yan alan dengesi ayrıca iyileştirilmeli |
| Mobile (390px) | 1440 / 1440 | `220px 0px 220px` | **P0 tekrar üretildi: orta kolon sıfır, makale gövdesi kullanılmaz** |
| 320px | 1440 / 1440 | `220px 0px 220px` | **P0 tekrar üretildi: orta kolon sıfır** |

## Yorum ve öneri

Gerçek telefon viewport'u responsive media query'leri çalıştırıp tek kolona düşüyor; masaüstünde dar bir element olarak preview edilen okuyucuda viewport breakpoint'leri host pencereyi görüp yan panelleri açık bırakıyor. Sadece CSS `max-width:390px` iframe/element genişliğini temsil etmiyor. Sabit simülatör çerçevesi/iframe ile izole viewport en doğru seçenek: medya query'leri gerçek okuyucu penceresinin ölçüsüne göre hesaplanır; admin panel CSS'siyle okuyucu CSS'si ayrılır. Alternatif container query, yalnız reader bileşenleri bu sorgulara göre yeniden düzenlenirse aynı sonucu daha hafif DOM'la verir ama mevcut viewport temelli stillerin kapsamlı dönüşümünü gerektirir. Öneri: önce isolated iframe/preview document, yükseklik ve viewport senkronu; ikinci seçenekse container-query tabanlı responsive reader refactor + snapshot/visual regression.

Masaüstü 1440 dış browser'da embedded mobile/320 modları ve gerçek 390/320 browser viewport'ları aynı değildir. 320 gerçek viewport'ta admin üst çubuğu sarıyor ama document-level horizontal overflow gözlenmedi; TOC görünür/etkin değildi. Gerçek telefon boyutunda reader içerik kolonu 238px olduğu için uzun başlık 313px yüksekliğe çıktı, fakat karakter karakter dikey metin sorunu yoktu.

## Tablo ve Dashboard notu

1440px Brave'de Articles tablosu 1359px idi; kullanılabilir table scroller 1136px idi. X-scroll yalnız kendi container'ında gerçekleşti, document overflow yok. 320px Dashboard için önceki kaydedilmiş ölçüm `clientWidth=320`, `scrollWidth=346`, New Article CTA'nın right edge `345.9px`; kanıt `evidence/dashboard-320.png`. Bu, makale tablosundaki lokal scroll'dan ayrı bir gerçek sayfa taşmasıdır.

