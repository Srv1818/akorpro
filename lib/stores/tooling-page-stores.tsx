"use client";

import {
  createContext,
  useContext,
  useMemo,
  type Context,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  createPreviewToolsStore,
  type PreviewToolsState,
  type PreviewToolsStore,
} from "@/lib/stores/preview-tools-store";

const GamlarPageToolsContext = createContext<PreviewToolsStore | null>(null);
const BesliCemberPageToolsContext = createContext<PreviewToolsStore | null>(null);

type ProviderProps = {
  children: ReactNode;
  instanceKey: string;
  initialTranspose?: number;
  initialTonalCenter?: number;
  initialScaleId?: string | null;
};

function makeProvider(
  StoreContext: Context<PreviewToolsStore | null>,
  displayName: string,
) {
  function ToolingPageToolsProvider({
    children,
    instanceKey,
    initialTranspose = 0,
    initialTonalCenter = 0,
    initialScaleId = null,
  }: ProviderProps) {
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
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
  }
  ToolingPageToolsProvider.displayName = displayName;
  return ToolingPageToolsProvider;
}

export const GamlarPageToolsProvider = makeProvider(
  GamlarPageToolsContext,
  "GamlarPageToolsProvider",
);
export const BesliCemberPageToolsProvider = makeProvider(
  BesliCemberPageToolsContext,
  "BesliCemberPageToolsProvider",
);

function makeUseToolingStore(StoreContext: Context<PreviewToolsStore | null>, label: string) {
  return function useToolingStore<T>(selector: (s: PreviewToolsState) => T): T {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error(`${label} ilgili ToolsProvider içinde kullanılmalıdır.`);
    }
    return useStore(store, selector);
  };
}

export const useGamlarPageToolsStore = makeUseToolingStore(
  GamlarPageToolsContext,
  "useGamlarPageToolsStore",
);
export const useBesliCemberPageToolsStore = makeUseToolingStore(
  BesliCemberPageToolsContext,
  "useBesliCemberPageToolsStore",
);

export type { PreviewToolsState };
