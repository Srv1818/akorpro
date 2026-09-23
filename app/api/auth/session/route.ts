import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getPayloadClient } from "@/lib/payload/client";

export const runtime = "nodejs";

/**
 * Oturum kapatma.
 *
 * Giriş burada üretilmiyor: parola girişini Payload'ın kendi ucu, Google
 * girişini OAuth eklentisi karşılıyor. İkisi de çerezi kendileri yazıyor.
 *
 * Çıkışta iki iş var: Payload'daki oturum kaydını düşür ve çerezi sil.
 * Payload'ın oturumları veritabanında tutuluyor (`users_sessions`), yani
 * yalnız çerezi silmek yetmez — token başka yerde hâlâ geçerli kalırdı.
 */
export async function DELETE() {
  try {
    const payload = await getPayloadClient();
    const headers = await nextHeaders();
    const { user } = await payload.auth({ headers });

    if (user) {
      // Bu kullanıcının tüm oturumlarını sonlandır.
      await payload.update({
        collection: "users",
        id: user.id,
        data: { sessions: [] } as never,
        overrideAccess: true,
      });
    }
  } catch {
    // Oturum zaten geçersizse bir şey yapmaya gerek yok; çerezi yine de düşürüyoruz.
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
