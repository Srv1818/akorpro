import { headers as nextHeaders } from "next/headers";
import { STAFF_ROLES } from "@/lib/auth/constants";
import { getPayloadClient } from "@/lib/payload/client";
import type { SessionUser } from "@/lib/auth/session-user";

export type { SessionUser };

/**
 * Oturumdaki kullanıcı — Payload.
 *
 * Directus sürümünde bu, her çağrıda Directus'a bir HTTP isteği demekti.
 * Payload'da `payload.auth()` çerezi aynı süreç içinde çözüyor; ağ turu yok.
 *
 * Çerez yoksa veya geçersizse `null` döner — çağıranlar bunu bekliyor.
 */
export async function getServerSessionUser(): Promise<SessionUser | null> {
  try {
    const payload = await getPayloadClient();
    const { user } = await payload.auth({ headers: await nextHeaders() });

    if (!user) return null;

    const role = (user as { role?: string | null }).role ?? null;
    const displayName =
      (user as { displayName?: string | null }).displayName || user.email || null;

    return {
      uid: String(user.id),
      email: user.email ?? null,
      // Google ile gelen hesap sağlayıcı tarafından doğrulanmış sayılır;
      // parolalı hesapları yönetici açıyor.
      emailVerified: true,
      signInProvider: (user as { googleId?: string | null }).googleId ? "google" : "password",
      admin: role != null && STAFF_ROLES.includes(role),
      role,
      displayName,
    };
  } catch {
    return null;
  }
}
