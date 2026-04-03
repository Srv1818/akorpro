import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { DISCOVER_MAX_SONG_IDS, getFeaturedSongIdsAdmin, setFeaturedSongIds } from "@/lib/firestore/admin-discover";
import { TAGS } from "@/lib/cache/tags";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const songIds = await getFeaturedSongIdsAdmin();
    return NextResponse.json(
      { featured: songIds },
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
  if (b.section != null && b.section !== "featured") {
    return NextResponse.json(
      { error: "Popüler ve yeni eklenenler otomatik; yalnızca editör seçimi (featured) düzenlenebilir." },
      { status: 400 },
    );
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
    const normalized = await setFeaturedSongIds(songIds, auth.user.uid);
    revalidateTag(TAGS.DISCOVER_FEATURED, "max");
    revalidatePath("/", "page");
    return NextResponse.json({ ok: true, section: "featured" as const, songIds: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
