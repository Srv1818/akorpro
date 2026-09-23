import type { CollectionConfig } from "payload";
import { hasRole, ownedBy } from "../access";

/**
 * Çalma listeleri kullanıcıya özel — herkese açık okuma YOK.
 * Tarayıcı doğrudan bağlanmaz; `app/api/playlists/*` route'ları aracılık eder.
 */
export const Playlists: CollectionConfig = {
  slug: "playlists",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "owner"],
    group: "Kullanıcı",
  },
  access: {
    read: ownedBy("owner"),
    create: ({ req }) => Boolean(req.user),
    update: ownedBy("owner"),
    delete: ownedBy("owner"),
  },
  fields: [
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      label: "Sahibi",
      access: { update: ({ req }) => hasRole(req.user, "admin") },
    },
    { name: "name", type: "text", required: true, label: "Ad" },
  ],
};

/**
 * Liste öğeleri ayrı koleksiyon (Payload array alanı değil), çünkü
 * `app/api/playlists/[id]/items/[itemId]` route'ları öğe bazında
 * ekleme/silme/sıralama yapıyor.
 */
export const PlaylistItems: CollectionConfig = {
  slug: "playlist-items",
  dbName: "playlist_items",
  admin: {
    defaultColumns: ["playlist", "song", "position"],
    group: "Kullanıcı",
  },
  access: {
    // Öğe erişimi listenin sahipliğinden türer; route katmanı zaten doğruluyor.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "playlist", type: "relationship", relationTo: "playlists", required: true, index: true },
    { name: "song", type: "relationship", relationTo: "songs", required: true, index: true },
    { name: "position", type: "number", required: true, defaultValue: 0, label: "Sıra" },
    { name: "transposeSemitones", type: "number", label: "Transpoze (yarım ses)" },
  ],
};
