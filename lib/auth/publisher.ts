import { PUBLISHER_ROLES } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/session-user";

/**
 * Şarkıların siteye düşmesi (approved) ve yayında içeriğin düzenlenmesi.
 *
 * Eskiden `AKORPRO_PUBLISHER_UIDS` env'indeki Firebase UID listesiyle yönetiliyordu.
 * Artık Directus rolüne bakılıyor: kapı her zaman açık, karar `Publisher` /
 * `Administrator` rolüne sahip olup olmamakta (bkz. scripts/directus-roles.mjs —
 * `Moderator` rolü `moderation_status`'ü `approved` yapamıyor).
 */
export function publisherGateActive(): boolean {
  return true;
}

export function canPublishSongs(user: Pick<SessionUser, "role"> | null): boolean {
  if (!user?.role) return false;
  return PUBLISHER_ROLES.includes(user.role);
}
