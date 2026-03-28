# Firestore veri modeli (Faz 3 — taslak)

Tek kaynak: `docs/ARCHITECTURE.md` ile uyumlu. Şema genişletilebilir; `schemaVersion` / `updatedAt` alanları önerilir.

## Admin

- **Custom claim**: `admin` (boolean) — istemci e-postasına güvenilmez; kurallar ve sunucu `request.auth.token.admin == true` ile kontrol eder.
- **Yazım**: Yalnızca admin — şarkı künyesi, akor kütüphanesi, keşfet feed alanları (popüler / yeni / editör seçimi) vb.

## Koleksiyonlar (üst seviye)

| Alan | Açıklama |
|------|----------|
| Şarkılar / sanatçılar | Kanonik içerik; sunucu/RSC okuma; yazım admin. |
| Katkı / moderasyon | Katkı akışı ve durum alanları (Faz 6 ile detay). |
| Keşfet | Popüler, yeni, editör seçimi için ayrı sorgular veya alt koleksiyonlar. |
| Akor kütüphanesi | Admin yazımı dokümanlar. |
| Gamlar | İsteğe bağlı koleksiyon veya statik JSON + build. |

### Şarkı künyesi (örnek admin alanları)

`originalKey`, `tempo` (BPM veya metin), `timeSignature`, `tuning`, `capo`, `difficulty`, `genre`, `contributorIds`, `moderationStatus`, `copyrightSource`, …

## Kullanıcı alt koleksiyonları

- `users/{uid}/songOverrides/{songId}` — `transposeSemitones`, isteğe bağlı `selectedScaleId`, `circleMode`, `fontSize`, `scrollSpeed`, `updatedAt`, `songId`.
- `users/{uid}/playlists/{playlistId}` ve `users/{uid}/playlists/{playlistId}/items/{itemId}` — `order`, `songId`, isteğe bağlı slug denormalizasyonu; öğede **snapshot** (transpose vb.) veya `overrideRef` — ürün kuralı tek dokümanda netleştirilmeli.

### Okuma sırası (tercih katmanı)

Playlist öğesi: **snapshot → songOverrides → sunucu varsayılanı**.

## İndeksler

`firestore.indexes.json`: sanatçı + popülerlik; keşfet sorguları; tüm şarkılar (harf, sanatçı, ton, zorluk); playlist (kullanıcı scope); `songOverrides` çoğu durumda `uid` + `songId` doğrudan okuma.

## Yerel geliştirme

Firebase Emulator (Auth + Firestore + isteğe bağlı Storage) + seed script; CI entegrasyonu Faz 11 ile hizalanır.
