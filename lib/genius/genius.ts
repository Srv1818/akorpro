import { parse } from "node-html-parser";
import { decode } from "he";

export type GeniusSearchHit = {
  id: number;
  title: string;
  artist: string;
  fullTitle: string;
  url?: string;
  thumbnailUrl?: string;
};

function getGeniusToken(): string {
  const token = process.env.GENIUS_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("GENIUS_ACCESS_TOKEN eksik. .env.local içine ekleyin.");
  }
  return token;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getGeniusToken()}`,
  };
}

type GeniusSearchResponse = {
  response?: {
    hits?: Array<{
      result?: {
        id: number;
        title: string;
        full_title?: string;
        url?: string;
        song_art_image_thumbnail_url?: string;
        primary_artist?: { name?: string };
      };
    }>;
  };
};

type GeniusSongResponse = {
  response?: {
    song?: {
      id: number;
      url?: string;
    };
  };
}

export async function searchGeniusSongs(query: string, limit = 8): Promise<GeniusSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const max = Math.max(1, Math.min(20, limit));
  const url = `https://api.genius.com/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Genius search failed (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as GeniusSearchResponse;
  const hits = data.response?.hits ?? [];

  return hits
    .map((h) => h.result)
    .filter((r): r is NonNullable<typeof r> => Boolean(r && typeof r.id === "number"))
    .slice(0, max)
    .map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.primary_artist?.name ?? "",
      fullTitle: r.full_title ?? `${r.title} - ${r.primary_artist?.name ?? ""}`.trim(),
      url: r.url,
      thumbnailUrl: r.song_art_image_thumbnail_url,
    }));
}

export async function getGeniusLyricsBySongId(songId: number): Promise<string> {
  const metaRes = await fetch(`https://api.genius.com/songs/${songId}`, {
    headers: authHeaders(),
  });
  if (!metaRes.ok) {
    const text = await metaRes.text().catch(() => "");
    throw new Error(`Genius song meta failed (${metaRes.status}): ${text || metaRes.statusText}`);
  }
  const meta = (await metaRes.json()) as GeniusSongResponse;
  const songUrl = meta.response?.song?.url?.trim();
  if (!songUrl) throw new Error("Genius song URL bulunamadı.");

  // Genius lyrics API ile gelmiyor; sayfadan scrape ediyoruz.
  const htmlRes = await fetch(songUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
  });
  if (!htmlRes.ok) {
    const text = await htmlRes.text().catch(() => "");
    throw new Error(`Genius song page failed (${htmlRes.status}): ${text || htmlRes.statusText}`);
  }

  const html = await htmlRes.text();
  const root = parse(html);

  const containers = root.querySelectorAll('[data-lyrics-container="true"]');
  const text = containers
    .map((el) =>
      el
        .innerText.replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (!text) {
    // Fallback: older markup sometimes stores lyrics in `.lyrics` container.
    const legacy = root.querySelector(".lyrics")?.innerText?.trim();
    if (legacy) return legacy;
    throw new Error("Lyrics bulunamadı (sayfa markup değişmiş olabilir).");
  }

  // Genius sayfası bazen başa "Contributors / Translations / ... Lyrics" gibi meta metinler ekleyebiliyor.
  let cleaned = text;
  const head = cleaned.slice(0, 250).toLowerCase();
  const lyricsIdx = head.indexOf("lyrics");
  if (lyricsIdx >= 0) {
    cleaned = cleaned.slice(lyricsIdx + "lyrics".length).trim();
  }
  // Footer'da bazen "Embed" gibi artifaktlar olabiliyor.
  cleaned = cleaned.replace(/\n?\s*Embed\s*$/i, "").trim();

  // HTML entity'leri düzelt (örn: &quot; -> ", &#x27; -> ').
  return decode(cleaned);
}

