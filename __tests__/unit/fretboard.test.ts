import { describe, it, expect } from "vitest";
import {
  stringIndexToFretboardLabel,
  scaleNoteNamesToPitchClassSet,
  pitchClassAtStringFret,
  enumerateFretboardPositionsForPitchClasses,
  gamlarCatalogAndTonicToPitchClassSet,
} from "@/lib/music/fretboard-from-scale-notes";
import { OPEN_STRING_PC_TOP_FIRST } from "@/lib/music/note-utils";

describe("stringIndexToFretboardLabel", () => {
  it("maps top-first index to guitar string number", () => {
    expect(stringIndexToFretboardLabel(0)).toBe(6);
    expect(stringIndexToFretboardLabel(5)).toBe(1);
    expect(stringIndexToFretboardLabel(2)).toBe(4);
  });
});

describe("scaleNoteNamesToPitchClassSet", () => {
  it("converts C major note names to pitch classes", () => {
    const result = scaleNoteNamesToPitchClassSet(["C", "D", "E", "F", "G", "A", "B"]);
    expect(result).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
  });

  it("handles chromatic note names", () => {
    const result = scaleNoteNamesToPitchClassSet(["C", "C#", "D"]);
    expect(result).toEqual(new Set([0, 1, 2]));
  });
});

describe("pitchClassAtStringFret", () => {
  it("open strings return standard tuning pitch classes", () => {
    expect(pitchClassAtStringFret(0, 0)).toBe(4);  // high E
    expect(pitchClassAtStringFret(1, 0)).toBe(11); // B
    expect(pitchClassAtStringFret(2, 0)).toBe(7);  // G
    expect(pitchClassAtStringFret(3, 0)).toBe(2);  // D
    expect(pitchClassAtStringFret(4, 0)).toBe(9);  // A
    expect(pitchClassAtStringFret(5, 0)).toBe(4);  // low E
  });

  it("fret 1 on high E → F (5)", () => {
    expect(pitchClassAtStringFret(0, 1)).toBe(5);
  });

  it("wraps at fret 12 (octave)", () => {
    expect(pitchClassAtStringFret(0, 12)).toBe(4);
  });
});

describe("enumerateFretboardPositionsForPitchClasses", () => {
  it("returns positions for a single pitch class", () => {
    const positions = enumerateFretboardPositionsForPitchClasses(new Set([0]), { maxFret: 12 });
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.pitchClass === 0)).toBe(true);
  });

  it("returns empty array for empty set", () => {
    const positions = enumerateFretboardPositionsForPitchClasses(new Set(), { maxFret: 5 });
    expect(positions).toEqual([]);
  });

  it("respects maxFret option", () => {
    const positions = enumerateFretboardPositionsForPitchClasses(
      new Set([0, 2, 4, 5, 7, 9, 11]),
      { maxFret: 3 },
    );
    expect(positions.every((p) => p.fret <= 3)).toBe(true);
  });

  it("positions include fret 0 (open strings)", () => {
    const openPcs = new Set(OPEN_STRING_PC_TOP_FIRST);
    const positions = enumerateFretboardPositionsForPitchClasses(openPcs, { maxFret: 0 });
    expect(positions.length).toBe(6);
    expect(positions.every((p) => p.fret === 0)).toBe(true);
  });
});

describe("gamlarCatalogAndTonicToPitchClassSet", () => {
  it("returns non-empty set for C major scale", () => {
    const result = gamlarCatalogAndTonicToPitchClassSet(0, "major");
    expect(result.size).toBeGreaterThanOrEqual(7);
    expect(result.has(0)).toBe(true); // C
  });

  it("returns non-empty set for A minor (aeolian)", () => {
    const result = gamlarCatalogAndTonicToPitchClassSet(9, "aeolian");
    expect(result.size).toBeGreaterThanOrEqual(7);
    expect(result.has(9)).toBe(true); // A
  });

  it("falls back to default for null/undefined scaleId", () => {
    const result = gamlarCatalogAndTonicToPitchClassSet(0, null);
    expect(result.size).toBeGreaterThan(0);
  });

  it("returns notes transposed to correct key", () => {
    const cMajor = gamlarCatalogAndTonicToPitchClassSet(0, "major");
    const dMajor = gamlarCatalogAndTonicToPitchClassSet(2, "major");
    expect(cMajor.has(0)).toBe(true);
    expect(dMajor.has(2)).toBe(true);
    expect(cMajor).not.toEqual(dMajor);
  });
});
