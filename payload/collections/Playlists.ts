import type { Access, CollectionConfig } from "payload";
import { hasRole, ownedBy } from "../access";

/** Öğeye erişim, bağlı olduğu çalma listesinin sahipliğinden gelir. */
const ownedViaPlaylist: Access = ({ req }) => {
  if (!req.user) return false;
  if (hasRole(req.user, "admin")) return true;
  return { "playlist.owner": { equals: req.user.id } };
};

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
    /**
     * Sahiplik ilişkili listeden türetilir.
     *
     * "Giriş yapmış olmak" YETMEZ: o durumda herhangi bir kullanıcı başkasının
     * listesindeki şarkıyı silebilir veya sırasını değiştirebilirdi. Directus
     * sürümünde bunu `owner = $CURRENT_USER` filtresi engelliyordu; burada
     * karşılığı ilişki üzerinden nokta gösterimi.
     */
    read: ownedViaPlaylist,
    create: ({ req }) => Boolean(req.user),
    update: ownedViaPlaylist,
    delete: ownedViaPlaylist,
  },
  fields: [
    { name: "playlist", type: "relationship", relationTo: "playlists", required: true, index: true },
    { name: "song", type: "relationship", relationTo: "songs", required: true, index: true },
    { name: "position", type: "number", required: true, defaultValue: 0, label: "Sıra" },
    { name: "transposeSemitones", type: "number", label: "Transpoze (yarım ses)" },
  ],
};
