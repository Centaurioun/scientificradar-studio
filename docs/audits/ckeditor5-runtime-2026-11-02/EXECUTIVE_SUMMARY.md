# ScientificRadar Studio — bağımsız CKEditor runtime forensik özeti

**Audit tarihi:** 2026-11-02
**Denetlenen kaynak:** `a6e8938ce45c724be5178aac20c7089bc6864dbd` (`origin/main`, `feat(editor): integrate CKEditor 5 with KaTeX support`)
**Genel değerlendirme:** **Production build'de temel editör akışı çalışıyor; CKEditor geliştirme sunucusunda tekrar üretilebilir React update-depth hatası var.**

## Sonuç

CKEditor entegrasyonu GitHub `main` üzerinde doğrulandı: CKEditor 5 v49.0.1 bağımlılığı, `ArticleCKEditor` runtime bileşeni, KaTeX Math köprüsü ve `Tiptap 3 (Baseline)` / `CKEditor 5 + Math (Pilot)` anahtarları mevcut. İstenen Google AI Studio integration report da aynı commit'te bulunuyor.

Kullanıcının bildirdiği gri/yüklenmeyen makale içeriği, koyu tema geçiş hatası ve SEO/navigasyon tepkisizliği izole Brave oturumlarında tekrar üretilemedi. CKEditor üç ayrı seed makalesinde içeriği gösterdi; bir disposable yazı kaydedildi, Tiptap'a geçirildi ve CKEditor'a dönüp reload edilince korundu. Tema hem Tiptap hem CKEditor ile görsel olarak değişti ve route/reload sonrasında `dark` olarak kaldı. SEO, Preview ve editör inspector panelleri açıldı.

Tek doğrulanmış ürün kusuru, **development server** üzerinde CKEditor mount edilirken üç kez görülen `Maximum update depth exceeded` console/Next overlay hatasıdır. Stack `ArticleCKEditor` dış-veri sync effect'indeki `onSyncJson` çağrısına ve parent `setBodyJson` çağrısına ulaşıyor. Production standalone'da üç seed makalesi ve CKEditor açılışında aynı hata görülmedi; bu nedenle production'da aynı etkisi olduğuna dair kanıt yoktur. Effect'in neden yeniden çalıştığına ilişkin en güçlü açıklama yeni `Set`/array prop kimlikleri ile JSON state güncellemesinin feedback döngüsü oluşturmasıdır; exact trigger'ın hangi canonical HTML farkıyla başladığı ölçülmediği için kök neden mekanizması **kesin değil**.

## Kapsam ve sayılar

- **22 route/path** doğrudan veya gerçek UI workflow'u üzerinden ziyaret edildi; `/menus` önce 307 ile `/homepage` adresine yöneldi ve hedef sayfa 200 döndü.
- Makinece okunabilir coverage envanterinde **42 vaka** var: **41 PASS, 1 FAIL**. Bu payda yalnızca CSV'de listelenen denemeleri kapsar; uygulamadaki tüm butonların eksiksiz tıklama envanteri değildir.
- Mevcut unit suite: **61/61 PASS**.
- Typecheck: **exit 0**.
- Lint: **exit 0**, tek Next `<img>` uyarısı.
- Production build: **exit 0**, 27 statik sayfa üretildi; build'in geçici Next type/config değişiklikleri audit worktree'sinde geri alındı.
- Playwright: Brave ile **35 test PASS mesajı** yazdı ancak runner kapanışta takıldı ve kesilince exit **130** oldu. Playwright-managed Chromium ile aynı 35/35 test **exit 0** ile tamamlandı.
- Tarayıcıda Brave `156.1.98.60` (Chromium engine `156.0.8078.48`), Playwright `1.64.1` kullanıldı.
- Desktop/tablet/mobile viewport ölçümlerinde yatay overflow görülmedi.

## Öncelikli takip sırası

1. Dev modundaki CKEditor update-depth hatasını production ve dev'de ayrı kabul kriterleriyle tekrar test edin.
2. `ArticleCKEditor` dış-veri effect'i, `onSyncJson`, `bodyJson` state ve render başına üretilen `availableSources`/`trustedImageSources` değerleri arasındaki döngüyü browser instrumentation ile doğrulayın.
3. CKEditor mount, clean load, engine switch, reload ve write/save akışları için gerçek Playwright regression testleri ekleyin.
4. Equation/Math, citation, figure, HTML Source, undo/redo ve save/restore round-trip senaryolarını CKEditor üzerinde ayrıca doğrulayın.
5. Tüm route ve kontroller için ayrı exhaustive inventory çalıştırın; bu audit riskli/destructive, import/export ve external integration kontrollerini kapsamaz.

## Severity özeti

| Severity | Sayı | Not |
| --- | ---: | --- |
| P0 | 0 | Crash, blank editor veya gerçek veri kaybı gözlenmedi. |
| P1 | 0 | Kritik navigasyon/tema kusuru doğrulanmadı. |
| P2 | 1 | CKEditor mount sırasında dev-only React update-depth hatası. |
| P3 | 0 | Görsel küçük kusur kaydedilmedi. |

**Fix uygulanmadı. Üretim kodu, testler ve dependency lockfile değiştirilmedi.** Detaylar için [FINDINGS.md](FINDINGS.md), [ROOT_CAUSE_ANALYSIS.md](ROOT_CAUSE_ANALYSIS.md) ve [ROUTE_AND_CONTROL_COVERAGE.csv](ROUTE_AND_CONTROL_COVERAGE.csv).
