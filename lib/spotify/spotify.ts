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

type GetSongBpmResult = { bpm?: number; key?: string };

type GetSongBpmResponse = {
  search?: Array<{
    bpm?: string | number;
    key_of?: string;
  }>;
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
  return cachedToken.value;
}

async function spotifyFetch<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify API failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

async function fetchSongBpm(title: string, artist: string): Promise<GetSongBpmResult> {
  const apiKey = process.env.GETSONGBPM_API_KEY?.trim();
  if (!apiKey) return {};
  try {
    const lookup = encodeURIComponent(`${title} ${artist}`);
    const url = `https://api.getsongbpm.com/search/?api_key=${apiKey}&type=both&lookup=${lookup}`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = (await res.json()) as GetSongBpmResponse;
    const first = data.search?.[0];
    if (!first) return {};
    const bpm = first.bpm !== undefined ? Number(first.bpm) : undefined;
    return {
      bpm: bpm && !isNaN(bpm) ? bpm : undefined,
      key: first.key_of ?? undefined,
    };
  } catch {
    return {};
  }
}

function getsongbpmKeyToOriginalKey(key: string | undefined): { originalKey?: string; keyMode?: "major" | "natural" } {
  if (!key) return {};
  const trimmed = key.trim();
  if (!trimmed) return {};
  // "Am", "C#m" → minor; "A", "C#" → major
  if (trimmed.endsWith("m")) {
    return { originalKey: trimmed, keyMode: "natural" };
  }
  return { originalKey: trimmed, keyMode: "major" };
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

  const songBpm = await fetchSongBpm(title, artist);
  const mapped = getsongbpmKeyToOriginalKey(songBpm.key);

  return {
    trackId: track.id,
    trackName: track.name,
    artistName: track.artists?.[0]?.name ?? artist,
    spotifyUrl: track.external_urls?.spotify,
    tempo: songBpm.bpm,
    timeSignature: undefined,
    originalKey: mapped.originalKey,
    keyMode: mapped.keyMode,
  };
}
