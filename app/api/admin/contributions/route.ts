import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPublishSongs } from "@/lib/auth/publisher";
import { getPendingContributions, getContributionById, updateContributionStatus } from "@/lib/firestore/contributions";
import { createSong } from "@/lib/firestore/admin-songs";
import { writeAuditLog } from "@/lib/security/audit-log";
import { TAGS } from "@/lib/cache/tags";
import type { KeyMode } from "@/lib/types/content";

export const runtime = "nodejs";

const VALID_KEY_MODES: KeyMode[] = ["major", "natural", "harmonic", "melodic"];

function inferKeyModeFromOriginalKey(originalKey: string): KeyMode {
  const k = originalKey.trim().toLowerCase();
  if (k.endsWith("maj")) return "major";
  if (k.endsWith("m")) return "natural";
  return "major";
}

/** List pending contributions */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const contributions = await getPendingContributions();
  return NextResponse.json({ contributions });
}

/**
 * Approve or reject a contribution.
 * POST /api/admin/contributions
 * Body: { id, action: "approve" | "reject", note? }
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
  const id = typeof b.id === "string" ? b.id : "";
  const action = typeof b.action === "string" ? b.action : "";
  const note = typeof b.note === "string" ? b.note : undefined;

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id ve action (approve/reject) zorunlu." }, { status: 400 });
  }

  const contrib = await getContributionById(id);
  if (!contrib) {
    return NextResponse.json({ error: "Katkı bulunamadı." }, { status: 404 });
  }

  if (action === "approve") {
    const songModerationStatus = canPublishSongs(auth.user.uid) ? "approved" : "pending";

    const slug = contrib.songTitle
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöçâîû\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    const artistSlug = contrib.artistName
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöçâîû\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const songId = await createSong(
      {
        title: contrib.songTitle,
        slug,
        artistId: artistSlug,
        artistSlug,
        artistName: contrib.artistName,
        chordBody: contrib.chordBody,
        originalKey: contrib.originalKey,
        keyMode: (contrib.keyMode && VALID_KEY_MODES.includes(contrib.keyMode as KeyMode) ? contrib.keyMode as KeyMode : undefined)
          ?? inferKeyModeFromOriginalKey(contrib.originalKey),
        difficulty: contrib.difficulty,
        genre: contrib.genre,
        tempo: contrib.tempo,
        timeSignature: contrib.timeSignature,
        tuning: contrib.tuning,
        capo: contrib.capo,
        copyrightSource: contrib.copyrightSource,
        contributorIds: [contrib.contributorUid],
        moderationStatus: songModerationStatus,
      },
      auth.user.uid,
    );

    await updateContributionStatus(id, "approved", auth.user.uid, note, songId);

    revalidateTag(TAGS.SONGS_ALL, "max");
    revalidateTag(TAGS.SONGS_FACETS, "max");

    await writeAuditLog(auth.user.uid, "contribution:approve", "contributions", id, { songId });

    return NextResponse.json({ ok: true, songId });
  }

  await updateContributionStatus(id, "rejected", auth.user.uid, note);
  await writeAuditLog(auth.user.uid, "contribution:reject", "contributions", id, { note });

  return NextResponse.json({ ok: true });
}
