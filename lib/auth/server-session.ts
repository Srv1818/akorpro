import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyFirebaseJwt } from "@/lib/auth/verify-firebase-jwt";
import { getAdminAuth } from "@/lib/firebase/admin";

export type ServerSessionUser = {
  uid: string;
  email: string | null;
};

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const auth = getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifySessionCookie(raw, true);
      return {
        uid: decoded.uid,
        email: decoded.email ?? null,
      };
    } catch {
      return null;
    }
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  try {
    const payload = await verifyFirebaseJwt(raw, projectId);
    const uid = typeof payload.sub === "string" ? payload.sub : null;
    if (!uid) return null;
    const email = typeof payload.email === "string" ? payload.email : null;
    return { uid, email };
  } catch {
    return null;
  }
}
