"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { PlaylistDoc } from "@/lib/types/playlist";
import type { SongOverrideDoc } from "@/lib/types/song-override";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";
import { getClientAuth, getClientFirestore } from "@/lib/firebase/client";

const OVERRIDE_SCHEMA_VERSION = 1;

type Props = {
  songId: string;
  songTitle: string;
  artistSlug: string;
  songSlug: string;
  originalKey: string;
  chordBody: string;
  serverUid: string | null;
};

type PlaylistRow = { id: string; name: string };

function formatError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "Bilinmeyen hata";
}

export function PreviewClient({
  songId,
  songTitle,
  artistSlug,
  songSlug,
  originalKey,
  chordBody,
  serverUid,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sceneMode, setSceneMode] = useState(false);

  const fromUrl = Number(searchParams.get("transpose") ?? "0");
  const initial = Number.isFinite(fromUrl) ? fromUrl : 0;
  const [semitones, setSemitones] = useState(initial);

  const [firebaseUid, setFirebaseUid] = useState<string | null | undefined>(undefined);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addNotice, setAddNotice] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const urlTransposeRef = useRef(0);

  const hydrateReadyRef = useRef(false);

  useEffect(() => {
    urlTransposeRef.current = initial;
  }, [initial]);

  useEffect(() => {
    setSemitones(initial);
  }, [initial]);

  useEffect(() => {
    hydrateReadyRef.current = false;
  }, [songId, firebaseUid]);

  useEffect(() => {
    if (!getFirebasePublicConfig()) {
      setFirebaseUid(null);
      return;
    }
    try {
      const auth = getClientAuth();
      const unsub = auth.onAuthStateChanged((u) => {
        setFirebaseUid(u?.uid ?? null);
      });
      return () => unsub();
    } catch {
      setFirebaseUid(null);
    }
  }, []);

  useEffect(() => {
    if (firebaseUid === undefined || firebaseUid === null || !songId) return;
    if (hydrateReadyRef.current) return;

    if (initial !== 0) {
      hydrateReadyRef.current = true;
      return;
    }

    if (!getFirebasePublicConfig()) {
      hydrateReadyRef.current = true;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const db = getClientFirestore();
        const snap = await getDoc(doc(db, "users", firebaseUid, "songOverrides", songId));
        if (cancelled) return;
        if (urlTransposeRef.current !== 0) {
          hydrateReadyRef.current = true;
          return;
        }
        hydrateReadyRef.current = true;
        if (!snap.exists) return;
        const data = snap.data() as Partial<SongOverrideDoc>;
        const t = data.transposeSemitones;
        if (typeof t === "number" && Number.isFinite(t)) {
          urlTransposeRef.current = t;
          setSemitones(t);
        }
      } catch {
        if (!cancelled) hydrateReadyRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUid, songId, initial]);

  useEffect(() => {
    if (firebaseUid === undefined || firebaseUid === null || !getFirebasePublicConfig()) {
      setPlaylists([]);
      return;
    }
    let cancelled = false;
    try {
      const db = getClientFirestore();
      const q = query(collection(db, "users", firebaseUid, "playlists"), orderBy("updatedAt", "desc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          setPlaylists(
            snap.docs.map((d) => {
              const data = d.data() as PlaylistDoc;
              return { id: d.id, name: typeof data.name === "string" ? data.name : d.id };
            }),
          );
        },
        () => {
          if (!cancelled) setPlaylists([]);
        },
      );
      return () => {
        cancelled = true;
        unsub();
      };
    } catch {
      setPlaylists([]);
    }
  }, [firebaseUid]);

  useEffect(() => {
    if (!selectedPlaylistId && playlists.length > 0) {
      setSelectedPlaylistId(playlists[0].id);
    }
    if (selectedPlaylistId && !playlists.some((p) => p.id === selectedPlaylistId)) {
      setSelectedPlaylistId(playlists[0]?.id ?? "");
    }
  }, [playlists, selectedPlaylistId]);

  const replaceTranspose = useCallback(
    (n: number) => {
      setSemitones(n);
      urlTransposeRef.current = n;
      const q = n === 0 ? "" : `?transpose=${n}`;
      router.replace(`${pathname}${q}`, { scroll: false });
    },
    [pathname, router],
  );

  const resetOriginal = useCallback(() => {
    setSemitones(0);
    urlTransposeRef.current = 0;
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const onSave = useCallback(async () => {
    setSaveMessage(null);
    if (!firebaseUid) {
      setSaveState("error");
      setSaveMessage("Önce giriş yapın.");
      return;
    }
    if (serverUid && serverUid !== firebaseUid) {
      setSaveState("error");
      setSaveMessage("Tarayıcı oturumu ile sunucu çerezi eşleşmiyor. Çıkış yapıp yeniden giriş yapın.");
      return;
    }
    if (!getFirebasePublicConfig()) {
      setSaveState("error");
      setSaveMessage("Firebase istemci yapılandırması eksik.");
      return;
    }
    setSaveState("saving");
    try {
      const db = getClientFirestore();
      const payload: SongOverrideDoc = {
        songId,
        transposeSemitones: semitones,
        schemaVersion: OVERRIDE_SCHEMA_VERSION,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", firebaseUid, "songOverrides", songId), payload, { merge: true });
      setSaveState("saved");
      setSaveMessage("Tercih kaydedildi.");
    } catch (e) {
      setSaveState("error");
      setSaveMessage(formatError(e));
    }
  }, [firebaseUid, semitones, serverUid, songId]);

  const onAddToPlaylist = useCallback(async () => {
    setAddNotice(null);
    if (!firebaseUid) {
      setAddNotice({ variant: "error", message: "Önce giriş yapın." });
      return;
    }
    if (serverUid && serverUid !== firebaseUid) {
      setAddNotice({
        variant: "error",
        message: "Oturum eşleşmiyor; çıkış yapıp yeniden giriş yapın.",
      });
      return;
    }
    if (!selectedPlaylistId) {
      setAddNotice({
        variant: "error",
        message: "Önce bir liste seçin veya çalma listelerinden liste oluşturun.",
      });
      return;
    }
    setAddBusy(true);
    try {
      const db = getClientFirestore();
      const itemsCol = collection(db, "users", firebaseUid, "playlists", selectedPlaylistId, "items");
      const existing = await getDocs(query(itemsCol, orderBy("order", "desc")));
      const top = existing.docs[0]?.data() as { order?: unknown } | undefined;
      const nextOrder = typeof top?.order === "number" ? top.order + 1 : 0;
      await addDoc(itemsCol, {
        order: nextOrder,
        songId,
        title: songTitle,
        artistSlug,
        songSlug,
        transposeSemitones: semitones,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", firebaseUid, "playlists", selectedPlaylistId), {
        updatedAt: serverTimestamp(),
      });
      setAddNotice({ variant: "success", message: "Şarkı listeye eklendi." });
    } catch (e) {
      setAddNotice({ variant: "error", message: formatError(e) });
    } finally {
      setAddBusy(false);
    }
  }, [
    artistSlug,
    firebaseUid,
    selectedPlaylistId,
    semitones,
    serverUid,
    songId,
    songSlug,
    songTitle,
  ]);

  const firebaseConfigured = Boolean(getFirebasePublicConfig());
  const sessionMismatch = Boolean(serverUid && firebaseUid && serverUid !== firebaseUid);
  const canSave =
    firebaseConfigured && firebaseUid !== undefined && firebaseUid !== null && !sessionMismatch;
  const canAddToPlaylist =
    canSave && Boolean(selectedPlaylistId) && playlists.length > 0;

  return (
    <div className={sceneMode ? "rounded-2xl ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""}>
      {sessionMismatch ? (
        <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          Sunucu oturumu ile tarayıcı Firebase oturumu eşleşmiyor. Çıkış yapıp yeniden giriş yapın.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Önizleme görünümü</p>
          <p className="text-xs text-muted">
            Orijinal ton sunucuda sabit: <span className="font-mono text-foreground">{originalKey}</span> · Transpoze
            görünüm katmanı; tercih Firestore&apos;ta saklanabilir.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={sceneMode}
            onChange={(e) => setSceneMode(e.target.checked)}
            className="h-4 w-4 rounded border-border text-accent"
          />
          Sahne modu (kontrast iskeleti)
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Transpoze:</span>
        {[-2, -1, 0, 1, 2].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => replaceTranspose(n)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              semitones === n
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-bg text-foreground hover:border-accent/50"
            }`}
          >
            {n === 0 ? "0" : n > 0 ? `+${n}` : `${n}`}
          </button>
        ))}
        <button
          type="button"
          onClick={resetOriginal}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
        >
          Orijinale dön
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Görüntülenen transpoze:{" "}
        <span className="font-mono text-foreground">
          {semitones === 0 ? "0" : semitones > 0 ? `+${semitones}` : semitones} yarım ton
        </span>
        {semitones !== 0 ? (
          <span className="block sm:inline sm:pl-2">· Parametreli URL kanonik değildir (ARCHITECTURE).</span>
        ) : null}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canSave || saveState === "saving"}
            onClick={() => void onSave()}
            title={!firebaseConfigured ? "NEXT_PUBLIC_FIREBASE_* tanımlayın" : undefined}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === "saving" ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {firebaseUid === undefined ? (
            <span className="text-sm text-muted">Oturum kontrol ediliyor…</span>
          ) : firebaseUid === null ? (
            <Link
              href={`/giris?returnTo=${encodeURIComponent(pathname)}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              Giriş (Kaydet için)
            </Link>
          ) : (
            <Link
              href="/calma-listeleri"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            >
              Çalma listelerim
            </Link>
          )}
        </div>

        {firebaseUid && !sessionMismatch ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="preview-playlist" className="block text-xs font-medium text-muted">
                Listeye ekle
              </label>
              <select
                id="preview-playlist"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                disabled={playlists.length === 0 || addBusy}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2 disabled:opacity-50"
              >
                {playlists.length === 0 ? (
                  <option value="">Henüz liste yok</option>
                ) : (
                  playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              type="button"
              disabled={!canAddToPlaylist || addBusy}
              onClick={() => void onAddToPlaylist()}
              className="shrink-0 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50 sm:mb-0 sm:py-2"
            >
              {addBusy ? "Ekleniyor…" : "Listeye ekle"}
            </button>
          </div>
        ) : null}
      </div>
      {playlists.length === 0 && firebaseUid && !sessionMismatch ? (
        <p className="mt-2 text-sm text-muted">
          Liste oluşturmak için{" "}
          <Link href="/calma-listeleri" className="text-accent underline-offset-2 hover:underline">
            çalma listeleri
          </Link>{" "}
          sayfasına gidin.
        </p>
      ) : null}
      {addNotice ? (
        <p
          className={`mt-2 text-sm ${addNotice.variant === "error" ? "text-red-200" : "text-muted"}`}
          role={addNotice.variant === "error" ? "alert" : "status"}
        >
          {addNotice.message}
        </p>
      ) : null}
      {saveMessage ? (
        <p
          className={`mt-2 text-sm ${saveState === "error" ? "text-red-200" : "text-muted"}`}
          role={saveState === "error" ? "alert" : "status"}
        >
          {saveMessage}
        </p>
      ) : null}

      <article className="mt-8 rounded-2xl border border-border bg-bg p-6">
        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">{chordBody}</pre>
      </article>
    </div>
  );
}
