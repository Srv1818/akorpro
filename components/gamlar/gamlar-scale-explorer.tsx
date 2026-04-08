"use client";

import { useMemo } from "react";
import { Note, Scale } from "tonal";
import {
  createGamlarScaleControls,
  GAMLAR_SELECTION_STORAGE_KEY,
} from "@/components/gamlar/gamlar-scale-controls";
import { defaultGamlarScaleId, gamlarScaleById, normalizeGamlarScaleId } from "@/data/gamlar-scale-catalog";
import { GUITAR_ROOT_ENTRIES } from "@/lib/chords-db/guitar";
import { gamlarCatalogAndTonicToPitchClassSet } from "@/lib/music/fretboard-from-scale-notes";
import { noteNameToPitchClass, OPEN_STRING_PC_TOP_FIRST, PC_TO_NAME } from "@/lib/music/note-utils";
import { resolveSongGamlarScaleId } from "@/lib/music/key-mode-gamlar";
import type { PreviewToolsState } from "@/lib/stores/preview-tools-store";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";
import { useGamlarPageToolsStore } from "@/lib/stores/tooling-page-stores";
import type { KeyMode } from "@/lib/types/content";

const STRING_NAMES = ["E", "B", "G", "D", "A", "E"] as const;
const FRET_COUNT = 16;
const STRING_COUNT = 6;
const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15] as const;
const INLAY_DOUBLE_FRET = 12;
const FRET_COL_STYLE = { gridTemplateColumns: "repeat(16, minmax(1.6rem, 1fr))" } as const;

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

type UseToolingHook = <T>(selector: (s: PreviewToolsState) => T) => T;

function createGamlarScaleExplorer(useToolsStore: UseToolingHook) {
  const GamlarScaleControlsBound = createGamlarScaleControls(
    useToolsStore,
    GAMLAR_SELECTION_STORAGE_KEY,
  );

  return function GamlarScaleExplorer({ lockedTonicPc, lockedMode }: Props) {
  const tonal = useToolsStore((s) => s.tonalCenterIndex);
  const scaleId = useToolsStore((s) => s.selectedScaleId);
  const lockSelection = lockedTonicPc != null || lockedMode != null;

  const effectiveTonal =
    lockedTonicPc != null ? ((lockedTonicPc % 12) + 12) % 12 : ((tonal % 12) + 12) % 12;
  const storeScaleNormalized = normalizeGamlarScaleId(scaleId);
  const effectiveScaleId = lockSelection
    ? resolveSongGamlarScaleId(lockedMode, storeScaleNormalized ?? undefined)
    : scaleId;

  const resolvedScaleId =
    normalizeGamlarScaleId(effectiveScaleId) ?? defaultGamlarScaleId();

  const scaleEntry = gamlarScaleById(resolvedScaleId);

  const activePcs = useMemo(
    () => gamlarCatalogAndTonicToPitchClassSet(effectiveTonal, resolvedScaleId),
    [effectiveTonal, resolvedScaleId]
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
                          ? "z-[6] rounded-lg bg-teal-400 text-[0.5rem] text-zinc-900 shadow-sm sm:rounded-xl sm:text-[0.65rem]"
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
        <GamlarScaleControlsBound lockedTonicPc={lockedTonicPc} lockedMode={lockedMode} />
      ) : null}
    </div>
  );
  };
}

/** Gamlar sayfası — `GamlarPageToolsProvider` gerekir */
export const GamlarScaleExplorer = createGamlarScaleExplorer(useGamlarPageToolsStore);
/** Önizleme — `PreviewToolsProvider` ile aynı tonal/gam store (5'li çember ile senkron) */
export const PreviewGamlarScaleExplorer = createGamlarScaleExplorer(usePreviewToolsStore);
