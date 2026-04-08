"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  GUITAR_QUALITY_OPTIONS,
  GUITAR_ROOT_ENTRIES,
  getGuitarChord,
  parseFretChar,
  type GuitarChordDef,
  type GuitarChordPosition,
  type GuitarChordResult,
  type GuitarRootDbKey,
} from "@/lib/chords-db/guitar";

/** Üstten alta: ince → kalın (yüksek mi → kalın Mi) — görsel satır 0 = tel 1 */
const STRING_NAMES = ["E", "B", "G", "D", "A", "E"] as const;

const FRET_COUNT = 16;
const STRING_COUNT = 6;

const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15] as const;
const INLAY_DOUBLE_FRET = 12;

const FRET_COL_STYLE = { gridTemplateColumns: "repeat(16, minmax(1.6rem, 1fr))" } as const;

const btnSelected =
  "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40";
const btnRootIdle =
  "bg-bg text-foreground ring-1 ring-border hover:bg-surface hover:ring-zinc-500/35";

/** Görsel satır s (0=ince E) → frets/fingers dizin i (0=kalın E) */
function stringRowToDataIndex(s: number): number {
  return STRING_COUNT - 1 - s;
}

function fretsForVisualRow(frets: string, s: number): string {
  const i = stringRowToDataIndex(s);
  return frets[i] ?? "x";
}

function fingerForVisualRow(fingers: string, s: number): string {
  const i = stringRowToDataIndex(s);
  return fingers[i] ?? "0";
}

/** Veri sırası (0=kalın): perde değerleri */
function parseFretLine(frets: string): Array<"open" | "mute" | number> {
  return Array.from({ length: STRING_COUNT }, (_, i) => parseFretChar(frets[i] ?? "x"));
}

/**
 * Parmak barre’si tek parça: bu perdede basılan tellerin en kalından en inceye
 * tüm aralığı (örn. 335553 → 0…5). Ortadaki teller başka perdede olsa da çubuk kesintisiz.
 */
function barreStringSpan(
  fretsParsed: Array<"open" | "mute" | number>,
  barreFret: number
): { from: number; to: number } | null {
  const hit = fretsParsed
    .map((v, i) => (v === barreFret ? i : -1))
    .filter((i) => i >= 0);
  if (hit.length === 0) return null;
  return { from: Math.min(...hit), to: Math.max(...hit) };
}

function ChordDiagram({
  result,
  positionIndex,
  embedded = false,
}: {
  result: GuitarChordResult | null;
  positionIndex: number;
  embedded?: boolean;
}) {
  const chord = result?.chord ?? null;
  const position: GuitarChordPosition | null =
    chord?.positions[positionIndex] ?? chord?.positions[0] ?? null;

  const shell = embedded
    ? "overflow-x-auto bg-bg/40 px-2 pb-2 pt-1.5"
    : "overflow-x-auto rounded-2xl border border-border bg-surface/80 p-2 shadow-inner";

  if (!chord || !position) {
    return (
      <div className={shell}>
        <p className="py-8 text-center text-sm text-muted">
          Bu kök ve kalite için gitar pozisyonu bulunamadı.
        </p>
      </div>
    );
  }

  const fretsParsed = parseFretLine(position.frets);
  const barreSpan =
    position.barres != null ? barreStringSpan(fretsParsed, position.barres) : null;

  let barreStyle: CSSProperties | null = null;
  if (position.barres != null && barreSpan) {
    const sTop = STRING_COUNT - 1 - barreSpan.to;
    const sBot = STRING_COUNT - 1 - barreSpan.from;
    const topPct = ((sTop + sBot) / 2 + 0.5) / STRING_COUNT;
    const heightPct = (sBot - sTop + 1) / STRING_COUNT;
    barreStyle = {
      left: `calc(((${position.barres} + 0.5) / ${FRET_COUNT}) * 100%)`,
      top: `${topPct * 100}%`,
      height: `${heightPct * 100}%`,
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <div className={shell}>
      <div className="mx-auto min-w-[38rem] space-y-1 sm:min-w-[44rem]">
        <div className="flex items-end gap-1.5 sm:gap-2">
          <div className="flex w-6 shrink-0 flex-col justify-end sm:w-7" aria-hidden />
          <div
            className="relative grid min-w-0 flex-1 text-center text-[0.6rem] font-semibold tabular-nums text-zinc-400 sm:text-[0.65rem]"
            style={FRET_COL_STYLE}
          >
            {Array.from({ length: FRET_COUNT }, (_, f) => (
              <div key={f}>{f}</div>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          <div className="flex w-6 shrink-0 flex-col sm:w-7" aria-label="Tel isimleri">
            {STRING_NAMES.map((name, s) => (
              <div
                key={`${name}-${s}`}
                className="flex h-6 items-center justify-end pr-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted sm:h-7 sm:pr-1.5 sm:text-[0.7rem]"
              >
                {name}
              </div>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-800/90 bg-gradient-to-b from-[#3d2b1f] via-[#5c4033] to-[#3d2b1f] shadow-[inset_0_2px_14px_rgba(0,0,0,0.45)]">
            {Array.from({ length: STRING_COUNT }, (_, s) => {
              const thickString = s >= 3;
              return (
                <div
                  key={s}
                  className="relative flex h-6 border-b border-border/50 last:border-b-0 sm:h-7"
                >
                  {Array.from({ length: FRET_COUNT }, (_, f) => (
                    <div
                      key={f}
                      className={[
                        "min-w-0 flex-1 border-r border-zinc-500/45 last:border-r-0",
                        f === 0
                          ? "border-l-[6px] border-l-black bg-black/15 shadow-[inset_-1px_0_0_rgba(0,0,0,0.35)]"
                          : "",
                      ].join(" ")}
                    />
                  ))}
                  <div
                    className={[
                      "pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 bg-gradient-to-r from-transparent via-zinc-200/75 to-transparent shadow-[0_0_4px_rgba(255,255,255,0.12)]",
                      thickString ? "h-[2.5px] sm:h-[3px]" : "h-px sm:h-[1.5px]",
                    ].join(" ")}
                  />
                </div>
              );
            })}

            {/* Barre: parmak noktalarıyla aynı çap (w) ve stil; rounded-full → uçlar yuvarlak */}
            {barreStyle ? (
              <div
                className="pointer-events-none absolute z-[4] w-[1.35rem] rounded-full bg-accent shadow-md ring-1 ring-accent/35 sm:w-6"
                style={barreStyle}
              />
            ) : null}

            {/* Parmak / açık / susturma */}
            {Array.from({ length: STRING_COUNT }, (_, s) => {
              const ch = fretsForVisualRow(position.frets, s);
              const v = parseFretChar(ch);
              const fChar = fingerForVisualRow(position.fingers, s);
              const showFinger = fChar && fChar !== "0";

              if (v === "mute") {
                return (
                  <div
                    key={`dot-${s}-mute`}
                    className="pointer-events-none absolute z-[5] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[0.65rem] font-bold text-zinc-300 sm:h-5 sm:w-5 sm:text-xs"
                    style={{
                      left: `calc((0 + 0.5) / ${FRET_COUNT} * 100%)`,
                      top: `calc(${(s + 0.5) / STRING_COUNT} * 100%)`,
                    }}
                  >
                    ×
                  </div>
                );
              }

              if (v === "open") {
                return (
                  <div
                    key={`dot-${s}-open`}
                    className="pointer-events-none absolute z-[5] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-stone-200/90 text-[0.55rem] font-bold text-stone-100 sm:h-5 sm:w-5 sm:text-[0.65rem]"
                    style={{
                      left: `calc((0 + 0.5) / ${FRET_COUNT} * 100%)`,
                      top: `calc(${(s + 0.5) / STRING_COUNT} * 100%)`,
                    }}
                  >
                    O
                  </div>
                );
              }

              const atBarre = position.barres != null && v === position.barres;

              if (atBarre) {
                return null;
              }

              return (
                <div
                  key={`dot-${s}-fret-${v}`}
                  className="pointer-events-none absolute z-[5] flex h-[1.35rem] w-[1.35rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[0.6rem] font-bold text-accent-foreground shadow-md ring-1 ring-accent/35 sm:h-6 sm:w-6 sm:text-xs"
                  style={{
                    left: `calc((${v} + 0.5) / ${FRET_COUNT} * 100%)`,
                    top: `calc(${(s + 0.5) / STRING_COUNT} * 100%)`,
                  }}
                >
                  {showFinger ? fChar : ""}
                </div>
              );
            })}

            <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
              {INLAY_SINGLE_FRETS.map((fret) => (
                <div
                  key={fret}
                  className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-200/95 shadow-[0_0_3px_rgba(0,0,0,0.45)] sm:size-2"
                  style={{
                    left: `calc(${(fret + 0.5) / FRET_COUNT} * 100%)`,
                  }}
                />
              ))}
              <div
                className="absolute size-1.5 -translate-x-1/2 rounded-full bg-stone-200/95 shadow-[0_0_3px_rgba(0,0,0,0.45)] sm:size-2"
                style={{
                  left: `calc(${(INLAY_DOUBLE_FRET + 0.5) / FRET_COUNT} * 100%)`,
                  top: "32%",
                }}
              />
              <div
                className="absolute size-1.5 -translate-x-1/2 rounded-full bg-stone-200/95 shadow-[0_0_3px_rgba(0,0,0,0.45)] sm:size-2"
                style={{
                  left: `calc(${(INLAY_DOUBLE_FRET + 0.5) / FRET_COUNT} * 100%)`,
                  top: "68%",
                }}
              />
            </div>
          </div>
        </div>

        <p className="pl-7 text-center text-[0.65rem] leading-tight text-muted sm:pl-8">
          chords-db · Perdeler 0–15 (a–f = 10–15) · Pozisyon {positionIndex + 1}/{chord.positions.length}
          {position.capo ? " · kapo" : ""}
          {result?.fallbackSuffix ? ` · yaklaşık (${result.fallbackSuffix})` : ""}
        </p>
      </div>
    </div>
  );
}

export function ChordLibraryExplorer() {
  const [root, setRoot] = useState<GuitarRootDbKey>("C");
  const [suffix, setSuffix] = useState<string>("major");
  const [variation, setVariation] = useState(1);

  const result = useMemo(() => getGuitarChord(root, suffix), [root, suffix]);

  const maxVar = result?.chord.positions.length ?? 1;
  const safeVariation = Math.min(Math.max(1, variation), maxVar);

  const rootLabel = GUITAR_ROOT_ENTRIES.find((r) => r.dbKey === root)?.label ?? root;

  const selectedLabel =
    GUITAR_QUALITY_OPTIONS.find((q) => q.suffix === suffix)?.label ?? suffix;

  const chordTitle =
    suffix === "major" ? rootLabel : `${rootLabel} ${selectedLabel}`;

  return (
    <div className="space-y-3">
      <section
        aria-label="Seçili akor ve gitar klavyesi"
        className="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="relative border-b border-border px-3 py-2 pr-[5.25rem] sm:pr-[5.75rem]">
          <div
            className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-0.5 sm:gap-1"
            role="group"
            aria-label="Akor pozisyonu"
          >
            {Array.from({ length: maxVar }, (_, i) => {
              const v = i + 1;
              const selected = v === safeVariation;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariation(v)}
                  className={[
                    "min-h-8 min-w-8 rounded-lg text-xs font-bold tabular-nums transition-colors sm:min-h-9 sm:min-w-9 sm:text-sm",
                    selected ? btnSelected : btnRootIdle,
                  ].join(" ")}
                >
                  {v}
                </button>
              );
            })}
          </div>
          <div className="text-center">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted">
              Seçili akor
            </p>
            <p className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {chordTitle}
            </p>
          </div>
        </div>
        <ChordDiagram result={result} positionIndex={safeVariation - 1} embedded />
      </section>

      <section aria-label="Kök nota seçimi">
        <div className="flex flex-wrap justify-center gap-1 rounded-2xl border border-border bg-surface/90 p-2 sm:gap-1.5 sm:p-2.5">
          {GUITAR_ROOT_ENTRIES.map(({ dbKey, label }) => {
            const selected = dbKey === root;
            return (
              <button
                key={dbKey}
                type="button"
                onClick={() => {
                  setRoot(dbKey);
                  setVariation(1);
                  setSuffix((prev) => (getGuitarChord(dbKey, prev) ? prev : "major"));
                }}
                className={[
                  "min-h-8 min-w-8 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors sm:min-h-9 sm:min-w-9 sm:text-[0.8125rem]",
                  selected ? btnSelected : btnRootIdle,
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Akor kalitesi seçimi">
        <div className="grid grid-cols-5 gap-1 rounded-2xl border border-border bg-surface/90 p-2 sm:gap-1.5 sm:p-2.5 md:grid-cols-10">
          {GUITAR_QUALITY_OPTIONS.map(({ label, suffix: suf }) => {
            const selected = suf === suffix;
            const available = getGuitarChord(root, suf) != null;
            return (
              <button
                key={suf}
                type="button"
                disabled={!available}
                title={!available ? "Bu kök için kütüphanede yok" : undefined}
                onClick={() => {
                  setSuffix(suf);
                  setVariation(1);
                }}
                className={[
                  "rounded-lg px-1 py-1.5 text-center text-[0.65rem] font-medium leading-tight transition-colors sm:px-2 sm:py-2 sm:text-xs",
                  selected ? btnSelected : "border border-border bg-bg text-foreground hover:border-zinc-500/45",
                  !available ? "cursor-not-allowed opacity-40 hover:border-border" : "",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
