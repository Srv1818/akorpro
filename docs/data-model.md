# Firestore veri modeli (Faz 3 — tamamlandı)

Tek kaynak: `docs/ARCHITECTURE.md` ile uyumlu. Şema genişletilebilir; `schemaVersion` / `updatedAt` alanları zorunlu.

## Koleksiyonlar

### `songs/{songId}` — Şarkılar

| Alan | Tip | Açıklama |
|------|-----|----------|
| `title` | string | Şarkı başlığı |
| `slug` | string | URL-friendly slug |
| `artistId` | string | `artists` koleksiyonundaki referans |
| `artistSlug` | string | Sanatçı slug (denormalize) |
| `artistName` | string | Sanatçı adı (denormalize) |
| `chordBody` | string | Sunucu HTML — akor + söz gövdesi |
| `originalKey` | string | Orijinal ton (ör. "Am", "Em") |
| `difficulty` | "kolay" \| "orta" \| "zor" | Zorluk seviyesi |
| `genre` | string | Tür (Rock, Pop, Alternatif vb.) |
| `tempo` | number \| string | BPM veya metin ("Andante") — isteğe bağlı |
| `timeSignature` | string | Ölçü ("4/4", "3/4") — isteğe bağlı |
| `tuning` | string | Akort ("Standard", "Drop D") — isteğe bağlı |
| `capo` | number | 0 = kapo yok; pozitif tam sayı — isteğe bağlı |
| `contributorIds` | string[] | Katkıcı UID'leri — isteğe bağlı |
| `moderationStatus` | "draft" \| "pending" \| "approved" \| "rejected" | Moderasyon durumu |
| `copyrightSource` | string | Telif/kaynak notu — isteğe bağlı |
| `popularity` | number | Popülerlik skoru (indeks için) — isteğe bağlı |
| `schemaVersion` | number | Şema versiyonu |
| `createdAt` | Timestamp | Oluşturulma tarihi |
| `updatedAt` | Timestamp | Son güncelleme |

### `artists/{artistId}` — Sanatçılar

| Alan | Tip | Açıklama |
|------|-----|----------|
| `name` | string | Sanatçı adı |
| `slug` | string | URL-friendly slug |
| `imageUrl` | string | Profil görseli URL — isteğe bağlı |
| `genre` | string | Ana tür — isteğe bağlı |
| `songCount` | number | Toplam şarkı sayısı (denormalize) |
| `popularity` | number | Popülerlik skoru — isteğe bağlı |
| `schemaVersion` | number | Şema versiyonu |
| `createdAt` | Timestamp | Oluşturulma tarihi |
| `updatedAt` | Timestamp | Son güncelleme |

### `discover/{section}` — Keşfet bölümleri

Section: `"popular"` | `"new"` | `"featured"`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `songIds` | string[] | Sıralı şarkı ID listesi |
| `updatedAt` | Timestamp | Son güncelleme |

## Kullanıcı alt koleksiyonları

### `users/{uid}/songOverrides/{songId}`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `songId` | string | Şarkı referansı |
| `transposeSemitones` | number | Transpoze yarım ton |
| `schemaVersion` | number | — isteğe bağlı |
| `updatedAt` | Timestamp | Son güncelleme — isteğe bağlı |

### `users/{uid}/playlists/{playlistId}`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `name` | string | Liste adı |
| `schemaVersion` | number | Şema versiyonu |
| `createdAt` | Timestamp | Oluşturulma |
| `updatedAt` | Timestamp | Son güncelleme |

### `users/{uid}/playlists/{playlistId}/items/{itemId}`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `order` | number | Sıralama |
| `songId` | string | Şarkı referansı |
| `title` | string | Şarkı başlığı (snapshot) |
| `artistSlug` | string | Sanatçı slug (snapshot) |
| `songSlug` | string | Şarkı slug (snapshot) |
| `transposeSemitones` | number | Anlık transpoze — isteğe bağlı |
| `createdAt` | Timestamp | Oluşturulma |

### Okuma sırası (tercih katmanı)

Playlist öğesi: **snapshot → songOverrides → sunucu varsayılanı**.

## Güvenlik kuralları

Kaynak: `firestore.rules`.

- `songs`, `artists`, `discover`: **herkes okur; yalnızca admin yazar** (`request.auth.token.admin == true`).
- `users/{uid}/playlists/{playlistId}` ve `.../items/{itemId}` ile `users/{uid}/songOverrides/{songId}`: **yalnızca** `request.auth.uid == uid` veya admin.
- Üst `users/{uid}` kök dokümanı: şimdilik kapalı.
- Diğer tüm yollar: kapalı.

## İndeksler

Kaynak: `firestore.indexes.json`.

Bileşik indeksler:
- `songs`: `moderationStatus` + `artistSlug` + `slug` (tek şarkı sorgusu)
- `songs`: `moderationStatus` + `artistSlug` + `title` (sanatçı şarkıları)
- `songs`: `moderationStatus` + `title` (tüm şarkılar)
- `songs`: `moderationStatus` + `originalKey` + `title` (ton filtresi)
- `songs`: `moderationStatus` + `difficulty` + `title` (zorluk filtresi)
- `songs`: `moderationStatus` + çoklu filtre kombinasyonları
- `songs`: `moderationStatus` + `popularity` desc (popüler sıralama)
- `artists`: `slug` (slug sorgusu)
- `artists`: `popularity` desc (popüler sanatçılar)

## Admin

- **Custom claim**: `admin` (boolean) — Console / Admin SDK ile atanır.
- **Yazım**: Şarkı, sanatçı, keşfet — yalnızca admin.

## Yerel geliştirme

- `firebase.json` → emulators (Auth 9099, Firestore 8080, UI 4000).
- `npm run emulators` — Firebase CLI gerekir.
- `npm run seed:firestore` — şarkı, sanatçı, keşfet ve kullanıcı örneği yazar.
- İstemci emulator: `.env.local` içinde `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1`.

## Sunucu fetch

RSC sayfa bileşenleri `lib/firestore/` altındaki fonksiyonlarla Firestore Admin SDK üzerinden okur:

- `lib/firestore/songs.ts` — `getSongBySlugs`, `getSongsByIds`, `getSongsByArtist`, `getFilteredSongs`, `getAllApprovedSongs`, `getFilterFacetOptions`
- `lib/firestore/artists.ts` — `getArtistBySlug`, `getAllArtists`
- `lib/firestore/discover.ts` — `getDiscoverPopular`, `getDiscoverNew`, `getDiscoverFeatured`
