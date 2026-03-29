"use client";

import { useState } from "react";

const ROOT_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type RootNote = (typeof ROOT_NOTES)[number];

/** Tam kalite ızgarası: 6 sütun × 6 satır (referans düzenine uygun) */
const CHORD_QUALITIES = [
  "Major",
  "Minor",
  "7",
  "m7",
  "maj7",
  "dim",
  "dim7",
  "aug",
  "sus2",
  "sus4",
  "6",
  "m6",
  "9",
  "m9",
  "add9",
  "7sus4",
  "m7b5",
  "7#9",
  "7b9",
  "9b5",
  "13",
  "maj9",
  "m11",
  "11",
  "maj11",
  "m13",
  "maj13",
  "6/9",
  "aug7",
  "7b5",
  "7#5",
  "mMaj7",
  "add11",
  "add4",
  "5",
  "9#11",
] as const;

export type ChordQuality = (typeof CHORD_QUALITIES)[number];

const CHORD_VARIATIONS = [1, 2, 3, 4] as const;
export type ChordVariation = (typeof CHORD_VARIATIONS)[number];

const FRET_COUNT = 16;
const STRING_COUNT = 6;

/** Üstten alta: ince → kalın (yüksek mi → kalın Mi) */
const STRING_NAMES = ["E", "B", "G", "D", "A", "E"] as const;

const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15] as const;
const INLAY_DOUBLE_FRET = 12;

const FRET_COL_STYLE = { gridTemplateColumns: "repeat(16, minmax(1.6rem, 1fr))" } as const;

function FretboardVisual({
  embedded = false,
  variation = 1,
}: {
  embedded?: boolean;
  variation?: ChordVariation;
}) {
  const shell = embedded
    ? "overflow-x-auto bg-bg/40 px-2 pb-2 pt-1.5"
    : "overflow-x-auto rounded-2xl border border-border bg-surface/80 p-2 shadow-inner";

  return (
    <div className={shell}>
      <div className="mx-auto min-w-[38rem] space-y-1 sm:min-w-[44rem]">
        <div className="flex items-end gap-1.5 sm:gap-2">
          <div className="flex w-6 shrink-0 flex-col justify-end sm:w-7" aria-hidden />
          <div
            className="grid min-w-0 flex-1 text-center text-[0.6rem] font-semibold tabular-nums text-zinc-400 sm:text-[0.65rem]"
            style={FRET_COL_STYLE}
          >
            {Array.from({ length: FRET_COUNT }, (_, f) => (
              <div key={f}>{f}</div>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          <div
            className="flex w-6 shrink-0 flex-col sm:w-7"
            aria-label="Tel isimleri"
          >
            {STRING_NAMES.map((name, s) => (
              <div
                key={`${name}-${s}`}
                className="flex h-6 items-center justify-end pr-1 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500 sm:h-7 sm:pr-1.5 sm:text-[0.7rem]"
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
                  className="relative flex h-6 border-b border-black/25 last:border-b-0 sm:h-7"
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

            <div
              className="pointer-events-none absolute inset-0 z-[2]"
              aria-hidden
            >
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
          Görsel önizleme — 6 tel, perdeler 0–15 · Varyasyon {variation}/4
        </p>
      </div>
    </div>
  );
}

const btnSelected =
  "bg-[#FFB800] text-zinc-950 shadow-sm ring-1 ring-amber-500/60";
const btnRootIdle =
  "bg-bg text-foreground ring-1 ring-border hover:bg-surface hover:ring-zinc-500/35";

export function ChordLibraryExplorer() {
  const [root, setRoot] = useState<RootNote>("C");
  const [quality, setQuality] = useState<ChordQuality>("Major");
  const [variation, setVariation] = useState<ChordVariation>(1);

  return (
    <div className="space-y-3">
      <section
        aria-label="Seçili akor ve gitar klavyesi"
        className="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="relative border-b border-border px-3 py-2 pr-[5.25rem] sm:pr-[5.75rem]">
          <div
            className="absolute right-2 top-2 z-10 flex gap-0.5 sm:gap-1"
            role="group"
            aria-label="Akor varyasyonu"
          >
            {CHORD_VARIATIONS.map((v) => {
              const selected = v === variation;
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
              {root} {quality}
            </p>
          </div>
        </div>
        <FretboardVisual embedded variation={variation} />
      </section>

      <section aria-label="Kök nota seçimi">
        <div className="flex flex-wrap justify-center gap-1 rounded-2xl border border-border bg-surface/90 p-2 sm:gap-1.5 sm:p-2.5">
          {ROOT_NOTES.map((n) => {
            const selected = n === root;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRoot(n)}
                className={[
                  "min-h-8 min-w-8 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors sm:min-h-9 sm:min-w-9 sm:text-[0.8125rem]",
                  selected ? btnSelected : btnRootIdle,
                ].join(" ")}
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Akor kalitesi seçimi">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-surface/90 p-2 sm:grid-cols-6 sm:gap-1.5 sm:p-2.5">
          {CHORD_QUALITIES.map((q) => {
            const selected = q === quality;
            return (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={[
                  "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors sm:py-2",
                  selected ? btnSelected : "border border-border bg-bg text-foreground hover:border-zinc-500/45",
                ].join(" ")}
              >
                {q}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
