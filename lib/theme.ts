export const THEME_COOKIE = "akorpro-theme";

export type ThemePreference = "dark" | "light";

export function themeCookieHeader(value: ThemePreference): string {
  const maxAge = 60 * 60 * 24 * 365;
  return `${THEME_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
