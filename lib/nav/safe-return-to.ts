/**
 * Open redirect koruması: yalnızca uygulama içi path + isteğe bağlı query.
 */
export function safeInternalReturnPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  if (t === "/giris" || t.startsWith("/giris?")) return null;
  return t;
}
