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
- **Veri taşıma**: Yok — greenfield. Firestore→MariaDB migration scripti gerekmiyor, temiz şema kurulur. İçerik yeni yığında yeniden girilir; **URL yapısı birebir korunur** ki kesimde her sayfa 1:1 eşleşsin.
- **Admin paneli**: **Tamamen Directus admin UI**. Mevcut Next.js admin arayüzü (`app/admin/*`) ve admin API route'ları (`app/api/admin/*`) **kaldırılır** — CRUD/moderasyon/import/keşfet düzenleme Directus'ta yapılır.
- **Cloudflare**: DNS + CDN + proxy/WAF **+ Cloudflare Tunnel** (VPS'te port açılmaz) **+ R2** (Directus dosya storage).
- **VPS**: 8 GB RAM.
- **Domain / kesim (KARAR 2026-08-20 — güncellendi)**: **`akorpro.com.tr` birincil domain olarak KALIR.**
  Altyapı göçü ile domain değişimi ayrı kararlar; domain değiştirilmiyor.
  `.com.tr` bir ccTLD ve Google için otomatik Türkiye hedefleme sinyali — kitlenin %98'i Türkiye
  (GSC: 1.348 tıklamanın 1.319'u). Bu sinyal 301 ile taşınmadığı için domain taşınmıyor.
  - Yeni yığın **`akorpro.com`** üzerinde paralel kurulur — ama **staging/prova ortamı olarak**,
    kalıcı adres olarak değil. Arama motorlarına **tamamen kapalı** tutulur (aşağıya bak).
  - **Kesim = DNS anahtarı**: yeni yığın test edilip onaylanınca `akorpro.com.tr`'nin DNS'i
    Vercel'den Cloudflare Tunnel'a çevrilir. URL'ler, canonical'lar, sitemap — hepsi `.com.tr` kalır.
  - Kesimden sonra **`akorpro.com` → `akorpro.com.tr` 301** (marka koruması; tersi değil).
  - **SEO sonucu**: adres değişikliği bildirimi yok, 301 zinciri yok, ccTLD sinyali korunur,
    geçiş dalgalanması yok. Domain kaynaklı SEO riski sıfır.
- **Çalışma şekli**: Ayrı git branch'inde geliştirilir (Sourcetree), `master`'a birleştirmeden ilerlenir.
- **Google OAuth**: **yeni** OAuth client; redirect URI'lar hem `akorpro.com` (staging) hem
  **`akorpro.com.tr` (production)** + Directus callback içerir. Firebase'in mevcut client'ına dokunulmaz —
  ayrı client ID olduğu için aynı domain iki client'ta yer alabilir.
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
3. **Cloudflare** (iki zone: `akorpro.com.tr` = production, `akorpro.com` = staging):
   - **`akorpro.com.tr` nameserver'ları Cloudflare'e taşınır.** Kesimden **önce** yapılır ve
     kayıtlar Vercel'i göstermeye devam eder — canlıda değişiklik olmaz. Kesim böylece tek bir
     DNS kaydı düzenlemesine iner. **Kesimden en az 24 saat önce TTL 300 sn'ye düşürülür**
     (hızlı rollback için).
   - **`akorpro.com` zone'u = staging.** Arama motorlarına tamamen kapalı tutulur:
     **Cloudflare Access** (e-posta/OTP ile giriş) staging hostname'in önüne konur. Bu, robots.txt'e
     güvenmekten daha sağlam — bot hiç içeriğe ulaşamaz.
     ⚠️ **Bu kritik**: staging, production'ın birebir kopyası. Açık bırakılırsa Google
     `akorpro.com`'u indeksler ve `.com.tr` ile **duplicate content** çakışması doğar —
     yani korumak istediğimiz sıralamalara zarar verir.
   - **Cloudflare Tunnel**: `cloudflared` container'ı Coolify'da. Public hostname'ler:
     geliştirme boyunca `akorpro.com` → `next-app`; kesimde buna `akorpro.com.tr` eklenir.
     Ayrı subdomain'ler → `directus` ve Coolify paneli (ikisi de Access arkasında). VPS'te 80/443 dışa kapalı.
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

**URL korunumu (kritik — kesimde 1:1 eşleşme için)**: Tüm public route segmentleri ve slug şeması **aynen korunur** — `app/sanatci/...`, `app/akor/...`, `app/akor-kutuphanesi`, `app/gitar-akorlari`, `app/calma-listeleri`, `app/gamlar`, `app/besli-cember`, `app/katki`, `app/profil`, `app/arama` + legal sayfalar (`gizlilik`, `iletisim`, `telif`, `kullanim-kosullari`, `cerez-politikasi`). `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` korunur; canonical `NEXT_PUBLIC_SITE_URL`
**`https://akorpro.com.tr` olarak KALIR** (domain değişmiyor). Staging deploy'unda da bu değer
production'ı gösterir — staging Cloudflare Access arkasında olduğu için taranmaz, indekslenmez. Slug üretim mantığı (`artist_slug`+`slug`) birebir aynı kalır.

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

**Kesim mekanizması (domain kararı sonrası güncellendi)** — Domain değişmediği için `.com.tr` tarafında
**hiçbir yönlendirme kuralı yok**. Kesim tek adım: `akorpro.com.tr` DNS kaydı Vercel'den
Cloudflare Tunnel'a çevrilir. URL'ler zaten aynı olduğu için kullanıcı ve Google açısından
sayfa adresleri hiç değişmez.

Kesimden **sonra** `akorpro.com` zone'unda tek bir Redirect Rule (301, path + query korunarak) —
marka koruması için, ters yönde:
```
concat("https://akorpro.com.tr", http.request.uri.path,
       if(http.request.uri.query != "", concat("?", http.request.uri.query), ""))
```
Bu kural **kesimden önce eklenmez** — staging o hostname üzerinde çalışıyor. Sıra: kesim → staging
Access kapatılır → redirect rule eklenir.

**`next.config.ts` `redirects()` bloğu KORUNUR** — 24 legacy kural (`/songs/:path*`, `/artist/:slug`,
`/chord/:artist/:song`, `/kesfet`, `/playlists`, `/login`, trailing-slash normalizasyonu…).
GSC'de bu eski URL'ler hiç gösterim almıyor, yani düşük riskli; ama maliyeti sıfır olduğu için taşınır.
Faz 6'daki `next.config.ts` düzenlemesi bu bloğa dokunmaz.

**Soft 404 — ölçüldü, Next'in belgelenmiş davranışı; SEO kaybı DEĞİL.** Eksik içerik `404` değil,
`200` + "bulunamadı" gövdesi + `noindex` döndürüyor (`/akor/olmayan/olmayan`, `/sanatci/olmayan`).

Kök neden: root `app/loading.tsx` her route için bir Suspense sınırı kuruyor → şarkı sorgusu
çözülmeden yanıt stream'lenmeye başlıyor → header'lar gönderildiği için status artık değiştirilemiyor.
Sayfa kodu `notFound()`'u doğru çağırıyor (`app/akor/[sanatciSlug]/[sarkiSlug]/page.tsx:104`).
Next dokümanı (`next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md` → Status Codes)
bunu açıkça tarif ediyor:

> "When streaming, a `200` status code will be returned… Some crawlers may label these responses as
> 'soft 404s'. **In the streaming case, this does not lead to indexation because the page is
> explicitly marked `noindex`** in the HTML."

**Sonuç: aksiyon gerekmiyor.** İndekslenmeyi `noindex` zaten engelliyor. Gerçek 404 status'u yalnızca
uyumluluk/analitik için gerekir; dokümanın önerdiği çözüm (`proxy.ts`'te stream öncesi slug varlık
kontrolü) her `/akor/*` ve `/sanatci/*` isteğine bir veri sorgusu ekler — bu sitenin trafiğinde
maliyeti faydasından büyük. Yeni yığında da aynı durum kabul edilir.

**Tek gerçek etkisi doğrulamada:** Eksik içerik 200 döndüğü için kesim kontrolü durum koduna
güvenemez. `scripts/verify-urls.mjs` bu yüzden gövde denetimi yapıyor (`noindex` meta, "bulunamadı"
başlığı, canonical/path uyuşmazlığı) — Directus'a girilmemiş bir şarkı için sahte yeşil üretmesin diye.
Detektör canlıda iki yönde test edildi: 35/35 gerçek içerik geçti, uydurma URL yakalandı.

**Diğer kör noktalar:**
- `/akor-kutuphanesi` ve `/sanatci/ayten-alpman` — dizinde ama trafik yok; yine de 200 dönmeli.
- Sitemap'teki 143 URL dizine alınmamış — kesimde kaybedilecek bir şey yok, ancak yeni sitemap aynı URL'leri üretmeli.
- `/akor/kenan-dogulu/kursun-adres-sormaz-ki` — **kapsam dışı** (aşağıda).

**Doğrulama adımları (domain kararı sonrası güncellendi):**
1. **Kesimden önce, staging'de** — `node scripts/verify-urls.mjs --base https://akorpro.com`
   → P0/P1 tamamı geçmeli. Bu, "içerik Directus'a girildi mi" sorusunun cevabı ve **kesim ön koşulu**.
   (Staging Cloudflare Access arkasındaysa script'e servis token'ı gerekir ya da kontrol geçici olarak
   Access bypass kuralı ile çalıştırılır.)
2. **Kesim anında** — DNS çevrildikten sonra `node scripts/verify-urls.mjs --base https://akorpro.com.tr`
   → tamamı geçmeli. Aynı komut, artık gerçek domain'e karşı.
3. **Kesimden sonra** — `akorpro.com` → `akorpro.com.tr` 301'i doğrula (marka koruma kuralı).
4. **GSC'de yeni property AÇILMAZ, adres değişikliği bildirilmez** — domain değişmiyor. Mevcut
   `akorpro.com.tr` property'si aynen devam eder; sitemap zaten gönderilmiş durumda.
5. Cloudflare Analytics'te 404 oranı izlenir; ilk 30 gün GSC'de tıklama/gösterim eğrisi takip edilir.
   Beklenti: **düşüş olmamalı** — URL'ler ve domain değişmediği için sinyal aktarımı gerekmiyor.
6. Vercel + Firebase, kesimden sonra **en az 2 hafta** ayakta bırakılır (rollback penceresi).

> `verify-urls.mjs --redirect` yeniden amaçlandırıldı: artık `akorpro.com/<path>` → **301** →
> `akorpro.com.tr/<path>` marka koruma kuralını doğrular (3. adım). Varsayılan `--base` da
> `https://akorpro.com.tr`.

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

- **Kesim (cutover) — DNS anahtarı**: Yeni yığın `akorpro.com` (staging, Access arkasında) üzerinde
  kurulur ve tam test edilir. Mevcut `akorpro.com.tr` (Vercel + Firebase) o ana kadar hiç etkilenmez.
  Kesim = `akorpro.com.tr` DNS kaydının Cloudflare Tunnel'a çevrilmesi. Domain, URL'ler ve canonical'lar
  değişmediği için Google açısından **hiçbir şey taşınmıyor** — yalnız origin değişiyor.
  - **Rollback**: DNS kaydını Vercel'e geri al. Bu yüzden kesimden ≥24 saat önce **TTL 300 sn**'ye
    düşürülür ve Vercel + Firebase kesimden sonra **≥2 hafta** ayakta bırakılır.
  - **Önceki plana göre fark**: eski yaklaşımda canlı domain hiç dokunulmadan bırakılıp 301 atılıyordu;
    şimdi kesim canlı domain üzerinde gerçekleşiyor. Rollback DNS ile hâlâ temiz, ama **anlık** değil
    (TTL kadar gecikir). Karşılığında domain kaynaklı SEO riski tamamen ortadan kalkıyor — bilinçli takas.
  - Greenfield olduğu için veri senkron riski yok. Kesim ön koşulu: **29 şarkı + 27 sanatçı** Directus'ta
    hazır (Faz 5.1, `scripts/verify-urls.mjs` ile denetlenir).
  - SEO notu: adres değişikliği bildirimi **yok**, yeni GSC property **yok**, 301 zinciri **yok**.
    Mevcut `akorpro.com.tr` property'si aynen devam eder.
- **ccTLD geotargeting — KARARLA ÇÖZÜLDÜ (2026-08-20)**: `.com` jenerik olduğu için Google'ın otomatik
  Türkiye hedefleme sinyalini taşımaz ve bu sinyal 301 ile aktarılmaz. Kitle %98 Türkiye
  (GSC: 1.348 tıklamanın 1.319'u). **Karar: domain değiştirilmiyor, `.com.tr` birincil kalıyor** →
  risk gerçekleşmiyor. `akorpro.com` staging olarak kullanılır, kesimden sonra `.com.tr`'ye 301'lenir.
- **Staging duplicate content (YENİ RİSK — paralel kurulumun getirdiği)**: `akorpro.com` üzerinde
  production'ın birebir kopyası çalışacak. Açık bırakılırsa Google indeksler ve `.com.tr` ile
  duplicate content çakışması doğar — yani korunmak istenen sıralamalara zarar verir.
  **Önlem: Cloudflare Access** (robots.txt'e güvenilmez; bot içeriğe hiç ulaşamamalı).
  Kesimde Access ancak `.com` → `.com.tr` 301 kuralı eklendikten sonra kaldırılır.
- **App Check kaybı**: bot/abuse koruması Cloudflare WAF + Turnstile'a devreder — yazma uçlarında Turnstile şart.
- **Real-time davranış farkı**: Firestore `onSnapshot` → Directus subscription; UX eşdeğerliği test edilir.
- **ISR önbellek**: tek VPS'te on-demand revalidate sorunsuz; ileride çok-instance olursa paylaşımlı cache gerekir.
- **8 GB RAM**: MariaDB+Directus+Next+build aynı makinede; build sırasında bellek baskısı olursa build'i CI/Coolify remote builder'a alıp swap eklenir.

> Not: Bu büyük bir geçiş; fazlar sırayla ve ayrı PR'larla ilerletilmeli (Faz 0 infra → 1-2 şema/Directus → 3 auth → 4-5 kod → 6 temizlik). Her faz sonunda doğrulama.

---

## Açık Sorular / Konuşulacaklar

- [x] ~~Admin: Directus mü, mevcut Next.js admin mi?~~ → **Directus admin UI**. Mevcut admin (`app/admin/*` + `app/api/admin/*`) kaldırılır.
- [x] ~~İçerik taşınacak mı?~~ → **Hayır**, greenfield. Sadece **URL yapısı korunur**. Aynı slug şeması → içerik yeniden girildiğinde URL'ler otomatik eşleşir. Zorunlu liste: Faz 5.1.
- [x] ~~Domain nameserver yetkisi~~ → Her iki domain de bizde. `akorpro.com` = staging; `akorpro.com.tr` nameserver'ları kesimden önce Cloudflare'e taşınır (kayıtlar Vercel'i göstermeye devam eder, canlıda değişiklik olmaz).
- [x] ~~Şema denetimi~~ → Yapıldı (yukarıdaki bulgular tablosu). `schemaVersion`, `cover_image_url`, elle sayçlar, `frets`/`barre_start`/`barre_end`, `audit_log` budandı; sayçlar otomatik; barre tutuldu.
- [x] ~~Genius/Spotify yardımcıları~~ → **Tamamen kaldırılır** (Directus'a taşınmaz).
- [x] ~~Google OAuth~~ → **Yeni** OAuth client (`akorpro.com` + Directus callback; Firebase'e dokunulmaz).
- [x] ~~Playlists realtime mı?~~ → **Hayır**, optimistic yerel güncelleme + yeniden çekme.
- [x] ~~Yedekleme sıklığı~~ → **Günlük** MariaDB yedeği → R2.
- [x] ~~Trafik alan sayfalar ne olacak?~~ → **Faz 5.1**. GSC ile ölçüldü; `data/gsc/CUTOVER-CHECKLIST.md` kesim ön koşulu.
- [x] ~~`/akor/kenan-dogulu/kursun-adres-sormaz-ki`~~ → **Kapsam dışı**; gerçek içerik değil, taşınmaz.
- [x] ~~`www` yinelenmesi~~ → Canlıda zaten 301 + doğru canonical; eski sitede aksiyon yok. Yeni yığında aynı davranış kurulacak.
- [x] ~~Soft 404 fix'i nerede yapılsın?~~ → **Hiçbir yerde.** Next'in belgelenmiş streaming davranışı; `noindex` indekslenmeyi zaten engelliyor. Yalnız doğrulama script'i gövde denetimi yapar (Faz 5.1).

- [x] ~~Domain kararı~~ → **`.com.tr` birincil KALIR** (karar 2026-08-20). Domain değiştirilmiyor;
  yalnız altyapı taşınıyor. `akorpro.com` staging olarak kullanılır, kesimden sonra `.com.tr`'ye 301'lenir.
  Sonuç: domain kaynaklı SEO riski sıfır. Bunun getirdiği yeni gereklilik: **staging Cloudflare Access
  ile kapatılmalı** (duplicate content).

Açık madde kalmadı. (İlerledikçe: canlı `com.tr`'de gerçek içerik olup olmadığı kesim öncesi teyit edilecek.)
