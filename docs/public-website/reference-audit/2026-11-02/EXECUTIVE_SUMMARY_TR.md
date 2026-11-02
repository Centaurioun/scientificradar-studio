# Yönetici özeti — bilim dergisi referans araştırması

**Araştırma tarihi:** 2 Kasım 2026 (Europe/Istanbul). **Sonuç:** Kısmi; Quanta canlı olarak ölçüldü, Knowable güvenlik doğrulamasında kaldı.

REA araçları Codex oturumunda kayıtlıydı. Ancak görev belgesi REA bağlantısından önce hedef origin’lere ek olarak kesin bir loopback CDP adresinin açıkça yetkilendirilmesini istiyor; mesajda bu adres bulunmadığı için REA’ya bağlanmadım. Bunun yerine kullanıcı tarayıcısından ve oturumundan bağımsız Playwright 1.64.1 / Chrome 155 kullandım. Knowable her iki hedefte de Cloudflare “Performing security verification” ekranı gösterdi. Bunu aşmayı denemedim ve sayfanın tasarımıymış gibi değerlendirmedim.

Quanta makalesi HTTP 200 ile yüklendi. DOM ölçümünde masaüstü H1 alanı 760 px, gövde metin blokları 560 px; 16 px Merriweather metni 30 px satır yüksekliğindeydi. Mobil 390 px’de H1 yaklaşık 25 px’e indi, gövde 350 px oldu ve belge genişliği taşmadı. 320 px stres görünümünde ilk ölçümde belge genişliği 326 px çıktı; ayrı bir etkileşim koşulunda yatay taşma görülmedi. Durum koşula bağlı ve kök neden bu araştırmada belirlenmedi.

## Tasarım devrine en yararlı bulgular

- **ÖNERİ:** Onaylı Merriweather/Inter seçimini koruyup başlık yazı tipini ayrı token olarak düzenleyin. Quanta’da başlık için Noe Display, gövde için Merriweather, arayüzde Pangram gözlendi.
- **ÖNERİ:** İlk okuma hedefini 680–720 px aralığında tutun; Quanta’nın ölçülen 560 px kolonu bundan daha dardır. Kaynak farklılığı ölçülebilir tasarım seçeneği olarak gösterilmeli, “tek doğru” kabul edilmemeli.
- **ÖNERİ:** Şekilleri metinden genişletme ve her şekle açıklama ekleme yeteneğini modelleyin. Ölçülen sayfada 560 px metin kolonundan geniş 10 şekil ve 10 açıklamalı `figure` vardı.
- **ÖNERİ:** Kaynak/DOI alanlarını yalnız gerçek bağlanmış kaynak olduğunda gösterin. DOM’da dört doi.org bağlantısı vardı; görünür `citation_doi` metadata anahtarı bulunmadı.
- **ÖNERİ:** Menü için görünür odak, Escape, dışarı tıklama ve dokunmatik durumları uygulamada ayrıca doğrulayın. Quanta’da klavye odağı görüldü; açılmış `role=menu` Escape sonrasında kapanmadı.

Bu bulgular Knowable sayfalarının ölçümü değildir. Görevde belirtilen tam karşılaştırma, Knowable’ın açılabilirliği ve erişilebilir izinli görsellerle yeni bir denemeye kadar **kısmen karşılandı**. `SIX_CYCLE_REVIEW.md` altı öz-denetim geçişinin her birinde bulguları, düzeltmeleri, güveni ve kalan bilinmeyenleri kaydeder. Nature, WCAG uygunluğu, LCP/INP, gerçek ekran okuyucu ve paywall davranışı test edilmedi.
