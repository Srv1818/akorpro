import { describe, it, expect } from "vitest";
import { gamlarChordExampleStrings } from "@/lib/music/gamlar-scale-triads";

describe("gamlarChordExampleStrings", () => {
  it("computes diatonic triads and sevenths for selected tonic (Ionian)", () => {
    const g = gamlarChordExampleStrings(7, "maj-ionian", "G");
    expect(g).not.toBeNull();
    expect(g!.triads).toContain("G");
    expect(g!.triads).toContain("Am");
    expect(g!.sevenths).toContain("Gmaj7");
    expect(g!.sevenths).toContain("Am7");
    expect(g!.seventhsIsChordList).toBe(true);
    expect(g!.tonicLabel).toBe("G");
  });

  it("transposes pentatonic target chords from C to F", () => {
    const f = gamlarChordExampleStrings(5, "blues-maj-pent", "F");
    expect(f).not.toBeNull();
    expect(f!.triads).toMatch(/F/);
    expect(f!.triads).not.toMatch(/\bC\b/);
  });
});
