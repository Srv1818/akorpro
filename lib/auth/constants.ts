/**
 * Payload oturum çerezi.
 *
 * Directus döneminden farkı önemli: çerezi artık uygulamanın kendisi yazıyor,
 * ayrı bir servis değil. Bu yüzden `SESSION_COOKIE_DOMAIN` ayarlama ve admin'i
 * aynı üst alan adı altında tutma zorunluluğu ortadan kalktı — kesim kontrol
 * listesindeki "atlanırsa kimse giriş yapamaz" maddesi de bununla kapandı.
 *
 * İsim Payload'ın varsayılanı (`<cookiePrefix>-token`).
 */
export const SESSION_COOKIE_NAME = "payload-token";

/** Payload `users.role` alanının değerleri. */
export const ROLES = {
  ADMINISTRATOR: "admin",
  PUBLISHER: "publisher",
  MODERATOR: "moderator",
  CONTRIBUTOR: "contributor",
} as const;

/** Yönetim arayüzüne ve moderasyon uçlarına erişebilen roller. */
export const STAFF_ROLES: readonly string[] = [
  ROLES.ADMINISTRATOR,
  ROLES.PUBLISHER,
  ROLES.MODERATOR,
];

/** Onaylı içeriği yayına alabilen roller. */
export const PUBLISHER_ROLES: readonly string[] = [ROLES.ADMINISTRATOR, ROLES.PUBLISHER];
