import { describe, it, expect } from "vitest";
import {
  GAMLAR_SCALE_CATALOG,
  gamlarScaleById,
  defaultGamlarScaleId,
} from "@/data/gamlar-scale-catalog";

describe("GAMLAR_SCALE_CATALOG", () => {
  it("has at least 10 entries", () => {
    expect(GAMLAR_SCALE_CATALOG.length).toBeGreaterThanOrEqual(10);
  });

  it("each entry has required fields", () => {
    for (const entry of GAMLAR_SCALE_CATALOG) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.tonalType).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(typeof entry.sortOrder).toBe("number");
    }
  });

  it("has unique ids", () => {
    const ids = GAMLAR_SCALE_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("gamlarScaleById", () => {
  it("returns entry for known id", () => {
    const entry = gamlarScaleById("major");
    expect(entry).toBeDefined();
    expect(entry!.name).toBe("Major");
  });

  it("returns undefined for unknown id", () => {
    expect(gamlarScaleById("nonexistent")).toBeUndefined();
  });

  it("returns undefined for null/undefined", () => {
    expect(gamlarScaleById(null)).toBeUndefined();
    expect(gamlarScaleById(undefined)).toBeUndefined();
  });
});

describe("defaultGamlarScaleId", () => {
  it("returns the first catalog entry id", () => {
    const id = defaultGamlarScaleId();
    expect(id).toBe(GAMLAR_SCALE_CATALOG[0].id);
  });
});
