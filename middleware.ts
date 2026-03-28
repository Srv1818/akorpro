import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyFirebaseJwt } from "@/lib/auth/verify-firebase-jwt";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export async function middleware(request: NextRequest) {
  if (!projectId) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(request);
  }

  try {
    await verifyFirebaseJwt(token, projectId);
    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (returnTo && returnTo !== "/giris") {
    url.searchParams.set("returnTo", returnTo);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/calma-listeleri/:path*"],
};
