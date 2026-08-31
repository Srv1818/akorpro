import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, STAFF_ROLES } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/session-user";
import { directusUrl } from "@/lib/directus/client";

export type { SessionUser };

type DirectusMe = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  provider: string | null;
  status: string;
  role: { name: string } | null;
};

function displayNameOf(me: DirectusMe): string | null {
  const full = [me.first_name, me.last_name].filter(Boolean).join(" ").trim();
  return full || me.email || null;
}

/**
 * Oturumdaki kullanıcı — Directus.
 *
 * Firebase `verifySessionCookie` / custom claim akışının yerine geçer:
 * tarayıcıdaki Directus oturum çerezi doğrudan Directus'a sorulur, yetki
 * kararı **rol adına** göre verilir (eski `admin` custom claim'i yerine).
 *
 * Çerez yoksa veya Directus reddederse `null` döner — çağıranlar bunu bekliyor.
 */
export async function getServerSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  let me: DirectusMe;
  try {
    const res = await fetch(
      `${directusUrl()}/users/me?fields=id,email,first_name,last_name,provider,status,role.name`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    me = (await res.json()).data as DirectusMe;
  } catch {
    return null;
  }

  if (!me?.id || me.status !== "active") return null;

  const role = me.role?.name ?? null;

  return {
    uid: me.id,
    email: me.email,
    // Directus'ta ayrı bir "email verified" alanı yok; SSO ile gelen hesap
    // sağlayıcı tarafından doğrulanmış sayılır, yerel hesaplar admin tarafından açılır.
    emailVerified: true,
    signInProvider: me.provider,
    admin: role != null && STAFF_ROLES.includes(role),
    role,
    displayName: displayNameOf(me),
  };
}
