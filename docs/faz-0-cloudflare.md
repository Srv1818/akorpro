# Altyapı runbook — Cloudflare + Coolify

> Durum (2026-08-31): `akorpro.com` (staging) yayında, Directus ve uygulama çalışıyor.
> `akorpro.com.tr` hâlâ Vercel'de, dokunulmadı.

## Gerçekleşen mimari

```
Cloudflare (DNS + CDN + WAF + R2)
   │  proxy'li A kaydı → VPS:443
   ▼
Contabo VPS (158.220.96.32) — Coolify
   ├── coolify-proxy (Traefik)  → TLS sonlandırma, hostname yönlendirme
   ├── akorpro-web              → Next.js       → akorpro.com
   ├── directus                 → API + admin   → admin.akorpro.com
   ├── postgres + redis         → Directus'un veri katmanı
   └── (başka projelerin konteynerleri — VPS paylaşımlı)
```

### Cloudflare Tunnel neden kullanılmıyor

Planın ilk hali "VPS'te port açılmaz, her şey Tunnel'dan geçer" diyordu. Bu karar
**tek amaçlı VPS** varsayımına dayanıyordu ve gerçekle uyuşmadı:

- VPS paylaşımlı — üzerinde kadrokurs, sporsek, faceji gibi başka projeler çalışıyor
  ve hepsi 80/443'ten Traefik'e giriyor. O portları kapatmak o siteleri düşürürdü.
- Dolayısıyla Tunnel'ın tek gerekçesi (açık port bırakmamak) ortadan kalkıyor;
  geriye yalnız fazladan bir katman ve fazladan bir arıza noktası kalıyor.
- Sunucu zaten çalışan bir düzene sahip: Cloudflare proxy → 443 → Traefik.
  akorpro da aynı düzeni kullanıyor.

**2026-08-31'de kurulan Tunnel, Access uygulaması ve ilgili firewall kuralları
geri alındı.** Origin IP'yi gizleme hedefi bırakıldı; bunun yerine (istenirse)
80/443'ü yalnız Cloudflare IP aralıklarına açmak sonraya bırakıldı.

---

## Blok A — `akorpro.com` zone'u ✅ TAMAM (2026-08-20)

- [x] Cloudflare hesabı + 2FA
- [x] `akorpro.com` eklendi (Free plan)
- [x] Bağlanma ekranında Search / Agent / Training → **Block** (staging indekslenmemeli)
- [x] Nameserver'lar registrar'da (METUnic) Cloudflare'e çevrildi
- [x] Doğrulandı: `louis.ns.cloudflare.com` + `maxine.ns.cloudflare.com`

> 📌 **Ölçülen gerçek:** TLD seviyesindeki NS TTL'i **172800 sn = 48 saat** ve bizim
> kontrolümüzde değil. Planın "NS taşımasını kesimden ayır" kararının somut gerekçesi bu:
> NS'i kesime bindirseydik rollback 48 saate kadar sürerdi. Ayrı yaptığımız için kesim
> tek bir A kaydı düzenlemesine iniyor. Aynı 48 saat `.com.tr` için de geçerli.

---

## Blok B — R2 ✅ TAMAM

- [x] Bucket: `akorpro-media`
- [x] S3 API token (Object Read & Write, yalnız bu bucket'a scope'lu)
- [x] Directus env'leri girildi:

```
STORAGE_LOCATIONS=r2
STORAGE_R2_DRIVER=s3
STORAGE_R2_KEY / STORAGE_R2_SECRET
STORAGE_R2_BUCKET=akorpro-media
STORAGE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_R2_REGION=auto
STORAGE_R2_FORCE_PATH_STYLE=true
```

> `REGION=auto` ve `FORCE_PATH_STYLE=true` R2 için zorunlu — S3 varsayılanlarıyla çalışmaz.

**Turnstile henüz kurulmadı.** Yazma uçları (katkı formu, telif bildirimi) giriş
gerektirdiği için acil değil; anonim yazma ucu yok.

---

## Blok C — Directus servisi ✅ TAMAM

- [x] Coolify → `Akorpro` projesi → **Directus With Postgresql** şablonu
      (Directus 11 + postgis/postgres 16 + redis 7)
- [x] Domain: `https://admin.akorpro.com:8055` (Coolify formatı; dışarıya 443)
- [x] Cloudflare'de `admin` A kaydı → `158.220.96.32`
- [x] Şema ve roller script'ten kuruldu:
      `npm run directus:schema` · `npm run directus:roles`

> **Sertifika sırası önemli:** A kaydı önce **DNS-only** bırakıldı, Traefik
> Let's Encrypt sertifikasını aldı, sonra proxy açıldı. Ters sırada HTTP-01
> doğrulaması takılabiliyor.

---

## Blok D — Google SSO ✅ TAMAM

- [x] Google Cloud → OAuth client (Web application), redirect URI:
      `https://admin.akorpro.com/auth/login/google/callback`
- [x] Directus env'leri: `AUTH_PROVIDERS=google`, `AUTH_GOOGLE_DRIVER=openid`,
      client id/secret, `AUTH_GOOGLE_MODE=session`,
      `AUTH_GOOGLE_DEFAULT_ROLE_ID=<Contributor>`,
      `AUTH_GOOGLE_REDIRECT_ALLOW_LIST=https://akorpro.com,https://akorpro.com/`
- [x] `SESSION_COOKIE_DOMAIN=.akorpro.com`

### Yaşanan iki tuzak (tekrarlanmasın)

1. **`INVALID_CREDENTIALS` — mevcut hesap `provider: default`'tu.** Directus SSO
   kullanıcıyı `provider` + `external_identifier` ile arar; parolayla açılmış hesabı
   bulamayıp yeni kayıt açmaya çalışır, e-posta çakışır. Çözüm: hesabın
   `provider`'ını `google`, `external_identifier`'ını e-posta yapmak.
2. **Provider değişince tarayıcıdaki oturum çerezi anında geçersizleşiyor** ama
   tarayıcı göndermeye devam ediyor → *her* istek 401. Belirti: giriş ekranı bile
   açılmıyor. Teşhis: `fetch('/server/info', {credentials:'omit'})` 200 dönerken
   `'include'` 401 dönüyorsa çerez bayattır. Çözüm: çerezi silmek (gizli pencere).
   Directus'un `/auth/logout`'u bu durumda çalışmaz — geçersiz oturumu çıkaramıyor.

---

## Blok E — Uygulama servisi ✅ TAMAM

- [x] Coolify → `akorpro-web`, GitHub App ile `Srv1818/akorpro`,
      branch `feature/directus-migration`, Nixpacks, port 3000
- [x] Domain `https://akorpro.com`, Cloudflare'de apex A kaydı (DNS-only → proxy'li)
- [x] Env: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DIRECTUS_URL`, `DIRECTUS_URL`,
      `DIRECTUS_TOKEN` (Directus'ta `AkorPro App` kullanıcısı, **Publisher** rolü)

> Uygulama admin token'ı kullanmıyor. `Publisher` rolü içerik okuyup yazabiliyor ama
> kullanıcı/rol tarafına dokunamıyor.

**Açık:** `www.akorpro.com` 503 dönüyor — Coolify'ın Domains alanına ikinci hostname
eklenmesi gerekiyor. Staging indekslemeye kapalı olduğu için aciliyeti yok.

---

## Staging koruması

`app/robots.ts` host'a bakıyor: `NEXT_PUBLIC_SITE_URL` `akorpro.com.tr` ile bitmiyorsa
ortam staging sayılıp **tamamen indekslemeye kapatılıyor** (`Disallow: /`).

Gerekçe: staging canlının birebir kopyası. İndekslenirse `.com.tr` ile duplicate
content çakışması doğar ve korumaya çalıştığımız sıralamalara zarar verir.
Kesimde `NEXT_PUBLIC_SITE_URL` `.com.tr` olunca koruma kendiliğinden kalkar.

---

## Blok F — `akorpro.com.tr` zone'u ⬜ YAPILMADI

Bu blok **siteyi taşımaz.** Cloudflare aynı kayıtları servis etmeye başlar, apex hâlâ
Vercel'i gösterir. Ziyaretçi açısından hiçbir değişiklik olmaz.

- [ ] Cloudflare'e `akorpro.com.tr` ekle. Bu zone indekslenmeli → **Search = Allow**
      (staging'in tersi). "Block training in robots.txt" **kapalı** — `app/robots.ts` tek kaynak.
- [ ] ⚠️ Otomatik tarama sonucuna güvenme, aşağıdaki tabloyla birebir karşılaştır:

| Tip | Ad | Değer | Proxy |
|---|---|---|---|
| A | `@` | `216.198.79.1` | **DNS only** |
| CNAME | `www` | `e3d3d21bd769d68b.vercel-dns-017.com` | **DNS only** |
| MX 10 | `@` | `mt-spamexperts.guzel.net.tr` | — |
| MX 20 | `@` | `ni-spamexperts.guzel.net.tr` | — |
| MX 30 | `@` | `pmg.guzel.net.tr` | — |
| MX 40 | `@` | `pmg2.guzel.net.tr` | — |
| TXT | `@` | `v=spf1 a mx include:relay.guzelhosting.com ~all` | — |
| TXT | `@` | `google-site-verification=TDDdB2nn7YzUQ0hao3DByhV7ZPQmHumbf7yH0CLIcQQ` | — |

> ⚠️ Tablodaki **tek kritik kayıt `google-site-verification` TXT'i.** Kaybedilirse GSC
> doğrulaması düşebilir — bu planın tamamen dayandığı Search Console erişimi.

- [ ] **NS değişiminden ÖNCE** Cloudflare NS'lerine doğrudan sorarak doğrula:
```bash
CFNS=<cloudflare-ns-1>
dig @$CFNS akorpro.com.tr A     +short
dig @$CFNS akorpro.com.tr MX    +short
dig @$CFNS akorpro.com.tr TXT   +short
dig @$CFNS www.akorpro.com.tr CNAME +short
```
- [ ] Ancak bundan sonra registrar'da NS'leri değiştir.

---

## Kesim kontrol listesi ⬜

Kesimden ≥24 saat önce:
- [ ] `akorpro.com.tr` apex A kaydının **TTL'ini 300 sn**'ye düşür (hızlı rollback için)

Kesim günü:
- [ ] `NEXT_PUBLIC_SITE_URL` → `https://akorpro.com.tr` (robots koruması otomatik kalkar)
- [ ] Coolify → `akorpro-web` Domains'e `https://akorpro.com.tr` ekle
- [ ] `akorpro.com.tr` apex A kaydı → `158.220.96.32`
- [ ] **Directus'a `admin.akorpro.com.tr` hostname'i ekle ve
      `SESSION_COOKIE_DOMAIN=.akorpro.com.tr` yap.** Oturum çerezi uygulama ile
      Directus'un aynı üst alan adı altında olmasını gerektiriyor; bu yapılmazsa
      kesimden sonra kimse giriş yapamaz. (bkz. `lib/auth/constants.ts`)
- [ ] Google OAuth client'a `https://admin.akorpro.com.tr/auth/login/google/callback`
      redirect URI'ını ekle; `AUTH_GOOGLE_REDIRECT_ALLOW_LIST`'e `.com.tr` adreslerini ekle
- [ ] Google consent screen **Testing → Published** (aksi halde yalnız test
      kullanıcıları giriş yapabilir)
- [ ] `node scripts/verify-urls.mjs` — 35/35 geçmeli
- [ ] GSC'de doğrulamanın hâlâ geçerli olduğunu kontrol et

Kesimden sonra:
- [ ] `akorpro.com` → `akorpro.com.tr` 301 (marka koruması; tersi değil)

---

## Sonraya bırakılanlar (bilerek)

| İş | Ne zaman | Neden |
|---|---|---|
| **WAF + Rate limiting** | İçerik girildikten sonra | Kurallar gerçek uçlara yazılır |
| **80/443'ü Cloudflare IP'lerine kısıtlama** | İstenirse | Origin'e doğrudan bağlanmayı kapatır; VPS paylaşımlı olduğu için tüm projeleri etkiler |
| **Turnstile** | Anonim yazma ucu açılırsa | Şu an yazma uçları giriş istiyor |
| **Email Routing** | Gerekirse | Mail kapalı; SMTP bilinçli olarak kurulmadı |
| **`www` hostname'i** | Kesimde | Staging'de kimse www'den gelmiyor |
