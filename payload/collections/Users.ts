import type { CollectionConfig } from "payload";
import { STAFF_ROLES, canAccessAdminPanel, hasRole, isAdmin } from "../access";

/**
 * Tek kullanıcı koleksiyonu: hem site girişi hem admin paneli girişi.
 *
 * Directus'ta iki ayrı dünya vardı — `directus_users` + rol/politika kayıtları,
 * ve panele girişi `admin_access` bayrağı belirliyordu. Burada tek `role` alanı
 * her ikisini de yönetiyor.
 *
 * E-posta + parola girişi Payload'da yerleşik. Bu, DURUM.md'de "atlanmamalı"
 * diye işaretlenen break-glass admin hesabı sorununu kendiliğinden çözüyor:
 * Google tarafında bir aksilik olursa parolayla girilebilir.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "displayName", "role"],
    group: "Sistem",
  },
  access: {
    // Panele yalnız personel girebilir; contributor girerse boş bir panel görür.
    admin: ({ req }) => canAccessAdminPanel(req.user),
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => {
      if (!req.user) return false;
      if (hasRole(req.user, "admin")) return true;
      // Personel olmayan yalnız kendini görür.
      if (canAccessAdminPanel(req.user)) return true;
      return { id: { equals: req.user.id } };
    },
    update: ({ req }) => {
      if (!req.user) return false;
      if (hasRole(req.user, "admin")) return true;
      return { id: { equals: req.user.id } };
    },
  },
  fields: [
    {
      name: "displayName",
      type: "text",
      label: "Görünen ad",
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "contributor",
      options: [
        { label: "Yönetici", value: "admin" },
        { label: "Yayıncı", value: "publisher" },
        { label: "Moderatör", value: "moderator" },
        { label: "Katkıcı", value: "contributor" },
      ],
      // Rolü yalnız admin değiştirebilir; aksi halde herkes kendini admin yapar.
      access: {
        create: ({ req }) => hasRole(req.user, "admin"),
        update: ({ req }) => hasRole(req.user, "admin"),
      },
      admin: {
        description: `Panele girebilen roller: ${STAFF_ROLES.join(", ")}`,
      },
    },
    {
      name: "avatarUrl",
      type: "text",
      label: "Avatar adresi",
      admin: { description: "Google ile girişte otomatik dolar." },
    },
    {
      name: "googleId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Google SSO eşleşmesi. Elle doldurulmaz.",
      },
    },
  ],
};
