import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
import { getGeniusLyricsBySongId } from "@/lib/genius/genius";
import { cleanLyricsText } from "@/lib/lyrics/clean";

export const runtime = "nodejs";

/**
 * POST /api/admin/genius/lyrics
 * Body: { songId: number|string }
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const songId =
    typeof b.songId === "number"
      ? b.songId
      : (() => {
          const songIdRaw = sanitizePlainField(b.songId);
          return songIdRaw ? Number(songIdRaw) : NaN;
        })();

  if (!Number.isFinite(songId)) {
    return NextResponse.json({ error: "`songId` zorunlu." }, { status: 400 });
  }

  try {
    const lyrics = await getGeniusLyricsBySongId(songId);
    const cleanedLyrics = cleanLyricsText(sanitizeTextContent(lyrics));
    return NextResponse.json(
      { lyrics: cleanedLyrics },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Genius lyrics alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

