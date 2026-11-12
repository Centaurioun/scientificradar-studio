# Brave canlı etkileşim denetimi — 2026-11-03

## Kapsam ve kanıt sınırı

Denetim gerçek, görünür Brave tarayıcısındaki `/localhost:3000` Studio sekmesinde yapıldı. Kullanıcının diğer Brave penceresi/sekmesi kapatılmadı; Studio sekmesi bulunan pencere öne alındı. Sunucu, `/Users/yusuf/Repos/scientificradar-studio-preview` detached checkout'undan çalışıyordu: `057986ec4b6a2241c8210fa42eafda46ec49588f`. Bu SHA taze alınan `origin/main` ile aynıydı; stale geliştirme sunucusu saptanmadı. Ana checkout ve preview checkout dirty/untracked durumları korunarak bırakıldı.

Ekran görüntüleri önceki doğrulama dosyalarında kayıtlıdır: `evidence/dashboard-320.png`, `evidence/embedded-preview-390-body.png`, `evidence/real-browser-390.png`, `evidence/real-browser-320.png`. Bu turdaki canlı Brave ekran görüntüleri gözlemlendi; tarayıcı aracının görüntü baytlarını worktree dosyasına yazma yeteneği olmadığından yeni görüntüler bu ek commit'e dosya olarak eklenmedi. Dolayısıyla aşağıdaki yeni ölçümler ekran/DOM gözlemi ve ölçüm kaydıdır; bunlar yeni PNG kanıtı olarak sunulmamalıdır.

## Sunucu, tarayıcı ve güvenli deneme verisi

- `localhost:3000` HTTP 200; Next.js 16.4.3 sunucusu PID `61204`, preview checkout'undan çalışıyor. Sunucu yeniden başlatılmadı veya durdurulmadı.
- Açık Brave Studio sekmesi mevcut makalenin yanındaki **New Article** ile oluşturulan, yalnız bu denemeye ait `[QA TEMP]` taslağına gitti. Var olan makale veya medya kaydı düzenlenmedi; IndexedDB temizlenmedi.
- Başlık/özet içinde `CO₂ CH₄ H₂O Fe³⁺ Ca²⁺ x² μm α β Δ` Unicode metni saklandı. Tiptap'te 4×4 tablo ve aynı notasyonu taşıyan caption eklendi. Makale düzenleme rotası yenilendi; başlık, özet, tablo ve caption `Saved (Local)` olarak geri yüklendi.
- CKEditor 5 + Math'e geçişte caption ve tablo kaldı; Tiptap'e dönünce aynı caption ve 4×4 tablo DOM'da duruyordu. Bu yalnızca bu örnek için geçiş/persistence kanıtıdır; denklem, citation, figure ve tüm formatting'in birebir korunduğunu ispatlamaz.
- Geçici taslak test sonunda bırakıldı; silme akışının recoverable olup olmadığı doğrulanmadı ve bu nedenle kalıcı silme yapılmadı. Taslak başlığı `[QA TEMP]` ile işaretlidir.

## Gerçek etkileşim sonuçları

| Yüzey/eylem | Gözlenen sonuç | Karar |
|---|---|---|
| Dashboard sidebar collapse/expand | 240px → 64px → 240px; içerik çalışmaya devam etti | Geçti |
| Global search | Açıldı; `JWST` sorgusu 1 makale döndürdü; Escape kapattı | Geçti |
| Articles search/filter | `JWST` 1 satır; In Review 2 satır; filtre temizlenebildi | Geçti |
| Articles selection | Satır seçimi ve select-all çalıştı; 9 makale seçili gösterildi; hepsi seçimden çıkarıldı | Geçti; bulk işlemler tetiklenmedi |
| Makale editörü | Geçici taslak kaydedildi ve yenileme sonrası IndexedDB'den geri yüklendi | Bu örnekte geçti |
| Tiptap ↔ CKEditor 5 + Math | 4×4 tablo ve caption iki yönde de görünür kaldı | Kısmi geçti; tam içerik sadakati kanıtlanmadı |
| Bilimsel sembol paleti | Unicode palette açıldı/kapatıldı; ±, µ, Δ, α, β, γ, λ, σ, Ω, ≠, ≈, ×, →, Å vb. gösterildi | Geçti |
| LaTeX equation composer | Inline/block modu ve girilmiş örnek için subscript/superscript preview gösterdi; Cancel ile kapandı | Composer açılışı geçti; kaydetme/serialize/render akışı sınanmadı |
| Figure inspector | Mevcut demo NIRSpec medyası QA taslağına seçildi; alt, caption, layout lock ve “human-verified” kontrolü görüldü | Geçti; rights reviewer/evidence alanı yok |
| Publish (Demo) | Yerel-only/no production açıklaması, 1 blocker, 5 warning, 14 pass ve 2 unverified gösterdi; yayın düğmesi kapalı kaldı | Güvenlik kapısı doğru fail-closed |
| Go to Field (Figure Rights) | Modal kapandı, Figure inspector'a döndü; rights/evidence/reviewer için input/select/textarea yok | **Çözülemeyen aksiyon / eksik iş akışı** |
| Entegrasyon Test Connection (Codex) | “Checked at 04:36: Not connected yet — no credentials or external endpoints configured in P0 isolated prototype.” | Düğme gerçek bağlantı testi değil; metin yerel/prototip kısıtını açık ediyor |
| DevTools console | İnceleme anında `error`/`warn` listesi boştu | Gözlenen sekme/oturum için hata görülmedi; ağ paneli/failed-request telemetry aracı yoktu |

### Güvenli yayın kapısı ve hak kanıtı

Test makalesinde mevcut seed medyası kullanıldı. Publish (Demo) kapısı “Local Demo Publication Only” ve `scientificradar.com` değişmeyeceğini bildiriyordu; bu disclaimer anlaşılırdı. Gate metni attribution bulunduğunu fakat açık doğrulanmış hak kanıtı olmadığını söyledi; hak referansı ve yetkili rights reviewer gerektiğini belirtti. `Go to Field` sonrası UI'da license/evidence/reviewer için giriş alanı olmadığı görünür DOM'da doğrulandı. Bu nedenle erişilebilir UI üzerinden blocker çözülemedi. Gerçek public export fail-closed guard korunmalı; öneri, kanıt kaydı için yetki/audit izi olan form ve “alt text review”, “attribution/licence metadata”, “rights approval + evidence” statülerinin ayrı tutulmasıdır.

### Bilimsel metadata denemesi

- Unicode bilimsel karakterler başlık ve özet düz metinlerinde doğru göründü; bu karakterlerin elle girilmesi mümkün. Bu gözlem, semantik `<sub>/<sup>` biçiminin veya erişilebilir telaffuz etiketinin bu alanlarda desteklendiği anlamına gelmez.
- Başlıktan otomatik oluşan slug'da sayısal/üst-alt indis bileşenleri kayboldu: `CO₂ → co`, `CH₄ → ch`, `H₂O → ho`, `Fe³⁺ → fe`, `Ca²⁺ → ca`, `x² → x`. Örnek slug önizlemesi: `qa-temp-co-ch-ho-fe-ca-x-m-responsive-scientific-metadata-display-test-for-a-deliberately-long-header`. Bu, adlandırma beklentisi bakımından yeni canlı gözlemdir; arama indeksleme veya canonical route bozukluğu olarak yorumlanmamalıdır.
- Figure alt text'i ve demo caption'ı görünürdü. Figure caption'daki metin mevcut seed medyasının içeriğiydi; QA makalesine ilişki atandı, medya kaydı değiştirilmedi.
- Taslak preview başlık/özet/notasyonu doğru gösterdi; buna karşılık Draft V5 durumundaki kayıtta reader preview tarihi “Published Nov 3, 2026” olarak göründü. Bu durum/tarih dili tutarsız ve doğrulanması gereken P2 UX bulgusudur; üretim yayınına dair bir kanıt değildir.

## Gerçek tarayıcı responsive matrisi

`scrollWidth - clientWidth`, sayfa düzeyindeki taşmayı ölçer. Reader iç grid değerleri QA taslağının Reader Preview'unda görülen layout'a aittir.

| Görünür Brave viewport | Document farkı | Reader içi grid / orta kolon | H1 yüksekliği | Sonuç |
|---|---:|---|---|---|
| 430×932 | 0px | `348px`, merkez 348px | 209px | Tek kolon, okunabilir |
| 390×844 | 0px | `308px`, merkez 308px | 244px | Tek kolon, okunabilir |
| 375×812 | 0px | `293px`, merkez 293px | 244px | Tek kolon, okunabilir |
| 320×700 | 0px | `238px`, merkez 238px | 313px | Tek kolon, dar ancak karakter karakter kırılma yok |
| 768×1024 | 0px | `341.938px`, merkez ~342px | 292px | Sıkışık orta kolon; masaüstü TOC/yan kolonlar alan tüketiyor |
| 1024×768 | 0px | `326.562px`, merkez ~327px | 443px | Sıkışık orta kolon; uzun H1 belirgin biçimde uzuyor |
| 1280×800 | 0px | `220px 0px 220px` | 492px | Orta kolon sıfır; reader kırılıyor |
| 1440×900 | 0px | `220px 0px 220px` | 492px | Orta kolon sıfır; reader kırılıyor |
| 1920×1080 | 0px | `220px 0px 220px` | 492px | Orta kolon sıfır; reader kırılıyor |

### Kullanıcının verdiği yayımlanmış makale üzerinde ek repro

Kullanıcının paylaştığı Brave appshot'taki mevcut route (`/articles/art-quantum-repeater/edit`) ve yayımlanmış “Heralded Quantum Entanglement…” makalesiyle, QA taslağından bağımsız olarak canlı Brave'de tekrar denendi. Outer browser viewport yaklaşık 2520 CSS px, Reader Preview iç mod Mobile 390 seçiliydi. `article` genişliği 308px ve H1/standfirst sarmalaması normal görünürken, reader body grid `220px 0px 220px` üretti; `.article-prose` ve ilk gerçek body paragrafının genişliği 0px idi. İlk paragraf yüksekliği 12,088px, başlık bölümleri 1,389–1,973px yüksekliğe çıktı. Ekran görüntüsündeki harf harf dikey makale gövdesi bu DOM ölçümleriyle doğrulandı. Bu, P0'u yalnız `[QA TEMP]` içeriğine bağlı olmaktan çıkarır ve gerçek seeded yayımlanmış örnekte de doğrular.

User appshot kendi içinde gerçek görsel kanıttır; browser chrome/tab listesini taşıdığından bu içerik PR'a kopyalanmadı. Benim ölçümüm görünür Brave'deki aynı route ve state üzerinde alındı. Mevcut `evidence/embedded-preview-390-body.png` makale gövdesinin sıfır kolon problemine ait önceki audit ekranını gösterir.

Sayfa scrollWidth'ünün viewport ile aynı kalması embedded okuyucunun çalıştığını göstermez: problem iç grid'in orta kolonunun 0 px olmasıdır. Gerçek 390 ve 320 viewport'ları ile masaüstü içinde 390 px simüle edilmiş reader farklı sonuç verdi. Bu gözlem SRS-UX-01'i ekrandan yeniden doğrular. Tablet gerçek viewport'u da genel overflow üretmedi fakat 768/1024'te merkez içerik okunabilir genişliğe ulaşmadı.

Article listesinde masaüstü gerçek DOM ölçümü: tablo 1359px, yatay scroll container 1136px (1440px browser, sidebar ve sayfa padding'i sonrası). Tablo kendi kabında yatay kayıyor ve document overflow üretmiyor; dashboard'ın 320px overflow bulgusundan ayrı tutulmalıdır. Birçok uzun tablo hücresine `whitespace-nowrap` uygulanmış olduğundan mobilde onlarca sütuna eşdeğer yatay gezinme yükü oluşur. Öneri: geniş desktop'ta kullanılabilir alanı kullan, orta ölçekte öncelikli kolonlar + ikincil detay, mobilde taranabilir kart/accordion sun; DOI rozeti yalnız gerçek DOI metadata sayıyorsa DOI diye etiketlensin.

## Altı çevrim: bu canlı oturumdaki bağımsız kontrol adımları

1. **Navigation/coverage:** Dashboard'dan görünür sidebar bağlantılarıyla `/articles`, `/pages`, `/categories`, `/media`, `/series`, `/homepage`, `/videos`, `/review`, `/calendar`, `/authors`, `/revisions`, `/assistant`, `/seo`, `/knowledge-links`, `/search-performance`, `/settings`, `/settings/navigation`, `/settings/integrations`, `/settings/roles`, `/settings/audit` açıldı. Her route'ta içerik başlığı/metni görüldü; tam işlev testi her modülde yapılmış değildir. Search, Articles filtre/selection ve sidebar collapse özellikle etkileşimli denendi.
2. **Responsive UX:** Önce gerçek dokuz viewport ve ardından masaüstü içi Desktop/Tablet/Mobile/320 okuyucu modları kıyaslandı. İç okuyucu kolonunun genişliğine bakıldı; sadece document overflow raporlanmadı.
3. **Scientific fidelity:** QA taslağında Unicode başlık/özet, otomatik slug, sembol palette, LaTeX composer, figure, caption, 4×4 tablo ve preview metni test edildi; tablo ve caption editor değişiminden sonra da korundu. Citation ve denklem kaydetme/render testi tamamlanmadı.
4. **Editorial workflow:** Yerel taslak kaydet/yenile, editor switching, Publish (Demo) kalite gate, Figure Rights blocker ve `Go to Field` etkileşimi denendi. Test geçici makaleyle sınırlıydı; review/restore/schedule işlemleri existing records'a uygulanmadı.
5. **Security/reliability:** Entegrasyon kartının gerçek durum metni ve Test Connection geri bildirimi görüldü; sır girilmedi, dış servis bağlantısı kurulmadı. UI, P0 izolasyonunu açıkça belirtiyor. Tarayıcı console warning/error boştu; ağ panelinde sistematik failed request enstrümantasyonu yoktu.
6. **Independent reverification:** Öncelikli embedded-reader P0, 1440 ve 1920'de tekrar ölçüldü; orta kolon 0px kaldı. Gerçek 390/320'de aynı QA taslağı ölçüldü ve bir sütun/okunabilir bulundu. Hak bloğu UI'dan tekrar Go to Field ile denendi; giriş alanı bulunmadı. Böylece hatalı genelleme (tüm mobil reader bozuk) ve güvenlik bypass önerisi reddedildi.

## Kapsam dışı / kanıtı yetersiz

- Dokuz viewport'taki bütün sidebar modüllerinin her button, modal, keyboard/focus, empty/error/success state'i tek tek test edilmedi. Route coverage, module-level exhaustive QA olarak sunulmamalıdır.
- Makale editöründe revision restore, unsaved warning, submit-review, destructive archive/delete, gerçek publication, HTML source round-trip, figure rights submission, form field save, citations, body formulas, captions ve SEO alanlarının tüm kombinasyonları denenmedi.
- Reader geniş içerik çeşitliliğine sahip birden fazla gerçek makaleyle test edilmedi; yeni QA sample yalnız uzun başlık/özet, demo figure, caption ve blank 4×4 table taşıdı. Dar ekranda gerçek hücre uzunluğu ve citation anchor davranışı teyit edilmedi.
- Dev console'da gözlem anında error/warn yoktu. Bu, her zaman aralığı/route için sıfır hata kanıtı değildir. Network failed-request listesi toplanamadı.
- Alt yazı/ses okuyucu, a11y otomatik audit, tüm klavye sırası, gerçek external provider config, RBAC server enforcement ve public deploy test edilmedi.

## Kaynakta beklenen kanıt noktaları

- Rights gate audit code: `lib/audit/run-article-audit.ts` (media rights check); strict export validation `lib/publishing/web-contract-v1.ts:1010-1081`; strict `rightsVerified` condition around line 1073.
- Rights approval schema `lib/types.ts:182-187` (`approved`, `approvedBy`, `approvedAt`, `evidenceRef`).
- Dashboard/article layout and embedded preview defects remain linked from existing issue register and screenshots; this report does not change application source.

