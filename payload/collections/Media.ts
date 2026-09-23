import type { CollectionConfig } from "payload";
import { anyone, isModerator, isPublisher } from "../access";

/** Yüklenen dosyalar. Depolama R2'ye bağlanır (payload.config.ts, storage-s3). */
export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    mimeTypes: ["image/*"],
  },
  admin: { group: "Sistem" },
  access: { read: anyone, create: isModerator, update: isModerator, delete: isPublisher },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alternatif metin",
      admin: { description: "Erişilebilirlik için zorunlu sayılmalı." },
    },
  ],
};
