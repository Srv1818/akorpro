import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSongByIdAdmin, updateSong, deleteSong } from "@/lib/firestore/admin-songs";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
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

  return NextResponse.json({ song });
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

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  await updateSong(id, updates, auth.user.uid);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  await deleteSong(id, auth.user.uid);
  return NextResponse.json({ ok: true });
}
