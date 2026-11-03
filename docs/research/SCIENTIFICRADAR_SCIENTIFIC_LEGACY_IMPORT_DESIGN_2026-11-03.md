# ScientificRadar — Scientific Legacy Article Import: Güvenli Taslak-Öncelikli Tasarım
**3 Kasım 2026 | TASARIM TEKLİFİ / UYGULAMA DEĞİLDİR | Gerçek site içeriği çekilmedi**

## 0. Karar ve sınır
**Öneri:** ScientificRadar Studio için `Import Existing Article` özelliğini ancak **owner-approved sample + lossless preview + safe quarantine** ölçütleriyle pilot olarak araştırın. Var olan M1–M7 Studio uyarlaması, W1 HTML güvenlik ve W2 dayanıklılık işleri tamamlanmadan gerçek web fetch'li/batch importer'a başlamak mantıklı değil. Kaynağa güvenilir structured CMS/export ulaşılabiliyorsa önceliği scraping'e değil ona verin. Hiçbir otomatik yayınlama veya yönlendirme çalıştırılmamalıdır.

### Okunan kanıt ve özel depo güvenliği
Güncel Web [v1 snapshot modeli](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/types.ts#L188-L219), [validator](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/contract-v1.ts#L112-L160), [redirect validator](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/seo/redirects.ts#L67-L82), Studio [authoring model](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/types.ts#L34-L62), [source fields](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/types.ts#L133-L148), [media fields](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/types.ts#L167-L185) incelendi. [Studio M3 hazırlığı](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/ai-studio/SCIENTIFICRADAR_STUDIO_WEB_ALIGNMENT_M1_M7_MISSION_2026-11-03.md#L82-L87) zaten reversible map/dry-run hedefler; bu tasarım **uygulama izni değil**, ileri aşamaya yönelik detaylandırmadır.

Özel `ardaiseri/sporsalonu-kurs` repo'suna meşru bağlı `ardaiseri` hesabından erişildi, `main` `27c0083f1da01797daf0e44775ed80f2969a5839`. Kaynakta URL→başlık/SEO açıklaması/metin/kapak/eski yayın zamanı çıkarımı, yetkili tenant'ta unique-slug draft kaydı, web panel import UI'sı, temel public IP DNS denetimi, içerik envanteri ve çeviri sayısı arayüzü görüldü. **Güzel fikir:** ham kaynak URL ve tarih izini kaybetmeden *taslak-first* iş akışı. **Sınır:** regex HTML parser'ı plain-text'e indirger; bilimsel atıf, tablo, math, figure caption, anlamlı iç bağlantı ve kompleks HTML round-trip garantisi yok. Kontrol çağrısı public DNS lookup'ı HTTP fetch'ten önce yapıyor; fakat incelenen fetch noktası varsayılan redirect davranışı kullanıyor ve doğrulanan IP'ye bağlantının bağlandığını gösteren transport kontrolü görülmedi. Bu, *güvenlik garantisi yok* demektir; gerçek SSRF saldırısı yürütülmedi, üretimde istismar gerçekleştiği iddia edilmiyor. Özel kod, ayrıntılı implementation veya kullanıcı verisi bu kamuya açık dosyada **bilerek yeniden yayımlanmıyor**.

## 1. Üç aday giriş modu

| Mod | Girdi ve akış | Artı | Kritik eksi | Tavsiye |
|---|---|---|---|---|
| A — Tek izinli URL | URL → alan adı/robots/hak ön kontrol → güvenli fetch → DOM/metadata parse → çift/üçlü preview → review draft | Hızlı kontrollü pilot; yazı başına insan gözü | HTML heterojen, içerik/figür kayıp; SSRF | **Pilot** (export yoksa) |
| B — Kontrollü batch | Owner-supplied XML sitemap/RSS/CSV veya export → kaynakların envanteri → dry-run → idempotent queued job → conflict ledger → taslak | Çok sayıda içeriğe uygun, hataları görünür | Büyük işleme/quotas, duplicate ve rollback operasyonu | **Later**, A veya C örneği başarılıysa |
| C — Yapılandırılmış export | CMS JSON/XML/DB export → typed mapping → kayıpsız test fixture → revisioned draft | En yüksek semantik doğruluk, daha az network fetch | Şema erişimi ve mapping maliyeti | **Prefer**, erişilebiliyorsa |

**Do nothing:** Kısa vadede en güvenlisi, ancak büyük arşiv için manuel yeniden yazım/SEO hata maliyeti doğurur. **Manuel copy-paste:** düşük ilk maliyet, citation/media/SEO provenance için iz sürülemez; yalnız birkaç basit makale için makul. **Tek adımda otomatik publish:** güvenlik ve bilimsel etik nedeniyle kesin **REJECT**.

## 2. Önerilen wizard (12 adım, her biri kanıtlı olay)

1. **Owner scope:** Import rolü ve allowlist edilmiş kaynak host/URL yolu; yetki belgesi, kapsam ve izin tarihi. Bekleyen her medya için hak sahipliği ayrı.
2. **Girdi modu:** Tek URL / sitemap-RSS-CSV / structured export. Asla açık proxy gibi tüm interneti taratacak arayüz değil.
3. **Preflight:** URL syntax, host ve iş izni, önceki import fingerprint, MIME, boyut/kota, robots ve telif politikası. Preview; ağ/fixture fetch öncesi risk raporu.
4. **Güvenli source acquisition:** sınırlı, tek amaçlı worker; kaynak yanıtı sha256, content-type, gerçek final URL ve zaman damgasıyla salt-okunur karantina deposuna; düz metin çıktısından farklı **ham kaynak arşivi**. Özel bilgileri maskele.
5. **Extraction v1:** DOM tabanlı belirsizlik-tutan parser; JSON-LD/schema.org, OG, HTML time, main/article, site template alternatifleri. Öncelik puanı kaynak kanıtına bağlı; alt bilgi, reklam, breadcrumb ve footer net ayrılmalı.
6. **Field-level diff/score:** Başlık/altbaşlık/meta, slug, canonical, author, date, language, affiliations, article body, headings, tables, lists, TeX, media/rights, inline DOI/citation ve references için kaynak konumu + çıkarılan değer + karar `confirmed/needs_review/unsupported`.
7. **Bibliyografya/media reconciliation:** DOI syntax bir kimlik doğrulama DEĞİLDİR; Crossref/PubMed/ORCID adayları yalnız sonraki insan incelemesine çıkar. Çeviri, sorumlu yazar, lisans ve kaynak ilişkisini otomatik olarak “verified” yapma.
8. **Üçlü önizleme:** (I) kaynak arşivinin güvenli, etkileşimsiz gösterimi, (II) Studio editable rich draft + farklar, (III) *mevcut Web reader'a denk* deterministik projection. Bir iddiayı/figure/citation'ı yutan her dönüşüm **blocking discrepancy**.
9. **Kaydetme:** HTML sanitizer ve Studio şema validasyonu; köken bilgisi, source hash, parser version, workspace revision; yalnız `quarantined` veya `draft_needs_review` -> saklama. Seçimsiz body overwrite yok.
10. **Ayrı editöryal review:** Editör kaynak–çıktı farklarını düzeltir, hak durumunu işaretler, metadata/author/link kararını verir; reviewer ve yayıncı birbirinden ayrıdır.
11. **SEO yönlendirme ÖNERİSİ:** Her eski canonical/slug/AMP sürümü -> gerçek yeni URL taslağı; Web `LegacyRedirectManifest` validator'ına aktarım; 301/308 **uygulanmaz**. Pseudostatü `awaiting_gsc_evidence`.
12. **Owner-approved publish:** İmzalı/auditli yayın isteği; server receipt + content hash/revision + Web fetch doğrulaması, cache invalidation/rollback; yayın ve yönlendirme birbirinden bağımsız onaylar.

Wizard UI'sında “taslak kaydedildi” ile “Web'de yayınlandı” iki ayrı etiket olmalı. Kaynak içeriğini **embed/iframe** ile live çalıştırmak yerine inert kaynak görünümü kullanın; import edilen script, SVG events ve remote embeds çalışmaz.

## 3. Bilimsel semantik uzlaştırma matrisi

| Alan | Dönüşüm kuralı | Çatışmada davranış |
|---|---|---|
| Başlık/SEO title/dek/summary | Visible H1 ayrı; OG/title yalnız aday; özet otomatik yazılmaz | Human review |
| Başlık hiyerarşisi | Article heading H1 tek; body H2/H3 korunur; derin seviyeler report | Unsupported heading bloklaması |
| Paragraf inline biçim | bold/em/underline, Unicode TR, sub/sup, link, inline code | Kayıplı plain text output engellenir |
| Tablo/figure | table caption, header scope, merged cells, figure ID, alt, caption, source/license, responsive dimensions | Bilinmeyen hücre span/hak: karantina |
| Math | Raw TeX + display/inline + equation label, source HTML'den KaTeX'e güvenli dönüşüm | Parser unsupported -> block |
| Citation/bibliography | inline marker↔source ID, Vancouver liste, DOI candidates ve links; duplicate referansları | Orphan/unknown DOI flagged, iddia uydurma yasak |
| Authors | görünür isim, profil eşleme, ORCID, affiliation ve locale | aynı kişi varsayımı yok; manuel mapping |
| Date | published/modified date ve timezone + sayfadan kanıt konumu | belirsiz veya çelişkili tarihler: `unknown` |
| URL | old complete URL, canonical, final redirect URL, original anchors, internal link graph | 1:1 SEO mapping gerek; chain/loop blok |
| Embedded media | licence, ownership, consent ve download policy | hak kanıtı yoksa download/publish blok |
| Language | detected locale aday; çevrilmiş metin ayrı article/revision ve gerçek relation | otomatik reciprocal hreflang yok |
| Corrections/retractions | archived legacy notice, withdrawal reason, publication state history | koru ve insan kontrolüne yönlendir |

Web'deki `bodyHtml` ve `blocks` eşdeğer sanılmamalı. Studio'nun Tiptap JSON'u koruyun; yayın için canonical rich HTML veya yeni onaylı contract extension kullanın. [Studio ref](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/docs/references/scientificradar-web/README.md#L21-L27). Bir dönüşüm kayıplıysa **sessizce düşürmek yerine** teknik hata ve editöryal seçim sunun.

## 4. Güvenlik/gizlilik/hukuk tehdit modeli

**SSRF saldırı yüzeyi:** URL alanı, takip edilen redirect, HTML içindeki `img/srcset`, OG image, `base`, media download, CSS URL, sitemap lokasyonları, feed'deki referanslar ve metadata API endpointleri ayrı fetch yüzeyleridir. Güvenlik kontrolleri kaynağa göre değil her bir outbound request hop'una uygulanır:
- İlk tercih: kullanıcı kontrollü URL'yi açık internette serbest fetch etmek yerine **owner-host allowlist** ve sadece HTTPS, standart port, sınırlı path, egress firewall/proxy; son çözümde transport-level kısıt.
- DNS A/AAAA sonuçlarının tamamını doğrula; IPv4, IPv6, mapped adresler, loopback, RFC1918, link-local, multicast, metadata ranges, reserved/unrouteable, IPv6 zone IDs, encoded IP ve IDN/punycode bypass; normalleştirme + hostname/Host/TLS SNI doğruluğu.
- **TOCTOU koruması:** DNS precheck ile TCP bağlantısı arasında IP değişebilir. Pin approved resolution or use egress proxy enforced destination policy. Allow **no automatic redirects**; her 3xx location'ı yeniden validate et, redirect depth ör. <=3 ve cross-host normalde kapalı.
- `fetch` zaman aşımı, status/type ve **streaming read byte cap** (HTML ör. 2 MiB; media daha ayrı politika), decompress bomb savunması; `Content-Length` güvenilmez; response `text/html` harici quarantine/reject; total concurrent jobs, per-domain rate ve quotas. Limitler tasarım önerisi, mevcut değerler değil.
- Server-side auth + CSRF/origin checks + role/tenant scoped records; audit logs secrets/token/PII veya raw copyrighted HTML yayımlamasın. Ayrı worker, read-only privileges, expiry, retry budget, retry jitter. Kaynak erişimi robots kuralları ve telif izninden bağımsız kabul edilmemeli: robots izni tek başına telif lisansı değildir.
- DOMPurify/sanitizer yalnız geçerli allowlist'le, output-context aware. HTML original -> parsed -> preview -> editor source -> public Web sink'lerinin hepsinde XSS/SVG event/unsafe URL/MathML/paste canary negatifleri. “URL güvenli” olması “HTML güvenli” olması anlamına gelmez.
- Model/AI extraction kullanılırsa injected sayfa içeriği komut olarak yürütülmez; sadece veri. Harici modele aktarım için ayrıca gizlilik ve sağlayıcı onayı gerekir.

Primary security guidance: [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

**Kayıt güvenliği / idempotency:** `jobKey = hash(tenant/workspace + normalizedSource + sourceHash + parserVersion)` kavramsal olarak; bir job tekrar çalışınca aynı revision'a bağlanmalı, görünmez duplicate oluşturmamalı. `draftId`, `jobId`, `sourceHash`, `fieldDecisionLog`, `provenanceReceipt` ve `undo` ayrı; rollback orijinal imported draft'ı geri alabilir ama editörün sonradan oluşturduğu yeni güncellemeleri yok edemez. İnsan düzenlemesinden sonra eski job overwrite yasak. Media blob transactional olarak confirmed storage'da olmadan “saved” gösterilmez.

## 5. Web/Studio contract hakları: test öncesi güvenlik açığı
[Web `PublicMedia` L49-L59](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/types.ts#L49-L59) hak doğrulaması içerir; [`validateMediaRecord` L112-L160](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/content/contract-v1.ts#L112-L160) bunun `false` olmasını blocker'a çevirmiyor. Web validator inputuna doldurulmuş credit/license ama `rightsVerified: false` bir figure/hero verilirse, yalnız bu bool yüzünden issue oluşturulmaz. Bu kod incelemesiyle doğrulanan sonuçtur; test bu oturumda çalıştırılmadı.

Önerilen test: `hero.rightsVerified=false` ve `blocks[].media.rightsVerified=false` için `UNVERIFIED_MEDIA_RIGHTS` issue ve `isIndexableCandidate=false` bekle; `true` ancak insanın hak ve kaynak alındısıyla eşleştirilir. Studio'nun [media kaydı](https://github.com/Centaurioun/scientificradar-studio/blob/50b9ff1ec249fff003be605d1acd101e89b4bf05/lib/types.ts#L167-L185) credit/licence var, ama rights boolean ve kanıt provenance ayrımı tasarlanmalı. Mevcut M1 görevine eklenecek, yeni paralel medya sistemi olmayacak.

## 6. Kabul / red matrisi

| Girdi ve tehdit | Preflight | Sonuç |
|---|---|---|
| Allowlist harici domain/host, localhost, private IP, metadata | DENY | Fetch yok, güvenli hata/audit |
| Public hostname → 302 to internal veya DNS rebinding | DENY | Her hop & actual socket IP yeniden kontrol |
| `file:`, `data:`, `blob:`, `javascript:` veya URL credentials | DENY | Fetch yok |
| HTML > limit / decompression bomb / binary MIME | DENY | Kısmi kaydı temizle, quota report |
| XSS `onerror`, SVG handler, iframe, script | QUARANTINE/STRIP SAFE | Sanitizer log + no executable rendering |
| Article + footer/nav mixed | REVIEW | Scope confidence düşük, kaynak/parsed diff |
| Missing table/citation/TeX/figure | BLOCK DRAFT APPROVAL | Lossless mismatch, insan müdahalesi |
| Missing rights/licence or author ownership | HOLD | Kaynak korunur; publish/media rehost yasak |
| Duplicate canonical/content hash/slugs | CONFLICT | Create duplicate değil, compare/reconcile |
| Existing editor draft newer revision | CONFLICT | Optimistic lock; no overwrite |
| Uncertain original date / DOI / translation | REVIEW | `unknown` ve origin candidate; asla verified değil |
| Legacy URL with no true new counterpart | 404/410 CANDIDATE | Homepage fallback/redirect uydurma yok |
| Parser network timeout/cancel | RETRYABLE | Bounded retry; resumable cursor |

## 7. SEO/göç
Web tarafındaki [redirect validator](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/lib/seo/redirects.ts#L67-L82) duplicate, self-loop, cycle, chain, homepage fallback, cross-host ve canonical conflict'i zaten kontrol ediyor. [M3 dry-run](https://github.com/Centaurioun/ScientificRadar-web/blob/3b096e84023ca1ba358b7d7dd4f25f17185fc8d7/docs/roadmap/LEGACY_REDIRECT_DRY_RUN_REPORT.md#L1-L30) gerçek GSC CSV'yi bekliyor; oradaki 34 canonical alternative, 15 Soft404, 4 5xx tarihi sayıları yeni crawl verisi gibi kullanılamaz.

Taslak mapping tablosu: `legacyCanonicalUrl, legacyVariantUrls, oldPublishedAt, newArticleId, proposedSlug, destinationLocale, destinationCanonical, status(approved/hold/retired), ownerEvidence, finalHttpStatus, redirectCode(301|308|null), decisionReceipt`. Yalnız meşru 1:1 hedef varsa 301/308 öner; noindex / sitemap / canonical / hreflang uyumunu ve source→destination final HTTP 200 kanıtını kontrol et; redirect loop/chains üretme. Yayın sonrası Search Console'da index coverage, URL Inspection, crawl errors ve trafik dalgalanmasını izle, aşamalı cutover yap. Google'ın resmi [site move](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) ve [redirect](https://developers.google.com/search/docs/crawling-indexing/301-redirects) kılavuzları temel referanstır. Gerçek HTTP istekleri bu araştırmada yapılmadı.

## 8. Önerilen TypeScript arayüzü — sadece mimari eskiz, çalıştırılmadı

```ts
type ImportMode = "verified-url" | "owner-batch-manifest" | "structured-export";
type Decision = "confirmed" | "needs_review" | "unsupported" | "rejected";
type JobStage = "preflight" | "quarantined" | "parsed" | "reconciliation"
  | "draft_saved" | "editorial_review" | "redirect_proposal" | "closed";

interface ImportProvenance {
  normalizedSourceUrl?: string;
  ownedOriginEvidenceId: string; // server controlled
  retrievedAt?: string;
  sourceSha256: string;
  parserVersion: string;
  contentType: string;
  finalValidatedUrl?: string;
}

interface FieldDiscrepancy {
  fieldPath: string; // e.g. body.tables[2].caption
  sourceLocator?: string;
  proposedValueHash?: string;
  decision: Decision;
  confidence: number; // 0..1, extraction estimate, NOT truth
  reasonCode: string;
  resolvedBy?: string; // authenticated reviewer ID
}

interface ImportCandidate {
  jobId: string;
  mode: ImportMode;
  stage: JobStage;
  targetArticleId?: string;
  expectedArticleRevision?: number;
  provenance: ImportProvenance;
  discrepancies: FieldDiscrepancy[];
  unsupportedScientificNodes: string[];
  mediaRightsHold: boolean;
  publishAuthorized: false; // no publish in import job
}

interface RedirectProposal {
  sourcePath: string;
  targetPath?: string;
  action: "301" | "308" | "404" | "410" | "hold";
  sourceEvidenceId: string;
  humanApproved: boolean;
}
```

Bu sözleşme Studio'nun mevcut `Article` alanlarını doğrudan değiştirmez; gerekli eklentiler yeni migration provenance metadata ve yayın tarafının onaylı adapter sınırındadır. Parser/queue/DB/hosting seçimi henüz yapılmamıştır.

## 9. Test-first kabul ve sınır (uygulamaya geçilirse)
1. Import worker fixture setinde public→localhost 302, IPv6 loopback, IPv4-mapped, custom port, DNS rebinding, decompression bomb, oversized HTML, disallowed schemes **zero outbound internal socket**; testler gerçek dış ağa saldırı yapmaz.
2. 1 misconfigured network/timeout işinde `jobId` ve source checksum alındısı korunur, tekrarlayan çağrı aynı işle sonuçlanır; duplicate yok.
3. Table colspan/rowspan, long references/DOI, math/KaTeX, sub/sup, Turkish locale, nested lists, figure caption/alt/rights ve nested citations, source→Studio draft→Web projection round-trip; korunamayan field her durumda blocker.
4. `onerror`/SVG/iframe/XSS fixture hiçbir view'de çalışamaz; statik sayfa preview'sı ayrıca ele alınır; geçmiş rapor otomatik bug kapanışı değildir.
5. Bilinmeyen DOI/ORCID/author/date asla `verified` alanı üretmez; insan kararı ve kaynak kanıtı auditlenir.
6. Lisans veya `rightsVerified=false` ile figure ve hero Web tüketici testi her durumda engellenir.
7. Aynı URL, aynı contentHash, farklı title ve başka owner'a ait source için distinct duplicate/conflict sonuçları; karşılık bekleyen slug'a redirect oluşturulmaz.
8. Draft görünür; public route/sitemap yok, `noindex`; yalnız gerçek publish receipt'inden sonra public state.
9. GSC dosyası yokken bütün redirect kayıtları `hold` kalır; 1:1 exact mapping, chain/loop/self/soft404 rejection testleri Web validator'da çalışır.
10. Rollback eski importu iptal eder ama daha sonra editör tarafından kaydedilmiş gerçek revision'ı silmez.
11. Screen-reader/keyboard: wizard focus traps yok; alan farkları tablo dışında metinsel olarak erişilebilir; üçlü preview 320/390 desktop kullanıcı görüntüsünü kaydırmadan sunar.
12. Source erişim ve medya barındırma lisans izinleriyle ilgili ledger olmadan `approved`/publish'e yol yok.

**Önerilen etkilenecek yerler (şimdi değiştirilmedi):** Studio `lib/import/*` (yeni), `lib/types.ts` (provenance), `lib/html-security.ts`, `lib/studio-persistence.ts`, `lib/audit/*`, `components/editor/article-preview-view.tsx`, importer UI; Web `lib/content/contract-v1.ts` ve tests, `lib/seo/redirects.ts` ve tests. Bu doküman kod değiştirmiyor.

## 10. Olası fayda / maliyet ve gözden geçirme kapıları
Tek URL pilot: L (provenance + parser + güvenli fetch + UX dahil), Medium confidence, P1 **yalnız ön koşullar geçince**. Structured export-first: M/L, Medium confidence ama owner data availability bilinmiyor. Batch: XL, Low/Medium confidence; hemen başlamak reddedilir. Başarı kriterleri: 10 farklı onaylı örnek kayıtta 0 sessiz scientific-node kaybı, 0 korunmasız medya, 0 yanlış public exposure; formatlı alanlarda reviewer düzeltme yüzdesi ve yazı başına inceleme süresi. **Mevcut baseline bilinmiyor; bunlar hedef/test önerileridir.**

**Owner gate:** Import için izinli host listesi, 3–10 örnek gerçek-yetkili HTML/structured export, kaynak/medya hak yazısı, eski URL/GSC CSV ve izinli hedef mimari olmadan fonksiyonel importer uygulaması başlatılmamalı.
