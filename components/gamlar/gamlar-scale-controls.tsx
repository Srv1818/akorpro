"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GuitarChordDiagramClassic } from "@/components/chords/guitar-chord-diagram-classic";
import {
  GAMLAR_FAMILY_LABELS,
  GAMLAR_FAMILY_ORDER,
  defaultGamlarScaleId,
  gamlarModesForFamily,
  gamlarScaleById,
  normalizeGamlarScaleId,
  type GamlarFamilyId,
} from "@/data/gamlar-scale-catalog";
import { GUITAR_ROOT_ENTRIES } from "@/lib/chords-db/guitar";
import { keyModeToGamlarCatalogScaleId } from "@/lib/music/key-mode-gamlar";
import { gamlarChordExampleStrings } from "@/lib/music/gamlar-scale-triads";
import { resolveChordTokenToFingering } from "@/lib/music/chord-fingering";
import { noteNameToPitchClass, PC_TO_NAME } from "@/lib/music/note-utils";
import type { PreviewToolsState } from "@/lib/stores/preview-tools-store";
import { usePreviewToolsStore } from "@/lib/stores/preview-tools-store";
import {
  useBesliCemberPageToolsStore,
  useGamlarPageToolsStore,
} from "@/lib/stores/tooling-page-stores";
import type { KeyMode } from "@/lib/types/content";

export const GAMLAR_SELECTION_STORAGE_KEY = "akorpro:gamlar-selection-v2";
/** 5'li çember — Gamlar ile farklı localStorage anahtarı (kalıcı seçimler ayrı). */
export const BESLI_CEMBER_SELECTION_STORAGE_KEY = "akorpro:besli-cember-selection-v2";

type UseToolingHook = <T>(selector: (s: PreviewToolsState) => T) => T;

const btnSelected =
  "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/40";
const btnRootIdle =
  "bg-bg text-foreground ring-1 ring-border hover:bg-surface hover:ring-zinc-500/35";

function familyOfScaleId(scaleId: string | null | undefined): GamlarFamilyId {
  const entry = gamlarScaleById(scaleId);
  return entry?.category ?? "major";
}

function guitarRootLabel(tonalPc: number): string {
  const pc = ((tonalPc % 12) + 12) % 12;
  const e = GUITAR_ROOT_ENTRIES.find((x) => noteNameToPitchClass(x.label) === pc);
  return e?.label ?? PC_TO_NAME[pc] ?? "C";
}

function createGamlarScaleFormulaPanel(useToolsStore: UseToolingHook) {
  return function GamlarScaleFormulaPanel() {
  const tonal = useToolsStore((s) => s.tonalCenterIndex);
  const scaleId = useToolsStore((s) => s.selectedScaleId);
  const resolvedScaleId = normalizeGamlarScaleId(scaleId) ?? defaultGamlarScaleId();
  const scaleEntry = gamlarScaleById(resolvedScaleId);
  const activeFamilyId = familyOfScaleId(resolvedScaleId);

  const chordExamples = useMemo(() => {
    const pc = ((tonal % 12) + 12) % 12;
    const label = guitarRootLabel(pc);
    return gamlarChordExampleStrings(pc, resolvedScaleId, label);
  }, [tonal, resolvedScaleId]);
  const [chordStripOpen, setChordStripOpen] = useState(false);
  const [chordStripGroup, setChordStripGroup] = useState<"triads" | "sevenths">("triads");
  const [chordPosIndices, setChordPosIndices] = useState<Record<string, number>>({});

  const triadTokens = useMemo(
    () =>
      (chordExamples?.triads ?? "")
        .split("—")
        .map((t) => t.trim())
        .filter(Boolean),
    [chordExamples?.triads],
  );
  const seventhTokens = useMemo(() => {
    if (!chordExamples?.sevenths || !chordExamples.seventhsIsChordList) return [] as string[];
    return chordExamples.sevenths
      .split("—")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [chordExamples?.sevenths, chordExamples?.seventhsIsChordList]);

  const chordStripTokens = useMemo(() => {
    const source = chordStripGroup === "triads" ? triadTokens : seventhTokens;
    return Array.from(new Set(source));
  }, [chordStripGroup, triadTokens, seventhTokens]);

  const chordStripFingerings = useMemo(
    () => chordStripTokens.map((token) => resolveChordTokenToFingering(token)),
    [chordStripTokens],
  );

  useEffect(() => {
    setChordPosIndices({});
  }, [chordStripTokens]);

  function renderChordLineAsButtons(tokens: string[], group: "triads" | "sevenths") {
    if (tokens.length === 0) return null;
    return (
      <span>
        {tokens.map((token, idx) => (
          <span key={`${token}-${idx}`}>
            <button
              type="button"
              onClick={() => {
                setChordStripGroup(group);
                setChordStripOpen(true);
              }}
              className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-accent"
              aria-label={`${token} akoru, akor cetvelini aç`}
            >
              {token}
            </button>
            {idx < tokens.length - 1 ? <span className="text-muted"> — </span> : null}
          </span>
        ))}
      </span>
    );
  }

  if (!scaleEntry?.formula) return null;

  return (
    <div className="rounded-2xl border border-border bg-bg/60 px-3 py-3 text-xs leading-relaxed text-foreground sm:px-4 sm:text-[0.8125rem]">
      {chordExamples ? (
        activeFamilyId === "blues" ? (
          <>
            {scaleEntry.subtitle ? <p className="text-muted">{scaleEntry.subtitle}</p> : null}
            <p className="mt-2 font-semibold text-foreground">Formül: {scaleEntry.formula}</p>
            <p className="mt-1.5 text-muted">
              <span className="font-medium text-foreground">
                Hedef akorlar ({chordExamples.tonicLabel}):
              </span>{" "}
              {renderChordLineAsButtons(triadTokens, "triads") ?? chordExamples.triads}
            </p>
            {chordExamples.sevenths ? (
              chordExamples.seventhsIsChordList ? (
                <p className="mt-1.5 text-muted">
                  <span className="font-medium text-foreground">
                    7&apos;li ({chordExamples.tonicLabel} örneği):
                  </span>{" "}
                  {renderChordLineAsButtons(seventhTokens, "sevenths") ?? chordExamples.sevenths}
                </p>
              ) : (
                <p className="mt-1.5 text-muted">{chordExamples.sevenths}</p>
              )
            ) : null}
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">{scaleEntry.subtitle ?? "Formül"}</p>
            <p className="mt-1.5 text-muted">
              <span className="font-medium text-foreground">
                3&apos;lü ({chordExamples.tonicLabel} örneği):
              </span>{" "}
              {renderChordLineAsButtons(triadTokens, "triads") ?? chordExamples.triads}
            </p>
            {chordExamples.sevenths ? (
              chordExamples.seventhsIsChordList ? (
                <p className="mt-1.5 text-muted">
                  <span className="font-medium text-foreground">
                    7&apos;li ({chordExamples.tonicLabel} örneği):
                  </span>{" "}
                  {renderChordLineAsButtons(seventhTokens, "sevenths") ?? chordExamples.sevenths}
                </p>
              ) : (
                <p className="mt-1.5 text-muted">{chordExamples.sevenths}</p>
              )
            ) : null}
          </>
        )
      ) : (
        <>
          {activeFamilyId === "blues" ? (
            <>
              {scaleEntry.subtitle ? <p className="text-muted">{scaleEntry.subtitle}</p> : null}
              <p className="mt-2 font-semibold text-foreground">Formül: {scaleEntry.formula}</p>
              <p className="mt-1.5 text-muted">
                <span className="font-medium text-foreground">Hedef akorlar (C):</span>{" "}
                {scaleEntry.triadsExample}
              </p>
              {scaleEntry.seventhsExample?.trim() ? (
                <p className="mt-1.5 text-muted">{scaleEntry.seventhsExample}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">{scaleEntry.subtitle ?? "Formül"}</p>
              <p className="mt-1.5 text-muted">
                <span className="font-medium text-foreground">3&apos;lü (C örneği):</span>{" "}
                {scaleEntry.triadsExample}
              </p>
              {scaleEntry.seventhsExample?.trim() ? (
                <p className="mt-1.5 text-muted">
                  <span className="font-medium text-foreground">7&apos;li (C örneği):</span>{" "}
                  {scaleEntry.seventhsExample}
                </p>
              ) : null}
            </>
          )}
        </>
      )}
      {chordStripOpen ? (
        <div className="mt-3 rounded-2xl border border-border bg-surface px-3 py-2 sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-1.5">
            <p className="text-xs font-semibold tracking-tight text-foreground">
              Akor cetveli ({chordStripGroup === "triads" ? "3'lü" : "7'li"})
            </p>
            <button
              type="button"
              onClick={() => setChordStripOpen(false)}
              className="rounded-md border border-border bg-bg px-2 py-1 text-[11px] font-medium text-foreground hover:bg-surface"
            >
              Kapat
            </button>
          </div>
          {chordStripFingerings.length === 0 ? (
            <p className="text-xs text-muted">Bu gamda gösterilecek akor bulunamadı.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {chordStripFingerings.map((entry, i) => {
                const positions = entry.chord?.positions ?? [];
                const posKey = `${entry.token}-${i}`;
                const posIdx = chordPosIndices[posKey] ?? 0;
                const pos = positions[posIdx] ?? positions[0] ?? null;
                const hasMultiple = positions.length > 1;
                if (!entry.chord || !pos) {
                  return (
                    <div
                      key={posKey}
                      className="flex min-h-[12.5rem] min-w-[10rem] items-center justify-center rounded-xl border border-border bg-bg px-2 py-3 text-center"
                    >
                      <p className="font-mono text-sm font-semibold text-foreground">{entry.token}</p>
                    </div>
                  );
                }
                return (
                  <div key={posKey} className="shrink-0">
                    <GuitarChordDiagramClassic
                      position={pos}
                      title={entry.token}
                      headerStart={
                        hasMultiple ? (
                          <button
                            type="button"
                            className="inline-flex size-4 items-center justify-center rounded-sm bg-transparent p-0 text-foreground opacity-90 hover:opacity-100"
                            aria-label={`Önceki pozisyon (${posIdx + 1} / ${positions.length})`}
                            onClick={() =>
                              setChordPosIndices((prev) => ({
                                ...prev,
                                [posKey]: (posIdx - 1 + positions.length) % positions.length,
                              }))
                            }
                          >
                            <ChevronLeft className="size-3.5 stroke-[2.5]" aria-hidden />
                          </button>
                        ) : undefined
                      }
                      headerEnd={
                        hasMultiple ? (
                          <button
                            type="button"
                            className="inline-flex size-4 items-center justify-center rounded-sm bg-transparent p-0 text-foreground opacity-90 hover:opacity-100"
                            aria-label={`Sonraki pozisyon (${posIdx + 1} / ${positions.length})`}
                            onClick={() =>
                              setChordPosIndices((prev) => ({
                                ...prev,
                                [posKey]: (posIdx + 1) % positions.length,
                              }))
                            }
                          >
                            <ChevronRight className="size-3.5 stroke-[2.5]" aria-hidden />
                          </button>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
  }
}

/** Gamlar sayfası — `GamlarPageToolsProvider` gerekir */
export const GamlarScaleFormulaPanel = createGamlarScaleFormulaPanel(useGamlarPageToolsStore);
/** 5'li çember sayfası — `BesliCemberPageToolsProvider` gerekir */
export const BesliCemberScaleFormulaPanel = createGamlarScaleFormulaPanel(useBesliCemberPageToolsStore);
/** Önizleme — `PreviewToolsProvider` gerekir */
export const PreviewGamlarScaleFormulaPanel = createGamlarScaleFormulaPanel(usePreviewToolsStore);

type Props = {
  lockedTonicPc?: number | null;
  lockedMode?: KeyMode;
  /** 5'li çember sayfasında Blues ailesi gösterilmez */
  hideBlues?: boolean;
  /** Çember üzerinden ton seçildiğinde kök nota satırı gizlenir */
  hideTonicRow?: boolean;
  /** Gam ailesi başlığı + kısa açıklama (blurb) satırı */
  hideFamilyBlurb?: boolean;
  /** Formül / 3’lü / 7’li kutusu (ör. 5’li çemberde çemberin altına taşınır) */
  hideFormulaPanel?: boolean;
  /** Kalıcı seçim anahtarı (sayfa başına sabit; Gamlar / 5'li çember farklı). */
  storageKey?: string;
};

export function createGamlarScaleControls(useToolsStore: UseToolingHook, defaultStorageKey: string) {
  const FormulaPanel = createGamlarScaleFormulaPanel(useToolsStore);

  return function GamlarScaleControls({
  lockedTonicPc,
  lockedMode,
  hideBlues = false,
  hideTonicRow = false,
  hideFamilyBlurb = false,
  hideFormulaPanel = false,
  storageKey = defaultStorageKey,
}: Props) {
  const tonal = useToolsStore((s) => s.tonalCenterIndex);
  const setTonal = useToolsStore((s) => s.setTonalCenterIndex);
  const scaleId = useToolsStore((s) => s.selectedScaleId);
  const setScaleId = useToolsStore((s) => s.setSelectedScaleId);
  const lockSelection = lockedTonicPc != null || lockedMode != null;

  const [persistReady, setPersistReady] = useState(false);

  const familyOrder = useMemo(
    () => (hideBlues ? GAMLAR_FAMILY_ORDER.filter((f) => f !== "blues") : [...GAMLAR_FAMILY_ORDER]),
    [hideBlues]
  );

  useEffect(() => {
    if (lockSelection) {
      queueMicrotask(() => setPersistReady(true));
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as { tonicPc?: number; scaleId?: string };
        if (typeof p.tonicPc === "number") setTonal(((p.tonicPc % 12) + 12) % 12);
        if (typeof p.scaleId === "string") {
          const n = normalizeGamlarScaleId(p.scaleId);
          if (n) setScaleId(n);
        }
      }
    } catch {
      /* ignore */
    }
    queueMicrotask(() => setPersistReady(true));
  }, [lockSelection, setScaleId, setTonal, storageKey]);

  useEffect(() => {
    if (!persistReady || lockSelection) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tonicPc: ((tonal % 12) + 12) % 12,
          scaleId: normalizeGamlarScaleId(scaleId) ?? defaultGamlarScaleId(),
        })
      );
    } catch {
      /* ignore */
    }
  }, [tonal, scaleId, persistReady, lockSelection, storageKey]);

  const effectiveScaleId = lockSelection ? keyModeToGamlarCatalogScaleId(lockedMode) : scaleId;

  const resolvedScaleId = normalizeGamlarScaleId(effectiveScaleId) ?? defaultGamlarScaleId();

  const activeFamilyId = familyOfScaleId(resolvedScaleId);

  const modesInFamily = gamlarModesForFamily(activeFamilyId);

  if (lockSelection) return null;

  return (
    <div className="space-y-3">
      {!hideTonicRow ? (
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
      ) : null}

      <section aria-label="Gam ailesi ve mod seçimi" className="space-y-2">
        <div
          className={[
            "grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface/90 p-2 sm:gap-2 sm:p-2.5",
            hideBlues ? "md:grid-cols-4" : "md:grid-cols-5",
          ].join(" ")}
        >
          {familyOrder.map((fid) => {
            const meta = GAMLAR_FAMILY_LABELS[fid];
            const selected = activeFamilyId === fid;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => {
                  if (activeFamilyId === fid) return;
                  const modes = gamlarModesForFamily(fid);
                  const first = modes[0];
                  if (first) setScaleId(first.id);
                }}
                className={[
                  "rounded-xl px-2 py-2 text-center text-xs font-semibold leading-tight transition-colors sm:text-sm",
                  selected ? btnSelected : "border border-border bg-bg text-foreground hover:border-zinc-500/45",
                ].join(" ")}
              >
                {meta.shortTab}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-surface/90 p-2 sm:p-2.5">
          {!hideFamilyBlurb ? (
            <p className="mb-2 text-center text-[0.7rem] text-muted sm:text-xs">
              {GAMLAR_FAMILY_LABELS[activeFamilyId].title}
              <span className="mx-1.5 text-border">·</span>
              <span className="text-muted/90">{GAMLAR_FAMILY_LABELS[activeFamilyId].blurb}</span>
            </p>
          ) : null}
          <div
            className={[
              "grid gap-1.5",
              modesInFamily.length <= 4
                ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7",
            ].join(" ")}
          >
            {modesInFamily.map((m) => {
              const selected = resolvedScaleId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setScaleId(m.id)}
                  className={[
                    "rounded-lg px-2 py-2 text-left text-[0.7rem] font-medium leading-snug transition-colors sm:py-2.5 sm:text-xs",
                    selected ? btnSelected : "border border-border bg-bg text-foreground hover:border-zinc-500/45",
                  ].join(" ")}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {!hideFormulaPanel ? <FormulaPanel /> : null}
      </section>
    </div>
  );
  }
}

/** Gamlar sayfası — `GamlarPageToolsProvider` gerekir */
export const GamlarScaleControls = createGamlarScaleControls(
  useGamlarPageToolsStore,
  GAMLAR_SELECTION_STORAGE_KEY,
);
/** 5'li çember sayfası — `BesliCemberPageToolsProvider` gerekir */
export const BesliCemberScaleControls = createGamlarScaleControls(
  useBesliCemberPageToolsStore,
  BESLI_CEMBER_SELECTION_STORAGE_KEY,
);
