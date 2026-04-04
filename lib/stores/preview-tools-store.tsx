"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

export type PreviewToolsState = {
  transposeSemitones: number;
  setTransposeSemitones: (n: number) => void;
  tonalCenterIndex: number;
  setTonalCenterIndex: (n: number) => void;
  selectedScaleId: string | null;
  setSelectedScaleId: (id: string | null) => void;
  resetTonalAndTranspose: () => void;
};

export type PreviewToolsStore = StoreApi<PreviewToolsState>;

export function createPreviewToolsStore(init: {
  transposeSemitones?: number;
  tonalCenterIndex?: number;
  selectedScaleId?: string | null;
}): PreviewToolsStore {
  return createStore<PreviewToolsState>((set) => ({
    transposeSemitones: init.transposeSemitones ?? 0,
    tonalCenterIndex: ((init.tonalCenterIndex ?? 0) % 12 + 12) % 12,
    selectedScaleId: init.selectedScaleId ?? null,
    setTransposeSemitones: (n) =>
      set({ transposeSemitones: Number.isFinite(n) ? Math.round(n as number) : 0 }),
    setTonalCenterIndex: (n) =>
      set({ tonalCenterIndex: (((Number(n) % 12) + 12) % 12) as number }),
    setSelectedScaleId: (id) => set({ selectedScaleId: id }),
    resetTonalAndTranspose: () => set({ transposeSemitones: 0, tonalCenterIndex: 0 }),
  }));
}

const PreviewToolsContext = createContext<PreviewToolsStore | null>(null);

export function PreviewToolsProvider({
  children,
  instanceKey,
  initialTranspose = 0,
  initialTonalCenter = 0,
  initialScaleId = null,
}: {
  children: ReactNode;
  /** Aynı sayfada store’u sıfırlamak için (ör. şarkı id) */
  instanceKey: string;
  initialTranspose?: number;
  initialTonalCenter?: number;
  initialScaleId?: string | null;
}) {
  const storeInitKey = JSON.stringify([
    instanceKey,
    initialTranspose,
    initialTonalCenter,
    initialScaleId,
  ] as const);
  const store = useMemo(() => {
    const [, transpose, tonal, scale] = JSON.parse(storeInitKey) as [
      string,
      number,
      number,
      string | null,
    ];
    return createPreviewToolsStore({
      transposeSemitones: transpose,
      tonalCenterIndex: tonal,
      selectedScaleId: scale,
    });
  }, [storeInitKey]);

  return <PreviewToolsContext.Provider value={store}>{children}</PreviewToolsContext.Provider>;
}

export function usePreviewToolsStore<T>(selector: (s: PreviewToolsState) => T): T {
  const store = useContext(PreviewToolsContext);
  if (!store) {
    throw new Error("usePreviewToolsStore PreviewToolsProvider içinde kullanılmalıdır.");
  }
  return useStore(store, selector);
}
