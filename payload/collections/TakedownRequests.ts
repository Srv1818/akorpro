import type { CollectionConfig } from "payload";
import { isModerator, isPublisher } from "../access";

/**
 * Telif kaldırma talepleri. Okuma yalnız personelde — içinde talep sahibinin
 * adı ve e-postası var, herkese açık olmamalı.
 */
export const TakedownRequests: CollectionConfig = {
  slug: "takedown-requests",
  dbName: "takedown_requests",
  admin: {
    useAsTitle: "songUrl",
    defaultColumns: ["songUrl", "name", "status", "createdAt"],
    group: "Sistem",
  },
  access: {
    read: isModerator,
    // Form girişsiz gönderilebiliyor; yazma route katmanından geçiyor.
    create: () => true,
    update: isModerator,
    delete: isPublisher,
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Ad" },
    { name: "email", type: "email", required: true, label: "E-posta" },
    { name: "songUrl", type: "text", required: true, label: "Şarkı adresi" },
    { name: "originalWork", type: "textarea", required: true, label: "Özgün eser" },
    { name: "proof", type: "textarea", required: true, label: "Kanıt" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Beklemede", value: "pending" },
        { label: "İnceleniyor", value: "reviewing" },
        { label: "Çözüldü", value: "resolved" },
        { label: "Reddedildi", value: "rejected" },
      ],
      index: true,
      label: "Durum",
    },
  ],
};
