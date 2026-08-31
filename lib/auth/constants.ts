/**
 * Directus oturum çerezi. Directus SSO `session` modunda bu çerezi kendisi yazar;
 * uygulama kendi çerezini üretmez (Firebase `createSessionCookie` akışı kalktı).
 *
 * ⚠️ Çerezin hem uygulama hem Directus tarafından görülebilmesi için ikisinin
 * **aynı üst alan adı** altında olması gerekir; Directus'ta `SESSION_COOKIE_DOMAIN`
 * buna göre ayarlanır (staging'de `.akorpro.com`). Kesimde uygulama `.com.tr`ye
 * geçtiğinde Directus'a `admin.akorpro.com.tr` hostname'i eklenip bu değer
 * `.akorpro.com.tr` yapılmalı — kesim kontrol listesinde madde olarak duruyor.
 */
export const SESSION_COOKIE_NAME = "directus_session_token";

/** Directus rolleri — `scripts/directus-roles.mjs` ile aynı adlar. */
export const ROLES = {
  ADMINISTRATOR: "Administrator",
  MODERATOR: "Moderator",
  PUBLISHER: "Publisher",
  CONTRIBUTOR: "Contributor",
} as const;

/** Yönetim arayüzüne ve moderasyon uçlarına erişebilen roller. */
export const STAFF_ROLES: readonly string[] = [
  ROLES.ADMINISTRATOR,
  ROLES.MODERATOR,
  ROLES.PUBLISHER,
];

/** Onaylı içeriği yayına alabilen roller (eski `AKORPRO_PUBLISHER_UIDS` kapısının yerine). */
export const PUBLISHER_ROLES: readonly string[] = [ROLES.ADMINISTRATOR, ROLES.PUBLISHER];
