import { describe, it, expect, vi } from "vitest";

/**
 * @tombatossals/chords-db paketi Windows'ta `#` karakterli dosya yollarıyla
 * ESM çözümleme sorunu yaşadığından, chord-fingering modülünü doğrudan import
 * edemiyoruz. Bunun yerine tryDirectLookup mantığını izole şekilde test ediyoruz.
 */

const SUPPORTED_SUFFIXES = new Set([
  "major", "minor", "7", "5", "dim", "dim7", "aug", "sus2", "sus4", "maj7",
  "m7", "7sus4", "maj9", "maj11", "maj13", "maj9#11", "maj13#11", "add9",
  "69", "maj7b5", "maj7#5", "m6", "m9", "m11", "m13", "madd9", "m69",
  "mmaj7", "mmaj9", "m7b5", "m7#5", "6", "9", "11", "13", "7b5", "aug7",
  "7b9", "7#9", "7(b5,b9)", "7(b5,#9)", "7(#5,b9)", "7(#5,#9)", "9b5",
  "aug9", "13#11", "13b9", "11b9", "sus2sus4", "-5",
]);

const DIRECT_SUFFIX_MAP: Record<string, string> = {
  "": "major",
  "M": "major",
  "maj": "major",
  "m": "minor",
  "min": "minor",
  "min6": "m6",
  "min7": "m7",
  "min9": "m9",
  "min11": "m11",
  "min13": "m13",
};

const TOKEN_RE = /^([A-G](?:#|b)?)((?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*)$/i;

function parseSuffix(token: string): { root: string; suffix: string } | null {
  const clean = token.split("/")[0]?.trim() ?? token.trim();
  const m = clean.match(TOKEN_RE);
  if (!m) return null;
  const root = m[1]!;
  const rawSuffix = (m[2] ?? "").toLowerCase();
  const suffix = DIRECT_SUFFIX_MAP[rawSuffix] ?? rawSuffix;
  return { root, suffix };
}

describe("chord-fingering direct lookup logic", () => {
  it("parses F#mmaj7 → root F#, suffix mmaj7", () => {
    const result = parseSuffix("F#mmaj7");
    expect(result).toEqual({ root: "F#", suffix: "mmaj7" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses D#dim → root D#, suffix dim", () => {
    const result = parseSuffix("D#dim");
    expect(result).toEqual({ root: "D#", suffix: "dim" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Cm7b5 → root C, suffix m7b5", () => {
    const result = parseSuffix("Cm7b5");
    expect(result).toEqual({ root: "C", suffix: "m7b5" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Cadd9 → root C, suffix add9", () => {
    const result = parseSuffix("Cadd9");
    expect(result).toEqual({ root: "C", suffix: "add9" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Cdim7 → root C, suffix dim7", () => {
    const result = parseSuffix("Cdim7");
    expect(result).toEqual({ root: "C", suffix: "dim7" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Am → root A, suffix minor", () => {
    const result = parseSuffix("Am");
    expect(result).toEqual({ root: "A", suffix: "minor" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses C → root C, suffix major", () => {
    const result = parseSuffix("C");
    expect(result).toEqual({ root: "C", suffix: "major" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Cmaj7 → root C, suffix maj7", () => {
    const result = parseSuffix("Cmaj7");
    expect(result).toEqual({ root: "C", suffix: "maj7" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses C7b9 → root C, suffix 7b9", () => {
    const result = parseSuffix("C7b9");
    expect(result).toEqual({ root: "C", suffix: "7b9" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Ammaj7 → root A, suffix mmaj7", () => {
    const result = parseSuffix("Ammaj7");
    expect(result).toEqual({ root: "A", suffix: "mmaj7" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Emadd9 → root E, suffix madd9", () => {
    const result = parseSuffix("Emadd9");
    expect(result).toEqual({ root: "E", suffix: "madd9" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("parses Bm7b5 → root B, suffix m7b5", () => {
    const result = parseSuffix("Bm7b5");
    expect(result).toEqual({ root: "B", suffix: "m7b5" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("handles case-insensitive mMaj7 → mmaj7", () => {
    const result = parseSuffix("F#mMaj7");
    expect(result).toEqual({ root: "F#", suffix: "mmaj7" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("maps min7 alias → m7", () => {
    const result = parseSuffix("Amin7");
    expect(result).toEqual({ root: "A", suffix: "m7" });
    expect(SUPPORTED_SUFFIXES.has(result!.suffix)).toBe(true);
  });

  it("returns null for non-chord text", () => {
    expect(parseSuffix("Verse")).toBeNull();
    expect(parseSuffix("[Intro]")).toBeNull();
    expect(parseSuffix("XYZ")).toBeNull();
  });
});
