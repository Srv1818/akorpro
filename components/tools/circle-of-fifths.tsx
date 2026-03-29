"use client";

import { Chord, Scale } from "tonal";
import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { CO5_LABELS, CO5_PITCH_CLASSES } from "@/lib/music/note-utils";
import {
  type DiatonicTriad,
  type ParentScaleFamily,
  getDiatonicTriads,
  getModeScaleNotes,
  leadingToneRootPc,
  modeLabelsTr,
  modeTypeNames,
  parentScaleFamilyLabelTr,
  relativeMinorRootPc,
  tonicNameFromPitchClass,
  wedgeIndexForTriadHighlight,
} from "@/lib/music/mode-theory";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";

type Props = {
  variant?: "widget" | "full";
  className?: string;
};

function donutWedgePath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number,
): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a0 = rad(startDeg);
  const a1 = rad(endDeg);
  const x0o = cx + rOuter * Math.cos(a0);
  const y0o = cy + rOuter * Math.sin(a0);
  const x1o = cx + rOuter * Math.cos(a1);
  const y1o = cy + rOuter * Math.sin(a1);
  const x0i = cx + rInner * Math.cos(a0);
  const y0i = cy + rInner * Math.sin(a0);
  const x1i = cx + rInner * Math.cos(a1);
  const y1i = cy + rInner * Math.sin(a1);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i} Z`;
}

function labelPos(cx: number, cy: number, r: number, midDeg: number) {
  const rad = (midDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function formatDimSymbol(tonicName: string): string {
  const s = Chord.getChord("dim", tonicName).symbol.replace("dim", "°");
  if (s.endsWith("°")) return s;
  return `${tonicName}°`;
}

function CircleOfFifthsInner({ variant = "widget", className = "" }: Props) {
  const filterId = `co5-${useId().replace(/:/g, "")}`;
  const tonalCenter = usePreviewToolsStore((s) => s.tonalCenterIndex);
  const setTonal = usePreviewToolsStore((s) => s.setTonalCenterIndex);
  const parentScale = usePreviewToolsStore((s) => s.parentScaleFamily);
  const setParentScale = usePreviewToolsStore((s) => s.setParentScaleFamily);
  const modeIndex = usePreviewToolsStore((s) => s.modeIndex);
  const setModeIndex = usePreviewToolsStore((s) => s.setModeIndex);

  const size = variant === "full" ? 380 : 260;
  const cx = size / 2;
  const cy = size / 2;
  const hubR = variant === "full" ? 52 : 36;
  const rOuter = size * 0.48;
  const rO = rOuter;
  const rM = rOuter * 0.78;
  const rI = rOuter * 0.58;

  const activeCoIdx = CO5_PITCH_CLASSES.findIndex((p) => p === tonalCenter);
  const tonicLabel = activeCoIdx >= 0 ? CO5_LABELS[activeCoIdx] : tonicNameFromPitchClass(tonalCenter);

  const scaleNotes = useMemo(
    () => getModeScaleNotes(tonalCenter, parentScale, modeIndex),
    [tonalCenter, parentScale, modeIndex],
  );

  const triads = useMemo(() => getDiatonicTriads(scaleNotes), [scaleNotes]);

  const scaleTitle = useMemo(() => {
    const types = modeTypeNames(parentScale);
    const t = types[modeIndex] ?? "major";
    const name = Scale.get(`${tonicLabel} ${t}`).name;
    return name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [tonicLabel, parentScale, modeIndex]);

  const highlightKeys = useMemo(() => {
    const m = new Map<string, DiatonicTriad["quality"]>();
    for (const t of triads) {
      const w = wedgeIndexForTriadHighlight(t);
      if (!w) continue;
      m.set(`${w.ring}:${w.wedgeIndex}`, t.quality);
    }
    return m;
  }, [triads]);

  const { majorLike, minorLike, dimLike } = useMemo(() => {
    const majorLike: DiatonicTriad[] = [];
    const minorLike: DiatonicTriad[] = [];
    const dimLike: DiatonicTriad[] = [];
    for (const t of triads) {
      if (t.quality === "major" || t.quality === "augmented") majorLike.push(t);
      else if (t.quality === "minor") minorLike.push(t);
      else if (t.quality === "diminished") dimLike.push(t);
    }
    return { majorLike, minorLike, dimLike };
  }, [triads]);

  const groupRef = useRef<SVGSVGElement>(null);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<SVGSVGElement>) => {
      let next = activeCoIdx;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (activeCoIdx + 1) % 12;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (activeCoIdx + 11) % 12;
      } else if (e.key === "Home") {
        e.preventDefault();
        next = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        next = 11;
      } else {
        return;
      }
      setTonal(CO5_PITCH_CLASSES[next]);
    },
    [activeCoIdx, setTonal],
  );

  const onRingClick = useCallback(
    (wedgeIndex: number, ring: "outer" | "middle" | "inner") => {
      const majorPc = CO5_PITCH_CLASSES[wedgeIndex];
      if (majorPc === undefined) return;
      let tonicPc: number;
      if (ring === "outer") tonicPc = majorPc;
      else if (ring === "middle") tonicPc = relativeMinorRootPc(majorPc);
      else tonicPc = leadingToneRootPc(majorPc);
      setTonal(tonicPc);
    },
    [setTonal],
  );

  const modeOptions = modeLabelsTr(parentScale);
  const parentIds: ParentScaleFamily[] = ["natural", "harmonic", "melodic"];

  const panelPill =
    "inline-flex min-w-0 max-w-full items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-tight shadow-sm";

  return (
    <div className={`${className}`}>
      <div className="mb-4 space-y-3">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Ana dizi seçimi</p>
          <div className="flex flex-wrap gap-2">
            {parentIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setParentScale(id)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  parentScale === id
                    ? "border-amber-400/80 bg-amber-500/15 text-foreground shadow-sm ring-1 ring-amber-400/40"
                    : "border-border bg-surface text-muted hover:border-muted hover:text-foreground"
                }`}
              >
                {parentScaleFamilyLabelTr(id)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="co5-mode-select" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted">
            Mod (derece)
          </label>
          {variant === "full" ? (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Mod seçimi">
              {modeOptions.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setModeIndex(i)}
                  className={`rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition sm:text-xs ${
                    modeIndex === i
                      ? "bg-emerald-600/25 text-foreground ring-1 ring-emerald-500/50"
                      : "bg-surface text-muted hover:bg-surface/80 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <select
              id="co5-mode-select"
              value={modeIndex}
              onChange={(e) => setModeIndex(Number(e.target.value))}
              className="w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none ring-accent/20 focus:ring-2"
            >
              {modeOptions.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <p className="mb-3 text-xs text-muted" id="co5-desc">
        5&apos;li çember: dış halka majör kökleri, orta relatif minör, iç vii°. Tıklayınca o perdelerin toniği seçilir; ok
        tuşları tonal merkezi değiştirir. Fretboard ile aynı store.
      </p>

      <div
        className={
          variant === "full"
            ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] lg:items-center"
            : "flex flex-col items-center"
        }
      >
        {/* Sol panel — majör / artırılmış */}
        <div
          className={`order-2 flex flex-col gap-2 lg:order-1 ${variant === "full" ? "items-end text-right" : "w-full max-w-sm items-stretch"}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">Majör</p>
          <div className={`flex flex-col gap-2 ${variant === "full" ? "items-end" : ""}`}>
            {majorLike.map((t) => (
              <span key={t.roman} className={`${panelPill} bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/35`}>
                {t.roman} ({t.symbol})
              </span>
            ))}
            {majorLike.length === 0 ? (
              <span className="text-xs text-muted">—</span>
            ) : null}
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <svg
            ref={groupRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="max-w-full text-foreground"
            role="radiogroup"
            aria-label="Beşli çember — tonal merkez ve diyatonik vurgu"
            aria-describedby="co5-desc"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <title>Beşli çember</title>
            <defs>
              <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx={cx} cy={cy} r={rO + 4} fill="var(--bg)" stroke="var(--border)" strokeWidth={1} />

            {CO5_PITCH_CLASSES.map((majorPc, i) => {
              const startDeg = i * 30 - 90;
              const endDeg = startDeg + 30;
              const midDeg = startDeg + 15;
              const majorName = CO5_LABELS[i];
              const relPc = relativeMinorRootPc(majorPc);
              const relName = tonicNameFromPitchClass(relPc);
              const ltPc = leadingToneRootPc(majorPc);
              const ltName = tonicNameFromPitchClass(ltPc);
              const minorSym = Chord.getChord("m", relName).symbol;

              const ho = highlightKeys.get(`outer:${i}`);
              const hm = highlightKeys.get(`middle:${i}`);
              const hi = highlightKeys.get(`inner:${i}`);

              const fillOuter = ho
                ? ho === "augmented"
                  ? "rgba(251, 191, 36, 0.42)"
                  : "rgba(251, 191, 36, 0.38)"
                : "rgba(63, 63, 70, 0.35)";
              const fillMid = hm ? "rgba(16, 185, 129, 0.35)" : "rgba(63, 63, 70, 0.28)";
              const fillIn = hi ? "rgba(251, 191, 36, 0.28)" : "rgba(63, 63, 70, 0.22)";

              const pOuter = donutWedgePath(cx, cy, rM, rO, startDeg, endDeg);
              const pMid = donutWedgePath(cx, cy, rI, rM, startDeg, endDeg);
              const pInner = donutWedgePath(cx, cy, hubR + 2, rI, startDeg, endDeg);

              const lo = labelPos(cx, cy, (rO + rM) / 2, midDeg);
              const lm = labelPos(cx, cy, (rM + rI) / 2, midDeg);
              const li = labelPos(cx, cy, (rI + hubR + 2) / 2, midDeg);

              const tonicOuterGlow = majorPc === tonalCenter;

              return (
                <g key={majorName}>
                  <path
                    d={pOuter}
                    fill={fillOuter}
                    stroke={tonicOuterGlow ? "rgba(251, 191, 36, 0.85)" : "var(--border)"}
                    strokeWidth={tonicOuterGlow ? 2 : 0.6}
                    className="cursor-pointer transition hover:opacity-95"
                    onClick={() => onRingClick(i, "outer")}
                  />
                  <path
                    d={pMid}
                    fill={fillMid}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    className="cursor-pointer transition hover:opacity-95"
                    onClick={() => onRingClick(i, "middle")}
                  />
                  <path
                    d={pInner}
                    fill={fillIn}
                    stroke="var(--border)"
                    strokeWidth={0.45}
                    className="cursor-pointer transition hover:opacity-95"
                    onClick={() => onRingClick(i, "inner")}
                  />
                  <text
                    x={lo.x}
                    y={lo.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none text-[10px] font-bold sm:text-[11px]"
                    fill={ho ? "var(--foreground)" : "var(--muted-foreground)"}
                  >
                    {majorName}
                  </text>
                  <text
                    x={lm.x}
                    y={lm.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none text-[9px] font-semibold sm:text-[10px]"
                    fill={hm ? "rgb(167, 243, 208)" : "var(--muted-foreground)"}
                  >
                    {minorSym}
                  </text>
                  <text
                    x={li.x}
                    y={li.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none text-[8px] font-semibold"
                    fill={hi ? "var(--foreground)" : "var(--muted-foreground)"}
                  >
                    {formatDimSymbol(ltName)}
                  </text>
                </g>
              );
            })}

            <circle
              cx={cx}
              cy={cy}
              r={hubR}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.5}
              filter={`url(#${filterId})`}
            />
            <text
              x={cx}
              y={cy - (variant === "full" ? 14 : 10)}
              textAnchor="middle"
              className="fill-muted pointer-events-none select-none text-[20px] leading-none"
              aria-hidden
            >
              𝄞
            </text>
            <text
              x={cx}
              y={cy + (variant === "full" ? 18 : 14)}
              textAnchor="middle"
              className="pointer-events-none select-none text-[11px] font-semibold fill-current sm:text-xs"
              aria-live="polite"
            >
              {scaleTitle}
            </text>
            <text
              x={cx}
              y={cy + (variant === "full" ? 34 : 28)}
              textAnchor="middle"
              className="pointer-events-none select-none text-[9px] fill-muted"
            >
              Toniği: {tonicLabel}
            </text>
          </svg>
        </div>

        {/* Sağ panel — minör */}
        <div
          className={`order-3 flex flex-col gap-2 lg:order-3 ${variant === "full" ? "items-start text-left" : "w-full max-w-sm items-stretch"}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90">Minör</p>
          <div className={`flex flex-col gap-2 ${variant === "full" ? "items-start" : ""}`}>
            {minorLike.map((t) => (
              <span key={t.roman} className={`${panelPill} bg-emerald-600/25 text-emerald-50 ring-1 ring-emerald-500/40`}>
                {t.roman} ({t.symbol})
              </span>
            ))}
            {minorLike.length === 0 ? (
              <span className="text-xs text-muted">—</span>
            ) : null}
          </div>
        </div>

        {/* Alt — dim */}
        {variant === "full" ? (
          <div className="col-span-full order-4 flex flex-col items-center gap-2 border-t border-border/60 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Eksiltilmiş</p>
            <div className="flex flex-wrap justify-center gap-2">
              {dimLike.map((t) => (
                <span
                  key={t.roman}
                  className={`${panelPill} bg-zinc-600/40 text-zinc-100 ring-1 ring-zinc-500/40`}
                >
                  {t.roman} ({t.symbol})
                </span>
              ))}
              {dimLike.length === 0 ? (
                <span className="text-xs text-muted">—</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="order-4 mt-4 flex w-full max-w-sm flex-col items-stretch gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Eksiltilmiş</p>
            <div className="flex flex-wrap gap-2">
              {dimLike.map((t) => (
                <span
                  key={t.roman}
                  className={`${panelPill} bg-zinc-600/40 text-zinc-100 ring-1 ring-zinc-500/40`}
                >
                  {t.roman} ({t.symbol})
                </span>
              ))}
              {dimLike.length === 0 ? (
                <span className="text-xs text-muted">—</span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted">
        Dizi perdeleri:{" "}
        <span className="font-mono text-foreground/90">
          {scaleNotes.join(" · ")}
        </span>
      </p>
    </div>
  );
}

export const CircleOfFifths = memo(CircleOfFifthsInner);
