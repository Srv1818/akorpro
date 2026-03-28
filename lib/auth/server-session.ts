import type { JWTPayload } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/session-user";
import { verifyFirebaseJwt } from "@/lib/auth/verify-firebase-jwt";
import { getAdminAuth } from "@/lib/firebase/admin";

export type { SessionUser };

function claimsFromJwtPayload(payload: JWTPayload): Pick<SessionUser, "emailVerified" | "signInProvider"> {
  const rec = payload as Record<string, unknown>;
  const rawEv = rec.email_verified;
  const emailVerified = rawEv === true || rawEv === "true";
  const fb = rec.firebase;
  let signInProvider: string | null = null;
  if (fb && typeof fb === "object" && fb !== null && "sign_in_provider" in fb) {
    const p = (fb as { sign_in_provider?: unknown }).sign_in_provider;
    signInProvider = typeof p === "string" ? p : null;
  }
  return { emailVerified, signInProvider };
}

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const auth = getAdminAuth();
  if (auth) {
    try {
      const decoded = await auth.verifySessionCookie(raw, true);
      const firebaseClaim = decoded.firebase as { sign_in_provider?: string } | undefined;
      return {
        uid: decoded.uid,
        email: decoded.email ?? null,
        emailVerified: decoded.email_verified === true,
        signInProvider: firebaseClaim?.sign_in_provider ?? null,
        admin: decoded.admin === true,
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
    const { emailVerified, signInProvider } = claimsFromJwtPayload(payload);
    const admin = (payload as Record<string, unknown>).admin === true;
    return { uid, email, emailVerified, signInProvider, admin };
  } catch {
    return null;
  }
}
