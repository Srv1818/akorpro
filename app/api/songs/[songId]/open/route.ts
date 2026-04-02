import { NextRequest, NextResponse } from "next/server";
import { getSongById } from "@/lib/firestore/songs";
import { chordPath } from "@/lib/paths";
import { safeInternalReturnPath } from "@/lib/nav/safe-return-to";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ songId: string }> }) {
  const { songId } = await ctx.params;
  if (!songId?.trim()) {
    return new NextResponse(null, { status: 404 });
  }

  const song = await getSongById(songId);
  if (!song || song.moderationStatus !== "approved") {
    return new NextResponse(null, { status: 404 });
  }

  const targetPath = chordPath(song.artistSlug, song.slug);
  const incoming = req.nextUrl.searchParams;
  const out = new URLSearchParams();

  const rt = safeInternalReturnPath(incoming.get("returnTo") ?? undefined);
  if (rt) out.set("returnTo", rt);

  const scene = incoming.get("scene");
  if (scene === "1" || scene === "true") out.set("scene", "1");

  const transpose = incoming.get("transpose");
  if (transpose != null && transpose !== "") {
    const n = Number(transpose);
    if (Number.isFinite(n)) out.set("transpose", String(n));
  }

  const qs = out.toString();
  const location = `${targetPath}${qs ? `?${qs}` : ""}`;
  return NextResponse.redirect(new URL(location, req.nextUrl.origin));
}
