# ScientificRadar — Çapraz Depo Ürün Fırsatları ve Eleştirel Değerlendirme
**3 Kasım 2026 | Karar belgesi | Araştırma; kod uygulaması değildir**

## Yönetici karar özeti (ilk sayfa)

**Karar önerisi:** Aktif Studio Web-alignment M1–M7 görevini **önce tamamlayın**. Yeni özellik paketlerini Google AI Studio'ya aynı anda vermeyin. Önce mevcut editörün veri kaybetmeden Web'in v1.0.0 yayın sözleşmesine çıkabildiği kanıtlansın. Kodun yeşil olması üretim yayın yetkisi veya gerçek kullanıcı deneyimi doğrulaması değildir.

**En ciddi risk:** Studio'nun tarayıcı-içi içerik/simüle rol modeli ile Web'in halka açık v1 snapshot modeli arasında henüz kanıtlanmış, kimlik doğrulamalı, kalıcı, revizyon-kontrollü yayın hattı yok. Ayrıca Web validator'ının medya alanında `rightsVerified=false` değerini reddetmediği doğrulandı. [Studio görev belgesi L26-L31](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/ai-studio/SCIENTIFICRADAR_STUDIO_WEB_ALIGNMENT_M1_M7_MISSION_2026-11-03.md#L26-L31) · [Web media type L49-L59](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/types.ts#L49-L59) · [validator L112-L160](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/contract-v1.ts#L112-L160).

**En değerli beş fikir (mevcut işler dikkate alınarak):**
1. **İki taraflı bilimsel yayın sözleşmesi kalite kapısı:** hak kanıtı, referans kimliği, desteksiz bilimsel blok, revizyon ve yayın alındısı; mevcut M1'i *genişlet*, ikinci yayın altyapısı kurma.
2. **Kayıpsız makale taşıma ön kontrolü:** Studio JSON/HTML → Web snapshot karşılaştırmalı içerik matrisi; M1'in kabul kriterine ekle.
3. **Bilimsel eski makale içe aktarma pilotu:** önce tek sahipliği doğrulanmış URL veya daha kaliteli yapılandırılmış dışa aktarım; taslak/karantina, alan bazında güven ve üçlü önizleme. Yeni özellik, M1 ve mevcut veri güvenliği kapılarından sonra.
4. **Referans–iddia ve görsel hakları uzlaştırması:** mevcut citation scanner ve SEO audit'i değiştirerek kanıt-kökeni odaklı, insan onaylı iş akışı; otomatik DOI/ORCID uydurmasın.
5. **SEO yönlendirme eşleme uzlaştırması ve içerik envanteri:** içe aktarma kayıtları ile Web'in **zaten var olan** redirect validator'ını birleştir; trafik sayısı yerine eksik kaynak/bozuk bağlantı/karşılığı olmayan URL gibi eyleme dönük durumlar göster.

**Şimdi reddet / ertele (ilk beş):**
1. Kod içinde ikinci bir editör motoruna daha geçiş veya bütün uygulamayı Web `ArticleBlock[]` modeline çevirme — **REJECT**.
2. Eski siteden regex→plain-text tek tıkla otomatik yayına taşıma — **REJECT**; bilimsel içerik kaybı ve SSRF riski.
3. Spor kursu CRM, e-ticaret, tenant tema seçimleri ve abonelik modülleri — **REJECT**.
4. Canlı GA4/AdSense ve bağlantı gerektiren yanıltıcı gösterge panelleri — **DEFER**; mevcut Web'de default-off config zaten var.
5. Yayıncı onayı ve kaynak denetimi olmadan yapay zekâ ile DOI/iddia/tam makale/çeviri oluşturma — **REJECT**.

**Sahip onayı gerektiren karar:** (a) ilk migrasyonun örnek kaynak biçimi ve hak kapsamı, (b) gerçek sunucu kimliği + saklama/yayın mimarisi, (c) yayından kaldırma/düzeltme politikası, (d) gerçek Search Console URL dışa aktarımı, (e) medya hak onay sorumlusu.

**Önemli kısıt:** Bunlar ürün mimarisi önerileridir; onaylanmış geliştirme işleri değildir. Bu dal yalnızca üç araştırma dokümanı içerir.

---

## 1. Kesin anlık durum ve kanıt hiyerarşisi

Araştırma başlangıcında GitHub API üzerinden `main` doğrulandı (3 Kasım 2026):
- Studio: [`50b9ff1ec249fff003be605d1acd101e89b4bf05`](https://github.com/Centaurioun/scientificradar-studio/commit/50b9ff1ec249fff003be605d1acd101e89b4bf05). Bu HEAD, AI Studio M1–M7 görevi + Web'in *inert* referanslarını taşıyan #23 birleşimidir; bir Web-alignment uygulama sonucu değildir. [Referans manifest](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/references/scientificradar-web/SOURCE_MANIFEST.md#L1-L33).
- Web: [`3b096e84023ca1ba358b7d7dd4f25f17185fc8d7`](https://github.com/Centaurioun/ScientificRadar-web/commit/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7). GitHub Actions'ta [Quality](https://github.com/Centaurioun/ScientificRadar-web/actions/runs/41543384305) ve [Responsive Playwright](https://github.com/Centaurioun/ScientificRadar-web/actions/runs/41543384497) **success**; ayrı execution report 40/40 unit, 85/85 E2E bildiriyor. Bunlar **Web** kanıtıdır; Studio veya gerçek prod entegrasyonu kanıtı değildir.
- Studio güncel HEAD'deki [Test foundation](https://github.com/Centaurioun/scientificradar-studio/actions/runs/41545826516) ve [CKEditor development mount](https://github.com/Centaurioun/scientificradar-studio/actions/runs/41545826684) workflow'ları success. Önceki [12 senaryolu runtime audit](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md#L14-L44) hâlen tarihi gözlemdir; o andaki 4 PASS/8 FAIL bugünün test tekrar koşusu değildir.
- Özel esin deposu `ardaiseri/sporsalonu-kurs` yetkili `ardaiseri` hesabıyla okunabildi; inceleme SHA'sı `27c0083f1da01797daf0e44775ed80f2969a5839`. Kamuya açık rapora özel repo kaynak kodu, kullanıcı verisi veya uzun alıntı taşınmamıştır.
- GitHub Project #3'ün proje kartları doğrudan okunamadı; [Web M0–M7 issue ve milestone kayıtları](https://github.com/Centaurioun/ScientificRadar-web/issues) ve Studio'nun 51-ID backlog'u çift iş önleme için incelendi. Eş isimli kapanmış/açık çift issue'lar var: issue durumundan **özellik üretimde** sonucu çıkarılmamalıdır.

**Kaynak derecelendirme:** Güncel kod > mevcut commit'teki test kaynağı ve GitHub workflow sonucu > güncel rapor > geçmiş test/audit > teklif. Bu oturumda iki uygulama yerel olarak başlatılmadı, yeni Playwright/browser testi koşulmadı; öneri puanları **analist tahmini**dir.

### Var olan değer ve sınır
Studio'da `Article` editable Tiptap JSON + `bodyHtml`, citation, source, media, review queue, revision restore, SEO/quality audit ve local demo preview vardır: [Article modeli](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/types.ts#L34-L62), [citation analizörü](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/citations.ts#L13-L24), [revision geri yükleme](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/app/revisions/page.tsx#L17-L69), [demo preview uyarısı](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/components/editor/article-preview-view.tsx#L61-L76). `MediaAsset` tarafında credit/licence alanları var ancak açık hak onay bool'u yok: [L167-L185](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/types.ts#L167-L185). Kalıcı sunucu verisi, gerçek RBAC ve live publication ispatlanmadı; [görev sınırı](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/ai-studio/SCIENTIFICRADAR_STUDIO_WEB_ALIGNMENT_M1_M7_MISSION_2026-11-03.md#L26-L31).

Web: ayrı Next.js uygulaması, `PublishedSnapshotRecordV1`, sanite edilmiş bilimsel HTML/KaTeX/citation/TOC, konulu yayın akışı, arama, ilgili yazılar, metadata/robots/sitemap ve default-off Google services içerir; fakat [repository](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/repository.ts#L1-L15) demo fixture'larından çalışır. [Web sözleşmesi](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/docs/design/CONTENT_CONTRACT.md#L1-L15). Mevcut [redirect manifest validator](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/seo/redirects.ts#L67-L82) tekrar yazılmamalıdır. [Google M1–M7 report](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/docs/google-ai-reports/SCIENTIFICRADAR_WEB_M1_M7_EXECUTION_REPORT.md#L21-L31) kendi deyimiyle live cutover'ı bloke tutar.

### Mevcut gerilimler ve doğrulanma düzeyi
- **Kesin kod bulgusu:** Web `PublicMedia.rightsVerified` mevcut; `validateMediaRecord` URL/alt/caption/credit/license/dimension kontrol ediyor ama booleanı kontrol etmiyor. [Web L112-L160](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/contract-v1.ts#L112-L160). Bu bir **contract bypass** ve yayın öncesi düzeltme adayıdır; dış saldırı kanıtı değildir. Studio M1 zaten [L60-L64](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/ai-studio/SCIENTIFICRADAR_STUDIO_WEB_ALIGNMENT_M1_M7_MISSION_2026-11-03.md#L60-L64) ile bunu istemektedir.
- **Onaylanmamış risk:** Studio geçmiş runtime audit'inde eşzamanlı tabların üstüne yazması, `blob:` media kaybı, local rol geçiş bypass ve statik sayfa içeriğinin eski XSS canary çalıştırması belgelenmiş; bu oturumda yeniden üretilmedi. [backlog W1–W5](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/SCIENTIFICRADAR_STUDIO_MASTER_DEVELOPMENT_BACKLOG_V2.md#L50-L69). Yeni başlık açılmasın; mevcut `SRS-SEC-*`, `SRS-DATA-*`, `SRS-MED-*`, `SRS-PUB-*` kapsamına kabul testi eklensin.
- **UI farklılığı (kod gözlemi, görsel test değil):** Studio preview genişlik/shell: [L120-L165](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/components/editor/article-preview-view.tsx#L120-L165); Web reader: [ArticleReader](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/components/editorial/ArticleReader.tsx#L143-L155). Mevcut M1 preview-parity görevi bu farkı zaten hedefliyor.

## 2. Rol ve iş akışı / UX test hipotezleri

**Yazar → editör → yayıncı:** Açılabilir taslak → bilimsel kaynak ve medya metadata → kaydet (dayanıklılık alındısı) → review/uyuşmazlık çözümü → Web projection önizlemesi → publish blocker → yetkili publish receipt → public page doğrulaması → düzeltme/geri çekme. Mevcut Studio akışında son iki gerçek sunucu adımı yok; görünür `published` yerel statü olabilir. En yüksek değer, sahte publish butonu değil **gerçeği anlatan durum/receipt**.

**Okur:** Keşif/arama/konu → bilimsel makale → bölüm içindekiler, kaynak–alıntı geri bağları ve formül → güncelleme/düzeltme bildirimi → ilgili makale. TOC, kaynak ve arama zaten var: [reader](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/components/editorial/ArticleReader.tsx#L28-L104), [search](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/app/search/page.tsx#L33-L57). Bu nedenle yeni genel amaçlı TOC, genel arama ve ikinci hover altyapısı **yüksek ROI değil**. Studio'da [Knowledge Links](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/app/knowledge-links/page.tsx#L50-L60) demo olarak mevcut; Web'e otomatik Wikipedia kelime işaretleme eklendiği kanıtlanmadı.

**Küçük kazanımlar:** Alan düzeyinde `needs-review` ve `unchanged` etiketleri; figure hak durumu; cross-app uyarı metinleri; gerçek kaynak eksikliği ile DOI syntax kontrolünün ayrıştırılması; yayın adımında geçen/kalan içerik karşılaştırması. Dashboard istatistiklerinden daha değerlidir.

## 3. Fırsat envanteri ve alternatifler (detay, maliyet, test ve puanlar üçüncü dosyada)

| Öneri | Tür | Gerçek mevcut durum | Karar | Çakışma |
|---|---|---|---|---|
| Medya `rightsVerified` fail-closed gate | Güvenlik/hukuk/bilim | PARTIAL: alan var, tüketici validator'da blocker yok | **RECOMMEND NOW**, M1 kabulüne ekle | M1 Studio / Web contract |
| Kayıpsız bilimsel projection ve preview comparison | Mimari/bilimsel | SPEC-ONLY Studio export, Web reader mevcut | **RECOMMEND NOW** (mevcut misyonu genişlet) | M1, `SRS-HTML-*` |
| Gerçek publish receipt, immutable revision, revocation | Mimari/ops | SPEC-ONLY; Studio local state ve Web demo | **STUDY FIRST** altyapı seçimi, sonra P0 | M1/M5/M7 |
| Tek URL doğrulanmış taslak importer | Migrasyon/bilim | M3 mapping spec var; tam wizard doğrulanmadı | **RECOMMEND LATER** kontrollü pilot | M3 #18/#20/#22 |
| Yapılandırılmış export + batch dry-run | Migrasyon | SPEC-ONLY; Web redirects mevcut | **STUDY FIRST**, örnek kaynak elde edilince | M3 |
| Source–citation–claim reconciliation | Bilimsel | PARTIAL: atıf ID taraması ve audit mevcut | **RECOMMEND LATER**, genişlet | `SRS-SCI-001/002`, `SRS-SEO-001` |
| Correction/withdrawal notice & history | Bilimsel/okur | PARTIAL: withdrawn Web statüsü var, süreç kanıtı yok | **STUDY FIRST** yayın politikası | M1, M7 |
| Redirect+import conflict reconciliation | SEO | PARTIAL: Web validator var, gerçek GSC satırları yok | **RECOMMEND LATER** GSC kanıtıyla | M3 |
| Actionable inventory / orphan and broken links | Workflow/analitik | PARTIAL: Studio dashboard yerel quality kartları var | **RECOMMEND LATER**, kullanım testiyle | `SRS-UX-003` |
| Translation evidence review | Bilimsel/çok dil | Locale alanı var; hakiki dil versiyon onayı bilinmiyor | **STUDY FIRST** | M2 locale |
| Logo master/variants/OG/favicons | Branding | İsim eşleşen asset bulunmadı; tam görsel kullanım denetimi yapılmadı | **RECOMMEND LATER** yalnız asset envanteri | Mevcut görsel baz korunacak |
| Tema-market/CRM/ikinci editör | Spekülatif | Ürün gereği yok | **REJECT** | Gereksiz maliyet |

### Ana özellikler için gerçek alternatifler
**Migrasyon:** (A) hiçbir şey yapma: teknik borç yok ama manuel kayıp riski; (B) tek URL + karantina: kontrollü doğruluk, M; (C) structured export + batch: daha yüksek doğruluk, L/XL, sahip kaynak erişimi gerektirir. Tercih önce örnek export sorgula, yoksa sınırlı B pilotu.

**Yayın:** (A) local demo'yu olduğu gibi tutmak: prototip için düşük maliyet, canlı yayın için kabul edilemez; (B) immutable artifact + imzalı/kimlikli yayın alındısı: orta operasyon yükü; (C) gerçek sunucu content service + audit DB + API: yüksek kalıcı maliyet ve daha güçlü yaşam döngüsü. Tercih yayın mimarisini içerik hacmi, güvenlik ve geri alma gereğine göre sahibiyle seçmek.

**Bilimsel doğrulama:** (A) yalnız manuel checklist: ucuz ama tutarsız; (B) ID, DOI syntax, kaynak–atıf eksikliği ve hakları işaretleyen deterministic audit: M; (C) otomatik harici metadata eşleştirme: L, fiyat/rate limit/hatalı eşleme riski. Önce B; C insan onayı olmadan değer üretmez.

## 4. Altı gerçek analitik revizyon döngüsü

1. **Tazelik / kanıt:** Tarihsel 51-task backlog ve Web M0–M7 raporunu güncel `main` ile karşılaştırdım. Yanlış ilk fikirler olan “Web'de sitemap yok”, “Web'de redirect validator yok”, “Studio'da citation/revision yok” çıkarıldı. Yeni doğrulanan medya rights gate üst sıralara alındı.
2. **Kullanıcı yolculuğu:** Genel dashboard ve TOC ekleme önerileri silindi; editörün *save→review→publish* ve okurun *source→correction* izleri gerçek sürtünme olarak kaldı. Tek tek article durumları yerine gerçek receipt tercih edildi.
3. **Bilimsel bütünlük:** Adversarial örnekler: iç içe tablo, `H2/H3`, Türkçe `İ/ı`, `sub/sup`, inline-display TeX, çoklu figure, atıf ile liste mismatch, hatalı DOI, geri çekilmiş makale, çevrilmiş metin. Regex/plaintext ithalatı üst sıradan **REJECT**e indirildi; kayıpsız ve editöre görünen discrepancy zorunlu yapıldı.
4. **Güvenlik/hukuk/ops:** Özel projedeki taslak-first deseni faydalı ama URL ön DNS kontrolünün yönlendirme/bağlantı-IP bağlama garantisi olmadığı görüldü. SSRF, hak ve sunucu yetkilendirme tehdit modeli olmadan live import ve “one-click publish” kaldırıldı.
5. **UX/a11y/uygulama:** Genel tasarım revizyonu çıkarıldı. Dar mobil preview, TOC focus, tablo overflow, alan bazlı provenance işaretleri ve golden fixture karşılaştırması M1 acceptance içine katıldı. Yeni editör kütüphanesi tasarımı reddedildi.
6. **Şüpheci önceliklendirme:** İlk 10 fikir yeniden sınandı: mevcut işi kopyalayan publication/SEO/hover/analytics önerileri tek satır halinde “M1/M3 genişlet”e indirildi. Son liste: önce hak kapısı ve kayıpsız export, sonra gerçek yayın mimarisi, sonra kontrollü migrasyon ve bilimsel kalite; marka/çeviri/analitik daha sonra.

**Belirsizlik defteri:** Gerçek legacy PHP örnek kaydı/GSC CSV görülmedi; yeniden browser test yapılmadı; gerçek kullanıcı görüşmesi, trafik baseline, editoryal ekip kapasitesi, storage hosting maliyeti ve Project #3 özel kartlarının tam durumu doğrulanmadı. Tüm “ölçülen kazanım” hedefleri geleceğe ait acceptance metrikleridir, bugünkü sonuç değildir.

## 5. Üç karar stratejisi
**A — Stabilizasyon (önerilen):** Aktif Studio M1–M7 misyonunu bitir; contract/sanitization/durability/rights/visual fixture testlerini incele; live servis bağlama. Sonra tek importer fixture prototipini değerlendir. En düşük regresyon ve maliyet riski.

**B — Paralel araştırma, ayrı geliştirme:** M1 çalışırken SADECE offline legacy örnek envanteri/CSV şeması ve editorial correction policy hazırlanır; kodda paralel feature yok. Orta hız, düşük çatışma.

**C — Büyük batch migrasyon ve production cutover:** Şu anda **önerilmez**. Gerçek kaynak, auth/storage, hak, GSC ve rollback kapıları belirsiz; yatırımın kayıp/SEO riski ağır basar.

## 6. Owner tarafından açık karar gerektiren sorular
1. Eski `scientificradar.com` PHP yayınının içeriği ve görsel hakları tamamen size ait mi; CMS export / örnek HTML / sitemap / Search Console dışa aktarımı hangi biçimde sağlanabilir?
2. İlk aşama hedefi *tek makale kalite kontrollü dry-run* mı, yoksa belirli bir onaylı makale örneklemine dayanan migrasyon değerlendirmesi mi?
3. Canlı yayın için kalıcı server storage, authentication, editorial roles ve rollback hangi sağlayıcı/işletme sorumluluğunda olacak? Onay gelene kadar kapsam tasarım düzeyinde kalmalı.
4. `rightsVerified` işaretini kim, hangi lisans belgesine dayanarak verecek? Hak iddiasını yalnızca dolu `license` stringiyle kanıtlamayalım.
5. Düzeltme, expression of concern, retraction ve withdrawal için editoryal karar yetkisi ve geçmiş revision gösterim politikası nedir?
6. Canlı GSC ölçümü/URL CSV olmadan 301/308 aktifleştirilmesini **yasak** tutuyor muyuz? Öneri: evet.

## 7. Kaynaklar ve bağımsızlık
- OWASP, [SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) (3 Kasım 2026 erişim).
- Google Search Central, [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) ve [Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects) (3 Kasım 2026 erişim).
- Kaynak: Yukarıda permalinkle belirtilen iki repo ve ilgili commit'lerdeki kod/CI. Özel esin deposundan kod kopyalanmamıştır.
- **Araştırma statüsü:** Doğrudan kaynak/commit ve workflow doğrulaması var; yeni yerel test, canlı browser testi, PHP içerik importu, sunucu işlemi, dağıtım, migration veya uygulama kodu değişikliği yok.
