import type { CollectionConfig } from "payload";
import { adminOnlyField, anyone, hasRole, isPublisher } from "../access";

export const ContributorProfiles: CollectionConfig = {
  slug: "contributor-profiles",
  dbName: "contributor_profiles",
  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "verified"],
    group: "Katkı",
  },
  access: {
    read: anyone,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if (!req.user) return false;
      if (hasRole(req.user, "admin", "publisher")) return true;
      return { user: { equals: req.user.id } };
    },
    delete: isPublisher,
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      unique: true,
      index: true,
      label: "Kullanıcı",
    },
    { name: "displayName", type: "text", required: true, label: "Görünen ad" },
    { name: "bio", type: "textarea", label: "Hakkında" },
    { name: "avatarUrl", type: "text", label: "Avatar adresi" },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      label: "Doğrulanmış",
      // Kullanıcı kendini doğrulanmış yapamaz.
      access: { create: adminOnlyField, update: adminOnlyField },
    },
  ],
};
