import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  DISCOVER_MAX_SONG_IDS,
  getDiscoverSectionsAdmin,
  isDiscoverSection,
  setDiscoverSectionSongIds,
} from "@/lib/firestore/admin-discover";
import { TAGS } from "@/lib/cache/tags";

export const runtime = "nodejs";

function discoverTagForSection(section: string): string | null {
  if (section === "popular") return TAGS.DISCOVER_POPULAR;
  if (section === "new") return TAGS.DISCOVER_NEW;
  if (section === "featured") return TAGS.DISCOVER_FEATURED;
  return null;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const sections = await getDiscoverSectionsAdmin();
    return NextResponse.json(
      { sections },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Keşfet verisi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const section = typeof b.section === "string" ? b.section : "";
  if (!isDiscoverSection(section)) {
    return NextResponse.json({ error: "Geçersiz bölüm (popular | new | featured)." }, { status: 400 });
  }

  if (!Array.isArray(b.songIds)) {
    return NextResponse.json({ error: "`songIds` dizi olmalı." }, { status: 400 });
  }

  const songIds = b.songIds.filter((id): id is string => typeof id === "string");
  if (songIds.length > DISCOVER_MAX_SONG_IDS) {
    return NextResponse.json(
      { error: `En fazla ${DISCOVER_MAX_SONG_IDS} şarkı ID'si.` },
      { status: 400 },
    );
  }

  try {
    const normalized = await setDiscoverSectionSongIds(section, songIds, auth.user.uid);
    const tag = discoverTagForSection(section);
    if (tag) revalidateTag(tag, "max");
    revalidatePath("/", "page");
    return NextResponse.json({ ok: true, section, songIds: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
