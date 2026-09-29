import type { CollectionConfig } from "payload";
import { anyone, isModerator, isPublisher } from "../access";
import { revalidateChordLibrary, revalidateChordLibraryAfterDelete } from "../revalidate";

export const ChordLibrary: CollectionConfig = {
  slug: "chord-library",
  dbName: "chord_library",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "root", "quality", "fingering"],
    group: "Referans",
  },
  access: { read: anyone, create: isModerator, update: isModerator, delete: isPublisher },
  hooks: {
    afterChange: [revalidateChordLibrary],
    afterDelete: [revalidateChordLibraryAfterDelete],
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Ad", index: true },
    { name: "root", type: "text", required: true, label: "Kök", index: true },
    { name: "quality", type: "text", required: true, label: "Nitelik", index: true },
    {
      name: "fingering",
      type: "text",
      required: true,
      label: "Basış",
      admin: { description: "Örn. x32010" },
    },
    { name: "fingers", type: "text", label: "Parmaklar" },
    { name: "barreFret", type: "number", label: "Barre perdesi" },
    { name: "sortOrder", type: "number", label: "Sıra", defaultValue: 0 },
  ],
};
