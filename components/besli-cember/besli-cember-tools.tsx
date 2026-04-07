"use client";

import { useEffect, useMemo, useState } from "react";
import { Interval, Note, Scale } from "tonal";
import { BesliCemberCircleOfFifths } from "@/components/tools/circle-of-fifths";
import { gamlarScaleById, normalizeGamlarScaleId } from "@/data/gamlar-scale-catalog";
import { GUITAR_ROOT_ENTRIES } from "@/lib/chords-db/guitar";
import { noteNameToPitchClass, PC_TO_NAME } from "@/lib/music/note-utils";
import {
  BesliCemberPageToolsProvider,
  useBesliCemberPageToolsStore,
} from "@/lib/stores/tooling-page-stores";
import { BESLI_CEMBER_SELECTION_STORAGE_KEY } from "@/components/gamlar/gamlar-scale-controls";

/** Majör ailesi modları — parlaktan karanlığa (brightness order). */
const MODES_BY_BRIGHTNESS = [
  { id: "maj-lydian", label: "Lydian" },
  { id: "maj-ionian", label: "Ionian" },
  { id: "maj-mixolydian", label: "Mixolydian" },
  { id: "maj-dorian", label: "Dorian" },
  { id: "maj-aeolian", label: "Aeolian" },
  { id: "maj-phrygian", label: "Phrygian" },
  { id: "maj-locrian", label: "Locrian" },
] as const;

const MAJOR_MODE_IDS: ReadonlySet<string> = new Set(
  MODES_BY_BRIGHTNESS.map((m) => m.id),
);

const btnSelected =
  "bg-[#FFB800] text-zinc-950 shadow-sm ring-1 ring-amber-500/60";
const btnRootIdle =
  "bg-bg text-foreground ring-1 ring-border hover:bg-surface hover:ring-zinc-500/35";
const btnModeIdle =
  "border border-border bg-bg text-foreground hover:border-zinc-500/45";

function BesliCemberControls() {
  const tonal = useBesliCemberPageToolsStore((s) => s.tonalCenterIndex);
  const setTonal = useBesliCemberPageToolsStore((s) => s.setTonalCenterIndex);
  const scaleId = useBesliCemberPageToolsStore((s) => s.selectedScaleId);
  const setScaleId = useBesliCemberPageToolsStore((s) => s.setSelectedScaleId);

  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BESLI_CEMBER_SELECTION_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { tonicPc?: number; scaleId?: string };
        if (typeof p.tonicPc === "number") setTonal(((p.tonicPc % 12) + 12) % 12);
        if (typeof p.scaleId === "string") {
          const n = normalizeGamlarScaleId(p.scaleId);
          if (n && MAJOR_MODE_IDS.has(n)) setScaleId(n);
        }
      }
    } catch {
      /* ignore */
    }
    queueMicrotask(() => setPersistReady(true));
  }, [setScaleId, setTonal]);

  useEffect(() => {
    if (!persistReady) return;
    try {
      localStorage.setItem(
        BESLI_CEMBER_SELECTION_STORAGE_KEY,
        JSON.stringify({
          tonicPc: ((tonal % 12) + 12) % 12,
          scaleId: normalizeGamlarScaleId(scaleId) ?? "maj-ionian",
        }),
      );
    } catch {
      /* ignore */
    }
  }, [tonal, scaleId, persistReady]);

  const resolvedScaleId = normalizeGamlarScaleId(scaleId) ?? "maj-ionian";

  useEffect(() => {
    if (!MAJOR_MODE_IDS.has(resolvedScaleId)) setScaleId("maj-ionian");
  }, [resolvedScaleId, setScaleId]);

  return (
    <div className="space-y-3">
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

      <section aria-label="Mod seçimi">
        <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-border bg-surface/90 p-2 sm:grid-cols-7 sm:gap-2 sm:p-2.5">
          {MODES_BY_BRIGHTNESS.map((m) => {
            const selected = resolvedScaleId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setScaleId(m.id)}
                className={[
                  "rounded-lg px-2 py-2 text-center text-[0.7rem] font-medium transition-colors sm:py-2.5 sm:text-xs",
                  selected ? btnSelected : btnModeIdle,
                ].join(" ")}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function toSharp(noteName: string): string {
  const chroma = Note.get(noteName).chroma;
  return chroma != null ? (PC_TO_NAME[chroma] ?? noteName) : noteName;
}

function BesliCemberInfoPanel() {
  const tonal = useBesliCemberPageToolsStore((s) => s.tonalCenterIndex);
  const scaleId = useBesliCemberPageToolsStore((s) => s.selectedScaleId);

  const info = useMemo(() => {
    const resolvedId = normalizeGamlarScaleId(scaleId) ?? "maj-ionian";
    const entry = gamlarScaleById(resolvedId);
    if (!entry?.formula) return null;

    const pc = ((tonal % 12) + 12) % 12;
    const tonicName = PC_TO_NAME[pc] ?? "C";
    const formula = entry.formula.replace(/\s*-\s*/g, ", ");

    const sc = Scale.get([tonicName, entry.tonalType]);
    const rawNotes = sc.notes ?? [];
    if (rawNotes.length < 7) return null;

    const notes = rawNotes.map(toSharp);

    const chords: string[] = [];
    for (let i = 0; i < 7; i++) {
      const root = rawNotes[i];
      const third = rawNotes[(i + 2) % 7];
      const fifth = rawNotes[(i + 4) % 7];
      const s3 = Interval.semitones(Interval.distance(root, third)) ?? 0;
      const s5 = Interval.semitones(Interval.distance(root, fifth)) ?? 0;
      let suffix = "";
      if (s3 === 3 && s5 === 6) suffix = "dim";
      else if (s3 === 4 && s5 === 8) suffix = "aug";
      else if (s3 === 3 && s5 === 7) suffix = "m";
      chords.push(`${toSharp(root)}${suffix}`);
    }

    return { formula, notes: notes.join(", "), chords: chords.join(", ") };
  }, [tonal, scaleId]);

  if (!info) return null;

  return (
    <div className="rounded-2xl border border-border bg-bg/60 px-4 py-3 text-xs leading-relaxed sm:text-[0.8125rem]">
      <p>
        <span className="font-semibold text-orange-400">Formula: </span>
        <span className="text-foreground">{info.formula}</span>
      </p>
      <p>
        <span className="font-semibold text-orange-400">Notes: </span>
        <span className="text-foreground">{info.notes}</span>
      </p>
      <p>
        <span className="font-semibold text-orange-400">Chords: </span>
        <span className="text-foreground">{info.chords}</span>
      </p>
    </div>
  );
}

export function BesliCemberTools() {
  return (
    <BesliCemberPageToolsProvider instanceKey="besli-cember-page" initialScaleId="maj-ionian">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <BesliCemberCircleOfFifths variant="full" chordSource="gamlar" />
        <BesliCemberControls />
        <BesliCemberInfoPanel />
      </div>
    </BesliCemberPageToolsProvider>
  );
}
