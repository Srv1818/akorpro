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

### Otomatik deploy kuruldu (2026-09-29)

`feature/payload-migration` dalına push → GitHub Actions imajı derler →
GHCR'a yükler → Coolify webhook ile tetiklenir → yeni sürüm yayına girer.
Coolify'da düğmeye basmak gerekmiyor.

| Tanım | Yer | Değer |
|---|---|---|
| `COOLIFY_WEBHOOK_URL` | Repo değişkeni | Coolify deploy webhook adresi |
| `COOLIFY_TOKEN` | Repo sırrı | Coolify API token'ı |

Token yetkileri: **Deploy + Read**. Önce yalnız Deploy verilmişti ve webhook
**403** döndü; Coolify'ın deploy akışı okuma yetkisini de istiyor
(bkz. coolify.io/docs/api-reference/authorization). Root ve Write verilmedi.

Süresi **1 yıl** (varsayılan 30 gündü — dolduğunda otomatik deploy sessizce
durur, bu yüzden uzatıldı). Yenileme tarihi: 2027-09-29.

Adres gizli değil, o yüzden sır değil değişken; token olmadan işe yaramıyor.
