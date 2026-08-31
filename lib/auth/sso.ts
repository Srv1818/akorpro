/**
 * Directus Google SSO giriş adresi.
 *
 * Directus kimliği doğruladıktan sonra oturum çerezini yazar ve `redirect`
 * parametresindeki adrese geri döner. Adres, Directus tarafında
 * `AUTH_GOOGLE_REDIRECT_ALLOW_LIST` içinde tanımlı olmalıdır — aksi halde
 * Directus yönlendirmeyi reddeder.
 */

function siteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  return raw ? raw.replace(/\/$/, "") : null;
}

function directusPublicUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  return raw ? raw.replace(/\/$/, "") : null;
}

/** Yapılandırma eksikse `null` döner; çağıran uyarı gösterir. */
export function googleLoginUrl(returnTo: string): string | null {
  const directus = directusPublicUrl();
  const site = siteUrl();
  if (!directus || !site) return null;

  const target = `${site}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}`;
  return `${directus}/auth/login/google?redirect=${encodeURIComponent(target)}`;
}
