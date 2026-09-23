/**
 * Google ile giriş adresi — Payload OAuth2 eklentisi.
 *
 * Directus sürümünde bu adres ayrı bir servise (admin.akorpro.com) gidiyordu.
 * Artık uygulamanın kendi içinde: `/payload-api/users/oauth/authorize`.
 * Eklenti `/api/` yolunu sabit varsaydığı için Payload'ın API tabanı
 * `payload.config.ts`'te açıkça `/payload-api` olarak veriliyor.
 *
 * Yapılandırma eksikse `null` döner; çağıran uyarı gösterir.
 */

const OAUTH_AUTHORIZE_PATH = "/payload-api/users/oauth/authorize";

function siteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  return raw ? raw.replace(/\/$/, "") : null;
}

/** Google girişinin yapılandırılmış olup olmadığı — giriş sayfası buna bakar. */
export function googleLoginConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1");
}

export function googleLoginUrl(returnTo: string): string | null {
  if (!googleLoginConfigured()) return null;

  const site = siteUrl();
  if (!site) return null;

  const path = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
  // Giriş sonrası dönülecek adres state olarak taşınır; eklenti
  // successRedirect içinde bunu okuyor (payload.config.ts).
  return `${site}${OAUTH_AUTHORIZE_PATH}?returnTo=${encodeURIComponent(path)}`;
}
