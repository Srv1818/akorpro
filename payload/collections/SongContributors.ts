import type { CollectionConfig } from "payload";
import { anyone, isModerator, isPublisher } from "../access";

/** Şarkı künyesinde görünen katkıcılar. */
export const SongContributors: CollectionConfig = {
  slug: "song-contributors",
  dbName: "song_contributors",
  admin: {
    defaultColumns: ["song", "user"],
    group: "Katkı",
  },
  access: {
    read: anyone,
    create: isModerator,
    update: isModerator,
    delete: isPublisher,
  },
  fields: [
    { name: "song", type: "relationship", relationTo: "songs", required: true, index: true },
    { name: "user", type: "relationship", relationTo: "users", required: true, index: true },
  ],
};
