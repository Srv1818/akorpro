import type { CollectionConfig } from "payload";
import { anyone, isModerator, isPublisher } from "../access";

export const Scales: CollectionConfig = {
  slug: "scales",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["key", "name", "category", "sortOrder"],
    group: "Referans",
  },
  access: { read: anyone, create: isModerator, update: isModerator, delete: isPublisher },
  fields: [
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "Anahtar",
      admin: { description: "Koddaki ScaleDoc.id karşılığı." },
    },
    { name: "name", type: "text", required: true, label: "Ad" },
    {
      name: "notesC",
      type: "json",
      label: "C'deki notalar",
      admin: { description: "Dizi olarak, örn. [\"C\",\"D\",\"E\"]" },
    },
    { name: "category", type: "text", label: "Kategori" },
    { name: "description", type: "textarea", label: "Açıklama" },
    { name: "sortOrder", type: "number", label: "Sıra", defaultValue: 0 },
  ],
};
