import { NextResponse } from "next/server";
import { searchContent, getPopularArtists } from "@/lib/firestore/search";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const searchRl = rateLimiter({ windowMs: 60_000, max: 60 });

export async function GET(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!searchRl.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    const popular = await getPopularArtists(6);
    return NextResponse.json({ songs: [], artists: [], popular, empty: true });
  }

  const results = await searchContent(q, 20);
  if (results.songs.length === 0 && results.artists.length === 0) {
    const popular = await getPopularArtists(6);
    return NextResponse.json({ ...results, popular, empty: true });
  }

  return NextResponse.json({ ...results, empty: false });
}
