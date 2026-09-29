import type { CollectionAfterChangeHook, CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { anyone, isModerator, isPublisher } from "../access";
import { slugify } from "../slugify";
import { revalidateArtist, revalidateArtistAfterDelete } from "../revalidate";

/**
 * INSERT'te slug her zaman isimden türetilir, alana ne yazılmış olursa olsun.
 * Sebebi ilk içerik denemesinde yaşanmıştı: slug alanına tam URL yapıştırılmıştı.
 * UPDATE'te elle verilen slug korunur, yalnız biçimi temizlenir.
 *
 * `akorpro_artists_slug()` trigger'ının karşılığı.
 */
const setSlug: CollectionBeforeValidateHook = async ({ data, operation }) => {
  if (!data) return data;
  if (operation === "create" || !data.slug || !String(data.slug).trim()) {
    data.slug = slugify(data.name);
  } else {
    data.slug = slugify(data.slug);
  }
  return data;
};

/**
 * Sanatçı adı veya slug'ı değişirse şarkılardaki denormalize kopyalar da
 * güncellenir. Yoksa şarkı kayıtları sessizce eski adı taşımaya devam eder.
 *
 * `akorpro_artists_propagate()` trigger'ının karşılığı.
 */
const propagateToSongs: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== "update") return doc;
  if (doc.slug === previousDoc?.slug && doc.name === previousDoc?.name) return doc;

  await req.payload.update({
    collection: "songs",
    where: { artist: { equals: doc.id } },
    data: { artistSlug: doc.slug, artistName: doc.name },
    req,
    // Şarkı hook'unu yeniden tetikleyip döngüye girmemek için derinlik sıfır.
    depth: 0,
  });

  return doc;
};

export const Artists: CollectionConfig = {
  slug: "artists",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "genre", "popularity"],
    group: "İçerik",
  },
  access: {
    read: anyone,
    create: isModerator,
    update: isModerator,
    delete: isPublisher,
  },
  hooks: {
    beforeValidate: [setSlug],
    afterChange: [propagateToSongs, revalidateArtist],
    afterDelete: [revalidateArtistAfterDelete],
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Ad", index: true },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      label: "Slug",
      admin: {
        readOnly: true,
        description: "Addan otomatik üretilir.",
      },
    },
    { name: "imageUrl", type: "text", label: "Görsel adresi" },
    { name: "genre", type: "text", label: "Tür" },
    { name: "popularity", type: "number", label: "Popülerlik", defaultValue: 0 },
  ],
};
