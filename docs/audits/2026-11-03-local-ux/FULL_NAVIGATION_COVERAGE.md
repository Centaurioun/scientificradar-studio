# Navigation ve modül etkileşim kapsamı — Brave

Bu matris, sidebar üzerinden görünür navigasyon ve seçilmiş etkileşimlerin gerçek Brave testini kaydeder. “Açıldı” sayfa ve temel yerleşimin kontrol edildiği anlamına gelir; her kontrolü, her boş/hata/klavye durumunu veya tüm viewport'ları test ettiğimiz anlamına gelmez.

| Sidebar modülü/route | Açıldı | Test edilen gerçek kontrol | Sonuç / sınır |
|---|:---:|---|---|
| Dashboard `/dashboard` | ✓ | Sidebar collapse/expand; global search linki; dashboard customization yüzeyi | Collapse genişliği 240→64→240px; Dashboard kartları, articles listesi ve activity görünür. Özelleştirme linki `/settings/navigation` açıldı, hiçbir ayar kaydedilmedi. 320px overflow önceki screenshot'ta ölçülü. |
| Articles `/articles` | ✓ | `JWST` arama, In Review filtre, row select, select-all ve selection cleanup | Arama 1, In Review 2 makale; select-all 9 kayıt seçti. Hiçbir bulk action çalıştırılmadı. Table 1359px / container 1136px, yatay scroll gerekir. |
| Pages `/pages` | ✓ | Route ve sayfa içeriği | Sayfa listesi yüklendi; içerik düzenle/kaydet akışı denenmedi. |
| Categories & Tags `/categories` | ✓ | Route ve taxonomy yüzeyi | Açıldı; oluşturma/kaydetme denenmedi. |
| Media Library `/media` | ✓ | Figure QA makalesine seçme, inspector görünümü | Var olan NIRSpec demo varlığı taslağa iliştirildi; varlığın kendi metadata'sı değiştirilmedi. rights reviewer/evidence formu yok. |
| Series & Collections `/series` | ✓ | Route ve liste görünümü | Açıldı; oluşturma/kaydetme denenmedi. |
| Homepage & Menus `/homepage` | ✓ | Route ve içerik görünümü | Açıldı; menü/anasayfa kalıcı ayarı değiştirilmedi. |
| Videos `/videos` | ✓ | Route | Yüklendi; sidebar “Opt” etiketi modu prototype/optional diye anlatıyor. Upload/CRUD denenmedi. |
| Review Queue `/review` | ✓ | Route | Açıldı; review/approve action existing data'ya uygulanmadı. |
| Publishing Calendar `/calendar` | ✓ | Route | Açıldı; schedule/unschedule denenmedi. |
| Authors & Editors `/authors` | ✓ | Route | Açıldı; kişi ekleme/düzenleme denenmedi. |
| Revision History `/revisions` | ✓ | Route | Açıldı; revision restore denenmedi. |
| AI Assistant `/assistant` | ✓ | Route | Local prototype olarak açıldı; üretken/saklayan assistant action denenmedi. |
| SEO & Quality Center `/seo` | ✓ | Route; aynı QA taslağının local audit gate'i | Makale quality gate 1 blocker, 5 warning, 14 pass, 2 unverified gösterdi. Existing seed makaleleri audit ile değiştirilmedi. |
| Smart Knowledge Links `/knowledge-links` | ✓ | Route | Açıldı; kalıcı link değişikliği denenmedi. |
| Search Performance `/search-performance` | ✓ | Route | Açıldı; external search integration bağlı değil. |
| General Settings `/settings` | ✓ | Route | Açıldı; ayar değiştirilmedi. |
| Dashboard & Navigation `/settings/navigation` | ✓ | Route, preset/checkbox surface | Balanced/Show All/Minimal ve widget/sidebar affordance'ları görüldü; save yapılmadı. |
| Integrations `/settings/integrations` | ✓ | 7 provider kartı, Codex Test Connection | UI her birinde Not Connected/P0 açıklar. Test Connection yerel “no credentials or external endpoints” feedback verdi; dış request/credential yok. |
| Roles & Permissions `/settings/roles` | ✓ | Simulated role choices visible | P0 demo simulation/P1 server RBAC başlığı açıkça görüldü; access mode değiştirilmedi. |
| Audit Logs `/settings/audit` | ✓ | Route; dashboard activity | Açıldı; yalnız audit kayıtları okundu. |

## Global/Chrome interactions

- Dashboard/sidebar `Collapse sidebar` 240px'den 64px'e indi, sonra açıldı.
- Toolbar global search açıldı, `JWST` ile tek makale döndürdü, Escape ile kapandı.
- New Article yalnız yeni `[QA TEMP]` taslağı açtı.
- `Reader Preview` görünümü açıldı, Desktop/Tablet/Mobile/320 modlarına geçti.
- Role/demo toggle Owner/Admin'de bırakıldı.
- Browser console `error` ve `warn` listesi denetim anında boştu. UI route'larında gözle görülür boş içerik/yükleme kırılması kaydedilmedi; bu systematic console/network telemetry değildir.

## Erişilebilirlik ve akış kapsamı sınırı

Sayfa açılışları her menü, modal, keyboard tab order, focus return, form validation, loading/error/success state, screen reader, WCAG/axe veya 9 viewport kombinasyonunun teyidi değildir. Özellikle review/approve, schedule, delete/archive, revision restore, user/role permission değişikliği ve existing article save gibi stateful kontroller bu denetimde çağrılmadı. Bunlar bir sonraki implementation QA sprintine acceptance test olarak eklenmelidir.

