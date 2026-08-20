# Faz 0.3 — Cloudflare kurulum runbook

> Uygulama sırası önemli. Her blok sonunda **DUR** ve doğrulama komutlarını çalıştır.
> Bloklar arası geçmeden önce doğrulamanın yeşil olması gerekir.
>
> Durum (2026-08-20): VPS ✅ · Coolify ✅ · Cloudflare ⬜ (hiç dokunulmadı)
>
> Temel ilke: **önce `akorpro.com` (staging, sıfır risk), sonra `akorpro.com.tr` (canlı).**
> Böylece Cloudflare'i canlı domainde değil, kaybedecek hiçbir şeyi olmayan domainde öğreniyoruz.

---

## Blok A — Cloudflare hesabı + `akorpro.com` zone'u

`akorpro.com` şu an hiçbir nameserver'a delege değil (NS/SOA boş, doğrulandı).
Taşınacak kayıt yok → bu blokta kırılabilecek bir şey yok.

- [ ] Cloudflare hesabı aç (varsa atla). Free plan bu iş için yeterli.
- [ ] **Hesapta 2FA'yı aç.** Tüm altyapının DNS'i buraya bağlanacak.
- [ ] `akorpro.com` domainini ekle → Free plan seç.
- [ ] **"Connect your domain" ekranındaki ayarlar** — Cloudflare'in "Recommended" değerleri
      indekslenmesi *istenen* bir site varsayar; staging için yanlış:

      | Ayar | CF önerisi | Seç |
      |---|---|---|
      | Search | Allow | **Block** |
      | Agent | Allow | **Block** |
      | Training | Block on pages with ads | **Block** (tam) |
      | Block training in robots.txt | Kapalı | **Kapalı bırak** |
      | Import DNS records | Automatic | Automatic (kayıt yok, tarama boş döner) |

      - Search/Agent/Training → Block: staging asla indekslenmemeli. Asıl koruma Access (Blok D),
        bu ikinci katman. "Block on pages with ads" sitede reklam olmadığı için hiçbir şeyi engellemez.
      - robots.txt toggle'ı **kapalı**: uygulama `robots.txt`'i kendisi üretiyor (`app/robots.ts`).
        Cloudflare de yazarsa iki kaynak olur. Kontrol uygulamada kalsın.
      - Hepsi sonradan dashboard'dan değiştirilebilir.
- [ ] Cloudflare'in verdiği iki nameserver'ı not et (`xxx.ns.cloudflare.com`).
- [ ] `akorpro.com`'un registrar'ında nameserver'ları bunlarla değiştir.
- [ ] Zone'da **hiçbir A/CNAME kaydı ekleme** — Tunnel bunu kendisi yazacak (Blok C).

**DUR — doğrula:**
```bash
dig +short NS akorpro.com @1.1.1.1     # cloudflare.com NS'leri dönmeli
```
Boş dönerse yayılma sürüyor demektir; registrar'a göre birkaç saat alabilir.

---

## Blok B — R2 + Turnstile (bağımsız, Tunnel'dan önce yapılabilir)

- [ ] **R2**: bucket oluştur (ör. `akorpro-media`).
- [ ] R2 → **S3 API token** üret. Kaydet: `access key id`, `secret access key`,
      `endpoint` (`https://<account-id>.r2.cloudflarestorage.com`), bucket adı.
      Bunlar Directus storage adapter'ına girecek (Faz 0.4).
- [ ] **Turnstile**: yeni site oluştur. Hostname olarak hem `akorpro.com` hem
      `akorpro.com.tr` ekle (kesimden sonra ikincisi kullanılacak).
      Kaydet: `site key` (public), `secret key`.

> Not: Bu anahtarlar Coolify'da env olarak saklanacak, repoya girmeyecek.

---

## Blok C — Cloudflare Tunnel

VPS'te 80/443 dışarı **açılmaz**; tüm trafik Tunnel üzerinden gelir.

- [ ] Cloudflare → Zero Trust → Networks → Tunnels → yeni tunnel oluştur.
- [ ] Tunnel token'ını al.
- [ ] Coolify'da `cloudflared` container'ını bu token ile çalıştır.
- [ ] Public hostname'leri bağla:

| Hostname | Hedef (Coolify iç servis) | Not |
|---|---|---|
| `akorpro.com` | `next-app:3000` | staging uygulama |
| `directus.akorpro.com` | `directus:8055` | Directus API + admin UI |
| `coolify.akorpro.com` | Coolify paneli | panel şu an public ise buraya alınır |

- [ ] Tunnel çalıştıktan sonra VPS firewall'da **80/443'ü dışarıya kapat**
      (ufw: yalnız SSH açık kalsın).

**DUR — doğrula:** Hostname'ler cevap veriyor mu, ve VPS IP'sine doğrudan
80/443 erişimi kapalı mı?

---

## Blok D — Cloudflare Access (⚠️ atlanmamalı)

Staging, production'ın birebir kopyası olacak. Açık bırakılırsa Google indeksler
ve `.com.tr` ile **duplicate content** çakışması doğar — yani korumak istediğimiz
sıralamalara zarar verir. `robots.txt` yeterli değil; bot içeriğe hiç ulaşmamalı.

- [ ] Zero Trust → Access → Application ekle: `akorpro.com` (ve `*.akorpro.com`).
- [ ] Policy: yalnız iki kişinin e-posta adresi (Allow → Emails).
- [ ] Aynı korumayı `coolify.akorpro.com` ve `directus.akorpro.com` için de uygula.
- [ ] **Service token** üret — `scripts/verify-urls.mjs`'in staging'i kontrol
      edebilmesi için gerekecek (Faz 5.1, doğrulama adımı 1).

**DUR — doğrula:** Gizli sekmede `akorpro.com` → Access giriş ekranı gelmeli, içerik gelmemeli.

> Access, ancak kesim tamamlanıp `.com → .com.tr` 301 kuralı eklendikten sonra kaldırılır.

---

## Blok E — `akorpro.com.tr` zone'u (canlı domain — dikkatli)

Bu blok **siteyi taşımaz.** Cloudflare aynı kayıtları servis etmeye başlar,
apex hâlâ Vercel'i gösterir. Ziyaretçi açısından hiçbir değişiklik olmaz.

Neden şimdi, kesimde değil: `.com.tr` delegasyonu nic.tr/metunic üzerinden değişiyor,
TLD seviyesinde yavaş yayılıyor ve TTL bizde değil. Kesime bindirilirse rollback
"NS yayılmasını bekle" olur. Ayrı yapılırsa kesim tek bir A kaydı düzenlemesine iner.

- [ ] Cloudflare'e `akorpro.com.tr` ekle. Bu zone canlı ve indekslenmesi **isteniyor** →
      Search/Agent ayarları staging'in tersi: **Search = Allow**. Training için karar
      ayrıca verilir (içerik bu sitenin değeri; aceleye gerek yok, sonradan değiştirilebilir).
      "Block training in robots.txt" yine **kapalı** — `app/robots.ts` tek kaynak.
- [ ] ⚠️ Otomatik tarama kayıtları çekecek — **tarama sonucuna güvenme**,
      aşağıdaki tabloyla birebir karşılaştır (özellikle `google-site-verification` TXT'i):

| Tip | Ad | Değer | Proxy |
|---|---|---|---|
| A | `@` | `216.198.79.1` | **DNS only (gri)** |
| CNAME | `www` | `e3d3d21bd769d68b.vercel-dns-017.com` | **DNS only (gri)** |
| MX 10 | `@` | `mt-spamexperts.guzel.net.tr` | — |
| MX 20 | `@` | `ni-spamexperts.guzel.net.tr` | — |
| MX 30 | `@` | `pmg.guzel.net.tr` | — |
| MX 40 | `@` | `pmg2.guzel.net.tr` | — |
| TXT | `@` | `v=spf1 a mx include:relay.guzelhosting.com ~all` | — |
| TXT | `@` | `google-site-verification=TDDdB2nn7YzUQ0hao3DByhV7ZPQmHumbf7yH0CLIcQQ` | — |

- [ ] **Her kayıt DNS-only (gri bulut).** Proxy açma — davranış birebir korunmalı.
- [ ] Wildcard kaydı **ekleme** (canlıda yok, doğrulandı). `_dmarc` de yok.

> ⚠️ Tablodaki **tek kritik kayıt `google-site-verification` TXT'i.** Kaybedilirse GSC
> doğrulaması düşebilir — bu planın tamamen dayandığı Search Console erişimi.
> MX/SPF düşük riskli: posta kutusu şu an aktif değil (Email Routing sonra kurulacak).

- [ ] **NS değişiminden ÖNCE** Cloudflare NS'lerine doğrudan sorarak kayıtları doğrula:
```bash
CFNS=<cloudflare-ns-1>
dig @$CFNS akorpro.com.tr A     +short
dig @$CFNS akorpro.com.tr MX    +short
dig @$CFNS akorpro.com.tr TXT   +short
dig @$CFNS www.akorpro.com.tr CNAME +short
```
Çıktılar yukarıdaki tabloyla **birebir** eşleşmeli. Eşleşmiyorsa NS'i değiştirme.

- [ ] Ancak bundan sonra: registrar'da (Güzel Hosting / nic.tr) nameserver'ları
      Cloudflare'inkilerle değiştir. Mevcut: `ns1.metunic.com.tr`, `ns2.metunic.com.tr`.

**DUR — doğrula (NS değişiminden sonra):**
```bash
dig +short NS akorpro.com.tr @1.1.1.1      # cloudflare NS'leri
curl -sI https://akorpro.com.tr | head -1  # 200, site normal
node scripts/verify-urls.mjs               # 35/35 geçmeli — regresyon kontrolü
```
- [ ] GSC'de doğrulamanın hâlâ geçerli olduğunu kontrol et.

---

## Blok F — Kesim hazırlığı (kesimden ≥24 saat önce)

- [ ] `akorpro.com.tr` apex A kaydının **TTL'ini 300 sn**'ye düşür.
      (Şu anki TTL ~1620 sn.) Hızlı rollback için şart.

---

## Sonraya bırakılanlar (bilerek)

| İş | Ne zaman | Neden |
|---|---|---|
| **WAF + Rate limiting** | Uygulama deploy olduktan sonra | Kurallar gerçek uçlara (`/api/contributions`, `/api/takedown`, `/directus/*`) yazılır; ortada uygulama yokken yazılamaz |
| **Email Routing** | NS taşındıktan sonra, ayrı adım | Mail kapalı, acil değil. Devreye alırken eski MX + SPF temizlenir |
| **`.com` → `.com.tr` 301** | Kesimden **sonra** | Staging o hostname üzerinde çalışıyor; önce eklenirse staging'i kırar |
| **Access kaldırma** | 301 kuralı eklendikten sonra | Sıra: kesim → 301 → Access kaldır |

---

## Bu blok bitince sıradaki

**Faz 0.4 — Coolify servisleri**: MariaDB (persistent volume + günlük yedek → R2),
Directus (Google SSO + R2 storage + MariaDB env'leri), next-app (Nixpacks build).
