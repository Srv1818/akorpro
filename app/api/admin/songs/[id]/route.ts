import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSongByIdAdmin, updateSong, deleteSong } from "@/lib/firestore/admin-songs";
import { songTag, songsArtistTag, TAGS } from "@/lib/cache/tags";
import { chordPath } from "@/lib/paths";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
import {
  inferKeyModeFromOriginalKey,
  keyModeToGamlarCatalogScaleId,
  normalizeGamlarScaleIdForKeyMode,
} from "@/lib/music/key-mode-gamlar";
import type { KeyMode } from "@/lib/types/content";

const VALID_KEY_MODES: KeyMode[] = ["major", "natural", "harmonic", "melodic"];

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const song = await getSongByIdAdmin(id);
  if (!song) return NextResponse.json({ error: "Şarkı bulunamadı." }, { status: 404 });

  return NextResponse.json(
    { song },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const existing = await getSongByIdAdmin(id);
  if (!existing) return NextResponse.json({ error: "Şarkı bulunamadı." }, { status: 404 });

  const b = body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof b.title === "string") updates.title = sanitizePlainField(b.title);
  if (typeof b.slug === "string") updates.slug = sanitizePlainField(b.slug);
  if (typeof b.artistName === "string") updates.artistName = sanitizePlainField(b.artistName);
  if (typeof b.artistSlug === "string") updates.artistSlug = sanitizePlainField(b.artistSlug);
  if (typeof b.artistId === "string") updates.artistId = sanitizePlainField(b.artistId);
  if (typeof b.chordBody === "string") updates.chordBody = sanitizeTextContent(b.chordBody);
  if (typeof b.originalKey === "string") updates.originalKey = sanitizePlainField(b.originalKey);
  if (typeof b.difficulty === "string") updates.difficulty = sanitizePlainField(b.difficulty);
  if (typeof b.genre === "string") updates.genre = sanitizePlainField(b.genre);
  if (typeof b.keyMode === "string") {
    const keyModeRaw = sanitizePlainField(b.keyMode);
    if (keyModeRaw && VALID_KEY_MODES.includes(keyModeRaw as KeyMode)) updates.keyMode = keyModeRaw as KeyMode;
  }
  if (b.tempo !== undefined) updates.tempo = b.tempo;
  if (typeof b.timeSignature === "string") updates.timeSignature = b.timeSignature;
  if (typeof b.tuning === "string") updates.tuning = b.tuning;
  if (typeof b.capo === "number") updates.capo = b.capo;
  if (typeof b.copyrightSource === "string") updates.copyrightSource = b.copyrightSource;
  if (typeof b.moderationStatus === "string") updates.moderationStatus = b.moderationStatus;
  if (typeof b.popularity === "number") updates.popularity = b.popularity;
  if (typeof b.showHarmonyDetails === "boolean") updates.showHarmonyDetails = b.showHarmonyDetails;
  if (typeof b.harmonyDetailsNotes === "string") updates.harmonyDetailsNotes = sanitizeTextContent(b.harmonyDetailsNotes);

  const existingKeyMode: KeyMode = existing.keyMode ?? inferKeyModeFromOriginalKey(existing.originalKey);
  const nextKeyMode: KeyMode =
    typeof updates.keyMode !== "undefined" ? (updates.keyMode as KeyMode) : existingKeyMode;

  if (typeof b.gamlarScaleId === "string") {
    const gRaw = sanitizePlainField(b.gamlarScaleId);
    updates.gamlarScaleId =
      gRaw === ""
        ? keyModeToGamlarCatalogScaleId(nextKeyMode)
        : (normalizeGamlarScaleIdForKeyMode(gRaw, nextKeyMode) ?? keyModeToGamlarCatalogScaleId(nextKeyMode));
  } else if (typeof updates.keyMode !== "undefined" && updates.keyMode !== existingKeyMode) {
    updates.gamlarScaleId = keyModeToGamlarCatalogScaleId(updates.keyMode as KeyMode);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const before = existing;
  await updateSong(id, updates, auth.user.uid);
  const after = await getSongByIdAdmin(id);

  if (before) {
    revalidateTag(songTag(before.artistSlug, before.slug), "max");
    revalidateTag(songsArtistTag(before.artistSlug), "max");
    revalidatePath(chordPath(before.artistSlug, before.slug), "page");
  }
  if (after) {
    revalidateTag(songTag(after.artistSlug, after.slug), "max");
    revalidateTag(songsArtistTag(after.artistSlug), "max");
    revalidatePath(chordPath(after.artistSlug, after.slug), "page");
  }
  revalidateTag(TAGS.SONGS_ALL, "max");
  revalidateTag(TAGS.SONGS_FACETS, "max");
  revalidateTag(TAGS.DISCOVER_POPULAR, "max");
  revalidateTag(TAGS.DISCOVER_NEW, "max");
  revalidateTag(TAGS.DISCOVER_FEATURED, "max");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const song = await getSongByIdAdmin(id);
  await deleteSong(id, auth.user.uid);

  if (song) {
    revalidateTag(songTag(song.artistSlug, song.slug), "max");
    revalidateTag(songsArtistTag(song.artistSlug), "max");
    revalidatePath(chordPath(song.artistSlug, song.slug), "page");
  }
  revalidateTag(TAGS.SONGS_ALL, "max");
  revalidateTag(TAGS.SONGS_FACETS, "max");
  revalidateTag(TAGS.DISCOVER_POPULAR, "max");
  revalidateTag(TAGS.DISCOVER_NEW, "max");
  revalidateTag(TAGS.DISCOVER_FEATURED, "max");

  return NextResponse.json({ ok: true });
}
