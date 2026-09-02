# Nerede kaldık

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
- Coolify: `directus` servisi (Directus 11 + Postgres + Redis), `akorpro-web` (Nixpacks)
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
