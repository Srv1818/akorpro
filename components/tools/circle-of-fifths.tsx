"use client";

import { Chord, Key, Note } from "tonal";
import { memo, useCallback, useMemo, useState } from "react";

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

type Props = { variant?: "widget" | "full"; className?: string };

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MODES: { id: ScaleMode; label: string }[] = [
  { id: "major", label: "Majör" },
  { id: "natural", label: "Doğal Minör" },
  { id: "harmonic", label: "Harmonik Minör" },
  { id: "melodic", label: "Melodik Minör" },
];

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

function scaleChanges(natScale: string[], altScale: string[]): DegChange[] {
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
/*  Highlight logic                                                    */
/* ------------------------------------------------------------------ */

function diatonicCo5Indices(majorKeyIdx: number): Set<number> {
  const s = new Set<number>();
  for (let offset = -1; offset <= 5; offset++) {
    s.add(((majorKeyIdx + offset) % 12 + 12) % 12);
  }
  return s;
}

function wedgeHighlight(idx: number, majorKeyIdx: number, diatonic: Set<number>): number {
  if (!diatonic.has(idx)) return 0;
  const dist = Math.abs(((idx - majorKeyIdx + 6) % 12) - 6);
  if (dist === 0) return 1.0;
  if (dist <= 1) return 0.85;
  if (dist <= 2) return 0.65;
  if (dist <= 3) return 0.5;
  return 0.35;
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
              : "text-muted hover:text-foreground"
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
    minor: "bg-emerald-500 text-zinc-900",
    diminished: "bg-zinc-600 text-zinc-100",
    augmented: "bg-amber-500 text-zinc-900",
    dominant: "bg-amber-500 text-zinc-900",
    "half-dim": "bg-zinc-600 text-zinc-100",
  }[entry.quality];

  const romanColor = {
    major: "text-amber-400",
    minor: "text-emerald-400",
    diminished: "text-zinc-400",
    augmented: "text-amber-400",
    dominant: "text-amber-400",
    "half-dim": "text-zinc-400",
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

  const isHorizontal = side === "bottom";

  return (
    <div className={`flex flex-col ${side === "right" ? "items-end" : side === "bottom" ? "items-center" : "items-start"}`}>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">{title}</p>
      <div className={`flex ${isHorizontal ? "flex-row flex-wrap justify-center gap-3" : "flex-col gap-2"}`}>
        {entries.map((e) => (
          <div key={e.roman} className={`flex items-center gap-2 ${side === "left" ? "flex-row-reverse" : "flex-row"}`}>
            {e.alteration && (
              <div className={`flex items-center gap-1 ${side === "left" ? "flex-row-reverse" : "flex-row"}`}>
                <span className="text-cyan-400">
                  {side === "left" ? "←" : "→"}
                </span>
                <span className="max-w-[200px] text-[9px] leading-tight text-cyan-400">{e.alteration}</span>
              </div>
            )}
            <ChordBadge entry={e} side={side} />
          </div>
        ))}
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
  onWedgeClick,
}: {
  size: number;
  majorKeyIdx: number;
  mode: ScaleMode;
  onWedgeClick: (idx: number, ring: "outer" | "inner") => void;
}) {
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.46;
  const rMid = rOuter * 0.72;
  const rInner = rMid * 0.65;
  const hubR = rInner * 0.72;

  const diatonic = useMemo(() => diatonicCo5Indices(majorKeyIdx), [majorKeyIdx]);

  const minorTonic = useMemo(() => relativeMinorName(CO5_LABELS[majorKeyIdx]), [majorKeyIdx]);
  const centerLabel = useMemo(() => {
    const maj = CO5_LABELS[majorKeyIdx];
    if (mode === "major") return `${maj} Major`;
    const labels: Record<string, string> = { natural: "Natural\nMinor", harmonic: "Harmonic\nMinor", melodic: "Melodic\nMinor" };
    return `${minorTonic} ${labels[mode]}`;
  }, [majorKeyIdx, minorTonic, mode]);

  const centerLines = centerLabel.split("\n");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
      <circle cx={cx} cy={cy} r={rOuter + 4} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />

      {CO5_PITCH_CLASSES.map((_, i) => {
        const startDeg = i * 30 - 105;
        const endDeg = startDeg + 30;
        const midDeg = startDeg + 15;

        const hl = wedgeHighlight(i, majorKeyIdx, diatonic);
        const majLabel = CO5_LABELS[i];
        const minLabel = CO5_MINOR_LABELS[i];
        const dimKey = Key.majorKey(majLabel);
        const dimTriad = dimKey.triads[6] ?? "";
        const dimLabel = formatSym(dimTriad);

        const outerFill = hl > 0 ? `rgba(217,161,12,${0.12 + hl * 0.25})` : "rgba(63,63,70,0.25)";
        const midFill = hl > 0 ? `rgba(180,140,20,${0.08 + hl * 0.18})` : "rgba(63,63,70,0.18)";
        const innerFill = hl > 0 ? `rgba(140,110,20,${0.06 + hl * 0.14})` : "rgba(63,63,70,0.12)";
        const stroke = hl > 0.7 ? "rgba(251,191,36,0.7)" : "rgba(63,63,70,0.5)";

        const pOuter = wedgePath(cx, cy, rMid, rOuter, startDeg, endDeg);
        const pMid = wedgePath(cx, cy, rInner, rMid, startDeg, endDeg);
        const pInner = wedgePath(cx, cy, hubR + 2, rInner, startDeg, endDeg);

        const oPos = polarXY(cx, cy, (rOuter + rMid) / 2, midDeg);
        const mPos = polarXY(cx, cy, (rMid + rInner) / 2, midDeg);
        const iPos = polarXY(cx, cy, (rInner + hubR + 2) / 2, midDeg);

        const outerFontSize = size > 300 ? 13 : 10;
        const midFontSize = size > 300 ? 10.5 : 8;
        const innerFontSize = size > 300 ? 8 : 6.5;

        return (
          <g key={i}>
            <path d={pOuter} fill={outerFill} stroke={stroke} strokeWidth={0.6} className="cursor-pointer hover:brightness-125 transition-all" onClick={() => onWedgeClick(i, "outer")} />
            <path d={pMid} fill={midFill} stroke={stroke} strokeWidth={0.5} className="cursor-pointer hover:brightness-125 transition-all" onClick={() => onWedgeClick(i, "inner")} />
            <path d={pInner} fill={innerFill} stroke={stroke} strokeWidth={0.4} />

            <text x={oPos.x} y={oPos.y} textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none select-none font-bold"
              style={{ fontSize: outerFontSize, fill: hl > 0 ? `rgba(255,245,200,${0.6 + hl * 0.4})` : "rgba(161,161,170,0.7)" }}>
              {majLabel}
            </text>
            <text x={mPos.x} y={mPos.y} textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none select-none font-semibold"
              style={{ fontSize: midFontSize, fill: hl > 0 ? `rgba(220,230,200,${0.5 + hl * 0.4})` : "rgba(161,161,170,0.55)" }}>
              {minLabel}
            </text>
            <text x={iPos.x} y={iPos.y} textAnchor="middle" dominantBaseline="central"
              className="pointer-events-none select-none font-semibold"
              style={{ fontSize: innerFontSize, fill: hl > 0 ? `rgba(255,200,200,${0.4 + hl * 0.4})` : "rgba(161,161,170,0.4)" }}>
              {dimLabel}
            </text>
          </g>
        );
      })}

      {/* Hub */}
      <circle cx={cx} cy={cy} r={hubR} fill="var(--bg)" stroke="var(--border)" strokeWidth={1.5} />
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

function CircleOfFifthsInner({ variant = "widget", className = "" }: Props) {
  const setStoreTonal = usePreviewToolsStore((s) => s.setTonalCenterIndex);

  const [majorKeyIdx, setMajorKeyIdx] = useState(1); // G
  const [mode, setMode] = useState<ScaleMode>("major");

  const svgSize = variant === "full" ? 420 : 260;

  const handleWedgeClick = useCallback(
    (idx: number, ring: "outer" | "inner") => {
      setMajorKeyIdx(idx);
      if (ring === "outer") setMode("major");
      else if (mode === "major") setMode("natural");
      setStoreTonal(CO5_PITCH_CLASSES[idx]);
    },
    [mode, setStoreTonal],
  );

  const handleModeChange = useCallback((m: ScaleMode) => {
    setMode(m);
  }, []);

  const chords = useMemo(() => buildChords(CO5_LABELS[majorKeyIdx], mode), [majorKeyIdx, mode]);

  const majorChords = useMemo(() => chords.filter((c) => c.panel === "major"), [chords]);
  const minorChords = useMemo(() => chords.filter((c) => c.panel === "minor"), [chords]);
  const dimChords = useMemo(() => chords.filter((c) => c.panel === "dim"), [chords]);

  if (variant === "widget") {
    return (
      <div className={className}>
        <CircleSVG size={svgSize} majorKeyIdx={majorKeyIdx} mode={mode} onWedgeClick={handleWedgeClick} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <ModeTabBar mode={mode} onChange={handleModeChange} />

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
        {/* Left panel - MAJOR chords */}
        <div className="order-2 min-w-[140px] lg:order-1 lg:min-w-[200px]">
          <ChordPanel title="MAJÖR" entries={majorChords} side="left" />
        </div>

        {/* Circle */}
        <div className="order-1 flex shrink-0 justify-center lg:order-2">
          <CircleSVG size={svgSize} majorKeyIdx={majorKeyIdx} mode={mode} onWedgeClick={handleWedgeClick} />
        </div>

        {/* Right panel - MINOR chords */}
        <div className="order-3 min-w-[140px] lg:min-w-[200px]">
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
