export const THEME_COOKIE = "akorpro-theme";

export type ThemePreference = "dark" | "light";

export function themeCookieHeader(value: ThemePreference): string {
  const maxAge = 60 * 60 * 24 * 365;
  return `${THEME_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/** SSR + next-themes: çerezde kayıtlı tercih; yoksa koyu mod. */
export function defaultThemeFromCookie(value: string | undefined): "dark" | "light" {
  if (value === "light") return "light";
  return "dark";
}
