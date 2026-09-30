# Nerede kaldık

> **2026-09-23 — Payload geçişi başladı.** Aşağıdaki Directus anlatısı hâlâ
> canlı olanı (akorpro.com) tarif ediyor. Yeni dal `feature/payload-migration`;
> durumu bu dosyanın sonundaki "Payload geçişi" bölümünde.


> Son güncelleme: 2026-09-02
> Ayrıntılı plan: [`MIGRATION-PLAN.md`](MIGRATION-PLAN.md) · Altyapı: [`docs/faz-0-cloudflare.md`](docs/faz-0-cloudflare.md)

## Tek cümleyle

Yeni yığın **`akorpro.com` üzerinde çalışıyor** (Directus + Next.js, Contabo/Coolify).
`akorpro.com.tr` hâlâ Vercel'de, hiç dokunulmadı. Kalan iş: içerik girişi, sonra kesim.

## Canlı durum (ölçüldü, varsayım değil)

| Adres | Durum |
|---|---|
| `https://akorpro.com` | 200 — Next.js, Directus'tan besleniyor |
| `https://akorpro.com/akor/eypio/omrum` | 200 — akor, söz, künye ve armoni notu render ediliyor |
| `https://admin.akorpro.com` | 200 — Directus, Google SSO ile giriş |
| `https://akorpro.com.tr` | Vercel'de, eski yığın, **değişmedi** |

İçerik: **1 sanatçı (Eypio), 1 şarkı (Ömrüm)** — eski siteden birebir taşındı, test amaçlı.

## Biten işler

### Kod (branch: `feature/directus-migration`, 6 commit)

- **Faz 1–2 — Şema ve roller.** 12 koleksiyon, 12 FK ilişkisi. Elle tıklanmıyor:
  `npm run directus:schema` ve `npm run directus:roles` idempotent script'ler.
  Roller: `Contributor` (admin UI'a giremez), `Moderator` (approved yapamaz), `Publisher` (yayına alır).
- **Faz 4 — Veri katmanı.** `lib/firestore/*` tamamen Directus'a çevrildi, dışa aktarılan
  imzalar korunduğu için çağıran sayfalar değişmedi. Arama artık bellekte değil
  veritabanında (`ILIKE`); keşfet blokları sıralı `discover_items`.
- **Faz 3 — Auth.** Firebase Auth → Directus + Google SSO. Yetki custom claim yerine
  **rol adına** göre. Playlist'ler için 4 API route (tarayıcı Directus'a bağlanmıyor).
  **Firebase projeden tamamen çıktı** — kod, bağımlılıklar, `firestore.rules`, config dosyaları.
- **Faz 5 — Admin.** `app/admin/*` ve `app/api/admin/*` silindi, Directus devraldı.
  Genius/Spotify entegrasyonu da kaldırıldı (plan kararı). ~5.200 satır eksi.

### Altyapı

- Cloudflare: `akorpro.com` zone'u, `admin` ve apex A kayıtları (proxy'li)
- Coolify: `directus` servisi (Directus 11 + Postgres + Redis), `akorpro-web` (GHCR imajı;
  build GitHub Actions'ta, Nixpacks terk edildi)
- R2 dosya depolama, Google OAuth client, Publisher rollü uygulama token'ı
- `songs(artist_slug, slug)` bileşik unique indeksi
- `robots.ts` host'a bakıyor: staging tamamen indekslemeye kapalı

### Yol boyunca çözülen üç tuzak

Hepsi `docs/faz-0-cloudflare.md`'de ayrıntılı; kısaca:

1. **Cloudflare Tunnel bırakıldı.** VPS paylaşımlı, 80/443 diğer projeler için açık
   kalmak zorunda; Tunnel'ın tek gerekçesi düşünce geriye fazladan katman kalıyordu.
2. **SSO `INVALID_CREDENTIALS`.** Parolayla açılmış hesap SSO ile eşleşmiyor;
   `provider`/`external_identifier` düzeltildi. Ardından tarayıcıdaki oturum çerezi
   geçersizleşip her isteği 401 yaptı — çerez temizlenerek çözüldü.
3. **Şarkı sayfası production'da 500.** İki ayrı sebep vardı: env doğrulaması hâlâ
   Firebase değişkenlerini zorunlu sayıyordu; ve sayfa hem statik üretiliyor hem
   `cookies()` okuyordu (`DYNAMIC_SERVER_USAGE`). İkisi de dev modunda görünmüyordu.

## Sırada ne var

### Sende

- [ ] **Break-glass admin hesabı** — Google'da olmayan bir e-posta, güçlü parola,
      `Administrator` rolü. Şu an tek admin hesabı Google'a bağlı ve SMTP yok;
      Google tarafında bir aksilikte Directus'a kilitlenirsin. Planda "atlanmamalı" işaretli.
- [ ] **İçerik girişi** — Directus admin'den. Şu an 1 şarkı var.
- [ ] İstersen `www.akorpro.com` (Coolify → Domains alanına ikinci hostname).
      Staging indekslemeye kapalı olduğu için aciliyeti yok.

### Kesim öncesi (içerik girildikten sonra)

- [ ] `akorpro.com.tr` zone'unu Cloudflare'e al — **siteyi taşımaz**, kayıtlar birebir
      kopyalanır, apex hâlâ Vercel'i gösterir. Kesimden ayrı yapılmasının sebebi:
      `.com.tr` NS TTL'i 48 saat ve bizde değil; kesime bindirilirse rollback günlere çıkar.
- [ ] Kesim kontrol listesi: `docs/faz-0-cloudflare.md` sonundaki tablo.
      **En kritik madde:** Directus'a `admin.akorpro.com.tr` hostname'i eklenip
      `SESSION_COOKIE_DOMAIN` `.akorpro.com.tr` yapılmalı — atlanırsa kesimden sonra
      hiç kimse giriş yapamaz.

## Bilinen açıklar

| Konu | Not |
|---|---|
| `www.akorpro.com` | 503 — Coolify Domains alanına eklenmedi |
| Turnstile | Kurulmadı; yazma uçları giriş istediği için anonim spam yüzeyi yok |
| MariaDB → Postgres | Plan MariaDB diyordu; Directus'un hazır Postgres şablonu kullanıldı (elle compose yazmamak için) |
| Günlük yedek → R2 | Henüz kurulmadı |
| Google consent screen | "Testing" modunda — kesimden önce Publish edilmeli |

---

# Payload geçişi (dal: `feature/payload-migration`)

Taban: `feature/directus-migration`. **`master` ve Vercel'deki `akorpro.com.tr`
bu çalışmanın tamamen dışında.**

## Neden

Directus'ta biriken üç sürtünme: şema ve roller kodla yönetilmeye çalışılıyordu
(`scripts/directus-*.mjs`), Flow'lar tetiklenmediği için slug otomasyonu Postgres
trigger'ına düşmüştü, ve admin ayrı bir servis + ayrı hostname + ayrı oturum
çerezi demekti. Payload'da üçü de tek TypeScript projesinin içinde.

## Biten

| İş | Durum |
|---|---|
| Build VPS'ten çıktı | Dockerfile + GitHub Actions + GHCR; Nixpacks bırakıldı |
| Next.js 16.2.1 → 16.3.6 | Payload'ın peer şartı `>=16.3.3`; tek başına doğrulandı |
| Payload 3.90.1 kuruldu | db-postgres, storage-s3, plugin-seo/sentry/import-export |
| 14 koleksiyon | Directus'un 12'si + `users` (auth) + `media` (yükleme) |
| Hook'lar | Slug üretimi, denormalize alanlar, sanatçı adı yayılımı — SQL trigger'ın yerine |
| Erişim kuralları | Tek `role` alanı; moderatör düzenler ama yayına alamaz |
| Veri katmanı | 7 dosya Payload Local API'ye çevrildi; imzalar korundu, HTTP katmanı kalktı |
| Üretim şeması | `prodMigrations` — taze veritabanında otomatik uygulanıyor |
| **Auth** | **Bitti.** Google + e-posta/parola. Giriş çalışıyor. |
| Directus | **Koddan tamamen çıktı** — `lib/directus/*`, SDK, script'ler silindi |

Ölçülen doğrulamalar (varsayım değil):

- Build 0 ile çıkıyor, tip denetimi temiz, 135/135 test geçiyor
- Lint çıktısı geçiş öncesiyle birebir aynı (20 hata, 6 kural) — yeni sorun yok
- Türkçe slugify, Postgres fonksiyonuyla 20 vakada birebir aynı sonucu veriyor
- Veritabanına **hiç erişmeden** derlenen imaj, taze Postgres'e bağlanınca:
  migration çalıştı (194 ms), 26 tablo oluştu
- Parola girişi 200 döndü ve çerez yazıldı; `/api/auth/me` doğru kullanıcıyı verdi
- İkinci kullanıcı, ilkinin çalma listesini ne gördü ne silebildi (403)
- Build sırasında Directus'a giden istek: **0**

## Kalan

**Kod: bitti.** Directus'a bağlı tek satır kalmadı.

**Altyapı (sırası önemli) — bu kısım sende:**

1. [ ] Coolify'da Payload için **ayrı** bir Postgres servisi.
       Directus'un Postgres'i kullanılamaz: o "Directus With Postgresql"
       şablonuyla kuruldu, yığını silince veritabanı da gider.
2. [ ] Google OAuth: mevcut istemciye Payload'ın callback adresi eklenecek.
       Yeni client açmaya gerek yok, aynısı kullanılacak.
3. [ ] GitHub Actions değişkenleri ve sırları
4. [ ] Coolify'da imaj + env ile deploy, doğrulama
5. [ ] İçerik girişi (şu an 1 sanatçı, 1 şarkı)
6. [ ] **En son:** Directus yığınının kaldırılması

## Bilinen ayrıntılar

- `package.json`'a `"type": "module"` eklendi. Payload CLI config'i aksi halde
  CJS olarak yükleyip göreli `.ts` importlarını çözemiyor. Bunun için
  `lighthouserc.js` → `.cjs` ve `next.config.ts`'te `require.resolve` →
  `createRequire`.
- Zengin metin editörü (lexical) **kurulmadı**: tek bir richText alanı yok,
  akor gövdesi `code` alanında HTML. Ayrıca top-level await içerdiği için
  Payload CLI'ını kırıyordu.
- Payload REST API'si `/payload-api` altında; `/api` mevcut route'ların.
- `/admin` proxy'nin korumalı yol listesinden çıkarıldı — kalsaydı Payload'ın
  kendi giriş sayfası `/giris`e yönlendirilir ve panele hiç girilemezdi.
- Şarkı sayfası dinamik kalıyor (`searchParams` okuyor). Payload'dan bağımsız,
  Directus döneminde de öyleydi.
- Payload CLI bu makinede yalnız projenin bulunduğu dizin yüzünden sorun
  çıkarabilir: `Proje Dosyaları` hem boşluk hem Türkçe karakter içeriyor.
  Docker içinde yol `/app` olduğu için orada sorun yok.

## Auth nasıl çalışıyor

- Çerez `payload-token`, uygulamanın kendisi yazıyor. Ayrı servis yok, bu yüzden
  `SESSION_COOKIE_DOMAIN` ve `admin.akorpro.com.tr` hostname maddeleri kesim
  listesinden **düştü**.
- E-posta + parola her zaman açık. Break-glass admin sorunu bununla kapandı:
  Google tarafında aksilik olursa parolayla girilir.
- Google yapılandırılmamışsa düğme hiç görünmez, uygulama yine açılır.
- Rol yükseltme elle: Google ile ilk kez giren herkes `contributor` olur.
  Aksi halde herkes panele girebilirdi.
- Payload'ın CSRF koruması `Origin` başlığı istiyor. Tarayıcılar gönderir;
  `curl` ile test ederken `-H "Origin: <site>"` eklenmezse oturum geçersiz görünür
  (bu yüzden bir kez yanlış alarm verdi).

## Google Cloud'da yapılacak tek şey

Mevcut OAuth istemcisine izinli redirect URI olarak şunu ekle:

```
https://akorpro.com/payload-api/users/oauth/callback
```

Yeni client açmaya gerek yok. Sonra `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
ve `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=1` tanımlanır.

---

## 2026-09-29 — Kesim yapıldı: akorpro.com artık Payload'da

`akorpro.com` Directus yığınından Payload'a taşındı. Ölçülen sonuç:

| Kontrol | Sonuç |
|---|---|
| `/`, `/gamlar`, `/gitar-akorlari`, `/akor-kutuphanesi` | 200 |
| `/admin` (Payload paneli) | 200, "ilk kullanıcıyı oluştur" ekranı |
| `/giris` | Parola alanı var, yani Payload |
| `www.akorpro.com` | 200 — eskiden 503'tü, açık madde kapandı |
| Migration | `20260923_141041_initial` 761 ms'de uygulandı |
| `/payload-api/users/me` | 200 |

`robots.txt` hâlâ `Disallow: /` — staging koruması bilinçli, `.com.tr` ile
yinelenen içerik olmasın diye.

**Veritabanı boş.** Payload taze bir Postgres'e bağlandı; içerik girişi sıfırdan.

### Kesim nasıl yapıldı

Alan adı `akorpro-web`'den kaldırılıp `akorpro-payload`'a eklendi. Coolify
`www` kaydını da kendiliğinden ekledi. Eski uygulama silinmedi, geri dönüş
yolu olarak alan adsız bırakıldı.

### Google girişi

OAuth istemcisi (`akorpro-payload`, eski adıyla `akorpro-directus`) tek bir
yönlendirme adresi tutuyor: `https://akorpro.com/payload-api/users/oauth/callback`.
Directus'unki bilerek kaldırıldı — Directus paneline Google ile giriş artık
çalışmıyor, kullanıcı kararı.

`GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` Coolify'da tanımlı.
Düğmenin görünmesi derleme zamanına bağlı olduğu için repo değişkeni
`NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=1` eklendi ve imaj yeniden derleniyor.

### Öğrenilen: NEXT_PUBLIC_* değişkenleri çalışma zamanında da gerekli

İlk deploy `[env] Eksik: NEXT_PUBLIC_SITE_URL` ile açılmadı. Sebep:
`lib/security/validate-env.ts` değişkenleri **dinamik anahtarla**
(`process.env[key]`) okuyor, bu yüzden Next derleme sırasında gömemiyor.
Yani `NEXT_PUBLIC_*` değişkenleri hem build arg olarak hem de konteyner
ortamında bulunmalı.

### Öğrenilen: VPS'e doğrudan erişim kapalı

`158.220.96.32` üzerinde 80 ve 443 dışarıdan yanıt vermiyor; trafik yalnız
Cloudflare üzerinden geçiyor. Bu yüzden Coolify'ın ürettiği `sslip.io` test
adresi hiçbir zaman çalışmadı. İleride bir şeyi kesim öncesi test etmek
gerekirse Cloudflare'de proxy'li bir alt alan adı açmak gerekiyor.

### Directus tamamen kaldırıldı (2026-09-29)

`akorpro-web` uygulaması ve `directus-with-postgresql` servisi Coolify'dan
silindi. Kalan iki kaynak: `akorpro-payload` ve `akorpro-payload-db`.

`admin.akorpro.com` artık 503 dönüyor. Cloudflare'deki `admin` A kaydı
öksüz kaldı, istenirse silinebilir — zararsız.

**Directus'taki test içeriği (1 sanatçı, 1 şarkı) gitti.** Kayıp sayılmaz:
içerik girişi zaten sıfırdan planlanıyordu ve Payload'ın veritabanı da boştu.

### Kalan kurulum adımı

Repo değişkeni `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=1` eklendi ve yeni imaj
derlendi (2 dk 58 sn). Google düğmesinin giriş sayfasında görünmesi için
Coolify'dan bir Deploy daha gerekiyor. Parola girişi şu an da çalışıyor.

### Deploy elle yapılıyor — otomatik tetikleme neden olmadı

Akış: `feature/payload-migration` dalına push → GitHub Actions imajı derler →
GHCR'a yükler. **Yayına alma Coolify'dan elle** (akorpro-payload → Actions → Deploy).

Otomatik tetikleme denendi ve çalışmadı. Coolify ayarlarında
**Settings → Advanced → Allowed API IPs** listesi var ve yalnız iki sabit IP'yi
kabul ediyor (`91.93.226.103`, `91.93.229.79`). GitHub Actions her çalıştırmada
başka bir IP'den geldiği için webhook **403** dönüyor. GitHub'ın IP aralıkları
binlerce CIDR ve sürekli değişiyor, o alana sığmaz.

Yol boyunca ikinci bir sorun daha çıktı ve düzeltildi: token'a yalnız `deploy`
yetkisi verilmişti, Coolify'ın deploy akışı `read` yetkisini de istiyor
(bkz. coolify.io/docs/api-reference/authorization). Ama asıl engel IP listesiydi.

**Otomatiğe dönmek istenirse:** IP listesini boşaltmak yeterli. API yine
korumasız kalmaz, Bearer token zorunlu olmaya devam eder. O zaman workflow'daki
"Deploy talimatı" adımının yerine Coolify deploy webhook'u çağrılır:
`https://xyz.coronstudio.com/api/v1/deploy?uuid=e3exzpdrcamjrqghikjfgmy2&force=false`

**Bilinçli kabul edilen risk:** build yeşil olup deploy unutulabilir, kod ile
yayındaki sürüm sessizce ayrışır. Bu yüzden workflow her çalıştırmada özet
sayfasına "İmaj hazır, Coolify'dan Deploy'a bas" satırı yazıyor.

### 2026-09-29 — Şarkı sayfası 500 veriyordu (düzeltildi)

**Belirti.** `/akor/<sanatci>/<sarki>` her istekte 500. Olmayan bir şarkı bile
404 yerine 500 dönüyordu. Loglarda `DYNAMIC_SERVER_USAGE`.

**Sebep kodda değil, build ortamındaydı.** Sayfa hem `searchParams` okuyor
(`returnTo`, `transpose`) hem de `revalidate` + `generateStaticParams` ile ISR
kullanıyordu. Next bir sayfayı ISR ile üretirken `searchParams`'a erişilirse
bu hatayı fırlatıyor.

Directus döneminde sorun çıkmamasının sebebi: build Coolify'da yapılıyordu ve
`DIRECTUS_URL` + `DIRECTUS_TOKEN` mevcuttu, `generateStaticParams` gerçek
yolları döndürüyor, sayfalar derleme anında üretiliyordu. Build GitHub
Actions'a taşınınca veritabanı erişimi kalmadı, liste boş döndü ve her istek
ISR yolundan geçmeye başladı.

Karşılaştırma, sebebi tek başına gösteriyor:

| Sayfa | searchParams | ISR | Sonuç |
|---|---|---|---|
| `/akor/[sanatci]/[sarki]` | var | var | **500** |
| `/sanatci/[slug]` | yok | var | 200 |
| `/gitar-akorlari` | var | yok | 200 |

**Çözüm.** Şarkı sayfası `export const dynamic = "force-dynamic"` ile açıkça
dinamik yapıldı; `revalidate` ve `generateStaticParams` kaldırıldı.
Önbellek kaybolmadı: okuma katmanı `unstable_cache` ile 1 saat tutuyor.

Doğrulama, üretim koşulu birebir taklit edilerek yapıldı — **veritabanısız
derlenip veritabanıyla çalıştırıldı**: şarkı sayfası 200.

**Açık kalan küçük madde:** olmayan şarkı 404 yerine 200 dönüyor (soft 404).
Çökme değil, ama arama motoru açısından düzeltilmeli.

### 2026-09-29 — İçerik artık anında yayına düşüyor

**Sorun.** Payload'da kaydedilen içerik siteye ancak TTL dolunca düşüyordu:
ana sayfa 5 dakika, şarkı ve sanatçı sayfaları 1 saat. Editör kaydedip
siteye bakınca eski hâli görüyor, yanlış kaydettiğini sanıyordu.

**Çözüm.** `payload/revalidate.ts` — koleksiyon hook'ları yazma sonrası
ilgili önbellek etiketlerini düşürüyor. `app/api/revalidate` ucuna ve
`REVALIDATION_SECRET`'e gerek kalmadı: Payload aynı Next süreci içinde
çalıştığı için `revalidateTag` doğrudan çağrılıyor, HTTP turu yok.

İki bilinçli karar:

- **`{ expire: 0 }`, `"max"` değil.** `"max"` bayat içeriği arka planda
  tazelerken göstermeye devam eder, yani kaydeden kişi yine eskisini görür.
  Sıfır, sonraki isteği bloklayıp taze veriyi getiriyor.
- **Hook'lar hata yutuyor.** Migration, seed script'i ve toplu içe aktarma
  istek bağlamı dışında çalışıyor; orada `revalidateTag` hata fırlatıyor.
  Yutulmasaydı içerik yazma işlemi düşerdi. Doğrulandı: doğrulama script'i
  16/16 kontrolle geçiyor.

Hangi yazma neyi tazeliyor:

| Koleksiyon | Düşen etiketler |
|---|---|
| `songs` | `songs:all`, facets, üç keşfet bloğu, şarkının ve sanatçısının etiketleri |
| `artists` | `artists:all`, `songs:all`, sanatçı ve şarkı listesi etiketleri |
| `chord-library` | `chord_library:all` |
| `discover-*` | Üç keşfet bloğu |

Slug veya sanatçı değişirse **eski** adresin etiketi de düşürülüyor; yoksa
eski URL bayat içerikle ayakta kalırdı.

### 2026-09-29 — SEO eklentisi kaldırıldı

Panel "0/3 kontrol geçiyor" diye kırmızı uyarı gösteriyordu ama o alanları
hiçbir sayfa okumuyordu. Sayfalar metadata'yı `generateMetadata` içinde
veriden üretiyor ve ürettiği daha iyi:

| | Değer |
|---|---|
| Eklentinin alanı | `Ömrüm \| AkorPro` |
| Sayfanın verdiği | `Ömrüm Akor — Eypio \| AkorPro` |

Açıklama da otomatik doluyor: ton, mod, solo gam, transpoze ve diyagram.
Alan doldurulsaydı daha iyi olanı ezme riski vardı.

`@payloadcms/plugin-seo` bağımlılıktan çıkarıldı. Şema değişikliği için
`20260929_072717_drop_seo_meta` migration'ı üretildi (`songs` ve `artists`
tablolarındaki `meta_title`, `meta_description`, `meta_image_id` sütunları).

Doğrulama üretim koşuluyla: veritabanısız derlenip **taze** Postgres'e
bağlandı, iki migration sırayla uygulandı, meta sütunu sayısı 0, sayfalar 200.

### İki siteyi karşılaştıran SEO ölçümü (2026-09-29)

`akorpro.com.tr` ile `akorpro.com` aynı şarkı sayfasında:

| Sinyal | .com.tr | .com |
|---|---|---|
| Başlık | aynı | aynı |
| Açıklama | aynı kalıp | aynı kalıp |
| Yapısal veri | 8 tip | aynı 8 tip |
| Kelime | 15.287 | 14.893 |
| H2 | 7 | 0 |
| İç bağlantı (`/akor/`) | 5 | 0 |

Teknik SEO birebir aynı — zaten aynı kod. Son iki satırdaki fark içerik
kaynaklı: tek şarkı olduğu için benzer şarkılar, önceki/sonraki ve aynı
türden öneri bölümleri boş kalıyor. İkinci şarkıda dolmaya başlar.

`.com.tr`'nin iyi sonuç almasının sebebi özel bir SEO çalışması değil,
181 sayfalık içerik ve birikmiş otorite.

### 2026-09-29 — Panelde site başlığı görünüyordu (düzeltildi)

Payload admin panelinin üstünde sitenin kendi navbar'ı çıkıyordu.

**Sebep.** `app/layout.tsx` kök layout'tu ve `<html>`, `<body>`, navbar,
footer render ediyordu. Next'te route grubu kök layout'tan kaçamaz; Payload'ın
kendi `RootLayout`'u bunun içine gömülüyordu. İki `<html>` iç içe.

**Çözüm.** Next'in "birden çok kök layout" düzenine geçildi. Site sayfaları
`app/(site)/` altına taşındı ve kök layout oraya indi. Artık iki bağımsız kök
var: `(site)` ve `(payload)`. Kökte yalnız gruplardan bağımsız olanlar kaldı:
`api`, `globals.css`, `global-error.tsx`, `icon.svg`, `robots.ts`, `sitemap.ts`.

Doğrulama taze Postgres ile: `/admin` 200 ve Payload paneli, içinde site
navbar'ı yok; site sayfaları 200.

### 2026-09-29 — İkonlar yuvarlatıldı

Köşe yarıçapı %22'den %35'e çıkarıldı (680 birimlik kutuda `rx` 150 → 240).

Bütün raster varlıklar **tek kaynaktan**, SVG'den yeniden üretildi:
6 boy PNG (32–512) ve `favicon.ico` (32 + 48). Böylece SVG ile raster
arasında yarıçap farkı kalmıyor.

`favicon.ico` elle kuruldu: `sharp` .ico yazamıyor, biçim de basit olduğu için
PNG'ler ICO kapsayıcısına gömüldü. Doğrulama: 512 pikselde üst kenarda ilk
opak piksel 172, `rx=240` için beklenen 181 (aradaki fark kenar yumuşatma).

### 2026-09-29 — Keşfet blokları netleşti, elle puan kaldırıldı

**Sorun.** Şarkı girerken verilen "Popülerlik" puanının neyi etkilediği belli
değildi. Üç yere etki ediyordu: ana sayfadaki Popüler bloğu, şarkı
sayfasındaki aynı türden öneriler, sanatçı sıralaması. Hiçbiri gerçek
ilgiyle bağlantılı değildi.

**Şimdi üç blok da net:**

| Blok | Kaynak |
|---|---|
| Popüler | **Son 30 günün gerçek tıklaması**, otomatik |
| Yeni eklenen | Eklenme tarihi, otomatik |
| Editör seçimi | Panelden, `discover-items` ile sürükle-bırak sıralı |

`songs.popularity` alanı kaldırıldı. Elle puan verilmiyor.

**Nasıl sayılıyor.** `song_views` koleksiyonu: şarkı başına **günlük** bir
satır. Her görüntülenme için ayrı satır tutulsaydı popüler bir şarkı günde
binlerce satır üretirdi; günlük kova satır sayısını şarkı × gün ile sınırlıyor.

Üç bilinçli karar:

- **Tarayıcıdan sayılıyor**, sunucu render'ında değil. Sunucuda sayılsaydı
  arama motoru botları popülerliği belirlerdi.
- **Kayan 30 günlük pencere.** Toplam sayaç olsaydı ilk giren şarkılar
  sonsuza kadar tepede kalırdı.
- **Tek `INSERT ... ON CONFLICT DO UPDATE`.** Payload Local API'si atomik
  artırma yapamıyor; oku-artır-yaz üç adımı eşzamanlı isteklerde sayım
  kaybederdi.

Aynı sekmede aynı şarkıya dönmek tekrar saymıyor (`sessionStorage`), yoksa
ileri-geri gezinmek sayacı şişirirdi. Uçta dakikada 30 istek sınırı var.

Henüz tıklanmamışsa liste boş kalmasın diye en yeni şarkılarla tamamlanıyor.

**Uçtan uca doğrulandı** (taze Postgres, üretim imajı davranışı): üç migration
uygulandı, iki şarkı girildi, birine 5 birine 1 tıklama gönderildi, sayaç
tablosu 5 ve 1 gösterdi, ana sayfadaki Popüler bloğu çok tıklananı öne aldı.

### 2026-09-29 — Editör seçimi tek listeye indi, elle puan tamamen kalktı

**Discover Sections + Discover Items kaldırıldı**, yerine tek koleksiyon:
`editor-picks` (Editör Seçimi). Şarkı seç, sıra ver, bitti.

Eski yapının asıl sorunu kullanılamaz olmasıydı: kod yalnızca `key` alanı tam
olarak `featured` olan bölümü okuyordu ve bu kelime panelde hiçbir yerde
yazmıyordu. Üretimde iki tablo da boştu; blok hiç çalışmamıştı.

**`popularity` alanı hem şarkıdan hem sanatçıdan kalktı.** Artık elle puan
verilmiyor:

| Yer | Eski | Yeni |
|---|---|---|
| Ana sayfa Popüler | elle puan | son 30 günün tıklaması |
| Arama sayfası popüler sanatçılar | elle puan | sanatçının şarkılarının tıklaması |
| Şarkı sayfası benzer öneriler | elle puan | en yeni önce |

Görüntülenmesi olmayan durumda listeler boş kalmıyor: Popüler en yeni
şarkılarla, popüler sanatçılar en çok şarkısı olanlarla tamamlanıyor.

**Telif kaynağı** alanına varsayılan değer verildi:
`Topluluk Katkısı/Eğitim amaçlı`. Her şarkıda elle yazmaya gerek yok.

### Migration üretiminde iki tuzak

**1. İnteraktif soru.** `payload migrate:create`, aynı anda hem tablo silinip
hem tablo eklendiğinde "bu yeni mi yoksa yeniden adlandırma mı" diye soruyor
ve otomasyondan cevaplanamıyor. Çözüm: değişikliği **iki adımda** üretmek —
önce yalnız silmeler, sonra yalnız eklemeler. O zaman soru hiç çıkmıyor.

**2. Üretilen SQL kendi kendini kırıyordu.** `DROP TABLE ... CASCADE`
kısıtlamayı da götürüyor, ardından gelen `DROP CONSTRAINT` "does not exist"
ile patlıyordu. Taze veritabanı testinde yakalandı; üretimde de patlardı.
Bütün migration'larda `DROP CONSTRAINT/INDEX/COLUMN` ifadeleri `IF EXISTS`
ile idempotent yapıldı.

**Doğrulama (taze Postgres):** beş migration sıfır hatayla uygulandı,
`editor_picks` ve `song_views` oluştu, `discover_*` tabloları gitti,
hiçbir tabloda `popularity` sütunu kalmadı, `copyright_source` varsayılanı
veritabanına işlendi, `/admin` 200.

## İçerik girişi notları

Panelde içerik girerken işe yarayan, tahmin edilmesi zor birkaç kural.

**Akor gövdesinde bölüm ayırıcı çizgi.** İki boş satır (Enter'a üç kez basmış
gibi) alt alta gelirse ince bir ayırıcı çizgi çizilir. Tek boş satır yalnız
boşluk bırakır. `[Chorus]`, `[Verse]` gibi başlıkların önüne iki boş satır
koymak okunurluğu belirgin artırıyor.

**Gam kimliği artık açılır liste** (2026-09-29). Şarkı sayfasında başlığın
altında ✦ ile görünen mod adı bu alandan geliyor, "Ton modu"ndan değil.
İkisi farklı seviyeler: ton modu aileyi seçer (dört seçenek), gam kimliği o
ailenin içindeki modu seçer (aile başına yedi mod).

Boş bırakılabilir, çoğu zaman bırakılmalı; boşsa ton modunun varsayılanı
kullanılır: majör → `maj-ionian`, doğal minör → `nm-aeolian`, harmonik →
`hm-harmonic`, melodik → `mm-melodic`. Yalnız şarkı Dorian, Phrygian gibi özel
bir mod üzerineyse seçilir.

Alan veritabanında `text` kaldı. `select` alan tipine **bilerek** çevrilmedi:
`select` Postgres'te enum sütunu açar, kataloğa eklenen her mod migration
gerektirir ve asıl istenen "ton moduna göre daralan liste" enum ile zaten
yapılamaz. Panel girişi `payload/components/GamlarScaleIdField.tsx` özel
bileşeni; seçenekler `gamlarScaleOptionsForKeyMode` ile seçili aileden geliyor.

**Eskiden sessiz başarısızlık vardı:** serbest metne yanlış bir kimlik
yazıldığında uyarı çıkmıyor, sayfa varsayılana düşüyor ve "Phrygian yazdım"
sanılıyordu. Artık iki katman var. Yazma anında `realignGamlarScaleIdToKeyMode`
kısayolu (`phrygian` → `maj-phrygian`) ve aile uyumsuzluğunu (`maj-phrygian` +
doğal minör → `nm-phrygian`, aynı gamın öbür perspektifi) onarıyor. Onarılamayan
değeri alanın `validate`'i geçerli modları sayarak reddediyor.

**Telif kaynağı** otomatik doluyor, dokunmaya gerek yok.

**Popülerlik puanı yok.** Sıralama tıklamadan hesaplanıyor.

**Katkı bölümü (Contributions, Contributor Profiles, Song Contributors)**
şu an kullanılmıyor, üçü de boş. Dışarıdan şarkı gönderimi açılmadı; katkı
sayfası yalnız yöneticiye açık. İleride topluluk katkısı istenirse altyapı
hazır. Karar ertelendi (2026-09-29).

### 2026-09-29 — .com.tr sanatçıları çıkarıldı

`akorpro.com.tr` sitemap'inden 70 sanatçı çekildi; ad ve tür, sayfalardaki
yapısal veriden (`MusicGroup`) alındı, Türkçe karakterler korundu.

Dosya: `data/import/sanatcilar.csv` (ad + tür). Slug sütunu **bilerek yok**:
Payload adı slug'a kendi çeviriyor.

**Asıl taşıma migration ile yapıldı**, panelin içe aktarma eklentisiyle değil:
eklenti "Something went wrong" ile takıldı ve sunucu logunda karşılığı yoktu.
`20260929_090000_seed_artists` dosya yüklemeye, eklentiye ve kimlik bilgisine
ihtiyaç duymuyor, deploy'da kendiliğinden çalışıyor, sürüm kontrolünde duruyor.
`ON CONFLICT (slug) DO NOTHING` sayesinde tekrar çalışsa kopya üretmez.

Sitemap 70 satır veriyordu ama üç sanatçı iki kez geçiyor
(`riza-tamer`, `seksendort`, `umut-kaya`). Benzersiz sayı: **67**.

**Slug denetimi yapıldı — URL'ler korunmalı.** 70 addan 69'u bizim
üreticimizle birebir aynı slug'ı veriyordu. Bir tanesi tutmuyordu:

| Ad | .com.tr | Bizim (eski hâl) |
|---|---|---|
| İkilem & Tuğba | `ikilem-ve-tugba` | `ikilem-tugba` |

Eski site `&` işaretini "ve" olarak yazıyormuş. `slugify` buna göre
güncellendi ve test eklendi. Sonuç: **70/70 birebir aynı.**

Not: Directus dönemindeki Postgres `akorpro_slugify()` fonksiyonu `&`
işaretini düşürüyordu, yani o dönemki davranış Firebase dönemiyle zaten
ayrışmıştı. Gerçek URL'ler Firebase döneminden geldiği için o taraf esas alındı.

**Şarkılar çekilmedi** — yalnız sanatçılar istendi. Şarkı gövdesi `<pre>`
içinde ve boşluklar akor hizalamasını belirlediği için ayrı bir dikkat
gerektirir; istenirse sonra yapılır.

### 2026-09-30 — Deploy sonrası boş sayfa, yumuşak 404 ve ölü CI

**1. Deploy'dan sonra ilk ziyaretçi boş sayfa görüyordu.**

Belirti: ana sayfada üç blok da 0 gösteriyordu, site haritasında hiç şarkı
yoktu. Veri kaybı sanıldı; kayıp yoktu, üretim veritabanında 67 sanatçı ve
8 şarkı duruyordu.

Sebep: ana sayfa, akor kütüphanesi ve site haritası ISR ile derleme anında
üretiliyordu. Derleme GitHub Actions'a taşınınca veritabanı erişimi kalmadı,
okumalar boş döndü ve imaja BOŞ sayfalar gömüldü. Deploy'dan sonraki ilk
istek o boş kopyayı alıyor, yeniden üretimi yalnız arka planda tetikliyordu.
İlk istek Googlebot ise site haritasını boş görüyordu — daha önce incelenen
indeksleme sorununun bir parçası büyük olasılıkla bu.

Canlıda gözlendi: site haritası art arda iki istekte önce 0, sonra 8 şarkı
döndü (`x-nextjs-cache: STALE` sonra `HIT`).

Çözüm: üçü de `force-dynamic`. Şarkı sayfasında aynı sorun 29 Eylül'de böyle
çözülmüştü. Veri önbelleği kaybolmuyor, `unstable_cache` katmanı yerinde
duruyor; dinamik olan yalnız HTML üretimi.

Doğrulama: veritabanısız derleme (`DATABASE_URI` ölü adrese çevrilerek)
sıfır hatayla geçti ve rota tablosunda üçü de `ƒ` oldu. Veriye bağlı başka
statik sayfa kalmadı; `/sanatci/[slug]` SSG ama `generateStaticParams`
derlemede boş döndüğü için önceden üretilmiyor, ilk istekte canlı çiziliyor.

**2. Olmayan sayfalar 404 yerine 200 dönüyordu.**

`app/(site)/loading.tsx` bütün grubu örtük bir Suspense sınırına alıyordu.
Next yedek arayüzü çizer çizmez yanıtı akıtmaya başlıyor, 200 gönderilmiş
oluyor ve sonradan `notFound()` çalışsa bile durum kodu değişemiyor. İçerik
doğruydu ama HTTP 200'dü — Google'ın "yumuşak 404" dediği durum.

Çözüm: `app/(site)/loading.tsx` silindi. Gerekçe `not-found.tsx` başına
yazıldı ki geri eklenmesin. Sayfalar zaten hızlı (sanatçı sayfası ~30 ms) ve
şarkı sayfasının kendi `<Suspense>`'i var, o da var oluş kontrolünden sonra
geldiği için durum kodunu bozmuyor.

Ölçüm: olmayan şarkı ve sanatçı 404, var olan şarkı ve sanatçı 200.

**3. `ci.yml` hiç çalışmamıştı.**

`main` dalında tetikleniyordu, böyle bir dal hiç olmadı; yalnız `master` var.
Tetikleyici `master` ve `feature/**` dallarına çevrildi.

Firebase'e bağlı her şey silindi: emülatörlü entegrasyon testi, E2E,
Lighthouse ve smoke adımları. Proje Payload + Postgres'e geçtiğinden hepsi
ölü koddu. İmaj derlemesi de çıkarıldı, o iş `deploy.yml`de.

Kalan: lint, `tsc --noEmit`, birim testleri ve bilgi amaçlı `npm audit`.

**Lint'i yeşile çekmek gerekti.** 20 hata birikmişti, öyle bırakılsa CI ilk
günden kırmızı olurdu. `prefer-const` ikilisi düzeltildi.
`react/no-unescaped-entities` kapatıldı: Türkçe metin kesme işaretiyle dolu
("5'li Çember", "Payload'ın"), kural tamamen biçimsel.
`react-hooks/set-state-in-effect` uyarıya düşürüldü, kapatılmadı — yakaladığı
yedi yer de bilinçli istemci deseni (yol değişince menü kapatma, çerez
okuma, hidrasyon bayrağı), ama gözden kaçmasın diye uyarı olarak duruyor.

Sonuç: 0 hata, 22 uyarı. Testler 172/172.

### 2026-09-30 — İkonlar bazen köşeli görünüyordu

Belirti: logo ve sekme ikonu kare çıkıyor, üst üste birkaç hard refresh
sonunda düzeliyordu. İki ayrı kusur üst üste binmiş.

**1. Masaüstü başlık tek başına farklı bir dosya kullanıyordu.**
`site-navbar.tsx` masaüstü satırında `/assets/logo/akorpro_ap_logo.svg`
vardı; mobil satır, footer, favicon ve manifest ise `/icons/icon.svg`
kullanıyor. 29 Eylül'de köşe yarıçapı %22'den %35'e (rx 150 → 240)
çıkarılırken `assets/logo` altındaki kopya atlanmış. Yani masaüstü rozeti
kalıcı olarak diğer her yerden daha köşeliydi.

Çözüm: masaüstü de `/icons/icon.svg` kullanıyor. Artık bütün yüzeyler tek
dosyadan besleniyor, bir daha ayrışamaz. `public/assets/logo/` klasörüne
hiçbir yerden referans kalmadı; dışarıdan bağlanmış olabileceği için
silinmedi, kullanılmıyor.

**2. Service worker görselleri sonsuza kadar saklıyordu.**
`public/sw.js` görseller için CacheFirst kullanıyordu ve hiçbir son kullanma
tarihi yoktu — yorumda "7 gün" yazıyordu ama kodda karşılığı yoktu. Üstelik
`CACHE_NAME` sabit `akorpro-v1` idi ve hiç artırılmamıştı. `activate` eski
adı taşıyan önbellekleri siliyor, yani sürüm hiç değişmeyince hiçbir şey
temizlenmiyordu. Bir kez saklanan ikon ömür boyu servis ediliyordu; hard
refresh ara sıra service worker'ı atlattığı için "birkaç denemede düzeliyor"
davranışı buradan geliyordu.

Çözüm:
- `CACHE_VERSION` eklendi (`v2-2026-09-30`). Sürüm artışı kullanıcıdaki eski
  dosyaları temizlemenin tek garantili yolu; dosyanın başına bunu hatırlatan
  bir not yazıldı.
- Görseller StaleWhileRevalidate oldu: önbellekten anında veriliyor, arka
  planda tazeleniyor. Değişen bir varlık en geç bir sonraki ziyarette geliyor.
- Arka plan tazelemesi `event.waitUntil` ile sarıldı; yoksa yanıt dönünce
  tarayıcı worker'ı uyutup güncellemeyi yarıda kesebiliyor.
- Ölü Firebase/analytics koşulları silindi (zaten hepsi çapraz kaynak,
  `origin` kontrolü kapsıyor). `/admin` ve `/payload-api/` önbelleğe hiç
  girmiyor.

**Yan düzeltme:** `globals.css` içindeki `prefers-reduced-data` kuralı
`img:not([loading="eager"])` olan her görseli gizliyor. Üç logo da bu
niteliğe sahip değildi, yani veri tasarrufu açık bir kullanıcıda logo hiç
görünmüyordu. Üçüne de `loading="eager"` eklendi — toplam 445 bayt.
