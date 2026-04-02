import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerSessionUser();
  return NextResponse.json({ user });
}
