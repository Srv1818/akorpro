# Firestore veri modeli (Faz 3)

Tek kaynak: `docs/ARCHITECTURE.md` ile uyumlu. Şema genişletilebilir; `schemaVersion` / `updatedAt` alanları önerilir.

## Güvenlik kuralları

- Kaynak: `firestore.rules`.
- `users/{uid}/playlists/{playlistId}` ve `.../items/{itemId}` ile `users/{uid}/songOverrides/{songId}`: **yalnızca** `request.auth.uid == uid` veya `request.auth.token.admin == true`.
- Üst `users/{uid}` kök dokümanı: şimdilik `allow read, write: if false`.
- Diğer tüm yollar: kapalı (`/{document=**}`).

## Uygulama bağlantısı (çalma listeleri)

- İstemci: girişten sonra Firebase Auth oturumu açıkken Firestore SDK ile CRUD (`components/playlists/playlists-manager.tsx`).
- HTTP-only `akorpro_session` middleware’i korur; Firestore kuralları için tarayıcıda Firebase oturumu da gerekir (aynı Google girişi).
- Sunucu: `lib/firebase/admin.ts` içinde `getAdminFirestore()` — toplu işlemler / seed / ileride Server Action.

## Yerel emulator + seed

- `firebase.json` → `emulators` (Auth 9099, Firestore 8080, UI 4000).
- `npm run emulators` — Firebase CLI gerekir (`npm i -D firebase-tools` veya global `firebase`).
- İstemci emulator: `.env.local` içinde `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1` (ve isteğe bağlı `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`, `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST`, `NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT`).
- `npm run seed:firestore` — `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` ile veya production service account ile çalışır; `AKORPRO_SEED_UID` ile hedef kullanıcı id’si değiştirilebilir.

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

`firestore.indexes.json`: şu an boş; mevcut liste sorguları tek alan `orderBy` kullanır (Firestore otomatik tek alan indeksi). Keşfet / tüm şarkılar / birleşik filtreler eklendikçe bileşik indeksler buraya yazılacak.

CI’da emulator testi: Faz 11 ile hizalanır.
