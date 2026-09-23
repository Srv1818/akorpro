import { PUBLISHER_ROLES } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/session-user";

/**
 * Şarkıların siteye düşmesi (approved) ve yayında içeriğin düzenlenmesi.
 *
 * Karar rol üzerinden veriliyor: kapı her zaman açık, belirleyici olan
 * `publisher` / `admin` rolüne sahip olmak. Moderatör `moderationStatus`
 * alanını değiştiremiyor (bkz. payload/collections/Songs.ts — alan bazlı erişim).
 */
export function publisherGateActive(): boolean {
  return true;
}

export function canPublishSongs(user: Pick<SessionUser, "role"> | null): boolean {
  if (!user?.role) return false;
  return PUBLISHER_ROLES.includes(user.role);
}
