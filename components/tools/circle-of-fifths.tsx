"use client";

import { Chord, Key, Note } from "tonal";
import { memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { CO5_LABELS, CO5_PITCH_CLASSES } from "@/lib/music/note-utils";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ScaleMode = "major" | "natural" | "harmonic" | "melodic";
type ChordQuality = "major" | "minor" | "diminished" | "augmented" | "dominant" | "half-dim";
type Panel = "major" | "minor" | "dim";

type ChordEntry = {
  degree: number;
  roman: string;
  symbol: string;
  quality: ChordQuality;
  panel: Panel;
  alteration?: string;
};

type Props = {
  variant?: "widget" | "full";
  className?: string;
  lockedMode?: ScaleMode;
  selectedPitchClass?: number | null;
  onPitchClassSelect?: (pitchClass: number) => void;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MODES: { id: ScaleMode; label: string }[] = [
  { id: "major", label: "Majör" },
  { id: "natural", label: "Doğal Minör" },
  { id: "harmonic", label: "Harmonik Minör" },
  { id: "melodic", label: "Melodik Minör" },
];
const MODE_LABELS: Record<ScaleMode, string> = {
  major: "Majör",
  natural: "Doğal Minör",
  harmonic: "Harmonik Minör",
  melodic: "Melodik Minör",
};

const ROMAN_MAJ = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const ROMAN_NAT = ["i", "ii°", "III", "iv", "v", "VI", "VII"] as const;
const ROMAN_HAR = ["i", "ii°", "III+", "iv", "V", "VI", "vii°"] as const;
const ROMAN_MEL = ["i", "ii", "III+", "IV", "V", "vi°7", "vii°7"] as const;

/* ------------------------------------------------------------------ */
/*  Music helpers                                                      */
/* ------------------------------------------------------------------ */

const CO5_MINOR_LABELS = ["Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "Bbm", "Fm", "Cm", "Gm", "Dm"] as const;

function relativeMinorName(majorTonic: string): string {
  const idx = CO5_LABELS.indexOf(majorTonic as (typeof CO5_LABELS)[number]);
  if (idx >= 0) return CO5_MINOR_LABELS[idx].replace("m", "");
  const t = Note.transpose(majorTonic, "-3m");
  return t ? Note.get(t).pc : majorTonic;
}

function formatSym(s: string): string {
  return s.replace(/dim/gi, "°").replace(/aug/gi, "aug");
}

function qualityOf(sym: string): ChordQuality {
  if (/m7b5|ø/i.test(sym)) return "half-dim";
  if (/dim|°/i.test(sym)) return "diminished";
  if (/aug|\+/i.test(sym)) return "augmented";
  const c = Chord.get(sym);
  if (!c.empty) {
    const q = c.quality.toLowerCase();
    if (q === "minor") return "minor";
    if (q === "augmented") return "augmented";
    if (q === "diminished") return "diminished";
  }
  if (/7$/.test(sym) && !/m7|maj7/i.test(sym)) return "dominant";
  return "major";
}

function panelOf(q: ChordQuality): Panel {
  if (q === "minor") return "minor";
  if (q === "diminished" || q === "half-dim") return "dim";
  return "major";
}

/* ------------------------------------------------------------------ */
/*  Chord computation for each mode                                    */
/* ------------------------------------------------------------------ */

function buildChords(majorTonic: string, mode: ScaleMode): ChordEntry[] {
  if (mode === "major") {
    const k = Key.majorKey(majorTonic);
    return k.triads.map((sym, i) => {
      const q = qualityOf(sym);
      return { degree: i, roman: ROMAN_MAJ[i], symbol: formatSym(sym), quality: q, panel: panelOf(q) };
    });
  }

  const minTonic = relativeMinorName(majorTonic);
  const mk = Key.minorKey(minTonic);

  if (mode === "natural") {
    return mk.natural.triads.map((sym, i) => {
      const q = qualityOf(sym);
      return { degree: i, roman: ROMAN_NAT[i], symbol: formatSym(sym), quality: q, panel: panelOf(q) };
    });
  }

  const natTriads = mk.natural.triads;
  const natScale = mk.natural.scale;

  if (mode === "harmonic") {
    const harTriads = mk.harmonic.triads;
    const harScale = mk.harmonic.scale;
    const degChanges = scaleChanges(natScale, harScale);

    return harTriads.map((sym, i) => {
      const q = qualityOf(sym);
      const alt = natTriads[i] !== sym ? buildAltText(degChanges, natTriads[i], sym, Chord.get(natTriads[i]).notes) : undefined;
      return { degree: i, roman: ROMAN_HAR[i], symbol: formatSym(sym), quality: q, panel: panelOf(q), alteration: alt };
    });
  }

  // melodic: use 7th chords for changed degrees, except augmented where triad is clearer
  const melTriads = mk.melodic.triads;
  const melChords = mk.melodic.chords;
  const melScale = mk.melodic.scale;
  const degChanges = scaleChanges(natScale, melScale);

  return melTriads.map((sym, i) => {
    const changed = natTriads[i] !== sym;
    const isAug = /aug|\+/i.test(sym);
    const displaySym = changed ? (isAug ? sym : melChords[i]) : sym;
    const q = qualityOf(displaySym);
    const alt = changed ? buildAltText(degChanges, natTriads[i], formatSym(displaySym), Chord.get(natTriads[i]).notes) : undefined;
    return { degree: i, roman: ROMAN_MEL[i], symbol: formatSym(displaySym), quality: q, panel: panelOf(q), alteration: alt };
  });
}

type DegChange = { deg: number; from: string; to: string };

function scaleChanges(natScale: readonly string[], altScale: readonly string[]): DegChange[] {
  const out: DegChange[] = [];
  for (let i = 0; i < 7; i++) {
    if (natScale[i] !== altScale[i]) out.push({ deg: i + 1, from: natScale[i], to: altScale[i] });
  }
  return out;
}

function buildAltText(changes: DegChange[], natSym: string, newSym: string, natChordNotes: string[]): string {
  const natNotesChromas = new Set(natChordNotes.map((n) => Note.get(n).chroma));
  const relevant = changes.filter((c) => natNotesChromas.has(Note.get(c.from).chroma));

  if (relevant.length === 0 && changes.length > 0) {
    const rc = changes[0];
    return `${rc.deg}. derece arızası (${rc.from} → ${rc.to}) (${formatSym(natSym)} → ${formatSym(newSym)})`;
  }

  const parts = relevant.map((c) => `${c.deg}. derece arızası (${c.from} → ${c.to})`);
  return `${parts.join(", ")} (${formatSym(natSym)} → ${formatSym(newSym)})`;
}

/* ------------------------------------------------------------------ */
/*  SVG helpers                                                        */
/* ------------------------------------------------------------------ */

function wedgePath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a0 = rad(startDeg), a1 = rad(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const x0o = cx + r2 * Math.cos(a0), y0o = cy + r2 * Math.sin(a0);
  const x1o = cx + r2 * Math.cos(a1), y1o = cy + r2 * Math.sin(a1);
  const x0i = cx + r1 * Math.cos(a0), y0i = cy + r1 * Math.sin(a0);
  const x1i = cx + r1 * Math.cos(a1), y1i = cy + r1 * Math.sin(a1);
  return `M${x0o},${y0o} A${r2},${r2} 0 ${large} 1 ${x1o},${y1o} L${x1i},${y1i} A${r1},${r1} 0 ${large} 0 ${x0i},${y0i}Z`;
}

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* ------------------------------------------------------------------ */
/*  Highlight: yalnızca panelde listelenen maj / min / dim akorlarının dilimleri */
/* ------------------------------------------------------------------ */

function co5IndexForRootPc(rootPc: number): number | null {
  for (let i = 0; i < 12; i++) {
    if (Note.get(CO5_LABELS[i]).chroma === rootPc) return i;
  }
  return null;
}

function chordEntryRootPc(symbol: string): number | null {
  const c = Chord.get(symbol);
  if (c.empty || c.tonic == null) return null;
  return Note.get(c.tonic).chroma;
}

/** Dış halka: majör anahtar adı; orta: minör etiket; iç: o majör gamın vii°’si — panel akoru hangi halkada yazılıysa o dilimde vurgu. */
type RingHighlights = { outer: Set<number>; mid: Set<number>; inner: Set<number> };

function co5IndexForMinorPanelChord(symbol: string): number | null {
  const pc = chordEntryRootPc(symbol);
  if (pc == null) return null;
  for (let i = 0; i < 12; i++) {
    const c = Chord.get(CO5_MINOR_LABELS[i]);
    if (!c.empty && c.tonic && Note.get(c.tonic).chroma === pc) return i;
  }
  return null;
}

function co5IndexForDimPanelChord(symbol: string): number | null {
  const pc = chordEntryRootPc(symbol);
  if (pc == null) return null;
  for (let i = 0; i < 12; i++) {
    const t6 = Key.majorKey(CO5_LABELS[i]).triads[6];
    if (!t6) continue;
    const c = Chord.get(t6);
    if (c.empty || !c.tonic) continue;
    if (Note.get(c.tonic).chroma === pc) return i;
  }
  return null;
}

function ringHighlightsFromChordEntries(entries: ChordEntry[]): RingHighlights {
  const outer = new Set<number>();
  const mid = new Set<number>();
  const inner = new Set<number>();
  for (const e of entries) {
    if (e.panel === "major") {
      const pc = chordEntryRootPc(e.symbol);
      if (pc == null) continue;
      const idx = co5IndexForRootPc(pc);
      if (idx != null) outer.add(idx);
    } else if (e.panel === "minor") {
      const idx = co5IndexForMinorPanelChord(e.symbol);
      if (idx != null) mid.add(idx);
    } else {
      const idx = co5IndexForDimPanelChord(e.symbol);
      if (idx != null) inner.add(idx);
    }
  }
  return { outer, mid, inner };
}

function ringHighlight(ring: "outer" | "mid" | "inner", idx: number, majorKeyIdx: number, hl: RingHighlights): number {
  const set = ring === "outer" ? hl.outer : ring === "mid" ? hl.mid : hl.inner;
  if (!set.has(idx)) return 0;
  return ring === "outer" && idx === majorKeyIdx ? 1 : 0.9;
}

/**
 * Karanlık: yarı saydam dilimler koyu zeminde iyi çalışır.
 * Aydınlık: yarı saydam gri + açık surface üst üste “silik” görünür — opak slate/zinc kullan.
 */
function co5Palette(isDark: boolean) {
  if (isDark) {
    return {
      outerBase: "rgba(63,63,70,0.25)",
      midBase: "rgba(63,63,70,0.18)",
      innerBase: "rgba(63,63,70,0.12)",
      strokeBase: "rgba(63,63,70,0.5)",
      strokeHl: "rgba(251,191,36,0.75)",
      outerHl: (hl: number) => `rgba(217,161,12,${0.12 + hl * 0.25})`,
      midHl: (hl: number) => `rgba(180,140,20,${0.08 + hl * 0.18})`,
      innerHl: (hl: number) => `rgba(140,110,20,${0.06 + hl * 0.14})`,
      textOuterMuted: "rgba(161,161,170,0.7)",
      textOuterHl: (hl: number) => `rgba(255,245,200,${0.6 + hl * 0.4})`,
      textMidMuted: "rgba(161,161,170,0.55)",
      textMidHl: (hl: number) => `rgba(220,230,200,${0.5 + hl * 0.4})`,
      textInnerMuted: "rgba(161,161,170,0.4)",
      textInnerHl: (hl: number) => `rgba(255,200,200,${0.4 + hl * 0.4})`,
      strokeW: { outer: 0.6, mid: 0.5, inner: 0.4 },
      rimStroke: 1,
      rimStrokeCss: "var(--border)",
      hubStrokeW: 1.5,
    };
  }

  return {
    outerBase: "rgb(203, 213, 225)",
    midBase: "rgb(228, 228, 231)",
    innerBase: "rgb(237, 237, 242)",
    strokeBase: "rgb(82, 82, 91)",
    strokeHl: "rgb(146, 64, 14)",
    outerHl: (hl: number) => `rgba(251, 191, 36, ${0.42 + hl * 0.48})`,
    midHl: (hl: number) => `rgba(252, 211, 77, ${0.5 + hl * 0.42})`,
    innerHl: (hl: number) => `rgba(252, 165, 165, ${0.45 + hl * 0.45})`,
    textOuterMuted: "rgb(24, 24, 27)",
    textOuterHl: (hl: number) => {
      void hl;
      return "rgb(69, 26, 3)";
    },
    textMidMuted: "rgb(39, 39, 42)",
    textMidHl: (hl: number) => {
      void hl;
      return "rgb(24, 24, 27)";
    },
    textInnerMuted: "rgb(63, 63, 70)",
    textInnerHl: (hl: number) => {
      void hl;
      return "rgb(127, 29, 29)";
    },
    strokeW: { outer: 1.15, mid: 1.05, inner: 0.95 },
    rimStroke: 2.5,
    rimStrokeCss: "rgb(113, 113, 122)",
    hubStrokeW: 2.25,
  };
}

/** next-themes `resolvedTheme` hidratasyon sırasında undefined olabiliyor; `html.dark` kaynak. */
function useIsDarkHtmlClass(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === "undefined") return () => {};
      const el = document.documentElement;
      const obs = new MutationObserver(() => {
        onStoreChange();
      });
      obs.observe(el, { attributes: true, attributeFilter: ["class"] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ModeTabBar({ mode, onChange }: { mode: ScaleMode; onChange: (m: ScaleMode) => void }) {
  return (
    <div className="mx-auto flex max-w-2xl rounded-xl border border-border bg-surface/60 p-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
            mode === m.id
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-zinc-700 hover:text-foreground dark:text-muted"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ChordBadge({ entry, side }: { entry: ChordEntry; side: "left" | "right" | "bottom" }) {
  const badgeBg = {
    major: "bg-amber-500 text-zinc-900",
    minor: "bg-green-500 text-zinc-900",
    diminished: "bg-zinc-600 text-zinc-100",
    augmented: "bg-amber-500 text-zinc-900",
    dominant: "bg-amber-500 text-zinc-900",
    "half-dim": "bg-zinc-600 text-zinc-100",
  }[entry.quality];

  const romanColor = {
    major: "text-amber-800 dark:text-amber-400",
    minor: "text-green-800 dark:text-green-400",
    diminished: "text-zinc-600 dark:text-zinc-400",
    augmented: "text-amber-800 dark:text-amber-400",
    dominant: "text-amber-800 dark:text-amber-400",
    "half-dim": "text-zinc-600 dark:text-zinc-400",
  }[entry.quality];

  const badge = (
    <span className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold ${badgeBg}`}>
      {entry.symbol}
    </span>
  );

  const roman = <span className={`text-[11px] font-semibold ${romanColor}`}>{entry.roman}</span>;

  if (side === "right") {
    return (
      <div className="flex items-center gap-2">
        {badge}
        {roman}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {roman}
      {badge}
    </div>
  );
}

function ChordPanel({
  title,
  entries,
  side,
}: {
  title: string;
  entries: ChordEntry[];
  side: "left" | "right" | "bottom";
}) {
  if (entries.length === 0) return null;

  // Sol panel elemanlarını sağa (çembere yakın), sağ ve alt panelleri ise sola yaslıyoruz.
  const containerAlign = side === "left" ? "items-end" : "items-start";

  return (
    <div className={`flex flex-col ${containerAlign}`}>
      {/* Başlık: Sadece alt paneldeyken ortalanması daha şık durur */}
      <p
        className={`mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-muted ${side === "bottom" ? "w-full text-center" : ""}`}
      >
        {title}
      </p>

      {/* Bütün panellerdeki akorları (Dim dahil) kesinlikle alt alta (flex-col) diziyoruz */}
      <div className="flex flex-col gap-2">
        {entries.map((e) => {
          // 1. SOL PANEL (Majör): Açıklama sola uzar -> [Metin] [Ok] [Akor]
          if (side === "left") {
            return (
              <div key={e.roman} className="flex items-center justify-end gap-2">
                {e.alteration && (
                  <div className="flex items-center gap-1 text-foreground">
                    <span className="max-w-[220px] text-[10px] font-medium leading-snug text-right text-foreground">
                      {e.alteration}
                    </span>
                    <span className="shrink-0" aria-hidden>
                      ←
                    </span>
                  </div>
                )}
                <ChordBadge entry={e} side={side} />
              </div>
            );
          }

          // 2. SAĞ (Minör) ve ALT (Dim) PANELLER: Açıklama sağa uzar -> [Akor] [Ok] [Metin]
          return (
            <div key={e.roman} className="flex items-center justify-start gap-2">
              <ChordBadge entry={e} side={side} />
              {e.alteration && (
                <div className="flex items-center gap-1 text-foreground">
                  <span className="shrink-0" aria-hidden>
                    →
                  </span>
                  <span className="max-w-[220px] text-[10px] font-medium leading-snug text-left text-foreground">
                    {e.alteration}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  The Circle SVG                                                     */
/* ------------------------------------------------------------------ */

function CircleSVG({
  size,
  majorKeyIdx,
  mode,
  ringHighlights,
  onWedgeClick,
}: {
  size: number;
  majorKeyIdx: number;
  mode: ScaleMode;
  ringHighlights: RingHighlights;
  onWedgeClick: (idx: number, ring: "outer" | "inner") => void;
}) {
  const isDark = useIsDarkHtmlClass();
  const c = useMemo(() => co5Palette(isDark), [isDark]);

  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.46;
  const rMid = rOuter * 0.72;
  const rInner = rMid * 0.65;
  const hubR = rInner * 0.72;

  const minorTonic = useMemo(() => relativeMinorName(CO5_LABELS[majorKeyIdx]), [majorKeyIdx]);
  const centerLabel = useMemo(() => {
    const maj = CO5_LABELS[majorKeyIdx];
    if (mode === "major") return `${maj} Major`;
    const labels: Record<string, string> = { natural: "Natural\nMinor", harmonic: "Harmonic\nMinor", melodic: "Melodic\nMinor" };
    return `${minorTonic} ${labels[mode]}`;
  }, [majorKeyIdx, minorTonic, mode]);

  const centerLines = centerLabel.split("\n");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full text-foreground">
      <circle cx={cx} cy={cy} r={rOuter + 4} fill="var(--surface)" stroke={c.rimStrokeCss} strokeWidth={c.rimStroke} />

      {CO5_PITCH_CLASSES.map((_, i) => {
        const startDeg = i * 30 - 105;
        const endDeg = startDeg + 30;
        const midDeg = startDeg + 15;

        const hlO = ringHighlight("outer", i, majorKeyIdx, ringHighlights);
        const hlM = ringHighlight("mid", i, majorKeyIdx, ringHighlights);
        const hlI = ringHighlight("inner", i, majorKeyIdx, ringHighlights);
        const majLabel = CO5_LABELS[i];
        const minLabel = CO5_MINOR_LABELS[i];
        const dimKey = Key.majorKey(majLabel);
        const dimTriad = dimKey.triads[6] ?? "";
        const dimLabel = formatSym(dimTriad);

        const outerFill = hlO > 0 ? c.outerHl(hlO) : c.outerBase;
        const midFill = hlM > 0 ? c.midHl(hlM) : c.midBase;
        const innerFill = hlI > 0 ? c.innerHl(hlI) : c.innerBase;
        const strokeO = hlO > 0.7 ? c.strokeHl : c.strokeBase;
        const strokeM = hlM > 0.7 ? c.strokeHl : c.strokeBase;
        const strokeI = hlI > 0.7 ? c.strokeHl : c.strokeBase;

        const pOuter = wedgePath(cx, cy, rMid, rOuter, startDeg, endDeg);
        const pMid = wedgePath(cx, cy, rInner, rMid, startDeg, endDeg);
        const pInner = wedgePath(cx, cy, hubR + 2, rInner, startDeg, endDeg);

        const oPos = polarXY(cx, cy, (rOuter + rMid) / 2, midDeg);
        const mPos = polarXY(cx, cy, (rMid + rInner) / 2, midDeg);
        const iPos = polarXY(cx, cy, (rInner + hubR + 2) / 2, midDeg);

        const outerFontSize = size > 300 ? 13 : isDark ? 10 : 10.5;
        const midFontSize = size > 300 ? 10.5 : isDark ? 8 : 8.5;
        const innerFontSize = size > 300 ? 8 : isDark ? 6.5 : 7;

        return (
          <g key={i}>
            <path
              d={pOuter}
              fill={outerFill}
              stroke={strokeO}
              strokeWidth={c.strokeW.outer}
              className="cursor-pointer hover:brightness-125 transition-all"
              onClick={() => onWedgeClick(i, "outer")}
            />
            <path
              d={pMid}
              fill={midFill}
              stroke={strokeM}
              strokeWidth={c.strokeW.mid}
              className="cursor-pointer hover:brightness-125 transition-all"
              onClick={() => onWedgeClick(i, "inner")}
            />
            <path d={pInner} fill={innerFill} stroke={strokeI} strokeWidth={c.strokeW.inner} />

            <text x={oPos.x} y={oPos.y} textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none select-none font-bold"
              style={{ fontSize: outerFontSize, fill: hlO > 0 ? c.textOuterHl(hlO) : c.textOuterMuted }}>
              {majLabel}
            </text>
            <text x={mPos.x} y={mPos.y} textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none select-none font-semibold"
              style={{ fontSize: midFontSize, fill: hlM > 0 ? c.textMidHl(hlM) : c.textMidMuted }}>
              {minLabel}
            </text>
            <text x={iPos.x} y={iPos.y} textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none select-none font-semibold"
              style={{ fontSize: innerFontSize, fill: hlI > 0 ? c.textInnerHl(hlI) : c.textInnerMuted }}>
              {dimLabel}
            </text>
          </g>
        );
      })}

      {/* Hub */}
      <circle cx={cx} cy={cy} r={hubR} fill="var(--bg)" stroke={c.rimStrokeCss} strokeWidth={c.hubStrokeW} />
      <text x={cx} y={cy - (centerLines.length > 1 ? 14 : 6)} textAnchor="middle" dominantBaseline="central"
        className="pointer-events-none select-none fill-current" style={{ fontSize: 22 }}>
        {"\u{1D11E}"}
      </text>
      {centerLines.map((line, li) => (
        <text key={li} x={cx} y={cy + 8 + li * 13} textAnchor="middle" dominantBaseline="central"
          className="pointer-events-none select-none fill-current font-bold" style={{ fontSize: 10.5 }}>
          {line}
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

function CircleOfFifthsInner({
  variant = "widget",
  className = "",
  lockedMode,
  selectedPitchClass,
  onPitchClassSelect,
}: Props) {
  const setStoreTonal = usePreviewToolsStore((s) => s.setTonalCenterIndex);

  const [majorKeyIdx, setMajorKeyIdx] = useState(1); // G
  const [mode, setMode] = useState<ScaleMode>(lockedMode ?? "major");

  const svgSize = variant === "full" ? 340 : 260;

  const handleWedgeClick = useCallback(
    (idx: number, ring: "outer" | "inner") => {
      setMajorKeyIdx(idx);
      if (!lockedMode) {
        if (ring === "outer") setMode("major");
        else if (mode === "major") setMode("natural");
      }
      const selectedPc = CO5_PITCH_CLASSES[idx];
      setStoreTonal(selectedPc);
      onPitchClassSelect?.(selectedPc);
    },
    [lockedMode, mode, onPitchClassSelect, setStoreTonal],
  );

  const handleModeChange = useCallback((m: ScaleMode) => {
    if (lockedMode) return;
    setMode(m);
  }, [lockedMode]);

  useEffect(() => {
    if (!lockedMode) return;
    queueMicrotask(() => setMode(lockedMode));
  }, [lockedMode]);

  useEffect(() => {
    if (selectedPitchClass == null) return;
    const idx = co5IndexForRootPc(selectedPitchClass);
    if (idx == null) return;
    queueMicrotask(() => setMajorKeyIdx(idx));
  }, [selectedPitchClass]);

  const chords = useMemo(() => buildChords(CO5_LABELS[majorKeyIdx], mode), [majorKeyIdx, mode]);
  const ringHighlights = useMemo(() => {
    if (mode === "harmonic" || mode === "melodic") {
      return ringHighlightsFromChordEntries(buildChords(CO5_LABELS[majorKeyIdx], "natural"));
    }
    return ringHighlightsFromChordEntries(chords);
  }, [majorKeyIdx, mode, chords]);

  const majorChords = useMemo(() => chords.filter((c) => c.panel === "major"), [chords]);
  const minorChords = useMemo(() => chords.filter((c) => c.panel === "minor"), [chords]);
  const dimChords = useMemo(() => chords.filter((c) => c.panel === "dim"), [chords]);

  if (variant === "widget") {
    return (
      <div className={className}>
        <CircleSVG
          size={svgSize}
          majorKeyIdx={majorKeyIdx}
          mode={mode}
          ringHighlights={ringHighlights}
          onWedgeClick={handleWedgeClick}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {!lockedMode ? (
        <ModeTabBar mode={mode} onChange={handleModeChange} />
      ) : (
        <div className="mx-auto w-fit rounded-lg border border-border bg-surface/70 px-3 py-1.5 text-xs font-semibold text-muted">
          Mod: <span className="text-foreground">{MODE_LABELS[mode]}</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-3">
        {/* Left panel - MAJOR chords */}
        <div className="order-2 min-w-[120px] lg:order-1 lg:min-w-[150px]">
          <ChordPanel title="MAJÖR" entries={majorChords} side="left" />
        </div>

        {/* Circle */}
        <div className="order-1 flex shrink-0 justify-center lg:order-2">
          <CircleSVG
            size={svgSize}
            majorKeyIdx={majorKeyIdx}
            mode={mode}
            ringHighlights={ringHighlights}
            onWedgeClick={handleWedgeClick}
          />
        </div>

        {/* Right panel - MINOR chords */}
        <div className="order-3 min-w-[120px] lg:min-w-[150px]">
          <ChordPanel title="MİNÖR" entries={minorChords} side="right" />
        </div>
      </div>

      {/* Bottom panel - DIM chords */}
      <div className="flex justify-center">
        <ChordPanel title="DİM" entries={dimChords} side="bottom" />
      </div>
    </div>
  );
}

export const CircleOfFifths = memo(CircleOfFifthsInner);
