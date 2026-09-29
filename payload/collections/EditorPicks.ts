import type { CollectionConfig } from "payload";
import { anyone, isModerator } from "../access";
import { revalidateDiscover, revalidateDiscoverAfterDelete } from "../revalidate";

/**
 * Ana sayfadaki "Editör seçimi" bloğu — elle seçilen şarkılar, elle sıra.
 *
 * Yerini aldığı yapı: `discover-sections` + `discover-items`. O ikili, üç
 * keşfet bloğunun da elle yönetildiği dönemden kalmıştı. Popüler artık
 * tıklamadan, Yeni eklenme tarihinden hesaplandığı için geriye tek bir elle
 * yönetilen liste kaldı; iki tablo taşımaya değmiyordu.
 *
 * Eski yapının asıl sorunu kullanılamaz olmasıydı: kod yalnızca `key` alanı
 * tam olarak "featured" olan bölümü okuyordu ve bu kelime panelde hiçbir
 * yerde yazmıyordu. Üretimde iki tablo da boştu, blok hiç çalışmamıştı.
 */
export const EditorPicks: CollectionConfig = {
  slug: "editor-picks",
  dbName: "editor_picks",
  labels: { singular: "Editör Seçimi", plural: "Editör Seçimi" },
  admin: {
    defaultColumns: ["song", "position"],
    group: "İçerik",
    description:
      "Ana sayfadaki Editör seçimi bloğu. Sıra küçükten büyüğe dizilir; boş bırakılırsa sona eklenir.",
  },
  // Panel ve API varsayılan olarak sıraya göre dizsin.
  defaultSort: "position",
  access: {
    read: anyone,
    create: isModerator,
    update: isModerator,
    delete: isModerator,
  },
  fields: [
    {
      name: "song",
      type: "relationship",
      relationTo: "songs",
      required: true,
      // Aynı şarkı listeye iki kez giremesin.
      unique: true,
      index: true,
      label: "Şarkı",
    },
    {
      name: "position",
      type: "number",
      required: true,
      defaultValue: 0,
      index: true,
      label: "Sıra",
      admin: { description: "Küçük olan önce gösterilir." },
    },
  ],
  hooks: {
    afterChange: [revalidateDiscover],
    afterDelete: [revalidateDiscoverAfterDelete],
  },
};
