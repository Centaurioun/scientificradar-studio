# ScientificRadar Studio — bağımsız UX ve yerel davranış denetimi

**Tarih:** 2026-11-03
**İncelenen kaynak:** `Centaurioun/scientificradar-studio`, `origin/main` = `057986ec4b6a2241c8210fa42eafda46ec49588f`
**Yöntem:** salt gözlem; temiz, ayrı audit worktree'si; uygulama koduna/dependency'lere değişiklik yok; demo verisi ve yalıtılmış Playwright bağlamı.
**Kapsam sınırı:** Bu rapor yerel UX/iş akışı bulgularıdır; yayın, erişilebilirlik (WCAG), penetrasyon testi ya da üretim onayı değildir.

## Yönetici özeti

P0: Editör içindeki 390/320 px Web Article Preview kontrolü, masaüstünde kapsayıcı genişliğini değiştirirken okuyucu breakpoint'leri gerçek tarayıcı genişliğine bağlı bırakıyor. 1440 px ekran içinde 390/320 px önizlemede orta sütun sıfıra düşüyor; metin harf harf alt alta uzuyor. Gerçek 390 ve 320 px tarayıcı genişliklerinde aynı sayfa tek sütun ve okunabilir. Bu, simüle edilen viewport ile gerçek mobilin farklı kod yollarından geçtiğini gösteren, tekrarlanabilir bir kusur.

P1: Studio 320 px görünümünde dashboard üst eylemleri kesiliyor. Makale listesi yatay kaydırmayı gizlemiyor, fakat tablo 1387 px genişliğinde kalıyor: 390 px'de 1031 px, 320 px'de 1101 px yatay kaydırma gerekiyor. 1920 px masaüstünde de içerik 1280 px'e sabitleniyor ve tablo hâlâ yatay kayıyor.

Bilimsel içerik işlevlerinin bazıları mevcut: Tiptap gövde editörü alt/üst indis işaretlerini sunuyor; yayın sözleşmesi kaynak/DOI ve kamuya açık makale URL'sini işler; medya hakları doğrulanmadan üretim dışa aktarımını bloke ediyor. Kusur, işlevlerin yokluğu değil, kapsam/uygulama uçurumları: başlık/özet düz metin alanları, DOI rozetinin DOI varlığını kanıtlamaması ve hak denetimi bulgusundan düzenlenebilir onay kanıtına giden görünür bir form bulunmaması.

## Öncelikli bulgular

### P0 — Masaüstünde daraltılmış Web önizlemesinde okuyucu sütunu çöküyor

**Durum:** Doğrulandı, tekrarlanabilir.
**Kanıt:** `components/editor/article-preview-view.tsx` içindeki 320/390/768 px sarmalayıcı genişlikleri ile `components/editor/web-article-reader-preview.tsx` içindeki `xl` tabanlı 220 px yan sütunlar. Desktop ekranında dar sarmalayıcıda grid hâlâ `220px minmax(0,1fr) 220px` kullanıyor; merkez sütun 0 px oluyor.

Yalıtılmış Chromium ölçümü (sunum/cihaz ölçeği 1):

| Senaryo | Preview client genişliği | Grid sütunları | Gövde paragraf genişliği | Sonuç |
|---|---:|---|---:|---|
| 1440 px ekran, gerçek desktop | 1240 px | 220 / 736 / 220 px | 700 px | Normal |
| 1440 px ekran, 390 px simülatör | 388 px | 220 / 0 / 220 px | 0 px | Harf harf yığılma, içerik yüksekliği ~9750 px |
| 1440 px ekran, 320 px simülatör | 318 px | 220 / 0 / 220 px | 0 px | Harf harf yığılma, içerik yüksekliği ~9750 px |
| Gerçek 390 px tarayıcı | 358 px grid | tek sütun | 358 px | Okunabilir |
| Gerçek 320 px tarayıcı | 288 px grid | tek sütun | 288 px | Okunabilir |

Ölçüm, preview viewport kontrollerinin gerçek cihaz genişliğiyle eşdeğer olmadığını kanıtlıyor. Sadece okuma ölçüsü 560/600/700 px değerlerine geçmek çözmüyor. 768 px simülatörde merkez 182 px'e düşüyor ve masaüstü TOC/yan kolon davranışı sürüyor.

**Öneri:** Simüle edilen kapsayıcı genişliğini layout kararlarında kullanın (container query veya preview bileşenine açık viewport profili); dar modda iki yan rail'i kaldırıp kompakt TOC'yi açın. Gerçek viewport ve desktop içi preview senaryolarını ayrı görsel regresyonlara ekleyin.

### P1 — Dashboard eylemleri 320 px genişlikte kesiliyor

**Durum:** Doğrulandı; bu turda yeniden üretildi ve ekran görüntüsü alındı.
**Kanıt:** [dashboard-320.png](evidence/dashboard-320.png). İzole Chromium 320×700 ölçümünde dashboard `documentElement.scrollWidth=346`; üstteki “New Article” eyleminin sağ kenarı x=345.9 px. “New Page” x=118–221.6 px içinde kalıyor; böylece sağdaki eylem viewport dışına taşıyor ve yatay sayfa overflow'u yaratıyor. Sidebar mobilde daralıyor.

**Öneri:** Dar ekran üst araç çubuğunda butonları sarmalayın veya tek “Yeni” menüsünde toplayın; 320 px'de tüm eylemlerin görünür/tıklanabilir olduğunu ve page-level yatay overflow olmadığını doğrulayın.

### P1 — Makale tablosu mobilde kullanılabilir olsa da aşırı yatay kaydırma gerektiriyor

**Durum:** Kaydırma kabı doğrulandı; ham sayfa taşması yok. Dar ekran kullanılabilirlik kusuru doğrulandı.
**Kanıt:** `app/articles/page.tsx` tablo kabı `overflow-x-auto`; tablo intrinsic genişliği 1387 px ve kabuk 390 px'de 358 px, 320 px'de 288 px.

| Viewport | İçerik sarmalayıcısı | Tablo kaydırma kabuğu | Tablo | Gerekli yatay scroll |
|---:|---:|---:|---:|---:|
| 1920 | 1280 | 1216 | 1387 | 173 |
| 1440 | 1200 | 1136 | 1387 | 251 |
| 1024 | 784 | 720 | 1387 | 667 |
| 390 | 358 | 358 | 1387 | 1029 |
| 320 | 288 | 288 | 1387 | 1099 |

Ölçümler farklı browser rounding/çerçeve durumlarında 2–3 px oynayabilir. `documentElement.scrollWidth` viewport ile aynıydı; yani sayfa genelinde taşma yok, tablo kendi içinde kayıyor. 1920 px ekranın ana içerik alanı 1680 px iken sayfa `max-w-7xl` ile 1280 px'de kalıyor; tablo yine de kaydırma gerektiriyor.

**Öneri:** Mobilde başlık/özet + durum/eylem odaklı kart/list görünümü sunun veya önemsiz sütunları uyarlamalı gizleyin. Masaüstünde tabloya yeterli alan tanıyın. Sabit/önemli sütunlar ve klavye ile yatay kaydırma test edilsin.

**Tablo içeriği belirsizliği:** Makale okuyucu ve sözleşme tabloları `overflow-x-auto` ile sarılmış. Seed makalelerde geniş gerçek bilimsel tablo bulunmadı; mevcut 3×3 test yalnız ekleme/caption doğruluyor. Bu yüzden tablo gövdesinin gerçek telefondaki kırpılması/okunabilirliği bu denetimde teyit edilmedi; embedding P0 ile etkileşimi ayrıca test edilmeli.

### P1 — Medya hakları bulgusunda onay kanıtı girişi bulunmuyor

**Durum:** İş akışı boşluğu doğrulandı; mevcut koruma doğru şekilde fail-closed.
**Kanıt:** `MediaRightsApproval` modeli reviewer, timestamp, evidence reference ve approved bool içeriyor. Export strict modda `rightsVerified` false ise reddediyor. Audit finding'i `featuredMediaId`/`media` alanına yönlendiriyor; editor inspector union gerçek sekme adlarını `taxonomy | sources | figures | seo | revisions` olarak tanımlıyor. Medya kütüphanesinde alt, caption, credit ve license alanları var; UI'da hak onayı, reviewer, evidence URL/reference ve revocation geçmişi girişi bulunmadı. `media` sekme adıyla gidildiğinde eşleşen sekme yok; hedef odak alanı da kayıtlı alanlarla eşleşmiyor.

**Öneri:** Figure/media panelinde lisans kanıtı, hak sahibi/credit, reviewer kimliği, tarih, kanıt referansı, durum ve yeniden doğrulama/revocation alanları olan bir hak inceleme akışı kurun; bulgudan bu alanlara odaklanın. Kimlik doğrulamasız istemci verisinin “verified” diye üretime güven vermesine izin vermeyin. Kamuya açık export korumasını gevşetmeyin. Yerel prototip Publish davranışı, üretim yayınından açıkça ayrılmalı ve yalnızca demo durumunu değiştirdiği görünür olmalı.

### P2 — Makale kaynağı rozetinde “DOI” sayısı DOI varlığından türetilmiyor

**Durum:** Kod yolu doğrulandı; görünen canlı örneklerin DOI alanlarının tam dağılımı sayılmadı.
**Kanıt:** `app/articles/page.tsx` `art.sourceIds.length` sayısını `${n} DOI` olarak gösteriyor; `ScientificSource.doi` opsiyonel. Dolayısıyla sayaç bağlı kaynak sayısını ifade ediyor; DOI'li kaynak sayısını kanıtlamıyor.

**Öneri:** “Kaynak” sayısını açıkça gösterin; DOI sayısı gösterilecekse seçili kaynakların geçerli DOI alanlarını sayıp DOI'siz durum için doğru değer verin.

### P2 — Bilimsel formülasyonun başlık/özet alanlarında düzenlenebilir sub/sup yok

**Durum:** Kapsamı sınırlı eksiklik doğrulandı; gövde editöründe özellik mevcut.
**Kanıt:** Tiptap gövde toolbar'ında subscript/superscript kontrolleri var. Başlık ve özet plain-text textarea; işaret biçimlendirme kontrolü sunmuyor. Unicode `CO₂`, `10⁻³` yazılabilir, ancak yaygın sembolleri keşfedilebilir biçimde ekleyen UI yok. Yayın sözleşmesinde başlık düz metin/sanitizasyon sınırı var; rich mark eklemek sözleşme/Web görünümü uyumu gerektirir.

**Öneri:** Önce güvenli Unicode bilimsel sembol paleti/ekleme kısayolu ve seçili metin testleri. Başlık/özete gerçek HTML/mark taşımak istenirse Web sözleşmesi ve arama/SEO tüketicileri için ayrıca tasarım ve uyumluluk kabulü gerekir.

### P2 — Şekil caption alanı tek satır

**Durum:** Doğrulandı.
**Kanıt:** Media Library caption alanı `type=text`; medya editöründeki alternatif metin 3 satırlı textarea ve editör figure caption 2 satırlı textarea. Uzun açıklamalar için medya kütüphanesinde çok satırlı düzenleme alanı yok.

**Öneri:** Caption düzenleyicisini textarea yapın; label, karakter sayacı ve uzun açıklama/alternatif metin ayrımını koruyun. Bu salt editör UX'idir; mevcut yayın alanı string kalabilir.

### P2 — Slug alanı kaydettiği URL'yi açıklamıyor; uzun slug tek satırda görünmüyor

**Durum:** Sunulan yol ipucu ile gerçek yayın yolu arasındaki çelişki doğrulandı; uzun slug'ın veri kaybına yol açtığı doğrulanmadı.
**Kanıt:** Editor slug alanı görsel olarak `/{locale}/` öneki gösteriyor; SEO kutusu `scientificradar.example/<locale>/<slug>` izlenimi veriyor. Gerçek v1 Web serializer canonical yolu `https://scientificradar.com/article/<slug>` olarak üretir; Web main'de `app/article/[slug]/page.tsx` mevcut. Tek satırlı input uzun slug'ı yatay gizler, fakat input içeriği otomatik kısaltıldığına dair kanıt yok.

**Öneri:** Gerçek canonical route örneğini önizleyin/kopyalatın; kısa alanı koruyup tam URL'yi ikincil satırda gösterin. Yerel önizleme linkinin `example` veya üretim URL'siyle karışmamasını sağlayın.

### P2 — Entegrasyon bağlantısı “Test Connection” adını taşıyor ama ağ testi yapmıyor

**Durum:** Mevcut davranış dürüstçe disconnected prototype; düğme etiketi yanlış beklenti yaratıyor. Security exposure kanıtı bulunmadı.
**Kanıt:** Ayarlar sayfası Client Component; handler yalnız yerel “tested” durumunu ve “Not connected yet — no credentials or external endpoints configured in P0” mesajını güncelliyor; ağ isteği/gerçek bağlantı yok. Bu bilinçli P0 sınırlaması ve güvenlik kusuru değil, fakat “Test Connection” gerçek provider health-check gibi görünüyor.

**Öneri:** Düğmeyi devre dışı/“Connection check unavailable in prototype” olarak adlandırın veya her zaman açık prototype açıklaması ekleyin. Gerçek entegrasyon gelirse kimlik bilgilerini yalnız server-side secret store'da saklayın; Client Component, IndexedDB ve `NEXT_PUBLIC_*` içine sır koymayın. Health check için allowlist sağlayıcı hostları, SSRF koruması, zaman aşımı, oran sınırlama, redakte edilmiş log ve auth kontrolleri ekleyin. Bu denetimde kimlik bilgisi eklenmedi ve harici endpoint çağrılmadı.

## Test ve güven sınırları

- Unit: 75/75 geçti (9 dosya).
- TypeScript: geçti.
- ESLint: geçti.
- Production build: geçti; Next.js build otomatik `tsconfig.json` ve `next-env.d.ts` üretti/değiştirdi. Bunlar audit worktree'sinde commit edilmedi.
- Playwright: yeni bağımsız tekrar 35/35 geçti, 0 failed, 0 skipped, exit 0 (19.5 s). Önceki yerel çağrı 35 pass yazdıktan sonra Ctrl-C ile exit 130 olmuştu; o çağrı tamamlanmış test run'ı değildi. Yeni tekrar port 4175'te tamamlandı ve standalone server kapandı.
- Harici servisler, üretim, gerçek kullanıcı içeriği veya kimlik bilgileri kullanılmadı.
