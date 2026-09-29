import type { CollectionConfig } from "payload";
import { isModerator } from "../access";

/**
 * Şarkı görüntülenme sayacı — şarkı başına GÜNLÜK bir satır.
 *
 * Neden her görüntülenme için ayrı satır değil: popüler bir şarkı günde
 * binlerce satır üretirdi. Günlük kova, satır sayısını şarkı × gün ile
 * sınırlıyor ve "son 30 gün" sorgusu tek bir toplama oluyor.
 *
 * Neden kayan pencere: toplam sayaç kullanılsaydı ilk giren şarkılar
 * sonsuza kadar listenin tepesinde kalırdı.
 *
 * Sayaç tarayıcıdan gelen işaretle artıyor (`/api/songs/[songId]/view`),
 * sunucu render'ında değil — yoksa arama motoru botları da sayılırdı.
 */
export const SongViews: CollectionConfig = {
  slug: "song-views",
  dbName: "song_views",
  admin: {
    defaultColumns: ["song", "day", "count"],
    group: "Sistem",
    description: "Otomatik doldurulur; elle düzenlenmesi gerekmez.",
  },
  access: {
    // Sayılar herkese açık değil: rakip site içerik seçimini okuyabilir.
    read: isModerator,
    create: () => false,
    update: () => false,
    delete: isModerator,
  },
  indexes: [{ fields: ["song", "day"], unique: true }],
  fields: [
    { name: "song", type: "relationship", relationTo: "songs", required: true, index: true },
    {
      name: "day",
      type: "text",
      required: true,
      index: true,
      admin: { description: "YYYY-MM-DD (UTC)" },
    },
    { name: "count", type: "number", required: true, defaultValue: 0 },
  ],
};
