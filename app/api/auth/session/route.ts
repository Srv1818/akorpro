import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { directusUrl } from "@/lib/directus/client";

export const runtime = "nodejs";

/**
 * Oturum kapatma.
 *
 * Giriş artık burada üretilmiyor: Directus Google SSO oturum çerezini kendisi
 * yazıyor (`session` modu), dolayısıyla eski `POST /api/auth/session`
 * (`createSessionCookie` ile Firebase ID token → çerez) akışı kalktı.
 *
 * Çıkışta iki iş var: Directus'ta oturumu geçersiz kıl ve çerezi sil.
 */
export async function DELETE(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  if (token) {
    try {
      await fetch(`${directusUrl()}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: token, mode: "json" }),
      });
    } catch {
      // Directus'a ulaşılamasa bile çerezi düşürüp kullanıcıyı çıkarmış oluyoruz.
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
