"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { THEME_COOKIE, themeCookieHeader, type ThemePreference } from "@/lib/theme";

function ThemeCookieSync() {
  const { resolvedTheme, theme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    if (theme === "system") {
      document.cookie = `${THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      return;
    }
    if (resolvedTheme === "dark" || resolvedTheme === "light") {
      document.cookie = themeCookieHeader(resolvedTheme as ThemePreference);
    }
  }, [resolvedTheme, theme]);

  return null;
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey={THEME_COOKIE}
      disableTransitionOnChange
    >
      <ThemeCookieSync />
      {children}
    </NextThemesProvider>
  );
}
