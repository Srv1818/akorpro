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
import { CircleOfFifths } from "@/components/tools/circle-of-fifths";
import { AutoScrollButton, MetronomeButton } from "@/components/preview/preview-toolbar";
import { GamlarScaleExplorer } from "@/components/gamlar/gamlar-scale-explorer";
import { FloatingWidgetDock } from "@/components/layout/floating-widget-dock";
import type { PlaylistDoc } from "@/lib/types/playlist";
import type { SongOverrideDoc } from "@/lib/types/song-override";
import type { KeyMode } from "@/lib/types/content";
import { useFirebaseUidFromSession } from "@/lib/auth/use-firebase-uid-from-session";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";
import { getClientFirestore } from "@/lib/firebase/client";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";
import { PC_TO_NAME, noteNameToPitchClass } from "@/lib/music/note-utils";

const OVERRIDE_SCHEMA_VERSION = 1;

type Props = {
  songId: string;
  songTitle: string;
  artistSlug: string;
  songSlug: string;
  originalKey: string;
  keyMode?: KeyMode;
  chordBody: string;
  tempo?: number | string;
  timeSignature?: string;
  serverUid: string | null;
};

type PlaylistRow = { id: string; name: string };

function formatError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "Bilinmeyen hata";
}

function parseTonicFromOriginalKey(key: string): string {
  const k = key.trim();
  // Örn: "Am" -> "A", "Em" -> "E", "Cmaj" -> "C"
  if (k.toLowerCase().endsWith("maj")) return k.slice(0, -3).trim();
  if (k.length > 1 && k.toLowerCase().endsWith("m")) return k.slice(0, -1).trim();
  return k;
}

function signedSemitoneDelta(fromPc: number, toPc: number): number {
  const raw = (toPc - fromPc + 12) % 12;
  return raw > 6 ? raw - 12 : raw; // [-6..+5]
}

function transposeChordToken(token: string, semitones: number): string {
  // Basit akor formatı: Root + opsiyonel kalite (m, maj, dim, aug, sus2, sus4) + opsiyonel sayı (7, 9 vb.)
  // Örn: Cm, Am, A7, Bb, F#, Dm7
  const m = token.match(/^([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4)?(\d+)?$/i);
  if (!m) return token;
  const root = m[1];
  const quality = m[2] ?? "";
  const digits = m[3] ?? "";

  const rootPc = noteNameToPitchClass(root);
  if (rootPc === null) return token;

  const newPc = (rootPc + semitones + 120) % 12;
  const newRoot = PC_TO_NAME[newPc];
  return `${newRoot}${quality}${digits}`;
}

function transposeChordBodyText(text: string, semitones: number): string {
  if (!text) return text;
  if (!Number.isFinite(semitones) || semitones === 0) return text;

  const chordTokenRegex = /\b([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4)?(\d+)?\b/gi;

  return text.replace(chordTokenRegex, (full, root: string, quality: string | undefined, digits: string | undefined) => {
    const suffix = `${quality ?? ""}${digits ?? ""}`;
    return transposeChordToken(`${root}${suffix}`, semitones);
  });
}

function keyModeToLabel(mode: KeyMode | undefined, originalKey: string): string {
  if (mode === "major") return "Majör";
  if (mode === "natural") return "Doğal Minör";
  if (mode === "harmonic") return "Harmonik Minör";
  if (mode === "melodic") return "Melodik Minör";

  // Backwards-compat: keyMode yoksa orijinal ton ismine göre tahmin.
  const k = originalKey.trim().toLowerCase();
  if (k.endsWith("maj")) return "Majör";
  if (k.endsWith("m")) return "Doğal Minör";
  return "Majör";
}

export function PreviewClient({
  songId,
  songTitle,
  artistSlug,
  songSlug,
  originalKey,
  keyMode,
  chordBody,
  tempo,
  timeSignature,
  serverUid,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sceneMode, setSceneMode] = useState(false);

  const semitones = usePreviewToolsStore((s) => s.transposeSemitones);
  const setTransposeSemitones = usePreviewToolsStore((s) => s.setTransposeSemitones);
  const resetTonalAndTranspose = usePreviewToolsStore((s) => s.resetTonalAndTranspose);
  const [activeWidget, setActiveWidget] = useState<null | "circle" | "gamlar">(null);

  const initialBpm =
    typeof tempo === "number"
      ? Number.isFinite(tempo)
        ? tempo
        : undefined
      : typeof tempo === "string"
        ? (() => {
            const n = Number(tempo);
            return Number.isFinite(n) ? n : undefined;
          })()
        : undefined;

  const initialTimeSignature = typeof timeSignature === "string" && timeSignature.trim() ? timeSignature : undefined;

  const initialBpmNumber = initialBpm ?? 120;
  const initialTimeSignatureValue = initialTimeSignature ?? "4/4";

  const [metronomeActive, setMetronomeActive] = useState(false);
  const [metronomeOpen, setMetronomeOpen] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(initialBpmNumber);
  const [metronomeTimeSignature, setMetronomeTimeSignature] = useState(initialTimeSignatureValue);

  useEffect(() => {
    // Yeni şarkıya geçildiğinde metronomu "orijinal" tempo/ölçüyle sıfırla.
    setMetronomeActive(false);
    setMetronomeOpen(false);
    setMetronomeBpm(initialBpmNumber);
    setMetronomeTimeSignature(initialTimeSignatureValue);
    setSaveAndAddOpen(false);
  }, [songId, initialBpmNumber, initialTimeSignatureValue]);

  const fromUrl = Number(searchParams.get("transpose") ?? "0");
  const initial = Number.isFinite(fromUrl) ? fromUrl : 0;

  const TRANSPOSE_SEMITONE_MIN = -6;
  const TRANSPOSE_SEMITONE_MAX = 5;
  const clampTranspose = (n: number) => Math.max(TRANSPOSE_SEMITONE_MIN, Math.min(TRANSPOSE_SEMITONE_MAX, n));
  const initialClamped = clampTranspose(initial);

  const originalTonicPc = (() => {
    const tonic = parseTonicFromOriginalKey(originalKey);
    return noteNameToPitchClass(tonic);
  })();

  const firebaseUid = useFirebaseUidFromSession();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveAndAddOpen, setSaveAndAddOpen] = useState(false);

  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addNotice, setAddNotice] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const urlTransposeRef = useRef(0);

  const hydrateReadyRef = useRef(false);

  const displayedChordBody = (() => {
    // chordBody'yi transpoze etmek, UI transpoze state’i ile birebir senkron olmalı.
    // Memo yerine hızlı fonksiyon çağrısı (metin boyutu küçük/orta) tercih edildi.
    // (İstersen daha sonra useMemo ile optimize edebiliriz.)
    return transposeChordBodyText(chordBody, semitones);
  })();

  useEffect(() => {
    if (!activeWidget) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveWidget(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeWidget]);

  /**
   * Sync URL param → store, but only when the value genuinely differs from what
   * replaceTranspose / resetOriginal already set.  This prevents a redundant
   * Zustand set() — and the resulting subscriber cascade — that used to fire on
   * every searchParam update triggered by router.replace().
   */
  useEffect(() => {
    if (initialClamped !== urlTransposeRef.current) {
      setTransposeSemitones(initialClamped);
    }
    urlTransposeRef.current = initialClamped;
    // setTransposeSemitones is a stable Zustand action; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClamped]);

  useEffect(() => {
    hydrateReadyRef.current = false;
  }, [songId, firebaseUid]);

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
          setTransposeSemitones(t);
        }
      } catch {
        if (!cancelled) hydrateReadyRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUid, songId, initial, setTransposeSemitones]);

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
      setTransposeSemitones(n);
      urlTransposeRef.current = n;
      const q = n === 0 ? "" : `?transpose=${n}`;
      router.replace(`${pathname}${q}`, { scroll: false });
    },
    [pathname, router, setTransposeSemitones],
  );

  // Ok tuşlarıyla yarım ses (semitone) hareketi.
  useEffect(() => {
    if (activeWidget || saveAndAddOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if ((t as any).isContentEditable) return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        replaceTranspose(clampTranspose(semitones - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        replaceTranspose(clampTranspose(semitones + 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeWidget, saveAndAddOpen, replaceTranspose, semitones]);

  const resetOriginal = useCallback(() => {
    resetTonalAndTranspose();
    urlTransposeRef.current = 0;
    setMetronomeActive(false);
    setMetronomeOpen(false);
    setMetronomeBpm(initialBpmNumber);
    setMetronomeTimeSignature(initialTimeSignatureValue);
    router.replace(pathname, { scroll: false });
  }, [
    pathname,
    resetTonalAndTranspose,
    router,
    initialBpmNumber,
    initialTimeSignatureValue,
  ]);

  const onSave = useCallback(async () => {
    setSaveMessage(null);
    if (!firebaseUid) {
      setSaveState("error");
      setSaveMessage("Önce giriş yapın.");
      setSaveAndAddOpen(false);
      return;
    }
    if (serverUid && serverUid !== firebaseUid) {
      setSaveState("error");
      setSaveMessage("Tarayıcı oturumu ile sunucu çerezi eşleşmiyor. Çıkış yapıp yeniden giriş yapın.");
      setSaveAndAddOpen(false);
      return;
    }
    if (!getFirebasePublicConfig()) {
      setSaveState("error");
      setSaveMessage("Firebase istemci yapılandırması eksik.");
      setSaveAndAddOpen(false);
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
      setSaveAndAddOpen(true);
    } catch (e) {
      setSaveState("error");
      setSaveMessage(formatError(e));
      setSaveAndAddOpen(false);
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
      setSaveAndAddOpen(false);
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

  const widgetTitle = activeWidget === "gamlar" ? "Gamlar" : "5'li Çember";
  const widgetMaxWidthClass = activeWidget === "gamlar" ? "max-w-6xl" : "max-w-5xl";

  return (
    <div className={sceneMode ? "rounded-2xl ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""}>
      {sessionMismatch ? (
        <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          Sunucu oturumu ile tarayıcı Firebase oturumu eşleşmiyor. Çıkış yapıp yeniden giriş yapın.
        </p>
      ) : null}

      {saveAndAddOpen ? (
        <div
          className="fixed inset-0 z-60 bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Kaydet ve listeye ekle"
          onMouseDown={() => setSaveAndAddOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3">
              <p className="text-sm font-medium text-foreground">Kaydet ve listeye ekle</p>
              <button
                type="button"
                onClick={() => setSaveAndAddOpen(false)}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface"
              >
                Kapat
              </button>
            </div>

            <div className="p-4">
              {addNotice ? (
                <p
                  className={`mb-3 text-sm ${addNotice.variant === "error" ? "text-red-200" : "text-muted"}`}
                  role={addNotice.variant === "error" ? "alert" : "status"}
                >
                  {addNotice.message}
                </p>
              ) : null}

              <label htmlFor="preview-playlist-modal" className="block text-xs font-medium text-muted">
                Listeye ekle
              </label>
              <select
                id="preview-playlist-modal"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                disabled={playlists.length === 0 || addBusy}
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2 disabled:opacity-50"
              >
                {playlists.length === 0 ? <option value="">Henüz liste yok</option> : null}
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={!canAddToPlaylist || addBusy}
                  onClick={() => void onAddToPlaylist()}
                  className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addBusy ? "Ekleniyor…" : "Listeye ekle"}
                </button>
                <button
                  type="button"
                  onClick={() => setSaveAndAddOpen(false)}
                  className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveWidget((w) => (w === "circle" ? null : "circle"))}
              aria-pressed={activeWidget === "circle"}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                activeWidget === "circle"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-bg text-foreground hover:border-accent/50"
              }`}
            >
              5&apos;li Çember
            </button>
            <button
              type="button"
              onClick={() => setActiveWidget((w) => (w === "gamlar" ? null : "gamlar"))}
              aria-pressed={activeWidget === "gamlar"}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                activeWidget === "gamlar"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-bg text-foreground hover:border-accent/50"
              }`}
            >
              Gamlar
            </button>
            <MetronomeButton
              active={metronomeActive}
              onActiveChange={(next) => {
                setMetronomeActive(next);
                setMetronomeOpen(next);
              }}
              bpm={metronomeBpm}
              onBpmChange={setMetronomeBpm}
              timeSignature={metronomeTimeSignature}
              onTimeSignatureChange={setMetronomeTimeSignature}
              showControls={false}
            />
            <AutoScrollButton />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px] text-muted">
          <div className="rounded-lg border border-border bg-surface px-2 py-1">
            Ton: <span className="font-mono text-foreground">{originalKey}</span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-2 py-1">
            BPM:{" "}
            <span className="font-mono text-foreground">
              {tempo ?? "-"}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-2 py-1">
            Ölçü:{" "}
            <span className="font-mono text-foreground">
              {timeSignature ?? "-"}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-2 py-1">
            Mod:{" "}
            <span className="font-mono text-foreground">
              {keyModeToLabel(keyMode, originalKey)}
            </span>
          </div>

          <button
            type="button"
            onClick={resetOriginal}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-[11px] font-medium text-foreground hover:bg-surface"
          >
            Orijinale dön
          </button>
        </div>
      </div>

      {activeWidget ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={widgetTitle}
          onMouseDown={() => setActiveWidget(null)}
        >
          <div
            className={`mx-auto flex h-full max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface ${widgetMaxWidthClass}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
              <p className="text-sm font-medium text-foreground">{widgetTitle}</p>
              <button
                type="button"
                onClick={() => setActiveWidget(null)}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface"
              >
                Kapat
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {activeWidget === "circle" ? (
                <div className="mx-auto max-w-5xl">
                  <CircleOfFifths variant="full" />
                </div>
              ) : (
                <div className="mx-auto max-w-6xl">
                  <GamlarScaleExplorer />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Transpoze kontrolleri (ok tuşları)">
          <span className="text-sm text-muted" id="transpose-label">Transpoze:</span>
          <div className="flex flex-wrap items-center gap-1" aria-describedby="transpose-label">
            {Array.from({ length: 12 }, (_, pc) => {
              const label = PC_TO_NAME[pc];
              const delta = originalTonicPc === null ? 0 : signedSemitoneDelta(originalTonicPc, pc);
              const isActive = semitones === delta;

              return (
                <button
                  key={pc}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => replaceTranspose(delta)}
                  className={`select-none inline-flex min-w-[2.5rem] justify-center rounded-md border px-1.5 py-1 text-xs font-medium leading-none transition ${
                    isActive
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-bg text-foreground hover:border-accent/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={!canSave || saveState === "saving"}
            onClick={() => void onSave()}
            title={!firebaseConfigured ? "NEXT_PUBLIC_FIREBASE_* tanımlayın" : undefined}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === "saving" ? "Kaydediliyor…" : "Kaydet ve Listeye ekle"}
          </button>
          {firebaseUid === undefined ? (
            <span className="text-sm text-muted">Oturum kontrol ediliyor…</span>
          ) : firebaseUid === null ? (
            <Link
              href={`/giris?returnTo=${encodeURIComponent(pathname)}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
            >
              Giriş (Kaydet için)
            </Link>
          ) : null}
        </div>
      </div>

      {playlists.length === 0 && firebaseUid && !sessionMismatch ? (
        <p className="mt-2 text-right text-sm text-muted">
          Liste oluşturmak için{" "}
          <Link href="/calma-listeleri" className="text-accent underline-offset-2 hover:underline">
            çalma listeleri
          </Link>{" "}
          sayfasına gidin.
        </p>
      ) : null}

      <div aria-live="polite" aria-atomic="true">
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
      </div>

      {/* Çalma araçları: (Kopyala/Yazdır kaldırıldı) */}

      <article className="mt-4 rounded-2xl border border-border bg-bg p-4 sm:p-6 print:border-0 print:p-0" id="chord-body">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-loose text-foreground sm:text-base sm:leading-relaxed">{displayedChordBody}</pre>
      </article>

      <div className="print:hidden">
        <FloatingWidgetDock open={metronomeOpen} zClassName={activeWidget ? "z-60" : "z-40"}>
          <MetronomeButton
            active={metronomeActive}
            onActiveChange={(next) => {
              setMetronomeActive(next);
              setMetronomeOpen(next);
            }}
            bpm={metronomeBpm}
            onBpmChange={setMetronomeBpm}
            timeSignature={metronomeTimeSignature}
            onTimeSignatureChange={setMetronomeTimeSignature}
            showToggle={false}
            showControls={true}
          />
        </FloatingWidgetDock>
      </div>
    </div>
  );
}
