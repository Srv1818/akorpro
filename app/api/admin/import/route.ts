import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { validateImportPayload } from "@/lib/firestore/import-validator";
import { writeAuditLog } from "@/lib/security/audit-log";

export const runtime = "nodejs";

function db() {
  const fs = getAdminFirestore();
  if (!fs) throw new Error("Firestore Admin başlatılamadı.");
  return fs;
}

/**
 * Bulk import songs.
 * POST /api/admin/import
 * Body: { songs: [...], dryRun?: boolean }
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
  if (!Array.isArray(b.songs)) {
    return NextResponse.json({ error: "`songs` dizisi zorunlu." }, { status: 400 });
  }

  if (b.songs.length > 500) {
    return NextResponse.json({ error: "Tek seferde en fazla 500 şarkı." }, { status: 400 });
  }

  const { valid, errors } = validateImportPayload(b.songs);

  if (b.dryRun) {
    return NextResponse.json({
      dryRun: true,
      validCount: valid.length,
      errorCount: errors.length,
      errors: errors.slice(0, 50),
    });
  }

  if (errors.length > 0 && valid.length === 0) {
    return NextResponse.json(
      { error: "Hiç geçerli kayıt yok.", errors: errors.slice(0, 50) },
      { status: 400 },
    );
  }

  const firestore = db();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const BATCH_SIZE = 500;
  let imported = 0;

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = firestore.batch();
    const chunk = valid.slice(i, i + BATCH_SIZE);

    for (const row of chunk) {
      const ref = firestore.collection("songs").doc();
      batch.set(ref, {
        title: row.title,
        slug: row.slug,
        artistName: row.artistName,
        artistSlug: row.artistSlug,
        artistId: row.artistSlug,
        chordBody: row.chordBody,
        originalKey: row.originalKey,
        difficulty: row.difficulty,
        genre: row.genre,
        moderationStatus: "approved",
        tempo: row.tempo ?? null,
        timeSignature: row.timeSignature ?? null,
        tuning: row.tuning ?? null,
        capo: row.capo ?? null,
        copyrightSource: row.copyrightSource ?? null,
        popularity: row.popularity ?? 0,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    imported += chunk.length;
  }

  await writeAuditLog(auth.user.uid, "bulk-import", "songs", "*", {
    totalRows: b.songs.length,
    imported,
    errorCount: errors.length,
  });

  return NextResponse.json({
    ok: true,
    imported,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  });
}
