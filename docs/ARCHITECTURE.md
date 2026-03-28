Master checklist — birleşik sürüm (güncellenmiş v3)
Mimari yasalar (faz bağımsız)
Ana içerik (şarkı sözü, akor metni, başlık, sanatçı, SEO gövdesi): RSC / güvenli sunucu fetch; useEffect + istemci Firestore ile ana blok doldurulmaz.
Üçüncü taraf script: next/script (lazyOnload / afterInteractive); LCP öğesinin önüne senkron script yok.
Sayfada ayırtıcı değer: ritim, zorluk, ton + transpoze, video, katkı/moderasyon, oy (+ şemada uygunsa AggregateRating), ilişkili şarkılar vb.
Referans/öğretici sayfalar (kütüphane, gam, çember): interaktif parça client olabilir; sayfa başlığı + açıklayıcı metin + iç linkler sunucuda.
Preview — sunucu / istemci sınırı: Sunucu her zaman orijinal ton + orijinal akor/söz metnini verir; transpoze ve widget’lar yalnızca görünüm katmanı (istemci state); künyede orijinal ton sabit, görüntülenen ton transpoze ile güncellenir.
Performans / ağ: Kritik üçüncü taraf origin’ler için preconnect/dns-prefetch politikası (Firebase, arama sağlayıcısı, CDN); görsel ve font için erişilebilir boyut ve öncelik (next/image, next/font).
Hata modeli: Route segment’lerinde uygun yerde error boundary; kullanıcıya anlamlı mesaj; log’larda korelasyon id (Sentry vb. ile uyumlu).
Çok dillilik (varsa): Tek dilde bile lang, inLanguage tutarlılığı; çok dilde URL/hreflang ve kanonik politikası bu fazda veya Faz 2’de kilitle.
Faz 0 — Kararlar ve repo
Git + branch stratejisi; .gitignore (.env*, service account, IDE, build).
NEXT_PUBLIC_* vs sunucu-only secret ayrımı.
Node + paket yöneticisi sabitleme (.nvmrc / engines / packageManager).
ESLint + Prettier; isteğe bağlı Husky + lint-staged.
URL şeması (tek kaynak): örn. /akor/[sanatci-slug]/[sarki-slug], /sanatci/[slug], /kesfet, /gitar-akorlari (veya eşdeğeri), /akor-kutuphanesi, /gamlar, /besli-cember, /calma-listeleri, /preview/[...] — isimleri bu fazda kilitle.
Facet/filtre query parametreleri için “indexlenebilir mi?” kararı (çoğu projede: sınırlı facet seti index, geri kalan noindex veya tek kanonik liste sayfası).
Paylaşım / deep link: İsteğe bağlı ?transpose= (ve benzeri) için kanonik politika: parametreli URL kanonik olmamalı (Faz 2 + 7 ile uyum); “orijinale dön” bu query’yi de temizler.
i18n kararı: Tek dil mi, /tr/ segmenti mi; SEO ve robots/sitemap ile çakışma yok.
Faz 1 — Next.js iskelet + tasarım sistemi
App Router layout’lar; metadata / generateMetadata planı.
Tailwind + bileşen kütüphanesi; tipografi, renk.
Tema: dark / light (gündüz).
Tek tema token seti (renk, border, akor satırı vurgusu); class veya data-theme ile dark / light.
İlk yüklemede opsiyonel prefers-color-scheme; çakışmada kural: kullanıcı seçimi sistemden önce gelir.
Kalıcılık: tercihen çerez (SSR ilk boyamada tema sapmasını azaltır); alternatif localStorage + FOUC riski yönetimi.
Flash önleme: layout’ta minimal inline script veya next-themes benzeri yaklaşım.
Sahne modu (Preview): aynı token zinciri; isteğe bağlı sahne-only kontrast override (ayrı tema dili değil, token override).
Global header, footer, nav (Keşfet, Tüm şarkılar, Kütüphane, Gamlar, 5’li çember, Listeler, Preview rotalarına yer); tema geçiş kontrolü header’da.
Durum: favori, transpoze, font boyutu (istemci veya cookie — sunucu HTML’den bağımsız katman).
loading.tsx, error.tsx, global-error.tsx + Suspense.
Mock JSON: şarkı, sanatçı, kullanıcı, keşfet üçlüsü, akor varyasyon şeması örneği, gam → nota eşlemesi.
Ortak bileşen iskeleti: Fretboard (mode: 'chord' | 'scale'), CircleOfFifths (tam sayfa + variant: 'widget'), yüzen panel wrapper.
Preview client mimarisi: Transpoze + scale widget + 5’li çember için tek paylaşılmış client store (Context / Zustand / Jotai vb.): transposeSemitones ve/veya tonal merkez tek kaynak; scale/gam ve çember okuyarak senkron; çember tıklaması → merkez/ton güncelleme → transpoze/fretboard ile uyum. Ağır SVG/Canvas: memo + seçici abonelik.
Font: next/font, subset/locale; font-display ve FOUT/CLS kontrolü.
Faz 2 — URL, routing, içerik sayfaları (mock)
Kanonik URL şeması; eski yollar → 301.
404 kullanıcı dostu; next.config redirects / middleware tutarlılığı.
Parametreli / arama URL’leri kanonik olmamalı.
Mock’ta bile sunucu HTML’de başlık + ana içerik alanı.
Keşfet (/kesfet): üç blok için ayrı sunucu veri bölümleri (mock).
Tüm şarkılar: liste sayfası + filtre UI iskeleti; linkler kanonik şarkı URL’sine.
Akor kütüphanesi / Gamlar / 5’li çember: route + sunucu metin iskeleti.
Çalma listeleri / Preview: route’lar; preview’da sahne modu + künye bloğu + “Orijinale dön” + Kaydet / listeye ekle UI iskeleti (mock; veri bağlama Faz 3).
Çok dil: route ve kanonik/hreflang ile Faz 0 kararı uyumlu.
Faz 3 — Firebase (Auth, Firestore, Storage)
Proje, web app, güvenli config.
İstemci Auth; HTTP-only session cookie + middleware + Admin veya edge uyumlu doğrulama.
Admin: Custom Claims + Firestore Rules (istemci e-posta ile yetki yok).
Auth yaşam döngüsü: e-posta doğrulama (politika), şifre sıfırlama, oturum süresi, çoklu cihaz; hesap silme / veri dışa aktarma (KVKK ile Faz 9’a bağla).
Koleksiyon modeli: şarkı, sanatçı, katkı, moderasyon, keşfet feed alanları veya koleksiyonları (popüler / yeni / editör seçimi), akor kütüphanesi dokümanları (admin yazımı), isteğe bağlı gam verisi koleksiyonu veya statik JSON + build.
Şarkı künyesi (admin alanları — örnek şema): originalKey, tempo (BPM veya metin), timeSignature, tuning, capo, difficulty, genre, contributorIds, moderationStatus, copyrightSource (yasal/not alanı) — genişletilebilir; Preview’da sunucudan okunur.
İsteğe bağlı: dokümanda schemaVersion veya updatedAt ile migration stratejisi.
Kullanıcı ayarları / override: users/{uid}/songOverrides/{songId} (veya eşdeğeri userSongSettings): transposeSemitones, isteğe bağlı selectedScaleId, circleMode, fontSize, scrollSpeed vb.; updatedAt, songId.
Çalma listeleri: users/{uid}/playlists/{playlistId} + .../items/{itemId}; order; songId + isteğe bağlı slug denormalizasyonu.
Playlist öğesi — tercih katmanı: songId zorunlu; inline snapshot (ek anı: transposeSemitones vb.) veya overrideRef — ürün kuralı tek dokümanda kilitle (öneri: snapshot daha öngörülebilir).
firestore.indexes.json: sanatçı + popülerlik; keşfet sorguları; tüm şarkılar (harf, sanatçı, ton, zorluk); playlist sorguları kullanıcı scope içinde; songOverrides çoğu durumda uid + songId doğrudan okuma (bileşik index ihtiyacını sorgu planıyla doğrula).
Sayfalama: startAfter / cursor — sanatçı şarkıları, tüm şarkılar, yeni eklenenler listesi.
admin claim adı ve koleksiyon tablosu bu fazda dokümante (tek kaynak README veya docs/data-model.md).
Yerel geliştirme: Firebase Emulator (Auth + Firestore + Storage isteğe bağlı) + seed script; CI’da emulator testi (Faz 11 ile örtüşür).
Faz 4 — Güvenlik
Firestore + Storage kuralları; playlist ve songOverrides sadece owner (request.auth.uid); admin yazımları claim ile.
XSS: akor/metin sanitize; güvenli Markdown / DOMPurify.
CSP (+ mümkünse nonce / strict dinamik); diğer güvenlik başlıkları (ör. X-Content-Type-Options, Referrer-Policy, frame policy).
Rate limiting; App Check (hassas yazma endpoint’leri).
Gizli anahtarlar istemci bundle’da yok.
Kütüphane importer’ı sadece sunucu/CI veya admin aracı; istemciden toplu yazım yok.
songOverrides ve playlist yazımlarında rate limit / kötüye kullanım (isteğe bağlı Cloud Function).
Admin audit log (kim, ne, ne zaman) — kritik alan değişiklikleri ve içe aktarma.
Faz 5 — Önbellek ve yeniden oluşturma
Karar tablosu: SSG / ISR / SSR.
Şarkı detay, sanatçı: ISR + revalidatePath / revalidateTag (moderasyon/onay sonrası).
Keşfet: popüler/yeni/tavsiye için ISR veya kısa revalidate; sıralama formülü değişince tag stratejisi.
Tüm şarkılar: ISR veya SSR + cache; filtre kombinasyonları için tutarlı TTL.
Tag isimlendirme: song:{id}, artist:{id}, discover:popular, discover:new, discover:featured, songs:list:{filterHash} vb.
Sunucu HTML, revalidate sonrası bot ile uyumlu.
Kullanıcı songOverrides ISR önbelleğini kirletmez; kişisel veri istemciden veya auth’lı API’den yüklenir. Şarkı gövdesi + künye ISR ile kalır.
Faz 6 — İçerik borusu + arama + katkı
Katkı formları, moderasyon, onay → Faz 5 revalidate.
E-E-A-T: katkıcı profil, moderatör onaylı rozet.
Algolia (veya seçilen) indeks + senkron; arama UI istemcide; SEO sayfaları arama sonucu ile doldurulmaz.
Büyük içe aktarma + doğrulama.
Arama: debounce ~300 ms; boş sonuçta popüler sanatçı + katkı CTA.
A11y arama: odak hapsi, klavye gezinti.
Akor kütüphanesi: admin UI; importer JSON şeması; Firestore’a yazım sadece admin.
Gamlar: veri kaynağı + fretboard scale modu.
Admin UI: Şarkı künyesi alanları CRUD; sadece admin (Claims + Rules + UI).
Faz 7 — SEO ve paylaşım
Sayfa başına: title, description, canonical.
OG + Twitter Card.
Dinamik OG görseli (şarkı/sanatçı için isteğe bağlı @vercel/og veya eşdeğeri) — paylaşımda CTR.
Bölünmüş sitemap + index; Keşfet, tüm şarkılar (ilk sayfalar veya kanonik varyant), sanatçı/şarkı.
robots.txt: /arama*, gereksiz facet döngüleri noindex; filtre spam politikası.
JSON-LD: MusicComposition, MusicGroup/Person, BreadcrumbList; oy varsa AggregateRating; inLanguage; mümkünse künyeden müzikle ilgili alanlar (ton, tempo — politika ve doğrulukla).
İç link: şarkı altında aynı sanatçı + benzer şarkılar; keşfet ve kütüphane bağlantıları.
Reklam: slot min-height, skeleton, CLS; adblock’ta skeleton kilitlenmesin.
Preview (public): paylaşım URL’si için sunucu metadata; künye özeti HTML’de (bot için); ?transpose= varsa canonical yine parametresiz kanonik URL.
Liste sayfalarında sayfalama: rel=prev/next veya tek kanonik strateji (tercihe göre, tutarlı).
Faz 8 — Medya, performans, mobil
next/image + remotePatterns.
Şarkı detay / preview LCP: kapak priority + doğru boyut.
CLS: reklam + yüzen widget dock alanı rezervasyonu.
CWV; mobil dokunma hedefleri, okunabilir akor (dark/light kontrastı dahil).
RUM: production’da Web Vitals toplama (GA4 / Vercel / OpenTelemetry — biri).
PWA: manifest, ikonlar, SW (offline vs telif — gözden geçir).
301 haritası ile tutarlılık.
Faz 9 — Yasal, çerez, analitik
Gizlilik, KVKK, çerez, kullanım koşulları.
Telif / içerik kaldırma süreci (copyrightSource ile uyumlu iletişim ve iş akışı).
Cookie consent + GA4 consent mode + next/script (LCP korunur).
Sentry (veya eşdeğeri).
Faz 10 — Erişilebilirlik ve kalite
Klavye, kontrast WCAG AA (dark ve light).
Skip link; aria kritik akışlar.
Fretboard / 5’li çember: odak yönetimi; kısa metin alternatifi veya veri tablosu.
İstemci adaları: transpoze, auto-scroll, metronom, kopyala/yazdır, print stylesheet, PDF.
Tema: sistem/kullanıcı tercihi öngörülebilir davranış; prefers-reduced-motion ile animasyon indirgeme.
İsteğe bağlı: prefers-reduced-data / düşük bant genişliği davranışı.
Faz 11 — Test ve CI/CD
Unit: transpoze, akor parser, gam nota hesaplama, importer validasyonu; isteğe bağlı store senkron (merkez ↔ transpoze) mantığı.
E2E: giriş, arama, şarkı görüntüleme, playlist CRUD, preview sahne modu; kaydet (songOverrides) + çalma listesine ekle (snapshot); “Orijinale dön”; tema geçişi (regresyon).
CI: lint, test, build; npm audit / supply chain (en az uyarı politikası); isteğe bağlı preview deploy.
Performans eşikleri: Lighthouse CI veya benzeri (LCP/CLS üst sınırları — spot).
Smoke: View Source / build çıktısında ana şarkı metni + künye özetinin sunucuda olduğu (preview dahil).
Emulator tabanlı integration (Faz 3 ile uyumlu).
Faz 12 — Yayın öncesi
Lighthouse (dark/light ve sahne modu spot kontrolü).
Production rules + env doğrulama; domain, SSL, hosting.
Yedekleme / moderasyon geri alma.
Yedekleme geri yükleme tatbikatı (RTO/RPO beklentisi tek cümleyle dokümante).
Feature flags (Remote Config veya env tabanlı) — riskli özellikler için.
Özellik 1–7 — checklist maddeleri (kısa, uygulanabilir)
Alan	Maddeler
1. Keşfet	Üç blok: ayrı Firestore sorguları + bileşik indeksler; sıralama kriterleri dokümante; ISR + tag; isteğe bağlı “daha fazla” client.
2. Tüm şarkılar	Filtre: harf, sanatçı, ton, zorluk; cursor + indeks; kanonik detay linki; SEO title/description; facet canonical/robots.
3. Akor kütüphanesi	Fretboard chord modu; nota seçici; varyasyon listesi + importer; sadece admin: Rules + Claims + UI.
4. Gamlar	Fretboard scale modu; nota → gam → vurgulama; statik JSON veya koleksiyon.
5. 5’li çember	SVG/Canvas adaptif; mod (Ionian…Locrian); isteğe bağlı harmonik/melodik minör; tıklama → not; spec dokümanı; çekirdek + widget aynı mantık; Preview store ile senkron.
6. Çalma listeleri	Auth zorunlu; CRUD; drag-drop isteğe bağlı; users/.../playlists/.../items; owner Rules; kartlar kanonik link; öğede snapshot veya overrideRef; toplu sıra güncellemesinde batch/transaction limitleri göz önünde.
7. Preview	Söz + akor sunucu HTML; admin künyesi sunucuda; istemci: transpoze görünüm katmanı; tek store ile transpoze + scale + çember konuşması; görüntülenen ton vs orijinal ton; Orijinale dön (transposeSemitones = 0, gam/merkez hizalama, ?transpose= temizleme); Kaydet → users/{uid}/songOverrides/{songId}; Çalma listeme ekle → playlist items + snapshot; yüzen widget’lar, sahne modu, metronom, auto-scroll; şarkı/künye CRUD admin-only.
Okuma sırası (tercih katmanı) — tek cümle
Playlist öğesi: snapshot → kullanıcı songOverrides → sunucu varsayılanı (aynı anda ikisi varsa ürün kuralı tek dokümanda net).

Kritik özet tablosu (güncellenmiş v3)
Konu	Nerede
Ana içerik sunucu HTML	Yasalar + Faz 1–3, 5, 7; Preview + Keşfet + listeler
Orijinal metin/ton sunucuda; transpoze = görünüm	Yasalar + Faz 1, 7
Dark/light + FOUC + sahne uyumu	Faz 1, 8, 10
Preview widget senkron (tek store)	Faz 1
Künye admin + sunucu HTML	Faz 3, 6, 7; smoke Faz 11
songOverrides + playlist snapshot	Faz 3, 4; E2E Faz 11
Session + middleware + Claims	Faz 3; listeler, admin, kaydet/liste
ISR + on-demand revalidate	Faz 5; şarkı, sanatçı, keşfet (kişisel veri ISR dışı)
İndeks + cursor	Faz 3
loading / error / Suspense	Faz 1
3. parti script / LCP	Yasalar + Faz 7, 9
Reklam CLS + adblock	Faz 7
JSON-LD + sitemap + canonical + facet	Faz 2, 7
İnce içerik kırma	Faz 6–7 + öğretici sayfalar
Ortak bileşenler	Faz 1: fretboard, çember, yüzen panel
Test	Faz 11: unit + E2E + emulator; performans eşiği
Güvenlik başlıkları + CSP	Faz 4
Font + preconnect	Yasalar, Faz 1, 8
Auth yaşam döngüsü + KVKK silme/dışa aktarma	Faz 3, 9
Admin audit	Faz 4, 6
Dinamik OG	Faz 7
Checklist — kısa maddeler (kopyala-yapıştır)
Tema: dark / light + kalıcılık (tercihen çerez) + FOUC önleme; kullanıcı vs sistem tercihi kuralı; sahne modu ile aynı token’lar (+ isteğe bağlı override).
Font: next/font, subset; CLS/FOUT kontrolü.
Preview: paylaşılmış client store (ton / transpoze / çember etkileşimi); scale ve çember aynı merkezi dinler; performans: memo + seçici abonelik.
Şarkı künyesi: admin CRUD; Preview’da RSC ile HTML; transpoze sonrası “görüntülenen ton” ayrı, “orijinal ton” sabit.
“Orijinale dön”: transposeSemitones → 0; gam/merkez hizalama; ?transpose= ile tutarlılık.
users/{uid}/songOverrides/{songId} + playlist items içinde snapshot veya overrideRef; okuma sırası: snapshot → override → sunucu varsayılanı.
Firestore Rules: owner-only override ve playlist; E2E: kaydet + listeye ekle + orijinale dön.
SEO: parametreli transpose URL kanonik değil; metadata sunucuda künye özeti; isteğe bağlı dinamik OG.
Güvenlik: CSP (+ nonce), güvenlik başlıkları, admin audit, rate limit / App Check yazmalarda.
Geliştirme: Emulator + seed; şema: schemaVersion / migration notu.
Ölçüm: RUM Web Vitals; CI: Lighthouse eşiği veya benzeri.
Yasal: KVKK + telif kaldırma süreci; hesap silme / veri dışa aktarma (Auth ile bağlı).