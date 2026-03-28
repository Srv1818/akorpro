import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSong, getAllSongsAdmin } from "@/lib/firestore/admin-songs";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
import type { Difficulty } from "@/lib/types/content";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const songs = await getAllSongsAdmin();
  return NextResponse.json({ songs });
}

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
  const title = sanitizePlainField(b.title);
  const slug = sanitizePlainField(b.slug);
  const artistName = sanitizePlainField(b.artistName);
  const artistSlug = sanitizePlainField(b.artistSlug);
  const artistId = sanitizePlainField(b.artistId);
  const chordBody = typeof b.chordBody === "string" ? sanitizeTextContent(b.chordBody) : "";
  const originalKey = sanitizePlainField(b.originalKey);
  const difficulty = sanitizePlainField(b.difficulty);
  const genre = sanitizePlainField(b.genre);

  if (!title || !slug || !artistName || !artistSlug || !chordBody || !originalKey || !difficulty || !genre) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  const id = await createSong(
    {
      title,
      slug,
      artistId: artistId || artistSlug,
      artistSlug,
      artistName,
      chordBody,
      originalKey,
      difficulty: difficulty as Difficulty,
      genre,
      tempo: typeof b.tempo === "number" || typeof b.tempo === "string" ? b.tempo : undefined,
      timeSignature: typeof b.timeSignature === "string" ? b.timeSignature : undefined,
      tuning: typeof b.tuning === "string" ? b.tuning : undefined,
      capo: typeof b.capo === "number" ? b.capo : undefined,
      copyrightSource: typeof b.copyrightSource === "string" ? b.copyrightSource : undefined,
      contributorIds: Array.isArray(b.contributorIds) ? b.contributorIds as string[] : undefined,
      popularity: typeof b.popularity === "number" ? b.popularity : undefined,
    },
    auth.user.uid,
  );

  return NextResponse.json({ ok: true, id });
}
