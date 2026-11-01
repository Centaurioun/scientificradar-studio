# Root-cause analizi

## Kanıtla sabitlenen zincir

1. `ArticleWorkspace` CKEditor'a `contentHtml={bodyHtml}` verir (`components/editor/article-workspace.tsx:1024-1027`).
2. Aynı render'da `availableSources` yeni `.filter()` sonucu, `trustedImageSources` ise yeni `Set` olarak oluşturulur (`article-workspace.tsx:1028-1029`).
3. `ArticleCKEditor` dış içerik sync effect'i `contentHtml`, `editorReady`, `trustedImageSources` ve `availableSources` değerlerini dependency listesinde tutar (`components/editor/article-ckeditor.tsx:446-468`).
4. Efekt CKEditor data'sını tekrar hazırlar, `setData` sonrası canonicalize eder ve `onSyncJson` callback'i çağırır (`article-ckeditor.tsx:451-464`).
5. Parent callback `latestBodyRef`'i günceller ve `setBodyJson(nextJson)` çağırır; `bodyHtml` burada güncellenmez (`article-workspace.tsx:1042-1045`).
6. Next development server'ın gerçek runtime stack'i bu effect/callback/state setter yolunu gösterdi; `Maximum update depth exceeded` üç kez görüldü.

Bu yol, tekrar render'da yeni `Set`/array identities nedeniyle effect'in tekrar çalışmasına ve JSON nesnesi için yeni state yazımına elverişlidir. Bununla birlikte effect'in eşitlik guard'ını tekrar tekrar geçmesine sebep olan runtime HTML/model farkını kaydetmedim; bu nedenle exact causal edge **güçlü bir hipotez**, kesin kanıt değil.

## Rakip açıklamalar ve kontroller

| Açıklama | Kanıt / değerlendirme |
| --- | --- |
| Kullanıcı IndexedDB'sindeki bozuk kayda bağlı | Temiz context sıfırdan seed verisiyle hatayı verdi; persistent article içeriği kullanılmadı. Zayıf açıklama. |
| Yalnızca Tiptap/base editor problemi | Temiz `?editor=tiptap` context'inde bu console hatası yok; CKEditor mount'ta var. CKEditor yolu lehine kanıt. |
| Production uygulaması da aynı React hatasını veriyor | Üç seed article production standalone'da açıldı; console/pageerror yok. Bu örnekler için desteklenmiyor. Tüm veriye genellenemez. |
| Browser network veya kayıp chunk | Local response 4xx/5xx ya da `requestfailed` yok; dev modda Next router prefetch için iki normal cancellation görüldü. CKE hatasının stack'i React state sync yoluna çıkıyor. |
| UI aslında mount olmuyor, sadece gizli içerik | `.ck-editor__editable` visible ve seed manuscript text içeriyor; loader görünmüyordu. Desteklenmiyor. |
| StrictMode/development instrumentasyon farkı | Production'da yok, development'ta var. Olası açıklama; StrictMode etkisi ayrıca toggle edilmedi, bu yüzden kesinleştirilmedi. |

## Kök neden hükmü

- **Doğrulanmış:** CKEditor development mount'ta external content sync callback'i parent `setBodyJson` state update'ine ulaşıyor ve Next dev runtime maksimum update-depth hatası yayıyor.
- **Doğrulanmamış:** Hatayı başlatan canonical HTML mismatch'in tam içeriği, hangi dependency kimliğinin ilk tekrar render'ı tetiklediği ve production'daki tüm CKEditor içeriklerinin davranışı.
- **Tavsiye:** Önce browser instrumentation ile prop identity, `contentHtml`, `lastEmittedHtmlRef`, canonical output ve callback sayısını aynı zaman çizelgesinde toplayın. Bu audit'te ürün kodu değişmedi.
