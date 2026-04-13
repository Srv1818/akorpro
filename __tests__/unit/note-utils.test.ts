import { describe, it, expect } from "vitest";
import {
  PC_TO_NAME,
  PC_TO_NAME_FLAT,
  pitchClassToChordRootName,
  noteNameToPitchClass,
  CO5_PITCH_CLASSES,
  CO5_LABELS,
  scalePitchClassesInKey,
  majorTriadPitchClasses,
} from "@/lib/music/note-utils";

describe("PC_TO_NAME", () => {
  it("maps 0–11 to note names", () => {
    expect(PC_TO_NAME[0]).toBe("C");
    expect(PC_TO_NAME[1]).toBe("C#");
    expect(PC_TO_NAME[6]).toBe("F#");
    expect(PC_TO_NAME[11]).toBe("B");
  });

  it("covers all 12 pitch classes", () => {
    for (let i = 0; i < 12; i++) {
      expect(PC_TO_NAME[i]).toBeDefined();
    }
  });
});

describe("PC_TO_NAME_FLAT / pitchClassToChordRootName", () => {
  it("maps enharmonics to flat spellings", () => {
    expect(PC_TO_NAME_FLAT[1]).toBe("Db");
    expect(PC_TO_NAME_FLAT[8]).toBe("Ab");
    expect(pitchClassToChordRootName(1, true)).toBe("Db");
    expect(pitchClassToChordRootName(1, false)).toBe("C#");
  });

  it("normalizes negative pitch classes", () => {
    expect(pitchClassToChordRootName(-1, false)).toBe("B");
  });
});

describe("noteNameToPitchClass", () => {
  it("parses natural notes", () => {
    expect(noteNameToPitchClass("C")).toBe(0);
    expect(noteNameToPitchClass("D")).toBe(2);
    expect(noteNameToPitchClass("E")).toBe(4);
    expect(noteNameToPitchClass("F")).toBe(5);
    expect(noteNameToPitchClass("G")).toBe(7);
    expect(noteNameToPitchClass("A")).toBe(9);
    expect(noteNameToPitchClass("B")).toBe(11);
  });

  it("parses sharps", () => {
    expect(noteNameToPitchClass("C#")).toBe(1);
    expect(noteNameToPitchClass("F#")).toBe(6);
    expect(noteNameToPitchClass("G#")).toBe(8);
  });

  it("parses flats (uppercase Bb → BB)", () => {
    expect(noteNameToPitchClass("Db")).toBe(1);
    expect(noteNameToPitchClass("Eb")).toBe(3);
    expect(noteNameToPitchClass("Gb")).toBe(6);
    expect(noteNameToPitchClass("Ab")).toBe(8);
    expect(noteNameToPitchClass("Bb")).toBe(10);
  });

  it("is case-insensitive", () => {
    expect(noteNameToPitchClass("c")).toBe(0);
    expect(noteNameToPitchClass("c#")).toBe(1);
    expect(noteNameToPitchClass("bb")).toBe(10);
  });

  it("trims whitespace", () => {
    expect(noteNameToPitchClass("  A  ")).toBe(9);
  });

  it("returns null for invalid input", () => {
    expect(noteNameToPitchClass("H")).toBeNull();
    expect(noteNameToPitchClass("X#")).toBeNull();
    expect(noteNameToPitchClass("")).toBeNull();
  });
});

describe("CO5_PITCH_CLASSES / CO5_LABELS", () => {
  it("has 12 entries", () => {
    expect(CO5_PITCH_CLASSES).toHaveLength(12);
    expect(CO5_LABELS).toHaveLength(12);
  });

  it("starts with C (0) and ends with F (5)", () => {
    expect(CO5_PITCH_CLASSES[0]).toBe(0);
    expect(CO5_LABELS[0]).toBe("C");
    expect(CO5_PITCH_CLASSES[11]).toBe(5);
    expect(CO5_LABELS[11]).toBe("F");
  });

  it("each step is a perfect fifth (7 semitones)", () => {
    for (let i = 0; i < CO5_PITCH_CLASSES.length - 1; i++) {
      expect((CO5_PITCH_CLASSES[i + 1] - CO5_PITCH_CLASSES[i] + 12) % 12).toBe(7);
    }
  });
});

describe("scalePitchClassesInKey", () => {
  it("C major scale in key C → {0,2,4,5,7,9,11}", () => {
    const cMajor = ["C", "D", "E", "F", "G", "A", "B"];
    const result = scalePitchClassesInKey(cMajor, 0);
    expect(result).toEqual(new Set([0, 2, 4, 5, 7, 9, 11]));
  });

  it("transposes to D major (key=2)", () => {
    const cMajor = ["C", "D", "E", "F", "G", "A", "B"];
    const result = scalePitchClassesInKey(cMajor, 2);
    expect(result).toEqual(new Set([2, 4, 6, 7, 9, 11, 1]));
  });

  it("ignores invalid note names", () => {
    const result = scalePitchClassesInKey(["C", "INVALID", "E"], 0);
    expect(result).toEqual(new Set([0, 4]));
  });
});

describe("majorTriadPitchClasses", () => {
  it("C major triad → {0, 4, 7}", () => {
    expect(majorTriadPitchClasses(0)).toEqual(new Set([0, 4, 7]));
  });

  it("G major triad → {7, 11, 2}", () => {
    expect(majorTriadPitchClasses(7)).toEqual(new Set([7, 11, 2]));
  });

  it("wraps around correctly for B root", () => {
    const result = majorTriadPitchClasses(11);
    expect(result).toEqual(new Set([11, 3, 6]));
  });
});
