/**
 * Türkçe duyarlı slug üretimi.
 *
 * `scripts/directus-slug-triggers.sql` içindeki `akorpro_slugify()` Postgres
 * fonksiyonunun birebir TypeScript karşılığı. Directus'ta bu iş veritabanı
 * trigger'ıyla yapılıyordu çünkü Directus Flow'ları tetiklenmiyordu; Payload'da
 * koleksiyon hook'u olarak çalıştığı için SQL trigger'a gerek kalmadı.
 *
 * Sıralama önemli: harf değiştirme `toLowerCase()`'ten ÖNCE yapılır. Aksi halde
 * "İ" ve "I" Türkçe kurallarına göre çevrilmez ve "ı" ASCII'ye düşmez.
 */

/** SQL tarafındaki translate() çifti ile aynı sırada. */
const TR_MAP: Record<string, string> = {
  ı: "i", İ: "i",
  ş: "s", Ş: "s",
  ğ: "g", Ğ: "g",
  ü: "u", Ü: "u",
  ö: "o", Ö: "o",
  ç: "c", Ç: "c",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
};

/** Postgres `left(..., 120)` ile aynı üst sınır. */
export const SLUG_MAX_LENGTH = 120;

export function slugify(value: string | null | undefined): string {
  const source = value ?? "";

  let mapped = "";
  for (const ch of source) {
    mapped += TR_MAP[ch] ?? ch;
  }

  return mapped
    // "&" sessizce düşerse eski adresler kırılır: .com.tr'de
    // "İkilem & Tuğba" → "ikilem-ve-tugba". Kelime olarak yazılıyor.
    .replace(/&/g, " ve ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}

/** Türkçe alfabe — filtre şeridi ve `titleInitial` bu sırayı kullanır. */
export const TR_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");

/**
 * Başlığın ilk harfini Türkçe kurallarıyla büyütür.
 *
 * Directus'ta harf filtresi `_istarts_with` ile yapılıyordu; Payload'da
 * karşılığı yok. Bellek içi filtrelemeye dönmemek için bu değer yazma anında
 * hesaplanıp indeksli bir alana konuyor.
 *
 * `toLocaleUpperCase("tr")` şart: varsayılan "i" harfini "I" yapar, oysa
 * Türkçede "İ" olmalı.
 */
export function trInitial(value: string | null | undefined): string {
  const first = (value ?? "").trim().charAt(0);
  if (!first) return "";
  return first.toLocaleUpperCase("tr");
}
