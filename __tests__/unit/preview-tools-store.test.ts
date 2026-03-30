import { describe, it, expect } from "vitest";
import {
  createPreviewToolsStore,
  type PreviewToolsState,
} from "@/lib/stores/preview-tools-store";

function getState(store: ReturnType<typeof createPreviewToolsStore>): PreviewToolsState {
  return store.getState();
}

describe("createPreviewToolsStore", () => {
  it("initializes with default values", () => {
    const store = createPreviewToolsStore({});
    const s = getState(store);
    expect(s.transposeSemitones).toBe(0);
    expect(s.tonalCenterIndex).toBe(0);
    expect(s.selectedScaleId).toBeNull();
  });

  it("initializes with custom values", () => {
    const store = createPreviewToolsStore({
      transposeSemitones: 3,
      tonalCenterIndex: 7,
      selectedScaleId: "dorian",
    });
    const s = getState(store);
    expect(s.transposeSemitones).toBe(3);
    expect(s.tonalCenterIndex).toBe(7);
    expect(s.selectedScaleId).toBe("dorian");
  });

  it("normalizes tonalCenterIndex to [0,11]", () => {
    const store = createPreviewToolsStore({ tonalCenterIndex: -1 });
    expect(getState(store).tonalCenterIndex).toBe(11);

    const store2 = createPreviewToolsStore({ tonalCenterIndex: 13 });
    expect(getState(store2).tonalCenterIndex).toBe(1);
  });
});

describe("setTransposeSemitones", () => {
  it("updates transpose value", () => {
    const store = createPreviewToolsStore({});
    getState(store).setTransposeSemitones(5);
    expect(getState(store).transposeSemitones).toBe(5);
  });

  it("rounds non-integer values", () => {
    const store = createPreviewToolsStore({});
    getState(store).setTransposeSemitones(3.7);
    expect(getState(store).transposeSemitones).toBe(4);
  });

  it("defaults to 0 for non-finite values", () => {
    const store = createPreviewToolsStore({ transposeSemitones: 5 });
    getState(store).setTransposeSemitones(NaN);
    expect(getState(store).transposeSemitones).toBe(0);

    getState(store).setTransposeSemitones(Infinity);
    expect(getState(store).transposeSemitones).toBe(0);
  });
});

describe("setTonalCenterIndex", () => {
  it("normalizes to [0,11]", () => {
    const store = createPreviewToolsStore({});
    getState(store).setTonalCenterIndex(14);
    expect(getState(store).tonalCenterIndex).toBe(2);

    getState(store).setTonalCenterIndex(-3);
    expect(getState(store).tonalCenterIndex).toBe(9);
  });
});

describe("setSelectedScaleId", () => {
  it("sets and clears scale id", () => {
    const store = createPreviewToolsStore({});
    getState(store).setSelectedScaleId("pentatonic-minor");
    expect(getState(store).selectedScaleId).toBe("pentatonic-minor");

    getState(store).setSelectedScaleId(null);
    expect(getState(store).selectedScaleId).toBeNull();
  });
});

describe("resetTonalAndTranspose", () => {
  it("resets transpose and tonal center to 0", () => {
    const store = createPreviewToolsStore({
      transposeSemitones: 5,
      tonalCenterIndex: 7,
      selectedScaleId: "dorian",
    });
    getState(store).resetTonalAndTranspose();
    const s = getState(store);
    expect(s.transposeSemitones).toBe(0);
    expect(s.tonalCenterIndex).toBe(0);
    expect(s.selectedScaleId).toBe("dorian");
  });
});

describe("store sync: transpose ↔ tonal center", () => {
  it("subscribes to changes", () => {
    const store = createPreviewToolsStore({});
    const calls: number[] = [];
    store.subscribe((s) => calls.push(s.transposeSemitones));

    getState(store).setTransposeSemitones(3);
    getState(store).setTransposeSemitones(-2);

    expect(calls).toEqual([3, -2]);
  });

  it("independent state instances don't interfere", () => {
    const store1 = createPreviewToolsStore({ transposeSemitones: 1 });
    const store2 = createPreviewToolsStore({ transposeSemitones: 5 });

    getState(store1).setTransposeSemitones(10);
    expect(getState(store1).transposeSemitones).toBe(10);
    expect(getState(store2).transposeSemitones).toBe(5);
  });
});
