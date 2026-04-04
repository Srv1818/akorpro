import { describe, expect, it } from "vitest";
import {
  inferKeyModeFromOriginalKey,
  normalizeGamlarScaleIdForKeyMode,
  resolveSongGamlarScaleId,
} from "@/lib/music/key-mode-gamlar";

describe("resolveSongGamlarScaleId", () => {
  it("uses stored id when it matches keyMode family", () => {
    expect(resolveSongGamlarScaleId("major", "maj-dorian")).toBe("maj-dorian");
  });

  it("falls back when stored id belongs to another family", () => {
    expect(resolveSongGamlarScaleId("major", "nm-aeolian")).toBe("maj-ionian");
  });

  it("falls back when keyMode is undefined and stored id is not in default (major) family", () => {
    expect(resolveSongGamlarScaleId(undefined, "nm-aeolian")).toBe("maj-ionian");
  });

  it("keeps stored major-family id when keyMode is undefined (defaults to major family)", () => {
    expect(resolveSongGamlarScaleId(undefined, "maj-dorian")).toBe("maj-dorian");
  });
});

describe("normalizeGamlarScaleIdForKeyMode", () => {
  it("accepts valid pair", () => {
    expect(normalizeGamlarScaleIdForKeyMode("hm-phrygian-dom", "harmonic")).toBe("hm-phrygian-dom");
  });

  it("rejects family mismatch", () => {
    expect(normalizeGamlarScaleIdForKeyMode("maj-ionian", "natural")).toBeUndefined();
  });
});

describe("inferKeyModeFromOriginalKey", () => {
  it("detects minor from trailing m", () => {
    expect(inferKeyModeFromOriginalKey("Am")).toBe("natural");
  });

  it("defaults to major", () => {
    expect(inferKeyModeFromOriginalKey("C")).toBe("major");
  });
});
