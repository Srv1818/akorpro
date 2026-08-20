# AkorPro: Vercel + Firebase → Contabo/Coolify + MariaDB/Directus + Cloudflare

> **Durum:** Taslak — okunacak, güncellenecek ve üzerine konuşulacak canlı doküman.
> Kararlar netleştikçe bu dosya güncellenir.

## Context

Proje şu an **Vercel** üzerinde host ediliyor ve tüm veri/kimlik katmanı **Firebase**'e bağlı
(Firestore = veri, Firebase Auth = Google girişi + session cookie + custom claims + App Check,
Firebase Admin SDK = sunucu). Amaç: bağımsız, sahip olunan bir yığına geçmek —
**Contabo VPS + Coolify** (host/orkestrasyon), **MariaDB** (veri), **Directus** (headless API + admin UI),
**Cloudflare** (DNS + CDN + WAF + Tunnel + R2).

Kullanıcı kararları (netleşti):
- **Auth**: Firebase Auth tamamen kalkar → **Directus auth + Google SSO**.
- **Veri erişimi**: Next.js, **Directus REST/GraphQL API** üzerinden okur/yazar (doğrudan MariaDB değil).
- **Veri taşıma**: Yok — greenfield. Firestore→MariaDB migration scripti gerekmiyor, temiz şema kurulur. İçerik yeni yığında yeniden girilir; **URL yapısı birebir korunur** ki `com.tr → com` yönlendirmesinde her sayfa 1:1 eşleşsin.
- **Admin paneli**: **Tamamen Directus admin UI**. Mevcut Next.js admin arayüzü (`app/admin/*`) ve admin API route'ları (`app/api/admin/*`) **kaldırılır** — CRUD/moderasyon/import/keşfet düzenleme Directus'ta yapılır.
- **Cloudflare**: DNS + CDN + proxy/WAF **+ Cloudflare Tunnel** (VPS'te port açılmaz) **+ R2** (Directus dosya storage).
- **VPS**: 8 GB RAM.
- **Domain / kesim**: Yeni yığın **`akorpro.com`** (bize ait) üzerinde **sıfırdan paralel** kurulur.
  Mevcut canlı **`akorpro.com.tr`** (Vercel + Firebase) hiç dokunulmadan çalışmaya devam eder.
  Yeni yığın hazır + test edilince **`akorpro.com.tr` → `akorpro.com` yönlendirmesi** yapılır (kesim).
  Bu paralel yaklaşım sayesinde canlı sitede kesinti/DNS rollback riski yok.
- **Çalışma şekli**: Ayrı git branch'inde geliştirilir (Sourcetree), `master`'a birleştirmeden ilerlenir.
- **Google OAuth**: `akorpro.com` + Directus callback için **yeni** OAuth client (Firebase'inkine dokunulmaz).
- **Playlists**: Realtime yok → **yerel güncelleme (optimistic) + gerektiğinde yeniden çekme**. `onSnapshot` kalkar.
- **Yedekleme**: MariaDB **günlük** otomatik yedek → R2.
- **Genius/Spotify**: Tamamen kaldırılır (Directus'a taşınmaz).

Beklenen sonuç: Firebase/Vercel'e sıfır bağımlılık; içerik ekibi Directus admin UI'dan yönetir;
uygulama davranışı (sayfalar, moderasyon akışı, akor kütüphanesi, keşfet, playlists) korunur.

Mevcut kapsam (keşiften): Firestore koleksiyonları `songs`, `artists`, `contributions`,
`contributor_profiles`, `chord_library`, `discover`, playlists, `audit_log`; **21 API route**;
real-time (`onSnapshot`) yalnız 2 yerde (`components/playlists/playlists-manager.tsx`,
`components/preview/preview-client.tsx`); Firebase Storage kullanılmıyor. Yan servisler: Sentry (kalır),
GA4 (kalır), Vercel Analytics (kaldırılır), ISR on-demand revalidate (kalır).

---

## Hedef Mimari

```
Cloudflare (DNS + CDN + WAF + Turnstile + R2)
   │  Cloudflare Tunnel  (cloudflared → origin; VPS 80/443 dışarı kapalı)
   ▼
Contabo VPS (8 GB, Ubuntu) — Coolify ile yönetilen container'lar:
   ├── next-app      Next.js 16 (output: standalone, node 24) — SSR/ISR
   ├── directus      API (REST+GraphQL) + Admin UI, storage adapter = R2 (S3)
   └── mariadb       tek veri kaynağı
```

Kimlik: Tarayıcı → Directus Google SSO → Directus access+refresh JWT → Next httpOnly cookie'de tutulur.
Sunucu tarafı Directus'a static token / kullanıcı token'ı ile gider.

---

## Faz 0 — Altyap (kod dışı, sırayla)

1. **Contabo VPS** (8 GB) provizyon, Ubuntu LTS, SSH sertleştirme (key-only, ufw).
2. **Coolify** kurulumu (tek satır installer). Coolify UI kendisi Tunnel arkasına alınır.
3. **Cloudflare**:
   - Domain (`akorpro.com.tr`) nameserver'ları Cloudflare'e taşınır.
   - **Cloudflare Tunnel**: `cloudflared` container'ı Coolify'da; public hostname → `next-app`, ayrı subdomain → `directus` ve Coolify paneli. VPS'te 80/443 dışa kapalı.
   - **WAF + Rate limiting**: yazma uçları (`/api/contributions`, `/api/takedown`) ve `/directus/*` için kurallar.
   - **Turnstile**: App Check yerine bot koruması (contribution/takedown formları). Site+secret key.
   - **R2**: bucket + S3 API token (Directus storage ve gelecekteki görseller için).
4. **Coolify servisleri**: MariaDB (persistent volume + zamanlanmış yedek → R2), Directus (env ile Google SSO + R2 + MariaDB), next-app (Git repo → **Nixpacks build**, Dockerfile yok).

---

## Faz 1 — Veri Modeli: Firestore → MariaDB/Directus şema

Firestore doküman tipleri (`lib/types/firestore.ts`, `contribution.ts`, `chord-library.ts`) ilişkisel şemaya map edilir.
Directus koleksiyon = MariaDB tablosu. Firestore `id` (string) yerine Directus **UUID PK** kullanılır; slug'lar UNIQUE indeksli.

> **Prensip — sadeleştir, birebir kopyalama**: Mevcut admin/şema karışık ve fazlalık içeriyor. Her alanı taşımak zorunda değiliz. Faz başında bir **alan denetimi** yapılır: kullanılan alanlar (public sayfalar + gerçekten girilen veriler) tutulur; ölü/gereksiz alanlar (`schemaVersion`, kullanılmayan denormalize alanlar, artık girilmeyen meta) **atılır**. Hedef: temiz, anlaşılır Directus koleksiyonları. Aşağıdaki tablolar üst-sınır (superset); denetimde budanır.

**`artists`** — `id uuid pk`, `name`, `slug (unique)`, `image_url?`, `genre?`, `song_count int`, `popularity int?`, `created_at`, `updated_at`.

**`songs`** — `id uuid pk`, `title`, `slug`, `artist` (FK→artists), `artist_slug`, `artist_name` (denormalize, mevcut kodla uyum), `chord_body LONGTEXT` (sanitize edilmiş sunucu HTML), `cover_image_url?`, `original_key`, `difficulty enum(kolay,orta,zor)`, `key_mode enum(major,natural,harmonic,melodic)?`, `gamlar_scale_id?`, `genre`, `tempo varchar?`, `time_signature?`, `tuning?`, `capo int?`, `moderation_status enum(draft,pending,approved,rejected)`, `copyright_source?`, `popularity int?`, `show_harmony_details bool?`, `harmony_details_notes LONGTEXT?`, `created_at`, `updated_at`. UNIQUE(`artist_slug`,`slug`).

**`song_contributors`** — junction (Firestore `contributorIds[]` + `array-contains` yerine): `song` FK, `user` FK. `getContributorSongCount` bu tabloyu + `moderation_status=approved` join'ler.

**`contributions`** — `id uuid pk`, tüm `ContributionDoc` alanları; `status enum(pending,approved,rejected)`, `moderator` FK?, `moderator_note?`, `approved_song` FK?, `contributor` FK, `contributor_display_name`, tarih alanları.

**`contributor_profiles`** — `user` FK (1-1, PK), `display_name`, `bio?`, `avatar_url?`, `approved_count int`, `verified bool`, `joined_at`, `updated_at`.

**`chord_library`** — `ChordShapeDoc` birebir: `name`, `root`, `quality enum(...)`, `fingering`, `fingers?`, `frets JSON?`, `barre_start/end/fret int?`, `sort_order int?`, tarih alanları.

**`scales`** — `ScaleDoc`: `id`, `name`, `notes_c JSON`, `category?`, `description?`, `sort_order?`.

**`discover`** — section bazlı sıralı liste. İki seçenek: (a) `discover_sections`(`key` = popular/new/featured, `updated_at`) + `discover_items`(`section` FK, `song` FK, `position int`); veya (b) tek satırda `song_ids JSON`. **Öneri: (a)** — Directus M2M ile sıralı, admin UI'dan sürükle-bırak.

**`audit_log`** — `actor` FK, `action`, `collection`, `target_id`, `meta JSON`, `created_at` (yalnız sistem yazar).

**Notlar**: Firestore `createdAt/updatedAt` epoch-ms → MariaDB `datetime` (Directus otomatik). `serializeDoc()` (Timestamp→number) katmanı Directus'ta gereksizleşir; okuma katmanı ISO/Date döndürür, gerekirse ms'e çevrilir.

### Şema Denetimi — bulgular (admin editörleri + write route'ları okunarak)

Tut / At / Karar kolonları. "At" = Directus'ta oluşturulmaz.

| Koleksiyon | Tut (fiilen kullanılıyor) | At | Karar gerek |
|---|---|---|---|
| **songs** | title, slug, artist(FK), artist_slug, artist_name, chord_body, original_key, difficulty, key_mode, gamlar_scale_id, genre, tempo, time_signature, tuning, capo, popularity, copyright_source, show_harmony_details, harmony_details_notes, moderation_status, contributors(junction), timestamps | `schemaVersion`, **`cover_image_url`** (KARAR: per-şarkı foto yüklenmeyecek → alan atılır) | ✔ Çözüldü |
| **artists** | name, slug, genre, image_url, popularity, timestamps | `schemaVersion`, **`song_count`** (elle alan atılır → otomatik türetilir) | ✔ Çözüldü |
| **chord_library** | name, root, quality, fingering, fingers, sort_order, **`barre_fret`** (tutulur + Directus formuna giriş eklenir) | `schemaVersion`, **`frets`** (diyagram `fingering`'den türetiyor), **`barre_start`**, **`barre_end`** | ✔ Çözüldü |
| **contributions** | songTitle, artistName, chord_body, original_key, key_mode, genre, difficulty, tempo, time_signature, tuning, capo, copyright_source, contributor(FK), contributor_display_name, status, moderator, moderator_note, approved_song(FK), timestamps | `schemaVersion` | — |
| **contributor_profiles** | user(FK), display_name, bio, avatar_url, verified, joined_at, updated_at | `approved_count` (elle alan atılır → otomatik türetilir) | ✔ Çözüldü |
| **discover** | section key + sıralı song listesi (M2M) | — | — |
| **audit_log** | — | **Tüm koleksiyon atılır** → Directus'un yerleşik **Activity Log + Revisions**'ı kullanılır (`lib/security/audit-log.ts` silinir) | — |

**Kararlar (denetim sonucu):**
- **Kapak görseli**: Per-şarkı foto yüklenmeyecek → `cover_image_url` **atılır**. OG görselleri için mevcut **dinamik/default OG** (`app/opengraph-image.tsx`) kullanılır (başlık/sanatçıdan üretilir veya sabit default). Public sayfalardaki `coverImageUrl` referansları (sitemap, sanatçı, gitar-akorlari, preview, akor sayfaları) default OG'ye düşürülür.
- **Sayçlar**: `artists.song_count` ve `contributor_profiles.approved_count` **otomatik türetilir** (Directus aggregate/flow; approved şarkı sayısı) — elle alanlar kalkar, tutarsızlık riski biter.
- **Barre**: `barre_fret` **tutulur**, Directus akor formuna barre perde girişi eklenir → barre akorları doğru çizilir.

**Genel budama**: her koleksiyondan `schemaVersion` atılır; `createdAt/updatedAt` Directus otomatik alanlarına devredilir; `serializeDoc` katmanı kalkar. `artist_id` (Firestore string) yerine gerçek FK; `artist_slug`/`artist_name` denormalize alanları şimdilik tutulur (public sorgular birebir kullanıyor), Faz 4'te FK join'e geçilince sadeleştirilebilir.

---

## Faz 2 — Directus konfigürasyonu

- **Koleksiyonlar & alanlar**: Faz 1 şeması (bootstrap için `schema apply` snapshot dosyası repo'ya konur → tekrarlanabilir kurulum).
- **Roller** (Firebase custom claims + `firestore.rules` + `AKORPRO_PUBLISHER_UIDS` yerine):
  - `Public` (anon): approved song/artist/chord/discover **okuma**; contribution **create**.
  - `Contributor` (giriş yapan): kendi profili + katkıları.
  - `Moderator` (admin): tüm içerik CRUD, moderasyon.
  - `Publisher`: approved yayınlama + yayında düzenleme (mevcut publisher-gate). Directus rol/policy ile.
- **Permission'lar** = `firestore.rules`'un Directus karşılığı (alan-düzeyi kısıtlar dahil).
- **Google SSO**: `AUTH_GOOGLE_*` env (client id/secret, redirect), `AUTH_GOOGLE_DEFAULT_ROLE_ID`. Google Cloud Console'da Directus callback URI eklenir.
- **Storage**: `STORAGE_LOCATIONS=r2`, S3 driver → Cloudflare R2 (endpoint/anahtar).
- **Flows**: contribution `approved` → song oluştur + `approved_song` bağla + `contributor_profiles.approved_count` artır (mevcut `app/api/admin/songs/[id]/moderate` mantığı Directus Flow'una taşınır). Song write → ilgili public sayfayı revalidate etmek için Next `/api/revalidate`'e webhook (flow) çağrısı.
- **Admin arayüzü Directus'un kendisi**: şarkı/sanatçı/akor/keşfet/moderasyon/import ekranları Directus'ta. Mevcut `app/admin/*` sayfaları ve `app/api/admin/*` route'ları kaldırılır.
- **Import** (`app/api/admin/import` + `lib/firestore/import-validator.ts`): Directus'ta CSV/JSON import veya bir kerelik seed scripti (`@directus/sdk`) ile.

---

## Faz 3 — Auth yeniden yazımı

Mevcut: `lib/auth/*`, `app/api/auth/*`, `lib/firebase/*`, `components/auth/*`, App Check.

- **`lib/directus/` istemcisi**: `@directus/sdk` ile server client (static token) + kullanıcı-bağlamlı client.
- **SSO akışı**: `app/giris` → Directus `/auth/login/google` redirect. Callback'te Directus access+refresh token → **httpOnly cookie** (mevcut `SESSION_COOKIE_NAME` desenini koru).
- **`getServerSessionUser()`** (`lib/auth/server-session.ts`) yeniden yazılır: Directus token doğrula / `/users/me` çağır → `SessionUser` (`uid`→Directus user id, `admin`→rol kontrolü). `verifyFirebaseJwt`, `getAdminAuth` kaldırılır.
- **`app/api/auth/session/route.ts`**: `createSessionCookie` yerine Directus token refresh/exchange + cookie set/clear.
- **`app/api/auth/custom-token/route.ts`**: **kaldırılır** (yalnız Firestore kuralları için client Firebase token üretiyordu; Directus'ta gereksiz).
- **`app/api/admin/claims/route.ts`**: **kaldırılır** (admin artık Directus rolü).
- **`lib/auth/publisher.ts`**: `AKORPRO_PUBLISHER_UIDS` env yerine Directus "Publisher" rol/policy kontrolü.
- **`require-admin.ts`**, `session-user.ts`, `components/auth/*`, `login-form.tsx`, `auth-header-actions.tsx`, `use-firebase-uid-from-session.ts`: Directus'a uyarlanır. `lib/security/app-check.ts` kaldırılır (→ Turnstile doğrulaması yazma uçlarında).

---

## Faz 4 — Veri katmanı yeniden yazımı

Strateji: `lib/firestore/*` modüllerinin **dışa aktardığı fonksiyon imzaları korunur**, gövdeleri Directus SDK sorgularına çevrilir → çağıran component/sayfa/route'lar minimum değişir. Klasör `lib/data/` (veya `lib/directus/collections/`) olarak yeniden adlandırılabilir, import yolları güncellenir.

- Her modül (`songs`, `artists`, `contributions`, `contributor-profiles`, `chord-library`, `discover`, `search`): Firestore `collection/where/orderBy/count` → Directus `readItems({ filter, sort, aggregate })`.
- **Önbellek korunur**: `unstable_cache` + `lib/cache/tags.ts` (TAGS/TTL) aynen; write'lar aynı tag'leri invalide eder. Firestore-retry sarmalayıcıları basitleştirilir/çıkarılır.
- **`array-contains` (contributorIds)** → `song_contributors` junction join.
- **Real-time kaldırılır** (`playlists-manager.tsx`, `preview-client.tsx` `onSnapshot`): Kullanıcı kendi verisini düzenlediği için realtime gereksiz → **optimistic yerel güncelleme + gerektiğinde Directus'tan yeniden çekme** (tek seferlik read). Websocket kurulmaz.
- **`serialize.ts`**: Directus tarih/tip normalizasyonuna göre sadeleşir/kaldırılır.

---

## Faz 5 — API route'lar, URL korunumu & app konfigürasyonu

**Admin route'ları kaldırılır** (Directus admin devralır): `app/admin/*` (8 sayfa) + `app/api/admin/*` (12 route: artists, chord-library, claims, contributions, discover, songs, songs/[id], songs/[id]/moderate, import, genius/lyrics, genius/search, spotify/resolve).
- Genius/Spotify yardımcıları (şarkı editöründe söz çekme / Spotify eşleme): **KARAR = tamamen kaldırılır**. İlgili route'lar (`genius/lyrics`, `genius/search`, `spotify/resolve`), song studio'daki entegrasyon kodu ve `genius-lyrics` npm bağımlılığı silinir (`node-html-parser` başka yerde kullanılmıyorsa o da).

**Kalan public route'lar** Directus'a bağlanır:
- `/api/revalidate` — aynen kalır (self-host Next ISR destekler; Directus flow'ları buraya webhook atar).
- `/api/search` — Directus filter/search.
- `/api/songs/[songId]/open` — popülerlik/sayaç güncelleme → Directus.
- `/api/contributions` — public katkı gönderimi (+ **Turnstile** doğrulaması) → Directus create.
- `/api/takedown` — public takedown talebi (+ Turnstile).
- `/api/auth/*` — Directus SSO/session (Faz 3).

**URL korunumu (kritik — `com.tr → com` eşleşmesi için)**: Tüm public route segmentleri ve slug şeması **aynen korunur** — `app/sanatci/...`, `app/akor/...`, `app/akor-kutuphanesi`, `app/gitar-akorlari`, `app/calma-listeleri`, `app/gamlar`, `app/besli-cember`, `app/katki`, `app/profil`, `app/arama` + legal sayfalar (`gizlilik`, `iletisim`, `telif`, `kullanim-kosullari`, `cerez-politikasi`). `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` korunur; canonical `NEXT_PUBLIC_SITE_URL` → `akorpro.com`. Slug üretim mantığı (`artist_slug`+`slug`) birebir aynı kalır.

**Config**:
- **Build = Nixpacks** (Coolify varsayılanı) — **elle Dockerfile yok**. Nixpacks Next.js'i otomatik algılar: `next build` → `next start` (node 24). `output: "standalone"` **gerekmez**; istenirse ileride küçültme için eklenebilir ama Nixpacks default akışı yeterli.
- **`next.config.ts`**: `images.remotePatterns`'a R2/Cloudflare host'ları eklenir; Sentry config kalır. (Standalone zorunlu değil.)
- **`@vercel/analytics` kaldırılır** (kodda `<Analytics/>` sökülür); istenirse Cloudflare Web Analytics beacon.
- Not: MariaDB + Directus, Coolify'da resmi hazır imajlar olarak çalışır (bizim yazdığımız Dockerfile değil). Nixpacks yalnız kendi Next.js uygulamamızı derler.

---

## Faz 5.1 — Trafik & Yönlendirme (SEO kesim güvenliği)

> GA4 eski sitede kurulu değil (`NEXT_PUBLIC_GA4_ID` boş) → tek trafik kaynağı **GSC**.
> Ham veri `data/gsc/`, envanter `node scripts/gsc-url-inventory.mjs` ile üretilir.

**Ölçüm (2026-08-20, son 3 ay):** 1.348 tıklama / 117.300 gösterim. Trafik alan **36 benzersiz path**.
Sitemap'te 178 URL var ama Google yalnız **35'ini** dizine almış (%20). Trafik son derece yoğun:
**6 sayfa tıklamaların %80'ini** taşıyor. Kesim riski bu yüzden küçük ve yönetilebilir.

**Önceliklendirme** (`data/gsc/CUTOVER-CHECKLIST.md`):
- **P0 (6 sayfa, tıklamaların %80'i)** — `/akor/eypio/omrum` (509), `/akor/ferdi-ozbegen/dilek-tasi` (181),
  `/akor/karaf/ask-durdukca` (147), `/akor/blok3/kusura-bakma` (74),
  `/akor/dolu-kadehi-ters-tut/dilerim-ki` (63), `/akor/mor-ve-otesi/cambaz` (59).
- **P1 (20 sayfa)** — kalan tıklama alan sayfalar.
- **P2 (10 sayfa)** — yalnız gösterim alanlar.

**Kesim ön koşulu (blocking):** Greenfield olduğu için içerik yeniden girilecek. Toplam
**29 şarkı + 27 sanatçı** Directus'a **kesimden önce** girilmiş olmalı — yoksa 301'in ucu 404 olur.
P0 %100 dolmadan kesim yapılmaz. Bu, `scripts/verify-urls.mjs` ile makine tarafından denetlenir
(P0/P1'de tek hata → çıkış kodu 1).

**www yinelenmesi — ölçüldü, canlıda sorun YOK.** GSC'de `www.akorpro.com.tr` ayrı satırlar üretiyor
(11 URL, 75 tıklama, 6.750 gösterim). Canlı davranış test edildi: `www` → apex **301** dönüyor ve
canonical apex'i gösteriyor. Yani bu satırlar Google'ın hâlâ hatırladığı **eski dizin kayıtları**,
aktif bir sızıntı değil — eski sitede yapılacak bir şey yok.
**Yeni yığında gereklilik:** `www.akorpro.com` → `akorpro.com` 301 + canonical yalnız apex.
Aynı davranış kurulmazsa problem *yeniden* doğar.

**Yönlendirme mekanizması** — Cloudflare **Redirect Rule** (Bulk Redirects'e gerek yok, path şeması birebir aynı),
`akorpro.com.tr` zone'unda, tüm istekler için, **301**, path + query korunarak:
```
concat("https://akorpro.com", http.request.uri.path,
       if(http.request.uri.query != "", concat("?", http.request.uri.query), ""))
```
`www.akorpro.com.tr` zone'u da aynı kurala dahil edilir.

**`next.config.ts` `redirects()` bloğu KORUNUR** — 24 legacy kural (`/songs/:path*`, `/artist/:slug`,
`/chord/:artist/:song`, `/kesfet`, `/playlists`, `/login`, trailing-slash normalizasyonu…).
GSC'de bu eski URL'ler hiç gösterim almıyor, yani düşük riskli; ama maliyeti sıfır olduğu için taşınır.
Faz 6'daki `next.config.ts` düzenlemesi bu bloğa dokunmaz.

**Soft 404 — kesim için EN KRİTİK bulgu.** Mevcut sitede eksik içerik `404` değil, **`200` + "bulunamadı"
gövdesi + `noindex`** döndürüyor. Doğrulandı:

| İstek | Beklenen | Gerçek |
|---|---|---|
| `/akor/olmayan-sanatci/olmayan-sarki` | 404 | **200** (soft 404) |
| `/sanatci/olmayan-sanatci` | 404 | **200** (soft 404) |
| `/asdfghjkl` (route eşleşmiyor) | 404 | 404 ✓ |

Sayfa kodu `notFound()` çağırıyor (`app/akor/[sanatciSlug]/[sarkiSlug]/page.tsx:104`,
sanatçı sayfası `:103`) ama yanıt 200 geliyor. Kök neden teşhis edilmedi — `node_modules` kurulu
olmadığı için `node_modules/next/dist/docs/` okunamadı; **fix'ten önce AGENTS.md gereği doküman okunmalı.**

Kesim açısından iki sonucu var:
1. **Yeni yığında düzeltilmesi zorunlu.** Directus'a girilmemiş bir şarkı 200 dönerse Google URL'i
   soft 404 olarak dizinde tutar — temiz 404'ten daha kötü.
2. **Doğrulama sadece durum koduna bakamaz.** `scripts/verify-urls.mjs` bu yüzden gövde denetimi de
   yapıyor: `noindex` meta, "bulunamadı" başlığı ve canonical/path uyuşmazlığı. Aksi halde eksik
   içerik için **sahte yeşil** üretirdi. Detektör canlıda iki yönde test edildi
   (35/35 gerçek içerik geçti, uydurma URL yakalandı).

**Diğer kör noktalar:**
- `/akor-kutuphanesi` ve `/sanatci/ayten-alpman` — dizinde ama trafik yok; yine de 200 dönmeli.
- Sitemap'teki 143 URL dizine alınmamış — kesimde kaybedilecek bir şey yok, ancak yeni sitemap aynı URL'leri üretmeli.
- `/akor/kenan-dogulu/kursun-adres-sormaz-ki` — **kapsam dışı** (aşağıda).

**Doğrulama adımları:**
1. Kesimden önce, staging'de: `node scripts/verify-urls.mjs --base https://<staging>` → P0/P1 tamamı 200.
2. Kesim anında: `node scripts/verify-urls.mjs --base https://akorpro.com` → tamamı 200.
3. Kesimden sonra: `node scripts/verify-urls.mjs --redirect` → `com.tr` tarafı 301 + doğru hedef.
4. GSC'de `akorpro.com` property'si açılır, sitemap gönderilir, **adres değişikliği** bildirilir.
5. Cloudflare Analytics'te 404 oranı izlenir; ilk 30 gün `com.tr` property'sinde tıklama düşüşü takip edilir.
6. `com.tr` yönlendirmesi **en az 12 ay** açık kalır (Google sinyal aktarımı için).

**Kapsam dışı (karar 2026-08-20):** `/akor/kenan-dogulu/kursun-adres-sormaz-ki` — 0 tıklama / 4 gösterim,
pozisyon 54.5, sitemap'te yok ve canlıda zaten soft 404, yani gerçek içerik değil. Taşınmayacak;
ihtiyaç olursa yeni sitede normal içerik girişi olarak eklenir. Karar
`scripts/gsc-url-inventory.mjs` içindeki `EXCLUDED` haritasında gerekçesiyle kayıtlı — script tekrar
çalıştığında korunur.

**Envanter tazeleme:** Kesime yakın GSC export'ları yenilenip `scripts/gsc-url-inventory.mjs`
tekrar çalıştırılır — o tarihe kadar yeni trafik alan sayfalar listeye girer.

---

## Faz 6 — Temizlik & env

- **Silinir**: `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `lib/firebase/*`, `scripts/seed-firestore.mjs` (→ Directus seed'e dönüşür), `firebase`/`firebase-admin`/`firebase-tools`/`@firebase/rules-unit-testing`/`@vercel/analytics` bağımlılıkları.
- **Eklenir**: `@directus/sdk`, MariaDB/Directus bağlantı env'leri.
- **`.env.example`** yeniden yazılır: `FIREBASE_*` / App Check / emulator kaldırılır; `DIRECTUS_URL`, `DIRECTUS_STATIC_TOKEN`, Google OAuth (Directus), `R2_*`, `TURNSTILE_*`, `REVALIDATION_SECRET` (kalır), Sentry/GA4 (kalır) eklenir.
- **`.github/`** workflow: Firebase deploy/emulator adımları → Coolify webhook/deploy; testler güncellenir.
- **README / AGENTS.md / docs/**: yeni yığın anlatımı.

---

## Kritik dosyalar (özet)

- Auth: `lib/auth/server-session.ts`, `lib/auth/publisher.ts`, `lib/auth/require-admin.ts`, `app/api/auth/*`, `app/giris/page.tsx`, `components/auth/*`, `lib/firebase/*` (silinir)
- Veri: `lib/firestore/*` (→ Directus), `lib/cache/tags.ts` (korunur), `components/playlists/playlists-manager.tsx`, `components/preview/preview-client.tsx` (realtime)
- **Silinen admin**: `app/admin/*` (8 sayfa), `app/api/admin/*` (12 route), `lib/firestore/admin-*.ts`, `lib/firestore/import-validator.ts`, `lib/security/audit-log.ts` (→ Directus activity/revisions)
- Kalan public route: `app/api/{auth,contributions,takedown,search,revalidate}/*`, `app/api/songs/[songId]/open`
- Config: `next.config.ts`, `.env.example`, `package.json`, `.github/*`, Firebase artefaktları (silinir). **Dockerfile yok** → Coolify Nixpacks derler.
- Infra (repo dışı ama repo'da doküman): Directus schema snapshot, Coolify servis tanımları, Cloudflare Tunnel config

---

## Doğrulama (end-to-end)

1. **Yerel geliştirme**: Next dev, **deploy edilmiş (staging) Directus'a** (`akorpro.com` VPS) `DIRECTUS_URL` ile bağlanır — yerelde Docker gerektirmez. (Alternatif: geçici bir Directus Cloud/örneği.) Directus schema snapshot uygulanır, örnek seed yüklenir.
2. **Akışları sür**:
   - Google ile giriş → session cookie oluşuyor, `/api/auth/me` doğru user/rol dönüyor.
   - Anasayfa/keşfet, sanatçı sayfası, şarkı önizleme (chord render), akor kütüphanesi, arama.
   - Contribution gönder (Turnstile) → `contributions` pending; admin panelde görün.
   - Admin moderate → approve → `songs` approved + `approved_song` bağlı + contributor count arttı; publisher-gate ile yayın davranışı.
   - Playlists: ekle/çıkar + realtime güncelleme.
   - `/api/revalidate` ile ISR invalidation.
3. **Testler**: `__tests__/integration/firestore-rules.test.ts` → Directus permission testine dönüştürülür; `vitest` + Playwright e2e yeşile alınır.
4. **Staging cutover provası**: Cloudflare Tunnel arkasında tam yığını çalıştır, gerçek domain'in staging subdomain'inde smoke.

---

## Riskler & rollback

- **Kesim (cutover)**: Yeni yığın `akorpro.com` üzerinde bağımsız kurulur; mevcut `akorpro.com.tr` (Vercel + Firebase) paralel çalışmaya devam eder. Yeni yığın tam test edilip stabil olunca `akorpro.com.tr → akorpro.com` yönlendirmesi (301) yapılır. İki taraf ayrı domain/altyapı olduğu için kesim anına kadar canlı site hiç etkilenmez; sorunda yönlendirme geri alınır. Greenfield olduğu için veri senkron riski yok (içerik yeni yığında yeniden girilir/seed edilir — **canlı içerik varsa `com`'a taşınması teyit edilmeli**).
  - SEO notu: `com.tr` → `com` kalıcı yönlendirme + `com`'da canonical; Search Console'da adres değişikliği bildirimi.
    Somut URL envanteri, öncelik listesi ve doğrulama adımları **Faz 5.1**'de (GSC verisiyle ölçüldü: 36 trafik alan path, 6 sayfa tıklamaların %80'i, kesim öncesi 29 şarkı + 27 sanatçı girilmiş olmalı).
- **App Check kaybı**: bot/abuse koruması Cloudflare WAF + Turnstile'a devreder — yazma uçlarında Turnstile şart.
- **Real-time davranış farkı**: Firestore `onSnapshot` → Directus subscription; UX eşdeğerliği test edilir.
- **ISR önbellek**: tek VPS'te on-demand revalidate sorunsuz; ileride çok-instance olursa paylaşımlı cache gerekir.
- **8 GB RAM**: MariaDB+Directus+Next+build aynı makinede; build sırasında bellek baskısı olursa build'i CI/Coolify remote builder'a alıp swap eklenir.

> Not: Bu büyük bir geçiş; fazlar sırayla ve ayrı PR'larla ilerletilmeli (Faz 0 infra → 1-2 şema/Directus → 3 auth → 4-5 kod → 6 temizlik). Her faz sonunda doğrulama.

---

## Açık Sorular / Konuşulacaklar

- [x] ~~Admin: Directus mü, mevcut Next.js admin mi?~~ → **Directus admin UI**. Mevcut admin (`app/admin/*` + `app/api/admin/*`) kaldırılır.
- [x] ~~İçerik taşınacak mı?~~ → **Hayır**, greenfield. Sadece **URL yapısı korunur** (com.tr → com eşleşmesi). Aynı slug şeması → içerik yeniden girildiğinde URL'ler otomatik eşleşir.
- [x] ~~Domain nameserver yetkisi~~ → `akorpro.com` bizde; yeni yığın orada kurulur, `com.tr` sonra yönlendirilir.
- [x] ~~Şema denetimi~~ → Yapıldı (yukarıdaki bulgular tablosu). `schemaVersion`, `cover_image_url`, elle sayçlar, `frets`/`barre_start`/`barre_end`, `audit_log` budandı; sayçlar otomatik; barre tutuldu.
- [x] ~~Genius/Spotify yardımcıları~~ → **Tamamen kaldırılır** (Directus'a taşınmaz).
- [x] ~~Google OAuth~~ → **Yeni** OAuth client (`akorpro.com` + Directus callback; Firebase'e dokunulmaz).
- [x] ~~Playlists realtime mı?~~ → **Hayır**, optimistic yerel güncelleme + yeniden çekme.
- [x] ~~Yedekleme sıklığı~~ → **Günlük** MariaDB yedeği → R2.
- [x] ~~Trafik alan sayfalar ne olacak?~~ → **Faz 5.1**. GSC ile ölçüldü; `data/gsc/CUTOVER-CHECKLIST.md` kesim ön koşulu.
- [x] ~~`/akor/kenan-dogulu/kursun-adres-sormaz-ki`~~ → **Kapsam dışı**; gerçek içerik değil, taşınmaz.
- [x] ~~`www` yinelenmesi~~ → Canlıda zaten 301 + doğru canonical; eski sitede aksiyon yok. Yeni yığında aynı davranış kurulacak.
- [ ] **Soft 404 fix'i nerede yapılsın?** Eksik içerik 200 dönüyor (bkz. Faz 5.1). Yeni yığında zorunlu; **mevcut `com.tr` sitesinde de ayrıca düzeltilsin mi**, yoksa geçişle mi kapansın? (Ayrı iş; `next/dist/docs` okunmadan fix yazılmamalı.)

**Kalan açık madde yok** — plan uygulamaya hazır. (İlerledikçe: canlı `com.tr`'de gerçek içerik olup olmadığı kesim öncesi teyit edilecek.)
