import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizePlainField } from "@/lib/security/sanitize";
import { resolveSpotifyKeyBpm } from "@/lib/spotify/spotify";

export const runtime = "nodejs";

/**
 * POST /api/admin/spotify/resolve
 * Body: { title: string, artist: string }
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
  const title = sanitizePlainField(b.title);
  const artist = sanitizePlainField(b.artist);

  if (!title || !artist) {
    return NextResponse.json({ error: "`title` ve `artist` zorunlu." }, { status: 400 });
  }

  try {
    const resolved = await resolveSpotifyKeyBpm({ title, artist });
    return NextResponse.json(
      { resolved },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spotify çözümleme başarısız.";
    // Spotify 403'ü (developer mode / premium) kullanıcıya net göster.
    if (typeof message === "string" && message.includes("Spotify API failed (403)")) {
      return NextResponse.json(
        {
          error:
            `${message}\n\n` +
            "Not: Spotify 2026 itibarıyla bazı hesap/app durumlarında audio-features için app owner Premium ve/veya ek erişim isteyebiliyor. " +
            "Premium'u yeni aldıysanız birkaç saat sonra düzelebilir; devam ederse app'i Premium olan hesapla yeniden oluşturun.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

