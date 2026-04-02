import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSong, getAllSongsAdmin } from "@/lib/firestore/admin-songs";
import { TAGS } from "@/lib/cache/tags";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
import type { Difficulty, KeyMode } from "@/lib/types/content";

const VALID_KEY_MODES: KeyMode[] = ["major", "natural", "harmonic", "melodic"];

function inferKeyModeFromOriginalKey(originalKey: string): KeyMode {
  const k = originalKey.trim().toLowerCase();
  // Örn "Am", "Em", "Dm" -> doğal minör kabul edilir.
  if (k.endsWith("maj")) return "major";
  if (k.endsWith("m")) return "natural";
  return "major";
}

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const songs = await getAllSongsAdmin();
    return NextResponse.json(
      { songs },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şarkılar alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
  const keyModeRaw = sanitizePlainField(b.keyMode);
  const keyMode = keyModeRaw && VALID_KEY_MODES.includes(keyModeRaw as KeyMode) ? (keyModeRaw as KeyMode) : undefined;
  const finalKeyMode = keyMode ?? inferKeyModeFromOriginalKey(originalKey);

  if (!title || !slug || !artistName || !artistSlug || !chordBody || !originalKey || !difficulty || !genre) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  let id: string;
  try {
    id = await createSong(
      {
        title,
        slug,
        artistId: artistId || artistSlug,
        artistSlug,
        artistName,
        chordBody,
        originalKey,
        difficulty: difficulty as Difficulty,
        keyMode: finalKeyMode,
        genre,
        tempo: typeof b.tempo === "number" || typeof b.tempo === "string" ? b.tempo : undefined,
        timeSignature: typeof b.timeSignature === "string" ? b.timeSignature : undefined,
        tuning: typeof b.tuning === "string" ? b.tuning : undefined,
        capo: typeof b.capo === "number" ? b.capo : undefined,
        copyrightSource: typeof b.copyrightSource === "string" ? b.copyrightSource : undefined,
        contributorIds: Array.isArray(b.contributorIds) ? (b.contributorIds as string[]) : undefined,
        popularity: typeof b.popularity === "number" ? b.popularity : undefined,
      },
      auth.user.uid,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şarkı oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  revalidateTag(TAGS.SONGS_ALL, "max");
  revalidateTag(TAGS.SONGS_FACETS, "max");
  revalidateTag(TAGS.DISCOVER_POPULAR, "max");
  revalidateTag(TAGS.DISCOVER_NEW, "max");
  revalidateTag(TAGS.DISCOVER_FEATURED, "max");

  return NextResponse.json({ ok: true, id });
}
