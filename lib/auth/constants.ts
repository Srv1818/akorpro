/** HTTP-only oturum çerezi (Admin createSessionCookie ile üretilen JWT). */
export const SESSION_COOKIE_NAME = "akorpro_session";

/** createSessionCookie expiresIn (ms). Maks. 14 gün. */
export const SESSION_COOKIE_MAX_MS = 1000 * 60 * 60 * 24 * 5;
