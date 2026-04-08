import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import admin from "firebase-admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPublishSongs } from "@/lib/auth/publisher";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { TAGS } from "@/lib/cache/tags";
import { validateImportPayload } from "@/lib/firestore/import-validator";
import { writeAuditLog } from "@/lib/security/audit-log";
import { sanitizeTextContent } from "@/lib/security/sanitize";
import {
  inferKeyModeFromOriginalKey,
  keyModeToGamlarCatalogScaleId,
  keyModeToGamlarFamily,
  normalizeGamlarScaleIdForKeyMode,
} from "@/lib/music/key-mode-gamlar";
import type { KeyMode } from "@/lib/types/content";
import { GAMLAR_SCALE_CATALOG, normalizeGamlarScaleId } from "@/data/gamlar-scale-catalog";

export const runtime = "nodejs";

function normalizeKeyModeAlias(raw: unknown): KeyMode | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (v === "major" || v === "majör") return "major";
  if (v === "natural" || v === "natural-minor" || v === "minor" || v === "minör" || v === "aeolian") return "natural";
  if (v === "harmonic" || v === "harmonic-minor") return "harmonic";
  if (v === "melodic" || v === "melodic-minor") return "melodic";
  return undefined;
}

function normalizeScaleAlias(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[()]/g, " ")
    .replace(/[#♯]/g, "sharp")
    .replace(/[♭]/g, "flat")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findGamlarScaleIdByLabel(rawScale: string, km: KeyMode): string | undefined {
  const label = normalizeScaleAlias(rawScale);
  if (!label) return undefined;

  // Common external/export aliases seen in third-party tools.
  const explicit: Record<string, string> = {
    "harmonic minor": "hm-harmonic",
    "hm harmonic minor": "hm-harmonic",
    "hm-harmonic-minor": "hm-harmonic",
    "phrygian dominant": "hm-phrygian-dom",
    "hm phrygian dominant": "hm-phrygian-dom",
    "hm-phrygian-dominant": "hm-phrygian-dom",
    "melodic minor jazz minor": "mm-melodic",
    "melodic minor": "mm-melodic",
    "altered scale super locrian": "mm-altered",
    "super locrian": "mm-altered",
    "locrian nat2": "mm-locrian-nat2",
    "locrian natural2": "mm-locrian-nat2",
    "dorian b2": "mm-dorian-b2",
    "lydian dominant lydian b7": "mm-lydian-dom",
    "mixolydian b6 melodic major": "mm-mixolydian-b6",
    "ionian major": "maj-ionian",
    dorian: "maj-dorian",
    phrygian: "maj-phrygian",
    lydian: "maj-lydian",
    mixolydian: "maj-mixolydian",
    "aeolian natural minor": "nm-aeolian",
    aeolian: "nm-aeolian",
    locrian: "maj-locrian",
  };
  const explicitId = explicit[label];
  if (explicitId && normalizeGamlarScaleIdForKeyMode(explicitId, km)) {
    return explicitId;
  }

  // Catalog name match (e.g. "Ionian (Major)", "Phrygian Dominant", etc.)
  const byName = GAMLAR_SCALE_CATALOG.find((entry) => normalizeScaleAlias(entry.name) === label)?.id;
  if (byName && normalizeGamlarScaleIdForKeyMode(byName, km)) {
    return byName;
  }

  return undefined;
}

function normalizeRowsForImport(rows: unknown[]): unknown[] {
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    const rec = row as Record<string, unknown>;
    const next: Record<string, unknown> = { ...rec };

    const keyMode =
      normalizeKeyModeAlias(rec.keyMode) ??
      normalizeKeyModeAlias(rec.mode) ??
      normalizeKeyModeAlias(rec.tonModu);
    if (keyMode) next.keyMode = keyMode;

    const rawScale =
      (typeof rec.gamlarScaleId === "string" ? rec.gamlarScaleId : undefined) ??
      (typeof rec.scaleId === "string" ? rec.scaleId : undefined) ??
      (typeof rec.scale === "string" ? rec.scale : undefined) ??
      (typeof rec.altMode === "string" ? rec.altMode : undefined);

    if (typeof rawScale === "string" && rawScale.trim()) {
      const km =
        keyMode ??
        inferKeyModeFromOriginalKey(typeof rec.originalKey === "string" ? rec.originalKey : "");
      const normalizedDirect = normalizeGamlarScaleIdForKeyMode(rawScale, km);
      if (normalizedDirect) {
        next.gamlarScaleId = normalizedDirect;
      } else {
        const byLabel = findGamlarScaleIdByLabel(rawScale, km);
        if (byLabel) {
          next.gamlarScaleId = byLabel;
          return next;
        }
        // Some external exports send "aeolian/dorian..." as alt mode names.
        // Try family-prefixed IDs to preserve intended family.
        const slug = rawScale.trim().toLowerCase();
        const family = keyModeToGamlarFamily(km);
        const prefix = family === "major" ? "maj" : family === "natural-minor" ? "nm" : family === "harmonic-minor" ? "hm" : "mm";
        const byFamily = normalizeGamlarScaleId(`${prefix}-${slug}`);
        if (byFamily && normalizeGamlarScaleIdForKeyMode(byFamily, km)) {
          next.gamlarScaleId = byFamily;
        }
      }
    }

    return next;
  });
}

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
  const normalizedRows = normalizeRowsForImport(b.songs);

  if (b.songs.length > 500) {
    return NextResponse.json({ error: "Tek seferde en fazla 500 şarkı." }, { status: 400 });
  }

  const { valid, errors } = validateImportPayload(normalizedRows);

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
  const importModerationStatus = canPublishSongs(auth.user.uid) ? "approved" : "pending";

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
        keyMode: row.keyMode ?? inferKeyModeFromOriginalKey(row.originalKey),
        gamlarScaleId: (() => {
          const km = row.keyMode ?? inferKeyModeFromOriginalKey(row.originalKey);
          return (
            normalizeGamlarScaleIdForKeyMode(row.gamlarScaleId, km) ?? keyModeToGamlarCatalogScaleId(km)
          );
        })(),
        difficulty: row.difficulty,
        genre: row.genre,
        moderationStatus: importModerationStatus,
        tempo: row.tempo ?? null,
        timeSignature: row.timeSignature ?? null,
        tuning: row.tuning ?? null,
        capo: row.capo ?? null,
        copyrightSource: row.copyrightSource ?? null,
        popularity: row.popularity ?? 0,
        ...(row.showHarmonyDetails !== undefined ? { showHarmonyDetails: row.showHarmonyDetails } : {}),
        ...(typeof row.harmonyDetailsNotes === "string"
          ? { harmonyDetailsNotes: sanitizeTextContent(row.harmonyDetailsNotes) }
          : {}),
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

  // Keşfet blokları `unstable_cache` ile tag'leniyor; bulk import sonrası hemen invalidation yap.
  revalidateTag(TAGS.SONGS_ALL, "max");
  revalidateTag(TAGS.SONGS_FACETS, "max");
  revalidateTag(TAGS.DISCOVER_POPULAR, "max");
  revalidateTag(TAGS.DISCOVER_NEW, "max");
  revalidateTag(TAGS.DISCOVER_FEATURED, "max");

  return NextResponse.json({
    ok: true,
    imported,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  });
}
