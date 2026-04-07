import { describe, it, expect } from "vitest";
import {
  extractChordTokensInOrderAsRendered,
  extractUniqueChordTokensAsRendered,
  extractUniqueChordTokensInOrder,
  formatChordSymbolDisplay,
  parseTonicFromOriginalKey,
  signedSemitoneDelta,
  transposeChordToken,
  transposeChordBodyText,
} from "@/lib/music/transpose";

describe("parseTonicFromOriginalKey", () => {
  it("strips trailing 'm' for minor keys", () => {
    expect(parseTonicFromOriginalKey("Am")).toBe("A");
    expect(parseTonicFromOriginalKey("Em")).toBe("E");
    expect(parseTonicFromOriginalKey("F#m")).toBe("F#");
    expect(parseTonicFromOriginalKey("Bbm")).toBe("Bb");
  });

  it("strips trailing 'maj' for major keys", () => {
    expect(parseTonicFromOriginalKey("Cmaj")).toBe("C");
    expect(parseTonicFromOriginalKey("Dbmaj")).toBe("Db");
  });

  it("returns as-is for plain note names", () => {
    expect(parseTonicFromOriginalKey("C")).toBe("C");
    expect(parseTonicFromOriginalKey("G")).toBe("G");
    expect(parseTonicFromOriginalKey("F#")).toBe("F#");
  });

  it("handles whitespace", () => {
    expect(parseTonicFromOriginalKey("  Am  ")).toBe("A");
    expect(parseTonicFromOriginalKey("  C  ")).toBe("C");
  });
});

describe("signedSemitoneDelta", () => {
  it("returns 0 for same pitch class", () => {
    expect(signedSemitoneDelta(0, 0)).toBe(0);
    expect(signedSemitoneDelta(7, 7)).toBe(0);
  });

  it("positive delta for ascending", () => {
    expect(signedSemitoneDelta(0, 2)).toBe(2);
    expect(signedSemitoneDelta(0, 5)).toBe(5);
    expect(signedSemitoneDelta(0, 6)).toBe(6);
  });

  it("negative delta for descending (> 6 semitones up = negative)", () => {
    expect(signedSemitoneDelta(0, 7)).toBe(-5);
    expect(signedSemitoneDelta(0, 11)).toBe(-1);
    expect(signedSemitoneDelta(0, 10)).toBe(-2);
  });

  it("works for non-zero from values", () => {
    expect(signedSemitoneDelta(9, 0)).toBe(3);
    expect(signedSemitoneDelta(9, 7)).toBe(-2);
  });

  it("range is always [-6..+6]", () => {
    for (let from = 0; from < 12; from++) {
      for (let to = 0; to < 12; to++) {
        const d = signedSemitoneDelta(from, to);
        expect(d).toBeGreaterThanOrEqual(-6);
        expect(d).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe("transposeChordToken", () => {
  it("transposes simple chords up", () => {
    expect(transposeChordToken("C", 2)).toBe("D");
    expect(transposeChordToken("A", 3)).toBe("C");
  });

  it("transposes with quality suffix", () => {
    expect(transposeChordToken("Am", 2)).toBe("Bm");
    expect(transposeChordToken("Dm7", 5)).toBe("Gm7");
  });

  it("transposes with sharp/flat roots", () => {
    expect(transposeChordToken("F#", 1)).toBe("G");
    expect(transposeChordToken("Bb", 2)).toBe("C");
  });

  it("wraps around", () => {
    expect(transposeChordToken("B", 1)).toBe("C");
    expect(transposeChordToken("C", -1)).toBe("B");
  });

  it("returns unchanged for non-chord tokens", () => {
    expect(transposeChordToken("Verse", 2)).toBe("Verse");
    expect(transposeChordToken("[Intro]", 3)).toBe("[Intro]");
    expect(transposeChordToken("", 1)).toBe("");
  });

  it("handles 0 semitones", () => {
    expect(transposeChordToken("Am", 0)).toBe("Am");
  });

  it("handles large negative semitones", () => {
    expect(transposeChordToken("C", -12)).toBe("C");
    expect(transposeChordToken("D", -14)).toBe("C");
  });

  it("handles sus2/sus4/dim/aug/min/maj qualities", () => {
    expect(transposeChordToken("Csus2", 2)).toBe("Dsus2");
    expect(transposeChordToken("Gsus4", 5)).toBe("Csus4");
    expect(transposeChordToken("Cdim", 3)).toBe("D#dim");
    expect(transposeChordToken("Caug", 7)).toBe("Gaug");
    expect(transposeChordToken("Cmaj7", 4)).toBe("Emaj7");
  });

  it("handles complex suffixes: mmaj7, dim7, m7b5, add9", () => {
    expect(transposeChordToken("F#mmaj7", 1)).toBe("Gmmaj7");
    expect(transposeChordToken("Cdim7", 2)).toBe("Ddim7");
    expect(transposeChordToken("Cm7b5", 3)).toBe("D#m7b5");
    expect(transposeChordToken("Cadd9", 5)).toBe("Fadd9");
    expect(transposeChordToken("D#dim", 1)).toBe("Edim");
    expect(transposeChordToken("Am7b5", 2)).toBe("Bm7b5");
    expect(transposeChordToken("C7b9", 7)).toBe("G7b9");
  });
});

describe("transposeChordBodyText", () => {
  it("transposes all chords in a multi-line body", () => {
    const body = "[Verse]\nAm          F\nKaranlıkta kaldım\nC           G\nYine sessizlik";
    const result = transposeChordBodyText(body, 2);
    expect(result).toContain("Bm");
    expect(result).toContain("G");
    expect(result).toContain("D");
    expect(result).toContain("A");
    expect(result).toContain("Karanlıkta kaldım");
    expect(result).toContain("Yine sessizlik");
  });

  it("returns text unchanged for 0 semitones when already cased", () => {
    const body = "Am F C G";
    expect(transposeChordBodyText(body, 0)).toBe(body);
  });

  it("normalizes lowercase chord roots at 0 semitones", () => {
    expect(transposeChordBodyText("d Em a g", 0)).toBe("D Em A G");
  });

  it("unwraps bracketed chord tokens while preserving section labels", () => {
    const body = "[Verse]\n[Am] [F] [C] [G]\nSarki sozu";
    const result = transposeChordBodyText(body, 0);
    expect(result).toContain("[Verse]");
    expect(result).toContain("Am F C G");
    expect(result).not.toContain("[Am]");
    expect(result).not.toContain("[F]");
  });

  it("inserts spacing when bracketed chords touch lyrics", () => {
    const body = "[C]Zor olsa da, [Am]galiba donuyor[Em]um sana";
    const result = transposeChordBodyText(body, 0);
    expect(result).toContain("C Zor olsa da, Am galiba donuyor Em um sana");
    expect(result).not.toContain("CZor");
    expect(result).not.toContain("Amgaliba");
    expect(result).not.toContain("donuyorEmum");
  });

  it("returns text unchanged for NaN", () => {
    expect(transposeChordBodyText("Am F", NaN)).toBe("Am F");
  });

  it("returns empty string for empty input", () => {
    expect(transposeChordBodyText("", 5)).toBe("");
  });

  it("preserves non-chord text", () => {
    const body = "[Chorus]\nLa la la\nSeviyorum seni";
    const result = transposeChordBodyText(body, 3);
    expect(result).toContain("[Chorus]");
    expect(result).toContain("la la");
    expect(result).toContain("Seviyorum seni");
  });

  it("handles complex chord sequences", () => {
    const body = "Em  C  G  D";
    const result = transposeChordBodyText(body, 5);
    expect(result).toBe("Am  F  C  G");
  });

  it("transposes 7th chords in body text", () => {
    const body = "Dm7  A7  Bb";
    const result = transposeChordBodyText(body, 2);
    expect(result).toContain("Em7");
    expect(result).toContain("B7");
    expect(result).toContain("C");
  });
});

describe("formatChordSymbolDisplay", () => {
  it("capitalizes single-letter roots", () => {
    expect(formatChordSymbolDisplay("d")).toBe("D");
    expect(formatChordSymbolDisplay("g")).toBe("G");
  });

  it("normalizes minor and keeps Bb-style spelling", () => {
    expect(formatChordSymbolDisplay("em")).toBe("Em");
    expect(formatChordSymbolDisplay("bb")).toBe("Bb");
  });

  it("preserves slash bass spelling", () => {
    expect(formatChordSymbolDisplay("d/F#")).toBe("D/F#");
  });
});

describe("extractUniqueChordTokensAsRendered", () => {
  it("extracts complex chord tokens from bracket lines", () => {
    expect(extractUniqueChordTokensAsRendered("[F#mmaj7] [Cdim7] [Am7b5]")).toEqual(["F#mmaj7", "Cdim7", "Am7b5"]);
  });

  it("extracts complex chord tokens from inline lines", () => {
    expect(extractUniqueChordTokensAsRendered("F#mmaj7  D#dim  Cadd9  Am7b5")).toEqual(["F#mmaj7", "D#dim", "Cadd9", "Am7b5"]);
  });

  it("on bracket lines only takes chords inside brackets", () => {
    expect(extractUniqueChordTokensAsRendered("[Am] sözde G ve F geçse de")).toEqual(["Am"]);
  });

  it("on plain lines uses inline chord pattern (chord row + lyrics)", () => {
    const body = "Am          F\nKaranlıkta kaldım\nC           G";
    expect(extractUniqueChordTokensAsRendered(body)).toEqual(["Am", "F", "C", "G"]);
  });

  it("dedupes and keeps first-seen order across lines", () => {
    expect(extractUniqueChordTokensAsRendered("[Am] x\n[F] y\nAm")).toEqual(["Am", "F"]);
  });
});

describe("extractChordTokensInOrderAsRendered", () => {
  it("keeps repeats and order (bracket lines)", () => {
    expect(extractChordTokensInOrderAsRendered("[Am] x\n[Am] y\n[F] z")).toEqual(["Am", "Am", "F"]);
  });

  it("keeps repeats on inline chord rows", () => {
    const body = "Am          F\nAm          F";
    expect(extractChordTokensInOrderAsRendered(body)).toEqual(["Am", "F", "Am", "F"]);
  });
});

describe("extractUniqueChordTokensInOrder", () => {
  it("returns unique chords in first-seen order", () => {
    expect(extractUniqueChordTokensInOrder("Am F C G Am")).toEqual(["Am", "F", "C", "G"]);
  });

  it("dedupes case-insensitively", () => {
    expect(extractUniqueChordTokensInOrder("Am am am")).toEqual(["Am"]);
  });

  it("returns empty for empty or no chords", () => {
    expect(extractUniqueChordTokensInOrder("")).toEqual([]);
    expect(extractUniqueChordTokensInOrder("sadece söz")).toEqual([]);
  });
});
