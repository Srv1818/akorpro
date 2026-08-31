/**
 * Directus ↔ uygulama tip dönüşümleri.
 *
 * Firestore sürümündeki `serializeDoc()` (Timestamp → number) yerine geçer.
 * Directus tarihleri ISO 8601 string döndürür; uygulama katmanı epoch-ms bekliyor.
 */

/** ISO 8601 → epoch milisaniye. Boş/geçersiz değerde 0 döner. */
export function toEpochMs(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

/** epoch milisaniye → Directus'un beklediği ISO 8601 string. */
export function toIso(value: number | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}
