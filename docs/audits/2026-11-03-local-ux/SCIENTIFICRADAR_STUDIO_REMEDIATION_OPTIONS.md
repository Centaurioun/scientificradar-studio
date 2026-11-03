# Önerilen düzeltme seçenekleri ve kabul ölçütleri

Bu dosya inceleme önerisidir; uygulama değişikliği değildir. Öncelik, bağımlılık veya tasarım kararı verilmedi.

## P0 — Preview kapsayıcı genişliğinde doğru responsive layout

1. Preview bileşeninin kendi dar/geniş profiline göre layout seçin (container query veya açık preview breakpoint prop'u).
2. 768 px ve altında iki 220 px rail'i saklayın; kompakt içindekiler görünümünü açın; merkez sütunun minimum kullanılabilir genişliğini koruyun.
3. Okuma genişliği kontrollerini içerik ölçüsü olarak tutun; viewport/layout profili yerine kullanmayın.

**Kabul testleri:**

- Desktop 1440×900 + 390 px simulated: merkez sütun >0 px, ana metin okunabilir; kompakt TOC görünür; masaüstü rail'leri yok.
- Desktop 1440×900 + 320 px simulated: aynı kriterler; tek kelime/harf başına satır yok; içerik boyu gerçek metin uzunluğuyla orantılı.
- Desktop 1440×900 + 768 px simulated: metin sütunu kullanılabilir; TOC ile içeriğin üst üste binmesi yok.
- Gerçek viewport 390×844 ve 320×700: tek sütun; beklenmedik document horizontal overflow yok.
- 1440×900 desktop okuyucu görünümü mevcut Web tasarımını korur.

## P1 — Mobil articles liste sunumu ve geniş ekran alanı

1. 768 px altında tabloyu kart/list sunumuna dönüştürün veya ikincil sütunları uyarlamalı gizleyin.
2. Temel kimlik, status ve başlıca işlem mobilde yatay scroll olmadan bulunabilsin; ek sütunlar kullanıcı isteğiyle açılabilsin.
3. Geniş masaüstünde ana içerik kapasitesi tabloyu gereksiz yatay kaydırmaya zorlamasın.

**Kabul testleri:** 320/390 px'de başlık, durum ve işlem erişilebilir; odak ve klavye kontrolleri çalışır; tüm satır eylemleri erişilebilir; 1024/1440/1920 px'de gereksiz kolon kırpması/scroll yok.

## P1 — Hak inceleme kanıtı akışı

1. Media/figure inspector içinde credit/license/source/evidence reference, reviewer, timestamp ve status girdilerini sağlayın.
2. Audit “Go to field” bulgusu gerçek sekme ve input'a odaklansın; boş/uyumsuz hedefe sessiz geçiş olmasın.
3. Hak onayının yetkili kişi tarafından yapıldığı doğrulanamıyorsa verified varsayılmasın; revocation/değişiklik geçmişi kaybolmasın.
4. Public export fail-closed kalsın. Yerel demo Publish ile gerçek production export/publication arasındaki fark görünür olsun; demo davranışını rights enforcement'tan muaf kılacaksa ürün sahibi ayrıca karar versin.

**Kabul testleri:** eksik/bozuk kanıt export'u reddeder; geçerli kanıt UI'da görüntülenir; reviewer/tarih ve kaynağı görünür; kanıt güncellenince önceki değerin izi korunur; audit CTA doğru alanı açar; istemci uydurma approval ile yetkisiz public publish yapamaz.

## P2 — Bilimsel metadata ve kaynak sayımı

1. Başlık/özet için önce Unicode alt/üst indis sembollerini ekleyen erişilebilir palet/kısayol değerlendirin. Rich HTML işaretleri daha geniş contract/SEO/Web incelemesi ister.
2. Kaynak adedi “Sources” diye etiketlensin; DOI adedi gerçek, doğrulanmış DOI alanlarından türetilsin.
3. Media Library caption tek satır input'u çok satır textarea yapın; caption ile alt text ayrımını koruyun.
4. Slug yardım metni gerçek canonical `/article/[slug]` ile eşleşsin; uzun URL tam kopyalanabilir/okunabilir olsun.

**Kabul testleri:** `CO₂`, `H₂O`, `10⁻³`, `x²` eklenip kaydetme/yeniden yükleme korunur; title plain-text encoding Web serialization'da korunur; DOI'siz kaynak DOI rozetine eklenmez; uzun caption çok satır görüntülenir; slug örneği gerçek Web linkine eşleşir.

## P2 — Sağlayıcı bağlantısı prototip etiketleri ve gelecekteki güvenlik

1. Mevcut prototipte “Test Connection” yerine açık unavailable/prototype durumu kullanın.
2. Gerçek provider desteği ayrı kapsam: secret'lar sunucu tarafı saklama, sağlayıcı host allowlist'i, authZ, SSRF koruması, timeout/rate limit, redacted audit log ve bağlantı testi için mock tabanlı test.

**Kabul testleri:** P0 arayüzünde test aksiyonu network çağrısı yapmaz ve bunu açıkça söyler; gerçek modda geçerli/yanlış credential, timeout, SSRF benzeri URL, yetkisiz kullanıcı ve hata redaksiyonu test edilir; hiçbir secret client bundle, IndexedDB veya `NEXT_PUBLIC_*` içinde yoktur.

## Ayrı test hattı — geniş bilimsel tablo

Mobilde gerçek, geniş tabloyu içeren Tiptap içeriği ve Web serializer çıktısını 320/390 px, 768 px ve desktop ölçülerinde kurun. Tablo kendi içinde yatay kaydırılabilmeli; belge genelinde taşmamalı; caption, header hücreleri, ekran okuyucu ilişkisi ve klavye scroll'u korunmalı. Bu audit mevcut kanıtla tablo çiziminin kusurlu olduğunu iddia etmez.
