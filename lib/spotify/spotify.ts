type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type SpotifySearchTracksResponse = {
  tracks?: {
    items?: Array<{
      id: string;
      name: string;
      popularity?: number;
      artists?: Array<{ id: string; name: string }>;
      external_urls?: { spotify?: string };
    }>;
  };
};

type SpotifyAudioFeaturesResponse = {
  id: string;
  tempo?: number;
  time_signature?: number;
  key?: number; // 0..11, -1 unknown
  mode?: number; // 0 minor, 1 major, -1 unknown
};

type SpotifyErrorPayload = {
  error?: {
    status?: number;
    message?: string;
    reason?: string;
  };
};

type SpotifyResolved = {
  trackId: string;
  trackName: string;
  artistName: string;
  spotifyUrl?: string;
  tempo?: number;
  timeSignature?: string;
  originalKey?: string; // e.g. "Am", "C#"
  keyMode?: "major" | "natural";
};

function getSpotifyClientId(): string {
  const v = process.env.SPOTIFY_CLIENT_ID?.trim();
  if (!v) throw new Error("SPOTIFY_CLIENT_ID eksik.");
  return v;
}

function getSpotifyClientSecret(): string {
  const v = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!v) throw new Error("SPOTIFY_CLIENT_SECRET eksik.");
  return v;
}

let cachedToken: { value: string; expiresAtMs: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - now > 30_000) return cachedToken.value;

  const basic = Buffer.from(`${getSpotifyClientId()}:${getSpotifyClientSecret()}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify token failed (${res.status}): ${text || res.statusText}`);
  }
  const data = (await res.json()) as SpotifyTokenResponse;
  if (!data.access_token) throw new Error("Spotify token alınamadı.");

  cachedToken = { value: data.access_token, expiresAtMs: now + Math.max(0, data.expires_in) * 1000 };
  return data.access_token;
}

async function spotifyFetch<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = text || res.statusText;
    try {
      const parsed = JSON.parse(text) as SpotifyErrorPayload;
      const m = parsed?.error?.message?.trim();
      const r = parsed?.error?.reason?.trim();
      msg = [m, r].filter(Boolean).join(" — ") || msg;
    } catch {
      // ignore JSON parse
    }
    throw new Error(`Spotify API failed (${res.status}): ${msg}`);
  }
  return (await res.json()) as T;
}

function spotifyKeyToOriginalKey(key: number | undefined, mode: number | undefined): { originalKey?: string; keyMode?: "major" | "natural" } {
  if (typeof key !== "number" || key < 0 || key > 11) return {};
  const N = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
  const root = N[key];
  // Spotify: mode 1 = major, 0 = minor
  if (mode === 1) return { originalKey: root, keyMode: "major" };
  if (mode === 0) return { originalKey: `${root}m`, keyMode: "natural" };
  return { originalKey: root };
}

export async function resolveSpotifyKeyBpm(params: { title: string; artist: string }): Promise<SpotifyResolved> {
  const title = params.title.trim();
  const artist = params.artist.trim();
  if (!title || !artist) throw new Error("Spotify için `title` ve `artist` zorunlu.");

  const q = `track:${title} artist:${artist}`;
  const searchUrl = `https://api.spotify.com/v1/search?type=track&limit=5&q=${encodeURIComponent(q)}`;
  const search = await spotifyFetch<SpotifySearchTracksResponse>(searchUrl);
  const items = search.tracks?.items ?? [];
  const track = items[0];
  if (!track?.id) throw new Error("Spotify: eşleşen track bulunamadı.");

  const afUrl = `https://api.spotify.com/v1/audio-features/${encodeURIComponent(track.id)}`;
  const af = await spotifyFetch<SpotifyAudioFeaturesResponse>(afUrl);
  const mapped = spotifyKeyToOriginalKey(af.key, af.mode);

  return {
    trackId: track.id,
    trackName: track.name,
    artistName: track.artists?.[0]?.name ?? artist,
    spotifyUrl: track.external_urls?.spotify,
    tempo: typeof af.tempo === "number" ? af.tempo : undefined,
    timeSignature: typeof af.time_signature === "number" && af.time_signature > 0 ? `${af.time_signature}/4` : undefined,
    originalKey: mapped.originalKey,
    keyMode: mapped.keyMode,
  };
}

