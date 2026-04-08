"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import { GuitarChordDiagramClassic } from "@/components/chords/guitar-chord-diagram-classic";
import { AutoScrollButton, MetronomeControls, MetronomeEngine } from "@/components/preview/preview-toolbar";
import { PreviewGamlarScaleExplorer } from "@/components/gamlar/gamlar-scale-explorer";
import { gamlarScaleById } from "@/data/gamlar-scale-catalog";
import type { PlaylistDoc } from "@/lib/types/playlist";
import type { KeyMode } from "@/lib/types/content";
import { useFirebaseUidFromSession } from "@/lib/auth/use-firebase-uid-from-session";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";
import { getClientFirestore } from "@/lib/firebase/client";
import { keyModeToGamlarCatalogScaleId } from "@/lib/music/key-mode-gamlar";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";
import { PC_TO_NAME, noteNameToPitchClass } from "@/lib/music/note-utils";
import { resolveChordTokenToFingering } from "@/lib/music/chord-fingering";
import { romanNumeralForChordInKey } from "@/lib/music/harmony-details";
import {
  extractChordTokensInOrderAsRendered,
  extractUniqueChordTokensAsRendered,
  formatChordSymbolDisplay,
  parseTonicFromOriginalKey,
  signedSemitoneDelta,
  transposeChordToken,
} from "@/lib/music/transpose";
import { ChevronRight, Info, Mic, MoreHorizontal, X } from "lucide-react";

const PLAYLIST_SCHEMA_VERSION = 1;

/** «Meraklısına daha fazla detay» modalı — varsayılan eğitim / sorumluluk reddi. */
const HARMONY_DETAIL_DEFAULT_DISCLAIMER =
  "Bu özet yalnızca eğitim ve genel bilgi amaçlıdır; hata veya eksiklik olabilir. Metin veya yapılandırma otomatik veya yapay zeka araçlarıyla oluşturulmuş olabilir; kesin veya profesyonel referans olarak kullanılmamalıdır.";

type Props = {
  songId: string;
  songTitle: string;
  artistSlug: string;
  songSlug: string;
  originalKey: string;
  keyMode?: KeyMode;
  /** Sunucunun çözdüğü gamlar kataloğu kimliği; yoksa `keyMode` varsayılanı kullanılır. */
  initialGamlarScaleId?: string;
  chordBody: string;
  tempo?: number | string;
  timeSignature?: string;
  serverUid: string | null;
  /** Firestore `showHarmonyDetails`; false değilse armoni özeti gösterilir. */
  showHarmonyDetails?: boolean;
  /** Firestore `harmonyDetailsNotes` — düzenleyici notu, modalın üstünde. */
  harmonyDetailsNotes?: string;
  prevSong?: { title: string; href: string } | null;
  nextSong?: { title: string; href: string } | null;
};

type PlaylistRow = { id: string; name: string };
type WidgetId = "gamlar" | "metronome";
const INLINE_CHORD_REGEX =
  /(?<![\p{L}\p{M}\p{N}_])([A-G](?:#|b)?)((?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*)(?![\p{L}\p{M}\p{N}_])/gu;
const BRACKET_CHORD_REGEX = /\[([A-G](?:#|b)?(?:(?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*))\]/g;

function lineHasBracketChords(line: string): boolean {
  return new RegExp(BRACKET_CHORD_REGEX.source).test(line);
}

/** Satırda yalnızca boşluk + satır içi akorlar var (klasik “akor satırı / söz satırı” biçimi). */
function isChordOnlySourceLine(line: string): boolean {
  if (!line.trim()) return false;
  if (lineHasBracketChords(line)) return false;
  const re = new RegExp(INLINE_CHORD_REGEX.source, INLINE_CHORD_REGEX.flags);
  const rest = line.replace(re, "").replace(/\s/g, "");
  return rest.length === 0;
}

function formatError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "Bilinmeyen hata";
}

function parsePlaylistIdFromReturnTo(value: string | null): string | null {
  if (!value) return null;
  try {
    // Supported formats (from playlists-manager):
    // returnTo=/calma-listeleri?p=<playlistId>
    // (returnTo itself is URL-encoded in the chord link)
    const url = new URL(value, "http://local");
    if (!url.pathname.startsWith("/calma-listeleri")) return null;
    const p = url.searchParams.get("p");
    return p && p.trim() ? p.trim() : null;
  } catch {
    // Fallback: handle plain string without URL parsing
    const m = value.match(/\/calma-listeleri\b[^#]*[?&]p=([^&]+)/);
    if (!m) return null;
    try {
      const decoded = decodeURIComponent(m[1] ?? "");
      return decoded.trim() ? decoded.trim() : null;
    } catch {
      return m[1]?.trim() ? m[1].trim() : null;
    }
  }
}

function PanelCloseButton({
  onClick,
  variant = "panel",
  className = "",
  title,
}: {
  onClick: () => void;
  variant?: "panel" | "scene";
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2";
  const byVariant =
    variant === "scene"
      ? "text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/50"
      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-accent/40";
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={variant === "scene" ? "Sahne modundan çık" : "Kapat"}
      title={title}
      className={`${base} ${byVariant} ${className}`.trim()}
    >
      <X className="size-3.5" strokeWidth={1.75} aria-hidden />
    </button>
  );
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

/** Sahne çubuğu: yalnızca seçili gamlar katalog etiketi. */
function formatModLineLabel(
  gamlarCatalogScaleId: string,
): string {
  const sub = gamlarScaleById(gamlarCatalogScaleId)?.name?.trim();
  return sub || gamlarCatalogScaleId;
}

function resolveOriginalMode(mode: KeyMode | undefined, originalKey: string): KeyMode {
  if (mode) return mode;
  const k = originalKey.trim().toLowerCase();
  if (k.endsWith("maj")) return "major";
  if (k.endsWith("m")) return "natural";
  return "major";
}

function renderChordTokenNode(token: string, key: string, onClick: () => void): ReactNode {
  return (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className="song-chord-token m-0 inline-block cursor-pointer appearance-none border-0 bg-transparent p-0 align-baseline [font-family:inherit] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      aria-label={`${token} akoru, Akorlar panelini aç`}
    >
      {token}
    </button>
  );
}

function renderChordLine(
  line: string,
  semitones: number,
  onChordClick: () => void,
  keyPrefix = "",
): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(INLINE_CHORD_REGEX.source, INLINE_CHORD_REGEX.flags);
  while ((match = regex.exec(line)) !== null) {
    const full = match[0];
    const displayed = transposeChordToken(full, semitones);
    const index = match.index;
    if (index > lastIndex) {
      const slice = line.slice(lastIndex, index);
      if (slice.length > 0) {
        out.push(
          <span key={`${keyPrefix}ly-${index}-${lastIndex}`} className="song-chord-lyric font-normal">
            {slice}
          </span>,
        );
      }
    }
    out.push(renderChordTokenNode(displayed, `${keyPrefix}${displayed}-${index}`, onChordClick));
    lastIndex = index + full.length;
  }
  if (lastIndex < line.length) {
    const slice = line.slice(lastIndex);
    if (slice.length > 0) {
      out.push(
        <span key={`${keyPrefix}ly-end-${lastIndex}`} className="song-chord-lyric font-normal">
          {slice}
        </span>,
      );
    }
  }
  return out;
}

function renderAlignedBracketLine(
  line: string,
  semitones: number,
  lineIndex: number,
  onChordClick: () => void,
  isLastSourceLine: boolean,
): ReactNode {
  const matches = Array.from(line.matchAll(BRACKET_CHORD_REGEX));
  if (matches.length === 0) return renderChordLine(line, semitones, onChordClick, `L${lineIndex}-`);

  const chordAtPos: Array<{ pos: number; token: string }> = [];
  let lyrics = "";
  let cursor = 0;

  for (const m of matches) {
    const full = m[0];
    const rootToken = m[1] ?? "";
    const idx = m.index ?? 0;
    if (idx > cursor) lyrics += line.slice(cursor, idx);
    chordAtPos.push({
      pos: lyrics.length,
      token: transposeChordToken(rootToken, semitones),
    });
    cursor = idx + full.length;
  }
  if (cursor < line.length) lyrics += line.slice(cursor);

  const nodes: ReactNode[] = [];
  let caret = 0;
  chordAtPos.forEach((item, i) => {
    if (item.pos > caret) nodes.push(" ".repeat(item.pos - caret));
    else if (i > 0) nodes.push(" ");
    nodes.push(renderChordTokenNode(item.token, `bchord-${lineIndex}-${i}-${item.pos}`, onChordClick));
    caret = Math.max(caret, item.pos + item.token.length);
  });

  const pairClass = isLastSourceLine ? "song-chord-pair flex flex-col gap-0" : "song-chord-pair flex flex-col gap-0 mb-2 sm:mb-2.5";
  /* Köşeli [Am] hizasında üst satırı büyütmek monospace sütun hizasını bozar; yalnızca söz yokken (yalnız akor) güvenli. */
  const chordRowClass =
    "block leading-none sm:leading-[1.05] [&_button]:align-baseline" + (!lyrics ? " song-chord-row-stacked" : "");
  const chordRow = <span className={chordRowClass}>{nodes}</span>;

  if (!lyrics) {
    return (
      <span key={`pair-${lineIndex}`} className={pairClass}>
        {chordRow}
      </span>
    );
  }

  return (
    <span key={`pair-${lineIndex}`} className={pairClass}>
      {chordRow}
      <span className="song-chord-lyric -mt-px block font-normal leading-tight sm:leading-snug">{lyrics}</span>
    </span>
  );
}

function codePointChar(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
    return "";
  }
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** Admin/import bazen <strong>, <b>, <h3> vb. gömer; yalnızca bilinen etiketleri kaldırır (&lt; ile şarkı sözü yazan edge-case’leri mümkün olduğunca korur). */
function stripEmbeddedHtmlFromChordBody(text: string): string {
  const withoutTags = text.replace(
    /<\/?(?:strong|b|em|i|u|h[1-6]|p|div|span|br)(?:\s[^>]*)?>/gi,
    "",
  );
  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => codePointChar(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => codePointChar(Number.parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeChordBodyText(text: string): string {
  // Some admin/import flows may send literal `\\n` instead of real newlines.
  // Normalize everything to real `\n` so both rendering and splitting work reliably.
  return stripEmbeddedHtmlFromChordBody(
    text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n"),
  );
}

function renderChordBodyWithHighlights(text: string, semitones: number, onChordClick: () => void): ReactNode {
  const lines = normalizeChordBodyText(text).split("\n");
  const rows: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const isLast = i >= lines.length - 1;
    const next = lines[i + 1];
    const nextNext = lines[i + 2];

    if (line.trim() === "") {
      rows.push(
        <Fragment key={`line-${i}`}>
          <span className="block h-[2px] sm:h-[0.8em]" aria-hidden />
        </Fragment>,
      );
      i += 1;
      continue;
    }

    if (lineHasBracketChords(line)) {
      rows.push(
        <Fragment key={`line-${i}`}>
          {renderAlignedBracketLine(line, semitones, i, onChordClick, isLast)}
        </Fragment>,
      );
      i += 1;
      continue;
    }

    if (
      next !== undefined &&
      isChordOnlySourceLine(line) &&
      next.trim() !== "" &&
      !lineHasBracketChords(next) &&
      !isChordOnlySourceLine(next)
    ) {
      const pairEndsSong = i + 1 >= lines.length - 1;
      rows.push(
        <Fragment key={`line-${i}`}>
            <span className={pairEndsSong ? "song-chord-pair flex flex-col gap-0" : "song-chord-pair flex flex-col gap-0 mb-2 sm:mb-2.5"}>
            <span className="song-chord-row-stacked block leading-none sm:leading-tight [&_button]:align-baseline">
              {renderChordLine(line, semitones, onChordClick, `L${i}-`)}
            </span>
            <span className="-mt-px block leading-tight sm:leading-snug">
              {renderChordLine(next, semitones, onChordClick, `L${i + 1}-`)}
            </span>
          </span>
        </Fragment>,
      );
      i += 2;
      continue;
    }

    if (
      line.trim() !== "" &&
      !isChordOnlySourceLine(line) &&
      next !== undefined &&
      isChordOnlySourceLine(next) &&
      nextNext !== undefined &&
      nextNext.trim() !== "" &&
      !lineHasBracketChords(nextNext)
    ) {
      rows.push(
        <Fragment key={`line-${i}`}>
          <span className="block leading-none sm:mb-2 sm:leading-tight">{renderChordLine(line, semitones, onChordClick, `L${i}-`)}</span>
        </Fragment>,
      );
      i += 1;
      continue;
    }

    const sep = isLast ? null : "\n";
    rows.push(
      <Fragment key={`line-${i}`}>
        {renderAlignedBracketLine(line, semitones, i, onChordClick, isLast)}
        {sep}
      </Fragment>,
    );
    i += 1;
  }
  return rows;
}

function splitChordBodyInTwo(text: string): [left: string, right: string] {
  const normalized = normalizeChordBodyText(text);
  const lines = normalized.split("\n");
  if (lines.length <= 1) return [normalized, ""];

  const midpoint = Math.ceil(lines.length / 2);
  let splitIndex = midpoint;
  let bestDistance = Number.POSITIVE_INFINITY;

  // Prefer splitting on an empty line close to center.
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]?.trim() !== "") continue;
    const distance = Math.abs(i - midpoint);
    if (distance < bestDistance) {
      bestDistance = distance;
      splitIndex = i;
    }
  }

  return [lines.slice(0, splitIndex).join("\n"), lines.slice(splitIndex).join("\n")];
}

/** Mobil Gamlar paneli: klavye yatay kullanıma uygun olsun diye ekranı yatay kilitle (destekleyen tarayıcılar). */
const WIDGET_MOBILE_MAX = 640;
const LYRICS_MOBILE_FIT_MAX_WIDTH = 640;
const LYRICS_MOBILE_FIT_MIN = 10;

const TRANSPOSE_SEMITONE_MIN = -6;
const TRANSPOSE_SEMITONE_MAX = 5;
const LYRICS_FONT_SIZE_MIN = 14;
const LYRICS_FONT_SIZE_MAX = 32;
const LYRICS_FONT_SIZE_STEP = 1;
const LYRICS_FONT_SIZE_DEFAULT = LYRICS_FONT_SIZE_MIN + LYRICS_FONT_SIZE_STEP;

function clampTransposeSemitones(n: number): number {
  return Math.max(TRANSPOSE_SEMITONE_MIN, Math.min(TRANSPOSE_SEMITONE_MAX, n));
}

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: "landscape" | "portrait" | string) => Promise<void>;
  unlock?: () => void;
};

function tryLockGamlarLandscape() {
  if (typeof window === "undefined") return;
  if (window.innerWidth >= WIDGET_MOBILE_MAX) return;
  const o = window.screen?.orientation as ScreenOrientationWithLock | undefined;
  if (!o?.lock) return;
  void o.lock("landscape").catch(() => {});
}

function unlockScreenOrientationIfPossible() {
  if (typeof window === "undefined") return;
  try {
    const o = window.screen?.orientation as ScreenOrientationWithLock | undefined;
    o?.unlock?.();
  } catch {
    /* noop */
  }
}

export function PreviewClient({
  songId,
  songTitle,
  artistSlug,
  songSlug,
  originalKey,
  keyMode,
  initialGamlarScaleId,
  chordBody,
  tempo,
  timeSignature,
  serverUid,
  showHarmonyDetails = true,
  harmonyDetailsNotes = "",
  prevSong = null,
  nextSong = null,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sceneMode, setSceneMode] = useState(false);
  const [sceneMoreOpen, setSceneMoreOpen] = useState(false);
  const [lyricsFontSizePx, setLyricsFontSizePx] = useState(LYRICS_FONT_SIZE_DEFAULT);
  const [effectiveLyricsFontSizePx, setEffectiveLyricsFontSizePx] = useState(LYRICS_FONT_SIZE_DEFAULT);
  const [lyricsAutoFitEnabled, setLyricsAutoFitEnabled] = useState(true);
  const [lyricsFitResizeTick, setLyricsFitResizeTick] = useState(0);
  const [splitLyricsEnabled, setSplitLyricsEnabled] = useState(false);

  const semitones = usePreviewToolsStore((s) => s.transposeSemitones);
  const setTransposeSemitones = usePreviewToolsStore((s) => s.setTransposeSemitones);
  const setTonalCenterIndex = usePreviewToolsStore((s) => s.setTonalCenterIndex);
  const resetTonalAndTranspose = usePreviewToolsStore((s) => s.resetTonalAndTranspose);
  const [openWidgets, setOpenWidgets] = useState<Record<WidgetId, boolean>>({
    gamlar: false,
    metronome: false,
  });
  const [widgetOffsets, setWidgetOffsets] = useState<Record<WidgetId, { x: number; y: number }>>({
    gamlar: { x: 0, y: 0 },
    metronome: { x: 0, y: 0 },
  });
  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetId, { width: number; height: number } | null>>({
    gamlar: null,
    metronome: null,
  });
  const widgetDragRef = useRef<{
    dragging: boolean;
    widget: WidgetId | null;
    pointerId: number | null;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  }>({
    dragging: false,
    widget: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });
  const widgetResizeRef = useRef<{
    resizing: boolean;
    widget: WidgetId | null;
    pointerId: number | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    resizing: false,
    widget: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });
  const sceneLyricsScrollRef = useRef<HTMLDivElement>(null);

  // Mobilde ekran genişliği değişince (resize/orient.) sözleri "zoom out" mantığıyla tekrar fit et.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setLyricsFitResizeTick((t) => t + 1);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

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
  const [metronomeBpm, setMetronomeBpm] = useState(initialBpmNumber);
  const [metronomeTimeSignature, setMetronomeTimeSignature] = useState(initialTimeSignatureValue);

  useEffect(() => {
    // Yeni şarkıya geçildiğinde metronomu "orijinal" tempo/ölçüyle sıfırla.
    setMetronomeActive(false);
    setOpenWidgets((w) => ({ ...w, metronome: false }));
    setMetronomeBpm(initialBpmNumber);
    setMetronomeTimeSignature(initialTimeSignatureValue);
    setSaveAndAddOpen(false);
    setChordStripOpen(false);
    setHarmonyDetailOpen(false);
    setLyricsAutoFitEnabled(true);
    setSceneMoreOpen(false);
  }, [songId, initialBpmNumber, initialTimeSignatureValue]);

  const transposeParamRaw = searchParams.get("transpose");
  const hasTransposeParam = transposeParamRaw !== null;
  const fromUrl = Number(transposeParamRaw ?? "0");
  const initial = Number.isFinite(fromUrl) ? fromUrl : 0;

  const initialClamped = clampTransposeSemitones(initial);

  const originalTonicPc = (() => {
    const tonic = parseTonicFromOriginalKey(originalKey);
    return noteNameToPitchClass(tonic);
  })();
  const originalMode = resolveOriginalMode(keyMode, originalKey);
  const gamlarWidgetScaleId = initialGamlarScaleId ?? keyModeToGamlarCatalogScaleId(keyMode);
  const transposedTonicPc = originalTonicPc === null ? null : (originalTonicPc + semitones + 120) % 12;

  /** Transpoze (buton, URL, oklar) ile tonal merkez tek kaynakta kalsın — Gamlar gamlar modu */
  useEffect(() => {
    if (transposedTonicPc === null) return;
    setTonalCenterIndex(transposedTonicPc);
  }, [transposedTonicPc, setTonalCenterIndex]);

  const firebaseUid = useFirebaseUidFromSession();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveAndAddOpen, setSaveAndAddOpen] = useState(false);
  const [chordStripOpen, setChordStripOpen] = useState(false);
  const [harmonyDetailOpen, setHarmonyDetailOpen] = useState(false);

  const [playlistNextSong, setPlaylistNextSong] = useState<{ title: string; href: string } | null>(null);
  const [playlistNextLoading, setPlaylistNextLoading] = useState(false);
  const [playlistPosition, setPlaylistPosition] = useState<{ index1: number; total: number } | null>(null);
  const [playlistPrevSong, setPlaylistPrevSong] = useState<{ title: string; href: string } | null>(null);

  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [playlistModalBusy, setPlaylistModalBusy] = useState<null | "add" | "create">(null);
  const [addNotice, setAddNotice] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [saveModalNewListName, setSaveModalNewListName] = useState("");

  const urlTransposeRef = useRef(0);
  const transposeLockRef = useRef(false);
  /** URL güncellenene kadar eski `?transpose` ile store'un ezilmesini engeller. `0` yarım ton da geçerli; parametre kalkışı `"cleared"`. */
  const pendingTransposeRef = useRef<number | "cleared" | null>(null);

  const chordStripTokens = useMemo(() => {
    const raw = extractUniqueChordTokensAsRendered(chordBody);
    return raw.map((t) =>
      semitones === 0 ? formatChordSymbolDisplay(t) : transposeChordToken(t, semitones),
    );
  }, [chordBody, semitones]);
  const chordStripFingerings = useMemo(
    () => chordStripTokens.map((token) => resolveChordTokenToFingering(token)),
    [chordStripTokens],
  );

  const chordProgressionTokens = useMemo(() => {
    const raw = extractChordTokensInOrderAsRendered(chordBody);
    return raw.map((t) =>
      semitones === 0 ? formatChordSymbolDisplay(t) : transposeChordToken(t, semitones),
    );
  }, [chordBody, semitones]);

  const harmonyRomanRows = useMemo(() => {
    if (transposedTonicPc === null) return [];
    return chordStripTokens.map((token) => ({
      symbol: token,
      roman: romanNumeralForChordInKey(token, transposedTonicPc, originalMode),
    }));
  }, [chordStripTokens, transposedTonicPc, originalMode]);

  const sceneParam = searchParams.get("scene");
  const sceneParamActive = sceneParam === "1" || sceneParam === "true";

  const replaceSceneParam = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("scene", "1");
      else params.delete("scene");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const prevSongHref = (() => {
    const effectivePrev = playlistPrevSong ?? prevSong;
    if (!effectivePrev?.href) return null;
    const params = new URLSearchParams();
    const t = searchParams.get("transpose");
    const returnTo = searchParams.get("returnTo");
    if (t) params.set("transpose", t);
    if (returnTo) params.set("returnTo", returnTo);
    if (sceneMode || sceneParamActive) params.set("scene", "1");
    const qs = params.toString();
    return qs ? `${effectivePrev.href}?${qs}` : effectivePrev.href;
  })();

  const nextSongHref = (() => {
    const effectiveNext = playlistNextSong ?? nextSong;
    if (!effectiveNext?.href) return null;
    const params = new URLSearchParams();
    const t = searchParams.get("transpose");
    const returnTo = searchParams.get("returnTo");
    if (t) params.set("transpose", t);
    if (returnTo) params.set("returnTo", returnTo);
    if (sceneMode || sceneParamActive) params.set("scene", "1");
    const qs = params.toString();
    return qs ? `${effectiveNext.href}?${qs}` : effectiveNext.href;
  })();

  useEffect(() => {
    if (sceneParamActive) setSceneMode(true);
    // Intentionally one-way: if URL removes scene, we don't force-close (user may close via UI)
  }, [sceneParamActive]);

  useEffect(() => {
    // If opened from a playlist (returnTo includes playlistId), pick next by playlist order.
    const rawReturnTo = searchParams.get("returnTo");
    const decodedReturnTo = rawReturnTo ? (() => {
      try {
        return decodeURIComponent(rawReturnTo);
      } catch {
        return rawReturnTo;
      }
    })() : null;
    const playlistId = parsePlaylistIdFromReturnTo(decodedReturnTo);

    if (!playlistId) {
      setPlaylistNextSong(null);
      setPlaylistNextLoading(false);
      setPlaylistPosition(null);
      setPlaylistPrevSong(null);
      return;
    }
    if (!firebaseUid || !getFirebasePublicConfig()) {
      // Can't compute playlist order without client Firestore access.
      setPlaylistNextSong(null);
      setPlaylistNextLoading(false);
      setPlaylistPosition(null);
      setPlaylistPrevSong(null);
      return;
    }

    let cancelled = false;
    setPlaylistNextLoading(true);
    void (async () => {
      try {
        const db = getClientFirestore();
        const itemsCol = collection(db, "users", firebaseUid, "playlists", playlistId, "items");
        const snap = await getDocs(query(itemsCol, orderBy("order", "asc")));
        if (cancelled) return;
        const items = snap.docs.map(
          (d) =>
            d.data() as {
              songId?: unknown;
              title?: unknown;
              artistSlug?: unknown;
              songSlug?: unknown;
              transposeSemitones?: unknown;
            },
        );
        const idx = items.findIndex((it) => typeof it.songId === "string" && it.songId === songId);
        // Playlist bağlamında (returnTo) açıldığında, sadece playlist item snapshot’ındaki transpoze kullan.
        // Böylece "Tüm şarkılar" gibi gezinme ekranlarında orijinal şarkı görünür.
        if (!hasTransposeParam && !transposeLockRef.current && idx >= 0) {
          const t = items[idx]?.transposeSemitones;
          if (typeof t === "number" && Number.isFinite(t)) {
            urlTransposeRef.current = t;
            transposeLockRef.current = true;
            setTransposeSemitones(t);
          }
        }
        const prev = idx > 0 ? items[idx - 1] : null;
        const next = idx >= 0 ? items[idx + 1] : null;
        setPlaylistPosition(idx >= 0 ? { index1: idx + 1, total: items.length } : null);
        if (prev && typeof prev.artistSlug === "string" && typeof prev.songSlug === "string" && typeof prev.title === "string") {
          setPlaylistPrevSong({ title: prev.title, href: `/akor/${prev.artistSlug}/${prev.songSlug}` });
        } else {
          setPlaylistPrevSong(null);
        }
        if (next && typeof next.artistSlug === "string" && typeof next.songSlug === "string" && typeof next.title === "string") {
          setPlaylistNextSong({ title: next.title, href: `/akor/${next.artistSlug}/${next.songSlug}` });
        } else {
          setPlaylistNextSong(null);
        }
      } catch {
        if (!cancelled) {
          setPlaylistNextSong(null);
          setPlaylistPosition(null);
          setPlaylistPrevSong(null);
        }
      } finally {
        if (!cancelled) setPlaylistNextLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUid, searchParams, songId, hasTransposeParam, setTransposeSemitones]);

  useEffect(() => {
    if (!openWidgets.gamlar && !openWidgets.metronome) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenWidgets({ gamlar: false, metronome: false });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openWidgets]);

  useEffect(() => {
    if (!chordStripOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChordStripOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chordStripOpen]);

  useEffect(() => {
    if (!openWidgets.gamlar) return;
    if (typeof window === "undefined" || window.innerWidth >= WIDGET_MOBILE_MAX) return;
    tryLockGamlarLandscape();
    return () => {
      unlockScreenOrientationIfPossible();
    };
  }, [openWidgets.gamlar]);

  useEffect(() => {
    if (!openWidgets.gamlar && !openWidgets.metronome) return;

    const applyLayout = () => {
      const opened = (["gamlar", "metronome"] as const).filter((id) => openWidgets[id]);
      if (opened.length === 0) return;

      const isNarrow = window.innerWidth < WIDGET_MOBILE_MAX;

      const computedSizes: Partial<Record<WidgetId, { width: number; height: number }>> = {};
      for (const id of opened) {
        if (isNarrow) {
          computedSizes[id] = { width: window.innerWidth, height: window.innerHeight };
        } else if (id === "metronome") {
          computedSizes[id] = { width: 320, height: 240 };
        } else {
          const pad = 32;
          const maxWidth = Math.max(460, Math.min(window.innerWidth - pad, Math.floor(window.innerWidth * 0.66)));
          const maxHeight = Math.max(340, Math.min(window.innerHeight - pad, Math.floor(window.innerHeight * 0.72)));
          const minWidth = 340;
          const minHeight = 260;
          const base = { width: 700, height: 500 };
          const width = Math.min(maxWidth, Math.max(minWidth, base.width));
          const height = Math.min(maxHeight, Math.max(minHeight, base.height));
          computedSizes[id] = { width, height };
        }
      }

      setWidgetSizes((prev) => {
        const next = { ...prev };
        for (const id of opened) {
          next[id] = computedSizes[id]!;
        }
        return next;
      });

      setWidgetOffsets((prev) => {
        const next = { ...prev };
        for (const id of opened) {
          const size = computedSizes[id]!;
          if (isNarrow) {
            next[id] = { x: 0, y: 0 };
            continue;
          }
          const existing = prev[id];
          if (existing.x !== 0 || existing.y !== 0) {
            const edgePad = 8;
            const maxX = Math.max(0, window.innerWidth / 2 - size.width / 2 - edgePad);
            const maxY = Math.max(0, window.innerHeight / 2 - size.height / 2 - edgePad);
            next[id] = {
              x: Math.max(-maxX, Math.min(maxX, existing.x)),
              y: Math.max(-maxY, Math.min(maxY, existing.y)),
            };
          } else if (id === "metronome") {
            const edgePad = 20;
            next[id] = {
              x: 0,
              y: Math.round(window.innerHeight / 2 - edgePad - size.height / 2 - 72),
            };
          } else {
            const edgePad = 20;
            const stackOffsetY = id === "gamlar" ? 12 : 0;
            const x =
              id === "gamlar"
                ? Math.round(-(window.innerWidth / 2 - edgePad - size.width / 2))
                : Math.round(window.innerWidth / 2 - edgePad - size.width / 2);
            const y = Math.round(-(window.innerHeight / 2 - edgePad - size.height / 2) + stackOffsetY);
            next[id] = { x, y };
          }
        }
        return next;
      });
    };

    const prevOverflow = document.body.style.overflow;

    const onResize = () => {
      applyLayout();
      if (window.innerWidth < WIDGET_MOBILE_MAX) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = prevOverflow || "";
      }
    };

    applyLayout();
    if (typeof document !== "undefined" && window.innerWidth < WIDGET_MOBILE_MAX) {
      document.body.style.overflow = "hidden";
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [openWidgets]);

  const handleWidgetHeaderPointerDown = useCallback((widget: WidgetId, e: ReactPointerEvent<HTMLDivElement>) => {
    if (!openWidgets[widget]) return;
    if (typeof window !== "undefined" && window.innerWidth < WIDGET_MOBILE_MAX) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button,a,input,select,textarea")) return;
    e.preventDefault();
    const offset = widgetOffsets[widget];
    widgetDragRef.current = {
      dragging: true,
      widget,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [openWidgets, widgetOffsets]);

  const handleWidgetHeaderPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = widgetDragRef.current;
    if (!drag.dragging || drag.pointerId !== e.pointerId || !drag.widget) return;
    const size = widgetSizes[drag.widget];
    if (!size) return;
    const edgePad = 8;
    const maxX = Math.max(0, window.innerWidth / 2 - size.width / 2 - edgePad);
    const maxY = Math.max(0, window.innerHeight / 2 - size.height / 2 - edgePad);
    const nextX = drag.baseX + (e.clientX - drag.startX);
    const nextY = drag.baseY + (e.clientY - drag.startY);
    setWidgetOffsets((prev) => ({
      ...prev,
      [drag.widget!]: {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      },
    }));
  }, [widgetSizes]);

  const handleWidgetHeaderPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = widgetDragRef.current;
    if (!drag.dragging || drag.pointerId !== e.pointerId) return;
    widgetDragRef.current = {
      ...drag,
      dragging: false,
      widget: null,
      pointerId: null,
    };
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const getWidgetBounds = useCallback(() => {
    if (typeof window === "undefined") {
      return { minWidth: 340, minHeight: 260, maxWidth: 920, maxHeight: 640 };
    }
    const pad = 32;
    return {
      minWidth: 340,
      minHeight: 260,
      maxWidth: Math.max(520, Math.min(window.innerWidth - pad, Math.floor(window.innerWidth * 0.95))),
      maxHeight: Math.max(420, Math.min(window.innerHeight - pad, Math.floor(window.innerHeight * 0.92))),
    };
  }, []);

  const handleWidgetResizePointerDown = useCallback((widget: WidgetId, e: ReactPointerEvent<HTMLButtonElement>) => {
    const size = widgetSizes[widget];
    if (!openWidgets[widget] || !size) return;
    if (typeof window !== "undefined" && window.innerWidth < WIDGET_MOBILE_MAX) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    widgetResizeRef.current = {
      resizing: true,
      widget,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [openWidgets, widgetSizes]);

  const handleWidgetResizePointerMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (typeof window !== "undefined" && window.innerWidth < WIDGET_MOBILE_MAX) return;
    const resize = widgetResizeRef.current;
    if (!resize.resizing || resize.pointerId !== e.pointerId || !resize.widget) return;
    const bounds = getWidgetBounds();
    const nextWidth = resize.startWidth + (e.clientX - resize.startX);
    const nextHeight = resize.startHeight + (e.clientY - resize.startY);
    const clampedSize = {
      width: Math.min(bounds.maxWidth, Math.max(bounds.minWidth, nextWidth)),
      height: Math.min(bounds.maxHeight, Math.max(bounds.minHeight, nextHeight)),
    };
    const edgePad = 8;
    const maxX = Math.max(0, window.innerWidth / 2 - clampedSize.width / 2 - edgePad);
    const maxY = Math.max(0, window.innerHeight / 2 - clampedSize.height / 2 - edgePad);
    setWidgetSizes((prev) => ({
      ...prev,
      [resize.widget!]: clampedSize,
    }));
    setWidgetOffsets((prev) => {
      const current = prev[resize.widget!];
      return {
        ...prev,
        [resize.widget!]: {
          x: Math.max(-maxX, Math.min(maxX, current.x)),
          y: Math.max(-maxY, Math.min(maxY, current.y)),
        },
      };
    });
  }, [getWidgetBounds]);

  const handleWidgetResizePointerUp = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const resize = widgetResizeRef.current;
    if (!resize.resizing || resize.pointerId !== e.pointerId) return;
    widgetResizeRef.current = {
      ...resize,
      resizing: false,
      widget: null,
      pointerId: null,
    };
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => {
    if (!sceneMode) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSceneMode(false);
        replaceSceneParam(false);
        setSceneMoreOpen(false);
      }
    };

    /** Mobilde belge kayarsa (overscroll, bazı tarayıcılarda body kilidine rağmen) sahne modundan çık. İçerikteki akor alanı ayrı scroll olduğu için çoğu cihazda window scroll tetiklenmez. */
    const exitIfPageScrolled = () => {
      if (typeof window === "undefined" || window.innerWidth >= WIDGET_MOBILE_MAX) return;
      const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const x = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      if (Math.abs(y) > 6 || Math.abs(x) > 6) {
        setSceneMode(false);
        replaceSceneParam(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", exitIfPageScrolled, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", exitIfPageScrolled);
      document.body.style.overflow = prevOverflow;
    };
  }, [replaceSceneParam, sceneMode]);

  useEffect(() => {
    if (!sceneMoreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSceneMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sceneMoreOpen]);

  useEffect(() => {
    urlTransposeRef.current = 0;
    // Yeni şarkıya geçince, URL/playlist dışında bir kaynaktan kilitlenmiş transpoze kalmasın.
    transposeLockRef.current = false;
    pendingTransposeRef.current = null;
  }, [songId]);

  /**
   * URL ↔ store: ilk yükleme / geri tuşu / paylaşılan linkte URL kaynak;
   * `replaceTranspose` sonrası kısa süre eski query ile çalışan render'larda store'u geri çekme.
   */
  useEffect(() => {
    if (!hasTransposeParam) {
      if (pendingTransposeRef.current === "cleared") {
        pendingTransposeRef.current = null;
        urlTransposeRef.current = 0;
        transposeLockRef.current = true;
      }
      return;
    }

    const pending = pendingTransposeRef.current;
    if (pending !== null) {
      if (pending === "cleared") {
        return;
      }
      if (initialClamped === pending) {
        pendingTransposeRef.current = null;
        urlTransposeRef.current = initialClamped;
        transposeLockRef.current = true;
      }
      return;
    }

    if (initialClamped !== urlTransposeRef.current) {
      setTransposeSemitones(initialClamped);
    }
    urlTransposeRef.current = initialClamped;
    transposeLockRef.current = true;
    // setTransposeSemitones is a stable Zustand action; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTransposeParam, initialClamped]);

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

  useEffect(() => {
    if (!saveAndAddOpen) setSaveModalNewListName("");
  }, [saveAndAddOpen]);

  const replaceTranspose = useCallback(
    (n: number) => {
      transposeLockRef.current = true;
      setTransposeSemitones(n);
      urlTransposeRef.current = n;
      pendingTransposeRef.current = n === 0 ? "cleared" : n;
      const params = new URLSearchParams(searchParams.toString());
      if (n === 0) params.delete("transpose");
      else params.set("transpose", String(n));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, setTransposeSemitones],
  );

  // Ok tuşlarıyla yarım ses (semitone) hareketi.
  useEffect(() => {
    if (openWidgets.gamlar || saveAndAddOpen || (showHarmonyDetails && harmonyDetailOpen)) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if ("isContentEditable" in t && t.isContentEditable) return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        replaceTranspose(clampTransposeSemitones(semitones - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        replaceTranspose(clampTransposeSemitones(semitones + 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openWidgets, saveAndAddOpen, harmonyDetailOpen, replaceTranspose, semitones, showHarmonyDetails]);

  useEffect(() => {
    if (!showHarmonyDetails || !harmonyDetailOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHarmonyDetailOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [harmonyDetailOpen, showHarmonyDetails]);

  useEffect(() => {
    if (!showHarmonyDetails) setHarmonyDetailOpen(false);
  }, [showHarmonyDetails]);

  const resetOriginal = useCallback(() => {
    transposeLockRef.current = true;
    resetTonalAndTranspose();
    urlTransposeRef.current = 0;
    pendingTransposeRef.current = "cleared";
    setMetronomeActive(false);
    setOpenWidgets((w) => ({ ...w, metronome: false }));
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
      setSaveState("saved");
      setSaveMessage("Listeyi seçin — transpoze kaydı eklenecek.");
      setSaveAndAddOpen(true);
    } catch (e) {
      setSaveState("error");
      setSaveMessage(formatError(e));
      setSaveAndAddOpen(false);
    }
  }, [firebaseUid, serverUid]);

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
    setPlaylistModalBusy("add");
    try {
      const db = getClientFirestore();
      const itemsCol = collection(db, "users", firebaseUid, "playlists", selectedPlaylistId, "items");
      const dupeSnap = await getDocs(query(itemsCol, where("songId", "==", songId), limit(1)));

      if (!dupeSnap.empty) {
        const existingRef = doc(itemsCol, dupeSnap.docs[0].id);
        await updateDoc(existingRef, {
          title: songTitle,
          artistSlug,
          songSlug,
          transposeSemitones: semitones,
          updatedAt: serverTimestamp(),
        });
      } else {
        const existing = await getDocs(query(itemsCol, orderBy("order", "desc"), limit(1)));
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
          updatedAt: serverTimestamp(),
        });
      }
      await updateDoc(doc(db, "users", firebaseUid, "playlists", selectedPlaylistId), {
        updatedAt: serverTimestamp(),
      });
      setAddNotice({
        variant: "success",
        message: dupeSnap.empty ? "Şarkı listeye eklendi." : "Listede vardı; güncellendi.",
      });
      setSaveAndAddOpen(false);
    } catch (e) {
      setAddNotice({ variant: "error", message: formatError(e) });
    } finally {
      setPlaylistModalBusy(null);
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

  const onCreatePlaylistAndAdd = useCallback(async () => {
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
    const name = saveModalNewListName.trim();
    if (!name) {
      setAddNotice({ variant: "error", message: "Liste adı girin." });
      return;
    }
    setPlaylistModalBusy("create");
    try {
      const db = getClientFirestore();
      const playlistRef = await addDoc(collection(db, "users", firebaseUid, "playlists"), {
        name,
        schemaVersion: PLAYLIST_SCHEMA_VERSION,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const itemsCol = collection(db, "users", firebaseUid, "playlists", playlistRef.id, "items");
      await addDoc(itemsCol, {
        order: 0,
        songId,
        title: songTitle,
        artistSlug,
        songSlug,
        transposeSemitones: semitones,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", firebaseUid, "playlists", playlistRef.id), {
        updatedAt: serverTimestamp(),
      });
      setAddNotice({
        variant: "success",
        message: `“${name}” listesine eklendi.`,
      });
      setSelectedPlaylistId(playlistRef.id);
      setSaveAndAddOpen(false);
    } catch (e) {
      setAddNotice({ variant: "error", message: formatError(e) });
    } finally {
      setPlaylistModalBusy(null);
    }
  }, [
    artistSlug,
    firebaseUid,
    saveModalNewListName,
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
  const canCreatePlaylistInModal = canSave && Boolean(saveModalNewListName.trim());

  const widgetTitleById: Record<WidgetId, string> = {
    gamlar: "Gamlar",
    metronome: "Metronom",
  };
  const canDecreaseLyricsFont = lyricsFontSizePx > LYRICS_FONT_SIZE_MIN;
  const canIncreaseLyricsFont = lyricsFontSizePx < LYRICS_FONT_SIZE_MAX;
  const canDecreaseTranspose = semitones > TRANSPOSE_SEMITONE_MIN;
  const canIncreaseTranspose = semitones < TRANSPOSE_SEMITONE_MAX;
  const [leftChordBody, rightChordBody] = useMemo(
    () => splitChordBodyInTwo(chordBody),
    [chordBody],
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const shouldFitLyrics = lyricsAutoFitEnabled && window.innerWidth < LYRICS_MOBILE_FIT_MAX_WIDTH;
    if (!shouldFitLyrics) {
      setEffectiveLyricsFontSizePx(lyricsFontSizePx);
      return;
    }

    const modeAttr = sceneMode ? "scene" : "body";
    const pres = Array.from(document.querySelectorAll(`[data-lyrics-pre="${modeAttr}"]`)) as HTMLElement[];
    if (pres.length === 0) return; // Sahne moduna girip çıkarken geçici olarak mount/unmount olabiliyor.

    const base = lyricsFontSizePx;
    const mobileMin = sceneMode ? 10 : LYRICS_MOBILE_FIT_MIN;

    // Amaç: pre satırları taşmadan sığacak "en büyük" fontu bulmak.
    // Böylece 2. resimdeki gibi zoom-out hissi stabil olur.
    let low = mobileMin;
    let high = base;
    let best = mobileMin;

    const availableHeight = sceneMode ? sceneLyricsScrollRef.current?.clientHeight ?? window.innerHeight : null;

    const fitsNow = () => {
      // Yatay taşma kontrolü
      for (const pre of pres) {
        const sw = pre.scrollWidth;
        const cw = pre.clientWidth;
        if (cw > 0 && sw > cw + 1) return false;
      }

      if (!sceneMode) return true;

      if (!availableHeight) return true;
      // Dikey taşma kontrolü (scene overlay'da)
      for (const pre of pres) {
        const sh = pre.scrollHeight;
        if (sh > availableHeight + 2) return false;
      }
      return true;
    };

    // Binary search: [mobileMin..base]
    // (base varsayılan olarak MIN+1; kullanıcı A-/A+ ile değiştirebilir, high = base)
    for (let i = 0; i < 9; i += 1) {
      const mid = Math.floor((low + high + 1) / 2);

      for (const pre of pres) pre.style.fontSize = `${mid}px`;

      if (fitsNow()) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    setEffectiveLyricsFontSizePx((prev) => (prev === best ? prev : best));
  }, [lyricsFontSizePx, lyricsAutoFitEnabled, chordBody, splitLyricsEnabled, semitones, sceneMode, lyricsFitResizeTick]);

  return (
    <div className="-mx-4 rounded-2xl px-4 py-5 sm:-mx-6 sm:px-6 lg:px-8">
      {sceneMode ? (
        <div
          className="fixed inset-0 z-[70] box-border flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
          role="dialog"
          aria-modal="true"
          aria-label="Sahne modu"
          onMouseDown={(e) => {
            // Mobilde bazen içerideki dokunuşlar backdrop handler'ına da düşebiliyor.
            // Yalnızca gerçek "arka plan" alanına tıklanırsa kapat.
            if (e.target !== e.currentTarget) return;
            setSceneMode(false);
            replaceSceneParam(false);
            setSceneMoreOpen(false);
          }}
        >
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center justify-between gap-2 sm:min-w-0 sm:flex-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-200">{songTitle}</p>
                  <p className="truncate text-xs text-white/60">
                    {originalKey}
                    {playlistPosition ? (
                      <>
                        <span className="mx-2 text-white/30">•</span>
                        <span className="text-white/70">Liste: {playlistPosition.index1}/{playlistPosition.total}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <PanelCloseButton
                  variant="scene"
                  className="shrink-0 sm:hidden"
                  title="Sahne modundan çık"
                  onClick={() => {
                    setSceneMode(false);
                    replaceSceneParam(false);
                    setSceneMoreOpen(false);
                  }}
                />
              </div>
              {/* Mobile: compact toolbar */}
              <div className="flex items-center gap-2 sm:hidden">
                <AutoScrollButton scrollContainerRef={sceneLyricsScrollRef} variant="scene" />
                <button
                  type="button"
                  aria-pressed={splitLyricsEnabled}
                  onClick={() => setSplitLyricsEnabled((prev) => !prev)}
                  className={`inline-flex shrink-0 min-h-[36px] items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    splitLyricsEnabled
                      ? "border-teal-400/60 bg-teal-500/25 text-white"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                  aria-label="Sözleri iki sütuna böl"
                  title="Sözleri iki sütuna böl"
                >
                  Böl
                </button>
                <button
                  type="button"
                  disabled={!prevSongHref || playlistNextLoading}
                  onClick={() => {
                    if (!prevSongHref) return;
                    router.push(prevSongHref);
                  }}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    playlistNextLoading
                      ? "Liste sırası yükleniyor…"
                      : prevSongHref
                        ? `Önceki: ${(playlistPrevSong ?? prevSong)?.title ?? ""}`
                        : "Önceki şarkı yok"
                  }
                  aria-label="Önceki şarkı"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={!nextSongHref || playlistNextLoading}
                  onClick={() => {
                    if (!nextSongHref) return;
                    router.push(nextSongHref);
                  }}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    playlistNextLoading
                      ? "Liste sırası yükleniyor…"
                      : nextSongHref
                        ? `Sıradaki: ${(playlistNextSong ?? nextSong)?.title ?? ""}`
                        : "Sıradaki şarkı yok"
                  }
                  aria-label="Sıradaki şarkı"
                >
                  →
                </button>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={sceneMoreOpen}
                  onClick={() => setSceneMoreOpen(true)}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-white transition hover:bg-white/10"
                  aria-label="Diğer sahne ayarları"
                  title="Diğer ayarlar"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
              </div>

              {/* Desktop: full toolbar */}
              <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-0">
                <button
                  type="button"
                  onClick={() => setChordStripOpen(true)}
                  aria-expanded={chordStripOpen}
                  aria-controls="chord-strip-panel"
                  className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 min-h-[36px]"
                >
                  Akorlar
                </button>
                <AutoScrollButton scrollContainerRef={sceneLyricsScrollRef} variant="scene" />
                <button
                  type="button"
                  disabled={!canDecreaseLyricsFont}
                  onClick={() => {
                    setLyricsAutoFitEnabled(false);
                    setLyricsFontSizePx((size) => Math.max(LYRICS_FONT_SIZE_MIN, size - LYRICS_FONT_SIZE_STEP));
                  }}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Söz yazısını küçült"
                  title="Söz yazısını küçült"
                >
                  A-
                </button>
                <button
                  type="button"
                  disabled={!canIncreaseLyricsFont}
                  onClick={() => {
                    setLyricsAutoFitEnabled(false);
                    setLyricsFontSizePx((size) => Math.min(LYRICS_FONT_SIZE_MAX, size + LYRICS_FONT_SIZE_STEP));
                  }}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Söz yazısını büyüt"
                  title="Söz yazısını büyüt"
                >
                  A+
                </button>
                <button
                  type="button"
                  disabled={!canDecreaseTranspose}
                  onClick={() => replaceTranspose(clampTransposeSemitones(semitones - 1))}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Transpoze: yarım ton düşür"
                  title="Transpoze: yarım ton düşür"
                >
                  T-
                </button>
                <button
                  type="button"
                  disabled={!canIncreaseTranspose}
                  onClick={() => replaceTranspose(clampTransposeSemitones(semitones + 1))}
                  className="inline-flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Transpoze: yarım ton yükselt"
                  title="Transpoze: yarım ton yükselt"
                >
                  T+
                </button>
                <button
                  type="button"
                  aria-pressed={splitLyricsEnabled}
                  onClick={() => setSplitLyricsEnabled((prev) => !prev)}
                  className={`inline-flex shrink-0 min-h-[36px] items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                    splitLyricsEnabled
                      ? "border-teal-400/60 bg-teal-500/25 text-white"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                  aria-label="Sözleri iki sütuna böl"
                  title="Sözleri iki sütuna böl"
                >
                  Böl
                </button>
                <button
                  type="button"
                  disabled={!prevSongHref || playlistNextLoading}
                  onClick={() => {
                    if (!prevSongHref) return;
                    router.push(prevSongHref);
                  }}
                  className="shrink-0 rounded-lg border border-white/10 bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-amber-500/35 transition hover:from-amber-600 hover:via-amber-400 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-40 min-h-[36px]"
                  title={
                    playlistNextLoading
                      ? "Liste sırası yükleniyor…"
                      : prevSongHref
                        ? `Önceki: ${(playlistPrevSong ?? prevSong)?.title ?? ""}`
                        : "Önceki şarkı yok"
                  }
                >
                  {playlistNextLoading ? (
                    "…"
                  ) : prevSongHref ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="shrink-0">←</span>
                      <span className="hidden sm:inline shrink-0">Önceki:</span>
                      <span className="hidden sm:inline min-w-0 max-w-[8rem] truncate text-white/90">
                        {(playlistPrevSong ?? prevSong)?.title ?? ""}
                      </span>
                    </span>
                  ) : (
                    "←"
                  )}
                </button>
                <button
                  type="button"
                  disabled={!nextSongHref || playlistNextLoading}
                  onClick={() => {
                    if (!nextSongHref) return;
                    router.push(nextSongHref);
                  }}
                  className="shrink-0 rounded-lg border border-white/10 bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-amber-500/35 transition hover:from-yellow-300 hover:via-amber-400 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-40 min-h-[36px]"
                  title={
                    playlistNextLoading
                      ? "Liste sırası yükleniyor…"
                      : nextSongHref
                        ? `Sıradaki: ${(playlistNextSong ?? nextSong)?.title ?? ""}`
                        : "Sıradaki şarkı yok"
                  }
                >
                  {playlistNextLoading ? (
                    "…"
                  ) : nextSongHref ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="hidden sm:inline shrink-0">Sıradaki:</span>
                      <span className="hidden sm:inline min-w-0 max-w-[8rem] truncate text-white/90">
                        {(playlistNextSong ?? nextSong)?.title ?? ""}
                      </span>
                      <span className="shrink-0">→</span>
                    </span>
                  ) : (
                    "→"
                  )}
                </button>
                <PanelCloseButton
                  variant="scene"
                  className="hidden sm:inline-flex"
                  title="Esc ile de çıkabilirsiniz"
                  onClick={() => {
                    setSceneMode(false);
                    replaceSceneParam(false);
                    setSceneMoreOpen(false);
                  }}
                />
              </div>
            </div>

              {sceneMoreOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-[75] bg-black/40 sm:hidden"
                    aria-hidden
                    onMouseDown={() => setSceneMoreOpen(false)}
                  />
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Sahne ayarları"
                    className="fixed inset-x-0 bottom-0 z-[76] max-h-[min(72vh,32rem)] overflow-hidden sm:hidden"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="mx-auto flex max-h-[min(72vh,32rem)] w-full flex-col border-t border-white/10 bg-black/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] backdrop-blur">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                        <p className="text-xs font-semibold tracking-tight text-white/90">Sahne ayarları</p>
                        <PanelCloseButton variant="scene" onClick={() => setSceneMoreOpen(false)} />
                      </div>
                      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={!canDecreaseLyricsFont}
                            onClick={() => {
                              setLyricsAutoFitEnabled(false);
                              setLyricsFontSizePx((size) =>
                                Math.max(LYRICS_FONT_SIZE_MIN, size - LYRICS_FONT_SIZE_STEP),
                              );
                            }}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Söz yazısını küçült"
                          >
                            A-
                          </button>
                          <button
                            type="button"
                            disabled={!canIncreaseLyricsFont}
                            onClick={() => {
                              setLyricsAutoFitEnabled(false);
                              setLyricsFontSizePx((size) =>
                                Math.min(LYRICS_FONT_SIZE_MAX, size + LYRICS_FONT_SIZE_STEP),
                              );
                            }}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Söz yazısını büyüt"
                          >
                            A+
                          </button>
                          <button
                            type="button"
                            disabled={!canDecreaseTranspose}
                            onClick={() => replaceTranspose(clampTransposeSemitones(semitones - 1))}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Transpoze: yarım ton düşür"
                          >
                            T-
                          </button>
                          <button
                            type="button"
                            disabled={!canIncreaseTranspose}
                            onClick={() => replaceTranspose(clampTransposeSemitones(semitones + 1))}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Transpoze: yarım ton yükselt"
                          >
                            T+
                          </button>
                        </div>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              resetOriginal();
                              setSceneMoreOpen(false);
                            }}
                            className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
                          >
                            Orijinale dön
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

            <div ref={sceneLyricsScrollRef} className="flex-1 overflow-auto p-4 sm:p-6">
              <div className={splitLyricsEnabled ? "grid grid-cols-2 gap-4" : ""}>
                <pre
                data-lyrics-pre="scene"
                  className="song-chord-text overflow-x-auto overflow-y-hidden whitespace-pre-wrap font-mono leading-none text-white sm:leading-snug md:leading-snug"
                  style={{ fontSize: `${effectiveLyricsFontSizePx}px` }}
                >
                  {renderChordBodyWithHighlights(
                    splitLyricsEnabled ? leftChordBody : chordBody,
                    semitones,
                    () => setChordStripOpen(true),
                  )}
                </pre>
                {splitLyricsEnabled ? (
                  <pre
                    data-lyrics-pre="scene"
                    className="song-chord-text overflow-x-auto overflow-y-hidden whitespace-pre-wrap font-mono leading-none text-white sm:leading-snug md:leading-snug"
                    style={{ fontSize: `${effectiveLyricsFontSizePx}px` }}
                  >
                    {renderChordBodyWithHighlights(rightChordBody, semitones, () => setChordStripOpen(true))}
                  </pre>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
            <div className="flex items-center justify-between gap-1.5 border-b border-border bg-surface/90 px-2.5 py-1.5">
              <p className="text-sm font-medium leading-tight tracking-tight text-foreground">Kaydet ve listeye ekle</p>
              <PanelCloseButton onClick={() => setSaveAndAddOpen(false)} />
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

              {playlists.length === 0 ? (
                <>
                  <p className="mb-2 text-xs text-muted">
                    Henüz listeniz yok. Yeni liste adı yazıp oluşturduğunuzda şarkı bu listeye eklenir.
                  </p>
                  <label htmlFor="preview-playlist-modal-new" className="block text-xs font-medium text-muted">
                    Liste oluştur
                  </label>
                  <input
                    id="preview-playlist-modal-new"
                    value={saveModalNewListName}
                    onChange={(e) => setSaveModalNewListName(e.target.value)}
                    disabled={playlistModalBusy !== null}
                    placeholder="Liste adı"
                    maxLength={120}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2 disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onCreatePlaylistAndAdd();
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <label htmlFor="preview-playlist-modal" className="block text-xs font-medium text-muted">
                    Listeye ekle
                  </label>
                  <select
                    id="preview-playlist-modal"
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                    disabled={playlistModalBusy !== null}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2 disabled:opacity-50"
                  >
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={!canAddToPlaylist || playlistModalBusy !== null}
                      onClick={() => void onAddToPlaylist()}
                      className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {playlistModalBusy === "add" ? "Ekleniyor…" : "Listeye ekle"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveAndAddOpen(false)}
                      className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
                    >
                      Vazgeç
                    </button>
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <label htmlFor="preview-playlist-modal-new" className="block text-xs font-medium text-muted">
                      Yeni liste oluştur
                    </label>
                    <input
                      id="preview-playlist-modal-new"
                      value={saveModalNewListName}
                      onChange={(e) => setSaveModalNewListName(e.target.value)}
                      disabled={playlistModalBusy !== null}
                      placeholder="Liste adı"
                      maxLength={120}
                      className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2 disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void onCreatePlaylistAndAdd();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!canCreatePlaylistInModal || playlistModalBusy !== null}
                      onClick={() => void onCreatePlaylistAndAdd()}
                      className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {playlistModalBusy === "create" ? "Oluşturuluyor…" : "Liste oluştur"}
                    </button>
                  </div>
                </>
              )}

              {playlists.length === 0 ? (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={!canCreatePlaylistInModal || playlistModalBusy !== null}
                    onClick={() => void onCreatePlaylistAndAdd()}
                    className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {playlistModalBusy === "create" ? "Oluşturuluyor…" : "Liste oluştur"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveAndAddOpen(false)}
                    className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {chordStripOpen ? (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40 print:hidden"
            aria-hidden
            onMouseDown={() => setChordStripOpen(false)}
          />
          <div
            id="chord-strip-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chord-strip-title"
            className="fixed inset-x-0 bottom-0 z-[81] max-h-[min(70vh,32rem)] overflow-hidden print:hidden"
          >
            <div className="mx-auto flex max-h-[min(70vh,32rem)] max-w-6xl flex-col border-t border-border bg-surface shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:rounded-t-2xl dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
              <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border px-2 py-0.5">
                <p
                  id="chord-strip-title"
                  className="m-0 text-xs font-medium leading-none tracking-tight text-foreground"
                >
                  Şarkıdaki akorlar
                </p>
                <PanelCloseButton
                  className="!size-5 [&_svg]:size-2.5"
                  onClick={() => setChordStripOpen(false)}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-4 pb-4 pt-1">
                {chordStripFingerings.length === 0 ? (
                  <p className="text-sm text-muted">Bu metinde tanınan akor yok.</p>
                ) : (
                  <div className="flex flex-wrap items-stretch justify-start gap-4 sm:flex-nowrap sm:overflow-x-auto sm:pb-1">
                    {chordStripFingerings.map((entry, i) => {
                      const pos = entry.chord?.positions[0] ?? null;
                      return (
                        <div key={`${entry.token}-${i}`} className="shrink-0">
                          {entry.chord && pos ? (
                            <GuitarChordDiagramClassic position={pos} title={entry.token} />
                          ) : (
                            <div className="flex min-h-[12.5rem] min-w-[10rem] flex-col items-center justify-center rounded-xl border border-border bg-bg px-2 py-3 text-center">
                              <p className="font-mono text-sm font-semibold text-foreground">{entry.token}</p>
                              <p className="mt-1 text-xs text-muted">Basılış bulunamadı</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-1 flex flex-col gap-3 sm:mt-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-start gap-x-1 gap-y-1.5">
            <button
              type="button"
              onClick={() =>
                setOpenWidgets((w) => {
                  const opening = !w.gamlar;
                  if (opening) tryLockGamlarLandscape();
                  return { ...w, gamlar: opening };
                })
              }
              aria-pressed={openWidgets.gamlar}
            className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition min-h-[36px] sm:px-2.5 ${
                openWidgets.gamlar
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-bg text-foreground hover:border-accent/50"
              }`}
            >
              Solo/Gam
            </button>
            <button
              type="button"
              onClick={() => setOpenWidgets((w) => ({ ...w, metronome: !w.metronome }))}
              aria-pressed={openWidgets.metronome}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition min-h-[36px] sm:px-2.5 ${
                openWidgets.metronome
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-bg text-foreground hover:border-accent/50"
              }`}
            >
              Metronom
            </button>
            <AutoScrollButton scrollContainerRef={sceneLyricsScrollRef} />
            <button
              type="button"
              id="chord-strip-trigger"
              onClick={() => setChordStripOpen((o) => !o)}
              aria-expanded={chordStripOpen}
              aria-controls="chord-strip-panel"
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition min-h-[36px] sm:px-2.5 ${
                chordStripOpen
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-bg text-foreground hover:border-accent/50"
              }`}
            >
              Akorlar
            </button>
          </div>
        </div>
        <div className="hidden sm:flex w-full items-end justify-center sm:w-auto sm:flex-1">
          <div className="relative inline-flex items-end justify-center">
          <button
            type="button"
            onClick={() => {
              const next = !sceneMode;
              setSceneMode(next);
              replaceSceneParam(next);
            }}
            aria-pressed={sceneMode}
            aria-label="Tam ekran"
            title="Tam ekran"
            className={`group relative inline-flex min-h-[36px] w-11 flex-col items-center justify-center gap-px rounded-md border px-0.5 py-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              sceneMode
                ? "border-accent bg-accent text-accent-foreground shadow-md shadow-black/10 ring-1 ring-accent/30"
                : "border-border bg-surface text-foreground shadow-sm shadow-black/5 hover:border-accent/40 hover:bg-bg/70"
            }`}
          >
            <Mic
              aria-hidden
              className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
              strokeWidth={2.25}
            />
            <span className="rounded bg-black/25 px-1 py-0.5 text-[9px] font-semibold leading-none tracking-wide text-current/95">
              Tam ekran
            </span>
          </button>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 text-[11px] text-muted sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-1.5">
          <div className="rounded-lg border border-border bg-surface px-2 py-1.5 sm:py-1">
            Ton: <span className="font-mono text-foreground">{originalKey}</span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-2 py-1.5 sm:py-1">
            BPM:{" "}
            <span className="font-mono text-foreground">
              {tempo ?? "-"}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-2 py-1.5 sm:py-1">
            Ölçü:{" "}
            <span className="font-mono text-foreground">
              {timeSignature ?? "-"}
            </span>
          </div>
          {showHarmonyDetails ? (
            <button
              type="button"
              onClick={() => setHarmonyDetailOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={harmonyDetailOpen}
              aria-label="Armoni özeti — ayrıntıları göster"
              title="Armoni özeti"
              className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-left transition hover:border-accent/40 hover:bg-bg/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:py-1"
            >
              <Info
                className="size-3.5 shrink-0 text-muted-foreground opacity-90"
                strokeWidth={2}
                aria-hidden
              />
              <span className="min-w-0">
                Mod:{" "}
                <span className="text-foreground">
                  {formatModLineLabel(gamlarWidgetScaleId)}
                </span>
              </span>
            </button>
          ) : (
            <div className="rounded-lg border border-border bg-surface px-2 py-1.5 sm:py-1">
              Mod:{" "}
              <span className="text-foreground">
                {formatModLineLabel(gamlarWidgetScaleId)}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={resetOriginal}
            className="col-span-2 rounded-lg border border-border bg-bg px-2 py-1.5 text-xs font-medium text-foreground hover:bg-surface min-h-[36px] sm:col-span-1"
          >
            Orijinale dön
          </button>
        </div>
      </div>

      {(openWidgets.gamlar || openWidgets.metronome) ? (
        <div className="pointer-events-none fixed inset-0 z-50 p-0 sm:p-4">
          {(["gamlar", "metronome"] as const).map((widget) => {
            if (!openWidgets[widget]) return null;
            const widgetTitle = widgetTitleById[widget];
            const offset = widgetOffsets[widget];
            const size = widgetSizes[widget];
            return (
              <div
                key={widget}
                role="dialog"
                aria-modal="false"
                aria-label={widgetTitle}
                className="pointer-events-auto absolute left-1/2 top-1/2 flex max-h-[100dvh] max-w-[100vw] flex-col overflow-hidden rounded-none border border-border bg-surface shadow-2xl sm:rounded-2xl"
                style={{
                  width: size?.width,
                  height: size?.height,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              >
                <div
                  className="flex cursor-default items-center justify-between gap-1.5 border-b border-border bg-surface/90 px-2.5 py-1.5 backdrop-blur sm:cursor-move"
                  onPointerDown={(e) => handleWidgetHeaderPointerDown(widget, e)}
                  onPointerMove={handleWidgetHeaderPointerMove}
                  onPointerUp={handleWidgetHeaderPointerUp}
                  onPointerCancel={handleWidgetHeaderPointerUp}
                >
                  <p className="text-sm font-semibold leading-tight tracking-tight text-foreground">
                    {widgetTitle}
                  </p>
                  <PanelCloseButton onClick={() => setOpenWidgets((w) => ({ ...w, [widget]: false }))} />
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {widget === "gamlar" ? (
                    <div className="mx-auto max-w-6xl">
                      <PreviewGamlarScaleExplorer
                        lockedTonicPc={transposedTonicPc}
                        lockedMode={originalMode}
                      />
                    </div>
                  ) : (
                    <MetronomeControls
                      active={metronomeActive}
                      onActiveChange={setMetronomeActive}
                      bpm={metronomeBpm}
                      onBpmChange={setMetronomeBpm}
                      timeSignature={metronomeTimeSignature}
                      onTimeSignatureChange={setMetronomeTimeSignature}
                      layout="column"
                      toggleStartLabel="Başlat"
                      toggleStopLabel="Durdur"
                    />
                  )}
                </div>
                {widget === "gamlar" ? (
                  <button
                    type="button"
                    aria-label="Widget boyutunu değiştir"
                    className="absolute bottom-1 right-1 hidden h-5 w-5 cursor-se-resize rounded bg-border/40 hover:bg-border/70 sm:block"
                    onPointerDown={(e) => handleWidgetResizePointerDown(widget, e)}
                    onPointerMove={handleWidgetResizePointerMove}
                    onPointerUp={handleWidgetResizePointerUp}
                    onPointerCancel={handleWidgetResizePointerUp}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1" role="group" aria-label="Transpoze kontrolleri (ok tuşları)">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1">
            <div className="grid w-full min-w-0 grid-cols-4 gap-1 sm:inline-flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1">
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
                    className={`select-none inline-flex min-h-[36px] w-full min-w-[36px] items-center justify-center rounded-md border px-1.5 py-1 text-xs font-medium leading-none transition sm:w-auto ${
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
            <div className="flex items-center justify-end gap-1 sm:ml-18 sm:justify-start">
              <button
                type="button"
                disabled={!canDecreaseLyricsFont}
                onClick={() => {
                  setLyricsAutoFitEnabled(false);
                  setLyricsFontSizePx((size) => Math.max(LYRICS_FONT_SIZE_MIN, size - LYRICS_FONT_SIZE_STEP));
                }}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Söz yazısını küçült"
                title="Söz yazısını küçült"
              >
                A-
              </button>
              <button
                type="button"
                disabled={!canIncreaseLyricsFont}
                onClick={() => {
                  setLyricsAutoFitEnabled(false);
                  setLyricsFontSizePx((size) => Math.min(LYRICS_FONT_SIZE_MAX, size + LYRICS_FONT_SIZE_STEP));
                }}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-border bg-bg px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Söz yazısını büyüt"
                title="Söz yazısını büyüt"
              >
                A+
              </button>
              <button
                type="button"
                aria-pressed={splitLyricsEnabled}
                onClick={() => setSplitLyricsEnabled((prev) => !prev)}
                className={`inline-flex min-h-[36px] items-center justify-center rounded-lg border px-2 py-1.5 text-sm font-semibold transition ${
                  splitLyricsEnabled
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-bg text-foreground hover:bg-surface"
                }`}
                aria-label="Sözleri iki sütuna böl"
                title="Sözleri iki sütuna böl"
              >
                Böl
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:items-end">
          <div className="flex w-full items-center justify-end sm:w-auto">
            <button
              type="button"
              disabled={!canSave || saveState === "saving"}
              onClick={() => void onSave()}
              title={!firebaseConfigured ? "NEXT_PUBLIC_FIREBASE_* tanımlayın" : undefined}
              className="w-full rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50 min-h-[36px] sm:w-auto"
            >
              {saveState === "saving" ? "Kaydediliyor…" : "Kaydet ve Listeye ekle"}
            </button>
          </div>
          <div className="w-full sm:hidden">
            <button
              type="button"
              onClick={() => {
                const next = !sceneMode;
                setSceneMode(next);
                replaceSceneParam(next);
              }}
              aria-pressed={sceneMode}
              aria-label="Tam ekran"
              title="Tam ekran"
              className={`group relative inline-flex min-h-[36px] w-full items-center justify-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                sceneMode
                  ? "border-accent bg-accent text-accent-foreground shadow-md shadow-black/10 ring-1 ring-accent/30"
                  : "border-border bg-surface text-foreground shadow-sm shadow-black/5 hover:border-accent/40 hover:bg-bg/70"
              }`}
            >
              <Mic aria-hidden className="size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" strokeWidth={2.25} />
              <span className="leading-none tracking-wide">Tam ekran</span>
            </button>
          </div>
          {firebaseUid === undefined ? (
            <span className="text-center text-sm text-muted sm:text-right">Oturum kontrol ediliyor…</span>
          ) : firebaseUid === null ? (
            <Link
              href={`/giris?returnTo=${encodeURIComponent(pathname)}`}
              className="flex min-h-[36px] w-full items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface sm:inline-flex sm:w-auto"
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

      <article
        className="mt-4 rounded-2xl bg-bg px-4 py-4 sm:px-6 sm:py-6 print:border-0 print:p-0"
        id="chord-body"
      >
        <div className={splitLyricsEnabled ? "grid grid-cols-2 gap-4" : ""}>
          <pre
            data-lyrics-pre="body"
            className="song-chord-text overflow-x-auto overflow-y-hidden whitespace-pre-wrap font-mono leading-none text-foreground sm:leading-snug md:leading-snug"
            style={{ fontSize: `${effectiveLyricsFontSizePx}px` }}
          >
            {renderChordBodyWithHighlights(
              splitLyricsEnabled ? leftChordBody : chordBody,
              semitones,
              () => setChordStripOpen(true),
            )}
          </pre>
          {splitLyricsEnabled ? (
            <pre
              data-lyrics-pre="body"
              className="song-chord-text overflow-x-auto overflow-y-hidden whitespace-pre-wrap font-mono leading-none text-foreground sm:leading-snug md:leading-snug"
              style={{ fontSize: `${effectiveLyricsFontSizePx}px` }}
            >
              {renderChordBodyWithHighlights(rightChordBody, semitones, () => setChordStripOpen(true))}
            </pre>
          ) : null}
        </div>
      </article>

      {showHarmonyDetails ? (
        <>
      <div className="print:hidden">
        <button
          type="button"
          onClick={() => setHarmonyDetailOpen(true)}
          className="mt-2 inline-flex items-center gap-0.5 text-left text-[11px] leading-snug text-muted-foreground/65 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Meraklısına daha fazla detay
          <ChevronRight
            className="size-3 shrink-0 opacity-80"
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      </div>

      {harmonyDetailOpen ? (
        <div
          className="fixed inset-0 z-[83] bg-black/50 p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="harmony-detail-title"
          onMouseDown={() => setHarmonyDetailOpen(false)}
        >
          <div
            className="mx-auto mt-2 max-h-[min(85vh,36rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:mt-8"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-1.5 border-b border-border bg-surface/90 px-2.5 py-1.5">
              <p id="harmony-detail-title" className="text-sm font-medium leading-tight tracking-tight text-foreground">
                Armoni özeti
              </p>
              <PanelCloseButton onClick={() => setHarmonyDetailOpen(false)} />
            </div>
            <div className="max-h-[min(75vh,32rem)] space-y-3 overflow-y-auto p-4 text-sm text-foreground">
              {harmonyDetailsNotes.trim() ? (
                <div className="rounded-lg border border-border bg-bg/80 p-3">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Not
                  </p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{harmonyDetailsNotes}</p>
                </div>
              ) : null}
              <dl className="space-y-1.5 text-xs leading-relaxed">
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <dt className="text-muted-foreground">Ton</dt>
                  <dd>
                    {transposedTonicPc !== null ? PC_TO_NAME[transposedTonicPc] : "—"} ·{" "}
                    {keyModeToLabel(keyMode, originalKey)}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <dt className="text-muted-foreground">Gam</dt>
                  <dd>{gamlarScaleById(gamlarWidgetScaleId)?.name?.trim() ?? "—"}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <dt className="text-muted-foreground">Transpoze</dt>
                  <dd>
                    {semitones > 0 ? "+" : ""}
                    {semitones} yarım ton
                  </dd>
                </div>
                {initialBpm !== undefined ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt className="text-muted-foreground">Tempo</dt>
                    <dd>{initialBpm} BPM</dd>
                  </div>
                ) : null}
                {initialTimeSignature ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt className="text-muted-foreground">Ölçü</dt>
                    <dd>{initialTimeSignature}</dd>
                  </div>
                ) : null}
              </dl>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Parçadaki akorlar (tekil)</p>
                {harmonyRomanRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Akor bulunamadı.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {harmonyRomanRows.map((row) => (
                      <li
                        key={row.symbol}
                        className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-xs font-mono"
                      >
                        <span>{row.symbol}</span>
                        <span className="text-muted-foreground">
                          {row.roman ?? "diyatonik dışı"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Akor akışı (sırayla)</p>
                {chordProgressionTokens.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Akor bulunamadı.</p>
                ) : (
                  <p className="break-words font-mono text-xs leading-relaxed text-foreground">
                    {chordProgressionTokens.join(" → ")}
                  </p>
                )}
              </div>

              <p className="text-[11px] leading-snug text-muted-foreground">
                Roma rakamları, seçilen ton ve moda göre diyatonik derecelerden türetilir; kromatik / geçiş rengi
                akorlar &quot;diyatonik dışı&quot; olarak işaretlenir.
              </p>

              <p
                className="border-t border-border pt-3 text-[10px] leading-snug text-muted-foreground/90"
                role="note"
              >
                {HARMONY_DETAIL_DEFAULT_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      ) : null}
        </>
      ) : null}

      <div className="print:hidden">
        <MetronomeEngine
          active={metronomeActive}
          bpm={metronomeBpm}
          timeSignature={metronomeTimeSignature}
        />
      </div>
    </div>
  );
}
