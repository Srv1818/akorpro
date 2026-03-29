import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { customTokenRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/**
 * HTTP-only oturum çerezi varken istemci Firebase Auth boşsa Firestore kuralları
 * `request.auth` göremez. Doğrulanmış oturum için kısa ömürlü custom token üretir.
 */
export async function GET(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!customTokenRateLimiter.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 503 });
  }

  try {
    const token = await adminAuth.createCustomToken(user.uid);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Token oluşturulamadı." }, { status: 500 });
  }
}
