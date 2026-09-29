import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { isModerator, isPublisher, publisherOnlyField, readApprovedOrStaff } from "../access";
import { slugify, trInitial } from "../slugify";
import { revalidateSong, revalidateSongAfterDelete } from "../revalidate";

export const DIFFICULTY_OPTIONS = [
  { label: "Kolay", value: "kolay" },
  { label: "Orta", value: "orta" },
  { label: "Zor", value: "zor" },
];

export const KEY_MODE_OPTIONS = [
  { label: "Majör", value: "major" },
  { label: "Doğal Minör", value: "natural" },
  { label: "Harmonik Minör", value: "harmonic" },
  { label: "Melodik Minör", value: "melodic" },
];

/**
 * Slug üretimi + denormalize alanların doldurulması.
 * `akorpro_songs_slug()` trigger'ının karşılığı.
 *
 * artistSlug ve artistName tek kaynaktan (ilişkili sanatçı) doldurulur;
 * elle yazılmasına gerek yok ve yazılırsa da ezilir.
 */
const setSlugAndDenormalized: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (!data) return data;

  if (operation === "create" || !data.slug || !String(data.slug).trim()) {
    data.slug = slugify(data.title);
  } else {
    data.slug = slugify(data.slug);
  }

  // Harf filtresi için: Payload'da "ile başlar" operatörü yok. Yazma anında
  // hesaplanıp indeksleniyor ki filtreleme bellekte değil veritabanında kalsın.
  data.titleInitial = trInitial(data.title);

  if (data.artist) {
    const artistId = typeof data.artist === "object" ? data.artist.id : data.artist;
    const artist = await req.payload.findByID({
      collection: "artists",
      id: artistId,
      depth: 0,
      req,
    });
    if (artist) {
      data.artistSlug = artist.slug;
      data.artistName = artist.name;
    }
  }

  return data;
};

export const Songs: CollectionConfig = {
  slug: "songs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "artistName", "originalKey", "difficulty", "moderationStatus"],
    group: "İçerik",
  },
  access: {
    read: readApprovedOrStaff,
    create: isModerator,
    update: isModerator,
    delete: isPublisher,
  },
  hooks: {
    beforeValidate: [setSlugAndDenormalized],
    afterChange: [revalidateSong],
    afterDelete: [revalidateSongAfterDelete],
  },
  // songs(artistSlug, slug) bileşik unique indeksi — Directus'ta elle eklenmişti.
  indexes: [
    { fields: ["artistSlug", "slug"], unique: true },
  ],
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Şarkı",
          fields: [
            { name: "title", type: "text", required: true, label: "Başlık", index: true },
            {
              name: "slug",
              type: "text",
              index: true,
              label: "Slug",
              admin: { readOnly: true, description: "Başlıktan otomatik üretilir." },
            },
            {
              name: "titleInitial",
              type: "text",
              index: true,
              admin: {
                readOnly: true,
                hidden: true,
                description: "Harf filtresi için başlığın ilk harfi (Türkçe büyük).",
              },
            },
            {
              name: "artist",
              type: "relationship",
              relationTo: "artists",
              required: true,
              label: "Sanatçı",
              index: true,
            },
            {
              name: "artistSlug",
              type: "text",
              index: true,
              admin: { readOnly: true, description: "Sanatçıdan otomatik dolar." },
            },
            {
              name: "artistName",
              type: "text",
              index: true,
              admin: { readOnly: true, description: "Sanatçıdan otomatik dolar." },
            },
            {
              name: "chordBody",
              type: "code",
              required: true,
              label: "Akor ve söz",
              admin: {
                language: "html",
                description: "Akor + söz gövdesi. Sunucuda render edilir.",
              },
            },
          ],
        },
        {
          label: "Müzikal",
          fields: [
            { name: "originalKey", type: "text", required: true, label: "Orijinal ton" },
            {
              name: "keyMode",
              type: "select",
              options: KEY_MODE_OPTIONS,
              label: "Ton modu",
            },
            { name: "gamlarScaleId", type: "text", label: "Gam kimliği" },
            {
              name: "difficulty",
              type: "select",
              required: true,
              defaultValue: "orta",
              options: DIFFICULTY_OPTIONS,
              label: "Zorluk",
            },
            { name: "genre", type: "text", required: true, label: "Tür", index: true },
            { name: "tempo", type: "text", label: "Tempo" },
            { name: "timeSignature", type: "text", label: "Ölçü", index: true },
            { name: "tuning", type: "text", label: "Akort" },
            { name: "capo", type: "number", label: "Kapo" },
            {
              name: "showHarmonyDetails",
              type: "checkbox",
              defaultValue: false,
              label: "Armoni ayrıntılarını göster",
            },
            {
              name: "harmonyDetailsNotes",
              type: "textarea",
              label: "Armoni notu",
              admin: { condition: (data) => Boolean(data?.showHarmonyDetails) },
            },
          ],
        },
        {
          label: "Yayın",
          fields: [
            {
              name: "moderationStatus",
              type: "select",
              required: true,
              defaultValue: "draft",
              options: [
                { label: "Taslak", value: "draft" },
                { label: "Beklemede", value: "pending" },
                { label: "Onaylı", value: "approved" },
                { label: "Reddedildi", value: "rejected" },
              ],
              label: "Yayın durumu",
              index: true,
              // Moderatör düzenler ama yayına alamaz — Directus'taki ayrımın aynısı.
              access: {
                create: publisherOnlyField,
                update: publisherOnlyField,
              },
              admin: {
                description: "Yalnız yayıncı ve yönetici değiştirebilir.",
              },
            },
            {
              name: "copyrightSource",
              type: "text",
              label: "Telif kaynağı",
              // Neredeyse her şarkı için aynı; elle yazdırmanın anlamı yok.
              defaultValue: "Topluluk Katkısı/Eğitim amaçlı",
            },
          ],
        },
      ],
    },
  ],
};
