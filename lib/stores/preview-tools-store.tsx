"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
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
  const storeRef = useRef<PreviewToolsStore | null>(null);
  const keyRef = useRef<string | null>(null);

  if (keyRef.current !== instanceKey || !storeRef.current) {
    keyRef.current = instanceKey;
    storeRef.current = createPreviewToolsStore({
      transposeSemitones: initialTranspose,
      tonalCenterIndex: initialTonalCenter,
      selectedScaleId: initialScaleId,
    });
  }

  return (
    <PreviewToolsContext.Provider value={storeRef.current}>{children}</PreviewToolsContext.Provider>
  );
}

export function usePreviewToolsStore<T>(selector: (s: PreviewToolsState) => T): T {
  const store = useContext(PreviewToolsContext);
  if (!store) {
    throw new Error("usePreviewToolsStore PreviewToolsProvider içinde kullanılmalıdır.");
  }
  return useStore(store, selector);
}
