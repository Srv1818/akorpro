import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateMetodBolumler } from "@/lib/firestore/admin-metodlar";
import { TAGS } from "@/lib/cache/tags";
import type { BolumDoc, DersDoc, IcerikBlok } from "@/lib/types/firestore";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

function parseBlok(b: unknown): IcerikBlok {
  const k = b as Record<string, unknown>;
  return {
    tip: (["metin", "video", "resim", "alphatab"].includes(String(k.tip)) ? k.tip : "metin") as IcerikBlok["tip"],
    icerik: String(k.icerik ?? ""),
  };
}

function parseDers(d: unknown): DersDoc {
  const k = d as Record<string, unknown>;
  return {
    id: String(k.id ?? ""),
    baslik: String(k.baslik ?? ""),
    altBaslik: String(k.altBaslik ?? ""),
    sira: Number(k.sira ?? 0),
    icerikBloklar: Array.isArray(k.icerikBloklar) ? k.icerikBloklar.map(parseBlok) : [],
  };
}

function parseBolum(b: unknown): BolumDoc {
  const k = b as Record<string, unknown>;
  return {
    id: String(k.id ?? ""),
    baslik: String(k.baslik ?? ""),
    sira: Number(k.sira ?? 0),
    dersler: Array.isArray(k.dersler) ? k.dersler.map(parseDers) : [],
  };
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.bolumler))
    return NextResponse.json({ error: "bolumler dizisi zorunlu." }, { status: 400 });

  const bolumler: BolumDoc[] = (b.bolumler as unknown[]).map(parseBolum);

  await updateMetodBolumler(id, bolumler, auth.user.uid);
  revalidateTag(TAGS.METODLAR_ALL, "max");
  return NextResponse.json({ ok: true });
}
