import type { CollectionConfig } from "payload";
import { anyone, isModerator, isPublisher } from "../access";

/** Ana sayfadaki keşfet blokları (popüler, yeni, öne çıkan). */
export const DiscoverSections: CollectionConfig = {
  slug: "discover-sections",
  dbName: "discover_sections",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["key", "title", "sortOrder"],
    group: "Keşfet",
  },
  access: { read: anyone, create: isModerator, update: isModerator, delete: isPublisher },
  fields: [
    { name: "key", type: "text", required: true, unique: true, index: true, label: "Anahtar" },
    { name: "title", type: "text", label: "Başlık" },
    { name: "sortOrder", type: "number", label: "Sıra", defaultValue: 0 },
  ],
};

/** Blok içindeki sıralı şarkılar. Sıra `position` ile tutulur. */
export const DiscoverItems: CollectionConfig = {
  slug: "discover-items",
  dbName: "discover_items",
  admin: {
    defaultColumns: ["section", "song", "position"],
    group: "Keşfet",
  },
  access: { read: anyone, create: isModerator, update: isModerator, delete: isModerator },
  fields: [
    {
      name: "section",
      type: "relationship",
      relationTo: "discover-sections",
      required: true,
      index: true,
      label: "Blok",
    },
    { name: "song", type: "relationship", relationTo: "songs", required: true, index: true, label: "Şarkı" },
    { name: "position", type: "number", required: true, defaultValue: 0, label: "Sıra" },
  ],
};
