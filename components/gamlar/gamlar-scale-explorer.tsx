"use client";

import { useMemo } from "react";
import { Note, Scale } from "tonal";
import { GAMLAR_SCALE_CATALOG, gamlarScaleById } from "@/data/gamlar-scale-catalog";
import { GUITAR_ROOT_ENTRIES } from "@/lib/chords-db/guitar";
import { gamlarCatalogAndTonicToPitchClassSet } from "@/lib/music/fretboard-from-scale-notes";
import { noteNameToPitchClass, OPEN_STRING_PC_TOP_FIRST, PC_TO_NAME } from "@/lib/music/note-utils";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";
import type { KeyMode } from "@/lib/types/content";

const STRING_NAMES = ["E", "B", "G", "D", "A", "E"] as const;
const FRET_COUNT = 16;
const STRING_COUNT = 6;
const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15] as const;
const INLAY_DOUBLE_FRET = 12;
const FRET_COL_STYLE = { gridTemplateColumns: "repeat(16, minmax(1.6rem, 1fr))" } as const;

const btnSelected =
  "bg-[#FFB800] text-zinc-950 shadow-sm ring-1 ring-amber-500/60";
const btnRootIdle =
  "bg-bg text-foreground ring-1 ring-border hover:bg-surface hover:ring-zinc-500/35";

function pitchClassAtStringFret(stringIndexTopFirst: number, fret: number): number {
  const open = OPEN_STRING_PC_TOP_FIRST[stringIndexTopFirst];
  if (open === undefined) return 0;
  return (open + fret) % 12;
}

function rootEntryForPitchClass(pc: number) {
  return GUITAR_ROOT_ENTRIES.find((e) => noteNameToPitchClass(e.label) === pc);
}

/** Perdede gösterilecek yazı: Tonal gam notalarıyla aynı enharmonik tercih */
function noteLabelForPitchClass(pc: number, scaleNoteNames: readonly string[]): string {
  for (const name of scaleNoteNames) {
    const c = Note.chroma(name);
    if (typeof c === "number" && !Number.isNaN(c) && c === pc) {
      return Note.get(name).name;
    }
  }
  return PC_TO_NAME[pc];
}

type Props = {
  lockedTonicPc?: number | null;
  lockedMode?: KeyMode;
};

function modeToGamlarScaleId(mode: KeyMode | undefined): string {
  if (mode === "harmonic") return "harmonic-minor";
  if (mode === "melodic") return "melodic-minor";
  if (mode === "natural") return "natural-minor";
  return "major";
}

export function GamlarScaleExplorer({ lockedTonicPc, lockedMode }: Props) {
  const tonal = usePreviewToolsStore((s) => s.tonalCenterIndex);
  const setTonal = usePreviewToolsStore((s) => s.setTonalCenterIndex);
  const scaleId = usePreviewToolsStore((s) => s.selectedScaleId);
  const setScaleId = usePreviewToolsStore((s) => s.setSelectedScaleId);
  const lockSelection = lockedTonicPc != null || lockedMode != null;

  const effectiveTonal =
    lockedTonicPc != null ? ((lockedTonicPc % 12) + 12) % 12 : ((tonal % 12) + 12) % 12;
  const effectiveScaleId = lockSelection ? modeToGamlarScaleId(lockedMode) : scaleId;

  const scaleEntry = gamlarScaleById(effectiveScaleId) ?? GAMLAR_SCALE_CATALOG[0];

  const activePcs = useMemo(
    () => gamlarCatalogAndTonicToPitchClassSet(effectiveTonal, effectiveScaleId),
    [effectiveTonal, effectiveScaleId]
  );

  /** Tonal.js gam notaları — vurgu kümesi `gamlarCatalogAndTonicToPitchClassSet` ile uyumlu */
  const scaleNotesFromTonal = useMemo(() => {
    if (!scaleEntry) return [] as string[];
    const tonic = rootEntryForPitchClass(effectiveTonal)?.label ?? PC_TO_NAME[effectiveTonal] ?? "C";
    return Scale.get([tonic, scaleEntry.tonalType]).notes;
  }, [effectiveTonal, scaleEntry]);

  const dotPositions = useMemo(() => {
    const out: { s: number; f: number; pc: number }[] = [];
    for (let s = 0; s < STRING_COUNT; s++) {
      for (let f = 0; f < FRET_COUNT; f++) {
        const pc = pitchClassAtStringFret(s, f);
        if (activePcs.has(pc)) out.push({ s, f, pc });
      }
    }
    return out;
  }, [activePcs]);
  const rootEntry = rootEntryForPitchClass(effectiveTonal);
  const rootLabel = rootEntry?.label ?? PC_TO_NAME[effectiveTonal] ?? "C";
  const scaleLabel = scaleEntry?.name ?? "Gam";

  const scalesSorted = useMemo(
    () => [...GAMLAR_SCALE_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder),
    []
  );

  const rootPc = effectiveTonal;

  return (
    <div className="space-y-3">
      <section
        aria-label="Seçili gam ve gitar klavyesi"
        className="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="border-b border-border px-3 py-2">
          <div className="text-center">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted">
              Seçili gam
            </p>
            <p className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {rootLabel} {scaleLabel}
            </p>
            {scaleNotesFromTonal.length > 0 ? (
              <p className="mt-1 font-mono text-xs text-accent sm:text-sm">
                {scaleNotesFromTonal.join(" — ")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto bg-bg/40 px-2 pb-2 pt-1.5">
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

                {dotPositions.map(({ s, f, pc }) => {
                  const isRoot = pc === rootPc;
                  return (
                    <div
                      key={`dot-${s}-${f}-${pc}`}
                      title={isRoot ? "Kök (tonal merkez)" : undefined}
                      className={[
                        "pointer-events-none absolute flex h-[1.35rem] min-w-[1.35rem] max-w-[2.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center px-0.5 font-bold leading-none sm:h-6 sm:min-w-6 sm:max-w-[2.75rem] sm:px-1",
                        isRoot
                          ? "z-[6] rounded-lg bg-green-500 text-[0.5rem] text-black shadow-sm sm:rounded-xl sm:text-[0.65rem]"
                          : "z-[5] rounded-full bg-amber-400 text-[0.5rem] text-zinc-950 shadow-md ring-1 ring-amber-600/50 sm:text-[0.65rem]",
                      ].join(" ")}
                      style={{
                        left: `calc((${f} + 0.5) / ${FRET_COUNT} * 100%)`,
                        top: `calc(${(s + 0.5) / STRING_COUNT} * 100%)`,
                      }}
                    >
                      {noteLabelForPitchClass(pc, scaleNotesFromTonal)}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="pl-7 text-center text-[0.65rem] leading-tight text-muted sm:pl-8">
              Tonal.js · Perdeler 0–15 · {scaleLabel}
            </p>
          </div>
        </div>
      </section>

      {!lockSelection ? (
        <>
          <section aria-label="Tonal merkez (kök nota)">
            <div className="flex flex-wrap justify-center gap-1 rounded-2xl border border-border bg-surface/90 p-2 sm:gap-1.5 sm:p-2.5">
              {GUITAR_ROOT_ENTRIES.map(({ label }) => {
                const pc = noteNameToPitchClass(label);
                const selected = pc !== null && pc === ((tonal % 12) + 12) % 12;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => pc !== null && setTonal(pc)}
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

          <section aria-label="Gam tipi seçimi">
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-surface/90 p-2 sm:grid-cols-6 sm:gap-1.5 sm:p-2.5">
              {scalesSorted.map((sc) => {
                const selected = (scaleId ?? GAMLAR_SCALE_CATALOG[0]?.id) === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setScaleId(sc.id)}
                    className={[
                      "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors sm:py-2",
                      selected ? btnSelected : "border border-border bg-bg text-foreground hover:border-zinc-500/45",
                    ].join(" ")}
                  >
                    {sc.name}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
