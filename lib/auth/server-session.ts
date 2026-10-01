import { headers as nextHeaders } from "next/headers";
import { unstable_rethrow } from "next/navigation";
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
 *
 * `unstable_rethrow` ŞART. Buradaki `catch` eskiden her şeyi yutuyordu,
 * Next'in kendi kontrol akışı hatalarını da. `nextHeaders()` bir istek-anı
 * API'si: sayfa derleme sırasında önceden üretilmeye çalışılırken bilerek
 * hata fırlatıyor ki Next o rotayı dinamik işaretlesin. O hata yutulunca
 * Next sayfayı statik sanıyor ve `user: null` ile üretip HTML'e gömüyor.
 *
 * Sonucu ağırdı: /calma-listeleri ve /katki derlemede "giriş yapmanız
 * gerekir" olarak dondu. Kullanıcı giriş yapmış olsa, başlıkta avatarı
 * görünse bile bu sayfalar hep çıkış yapmış hali gösteriyordu. (2026-10-01)
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
  } catch (err) {
    // Önce Next'in kendi sinyalleri geçsin (headers/cookies, notFound, redirect).
    unstable_rethrow(err);
    return null;
  }
}
