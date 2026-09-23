import type { CollectionConfig, Where } from "payload";
import { hasRole, isPublisher, staffOnlyField } from "../access";
import { DIFFICULTY_OPTIONS, KEY_MODE_OPTIONS } from "./Songs";

/**
 * Kullanıcı katkıları. Katkıcı kendi kaydını görür ve yalnız beklemedeyken
 * düzenleyebilir; onaylandıktan sonra dokunamaz.
 */
export const Contributions: CollectionConfig = {
  slug: "contributions",
  admin: {
    useAsTitle: "songTitle",
    defaultColumns: ["songTitle", "artistName", "contributorDisplayName", "status"],
    group: "Katkı",
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      if (hasRole(req.user, "admin", "publisher", "moderator")) {
        return true;
      }
      return { contributor: { equals: req.user.id } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if (!req.user) return false;
      if (hasRole(req.user, "admin", "publisher", "moderator")) {
        return true;
      }
      // Katkıcı yalnız kendi beklemedeki kaydını düzenler.
      const own: Where = {
        and: [
          { contributor: { equals: req.user.id } },
          { status: { equals: "pending" } },
        ],
      };
      return own;
    },
    delete: isPublisher,
  },
  fields: [
    { name: "songTitle", type: "text", required: true, label: "Şarkı adı" },
    { name: "artistName", type: "text", required: true, label: "Sanatçı adı" },
    { name: "chordBody", type: "code", required: true, label: "Akor ve söz", admin: { language: "html" } },
    { name: "originalKey", type: "text", required: true, label: "Orijinal ton" },
    { name: "keyMode", type: "select", options: KEY_MODE_OPTIONS, label: "Ton modu" },
    { name: "genre", type: "text", required: true, label: "Tür" },
    { name: "difficulty", type: "select", required: true, defaultValue: "orta", options: DIFFICULTY_OPTIONS, label: "Zorluk" },
    { name: "tempo", type: "text", label: "Tempo" },
    { name: "timeSignature", type: "text", label: "Ölçü" },
    { name: "tuning", type: "text", label: "Akort" },
    { name: "capo", type: "number", label: "Kapo" },
    { name: "copyrightSource", type: "text", label: "Telif kaynağı" },
    {
      name: "contributor",
      type: "relationship",
      relationTo: "users",
      index: true,
      label: "Katkıcı",
    },
    { name: "contributorDisplayName", type: "text", required: true, label: "Katkıcı adı" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Beklemede", value: "pending" },
        { label: "Onaylandı", value: "approved" },
        { label: "Reddedildi", value: "rejected" },
      ],
      index: true,
      label: "Durum",
      access: { update: staffOnlyField },
    },
    {
      name: "moderator",
      type: "relationship",
      relationTo: "users",
      label: "Moderatör",
      access: { update: staffOnlyField },
    },
    {
      name: "moderatorNote",
      type: "textarea",
      label: "Moderatör notu",
      access: { update: staffOnlyField },
    },
    {
      name: "approvedSong",
      type: "relationship",
      relationTo: "songs",
      label: "Onaylanan şarkı",
      access: { update: staffOnlyField },
    },
  ],
};
