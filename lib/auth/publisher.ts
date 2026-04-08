/**
 * Şarkıların siteye düşmesi (approved) ve yayında içeriğin düzenlenmesi.
 *
 * `AKORPRO_PUBLISHER_UIDS` virgülle ayrılmış Firebase Auth UID listesi.
 * Boş veya tanımsız → tüm adminler eskisi gibi yayınlar (geriye dönük uyumluluk).
 */
export function publisherGateActive(): boolean {
  const raw = process.env.AKORPRO_PUBLISHER_UIDS?.trim() ?? "";
  return raw.length > 0;
}

export function canPublishSongs(uid: string): boolean {
  const raw = process.env.AKORPRO_PUBLISHER_UIDS?.trim() ?? "";
  if (!raw) return true;
  const set = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
  return set.has(uid);
}
