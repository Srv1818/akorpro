/**
 * Payload tarih alanları ISO 8601 string döndürür; uygulama katmanı epoch-ms
 * bekliyor (Firestore Timestamp döneminden kalan sözleşme).
 *
 * `lib/directus/serialize.ts`'in karşılığı.
 */
export function toEpochMs(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Payload ilişki alanı: derinliğe göre id veya genişletilmiş nesne gelir. */
export function relId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "id" in value) {
    return String((value as { id: string | number }).id);
  }
  return "";
}
