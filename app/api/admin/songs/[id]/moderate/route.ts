import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { moderateSong, getSongByIdAdmin } from "@/lib/firestore/admin-songs";
import { songTag, songsArtistTag, TAGS } from "@/lib/cache/tags";
import type { ModerationStatus } from "@/lib/types/firestore";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES: ModerationStatus[] = ["draft", "pending", "approved", "rejected"];

export async function POST(request: Request, ctx: Ctx) {
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
  const status = b.status as string;
  const note = typeof b.note === "string" ? b.note : undefined;

  if (!VALID_STATUSES.includes(status as ModerationStatus)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  await moderateSong(id, status as ModerationStatus, auth.user.uid, note);

  if (status === "approved") {
    const song = await getSongByIdAdmin(id);
    if (song) {
      revalidateTag(songTag(song.artistSlug, song.slug), "page");
      revalidateTag(songsArtistTag(song.artistSlug), "page");
    }
    revalidateTag(TAGS.SONGS_ALL, "page");
    revalidateTag(TAGS.SONGS_FACETS, "page");
    revalidateTag(TAGS.DISCOVER_POPULAR, "page");
    revalidateTag(TAGS.DISCOVER_NEW, "page");
    revalidateTag(TAGS.DISCOVER_FEATURED, "page");
  }

  return NextResponse.json({ ok: true });
}
