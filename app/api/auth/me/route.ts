import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { canPublishSongs, publisherGateActive } from "@/lib/auth/publisher";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerSessionUser();
  return NextResponse.json({
    user,
    publisherGateActive: publisherGateActive(),
    canPublishSongs: user ? canPublishSongs(user.uid) : false,
  });
}
