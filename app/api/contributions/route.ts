import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { createContribution, getContributionsByUser } from "@/lib/firestore/contributions";
import { sanitizePlainField, sanitizeTextContent } from "@/lib/security/sanitize";
import { rateLimiter } from "@/lib/security/rate-limit";
import type { KeyMode } from "@/lib/types/content";

export const runtime = "nodejs";

const contribRl = rateLimiter({ windowMs: 300_000, max: 5 });

const VALID_KEY_MODES: KeyMode[] = ["major", "natural", "harmonic", "melodic"];

function inferKeyModeFromOriginalKey(originalKey: string): KeyMode {
  const k = originalKey.trim().toLowerCase();
  if (k.endsWith("maj")) return "major";
  if (k.endsWith("m")) return "natural";
  return "major";
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!contribRl.check(clientIp)) {
    return NextResponse.json({ error: "Çok fazla katkı gönderimi. 5 dakika bekleyin." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const songTitle = sanitizePlainField(b.songTitle);
  const artistName = sanitizePlainField(b.artistName);
  const chordBody = typeof b.chordBody === "string" ? sanitizeTextContent(b.chordBody) : "";
  const originalKey = sanitizePlainField(b.originalKey);
  const genre = sanitizePlainField(b.genre);
  const difficulty = sanitizePlainField(b.difficulty);
  const keyModeRaw = sanitizePlainField(b.keyMode);
  const keyMode = keyModeRaw && VALID_KEY_MODES.includes(keyModeRaw as KeyMode) ? (keyModeRaw as KeyMode) : undefined;
  const finalKeyMode = keyMode ?? inferKeyModeFromOriginalKey(originalKey);

  if (!songTitle || !artistName || !chordBody || !originalKey || !genre || !difficulty) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  if (!["kolay", "orta", "zor"].includes(difficulty)) {
    return NextResponse.json({ error: "Geçersiz zorluk." }, { status: 400 });
  }

  const tempo =
    typeof b.tempo === "number"
      ? b.tempo
      : typeof b.tempo === "string" && b.tempo.trim()
        ? b.tempo.trim()
        : undefined;
  const timeSignature = typeof b.timeSignature === "string" ? b.timeSignature.trim() : undefined;
  const capo =
    typeof b.capo === "number" && !Number.isNaN(b.capo)
      ? b.capo
      : typeof b.capo === "string" && b.capo.trim() !== ""
        ? Number(b.capo)
        : undefined;
  const capoSafe = capo !== undefined && !Number.isNaN(capo) ? capo : undefined;
  const copyrightSource =
    typeof b.copyrightSource === "string" && b.copyrightSource.trim()
      ? b.copyrightSource.trim()
      : undefined;

  try {
    const id = await createContribution({
      songTitle,
      artistName,
      chordBody,
      originalKey,
      keyMode: finalKeyMode,
      genre,
      difficulty: difficulty as "kolay" | "orta" | "zor",
      tempo,
      timeSignature,
      tuning: typeof b.tuning === "string" ? b.tuning : undefined,
      capo: capoSafe,
      copyrightSource,
      contributorUid: user.uid,
      contributorDisplayName: user.email ?? "Anonim",
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("contributions POST", e);
    return NextResponse.json(
      {
        error:
          "Katkı kaydedilemiyor. Sunucuda Firebase Admin için FIREBASE_SERVICE_ACCOUNT_KEY tanımlı ve geçerli olmalı.",
      },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const uidParam = searchParams.get("uid");
  const targetUid = user.admin && uidParam ? uidParam : user.uid;

  try {
    const contributions = await getContributionsByUser(targetUid);
    return NextResponse.json({ contributions });
  } catch (e) {
    console.error("contributions GET", e);
    return NextResponse.json(
      {
        error:
          "Katkı listesi okunamıyor. FIREBASE_SERVICE_ACCOUNT_KEY tanımlı ve geçerli olmalı.",
      },
      { status: 503 },
    );
  }
}
