import { NextResponse } from "next/server";
import { rateLimiter } from "@/lib/security/rate-limit";
import { getAdminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const claimsRl = rateLimiter({ windowMs: 60_000, max: 10 });

type Body = {
  uid?: unknown;
  email?: unknown;
  admin?: unknown;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Set custom claims (admin bootstrap).
 *
 * POST /api/admin/claims
 * Authorization: Bearer <ADMIN_CLAIMS_SECRET>
 * Body: { uid: string } OR { email: string }, admin: boolean
 */
export async function POST(request: Request) {
  const secret = process.env.ADMIN_CLAIMS_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_CLAIMS_SECRET yapılandırılmamış." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!claimsRl.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin başlatılamadı — FIREBASE_SERVICE_ACCOUNT_KEY eksik olabilir." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Geçersiz JSON.");
  }

  const b = body as Body;
  const uid = typeof b.uid === "string" ? b.uid.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const admin = b.admin === true;

  if (!uid && !email) return badRequest("`uid` veya `email` zorunlu.");
  if (b.admin !== true && b.admin !== false) return badRequest("`admin` boolean olmalı (true/false).");

  const targetUid = uid
    ? uid
    : (await adminAuth.getUserByEmail(email).catch(() => null))?.uid ?? "";

  if (!targetUid) return badRequest("Kullanıcı bulunamadı (uid/email).");

  await adminAuth.setCustomUserClaims(targetUid, { admin });

  return NextResponse.json({ ok: true, uid: targetUid, claims: { admin } });
}

