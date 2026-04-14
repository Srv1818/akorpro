/**
 * Firestore Timestamp sınıf örneklerini epoch milisaniyeye (number) çevirir.
 * React Server Components → Client Components sınırında class instance'lar
 * serileştirilemiyor; bu yardımcı her belge okunduğunda çağrılmalıdır.
 */

function serializeValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val !== "object") return val;

  if (typeof (val as { toMillis?: unknown }).toMillis === "function") {
    return (val as { toMillis: () => number }).toMillis();
  }

  if (Array.isArray(val)) {
    return val.map(serializeValue);
  }

  const obj = val as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    out[key] = serializeValue(obj[key]);
  }
  return out;
}

export function serializeDoc<T extends object>(raw: T): T {
  return serializeValue(raw) as T;
}
