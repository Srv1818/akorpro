import { NextResponse } from "next/server";
import { SESSION_COOKIE_MAX_MS, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { sessionPostRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!sessionPostRateLimiter.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (FIREBASE_SERVICE_ACCOUNT_KEY)." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const idToken =
    typeof body === "object" && body !== null && "idToken" in body
      ? (body as { idToken?: unknown }).idToken
      : undefined;

  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "idToken gerekli." }, { status: 400 });
  }

  const expiresIn = SESSION_COOKIE_MAX_MS;

  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const res = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });
    return res;
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth/session] createSessionCookie:", code || e);
    }
    return NextResponse.json({ error: "Oturum oluşturulamadı." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
