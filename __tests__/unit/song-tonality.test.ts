import { describe, expect, it } from "vitest";
import { songTonality } from "@/lib/music/song-tonality";

describe("songTonality", () => {
  it("major ailesindeki Aeolian'ı minör sayar (Kara Sevda: C# + maj-aeolian)", () => {
    const t = songTonality("C#", "major", "maj-aeolian");
    expect(t?.label).toBe("C# Doğal Minör");
    expect(t?.scaleNotes).toEqual(["C#", "D#", "E", "F#", "G#", "A", "B"]);
    expect(t?.pentatonic).toEqual({ name: "Minör Pentatonik", notes: ["C#", "E", "F#", "G#", "B"] });
  });

  it("Phrygian'ı minör sayar ama doğal minör demez", () => {
    expect(songTonality("E", "major", "maj-phrygian")?.label).toBe("E Minör");
  });

  it("'m' ekli tonda kökü ayırır", () => {
    expect(songTonality("Dm", "major", "maj-aeolian")?.label).toBe("D Doğal Minör");
  });

  it("gam yoksa ve mod majörse majör kalır", () => {
    const t = songTonality("G", "major", undefined);
    expect(t?.label).toBe("G Majör");
    expect(t?.pentatonic?.notes).toEqual(["G", "A", "B", "D", "E"]);
  });

  it("açık minör modu korur", () => {
    expect(songTonality("Am", "harmonic", undefined)?.label).toBe("A Harmonik Minör");
  });

  it("gam zaten pentatonikse ikinci öneri vermez", () => {
    expect(songTonality("A", "major", "blues-min-pent")?.pentatonic).toBeUndefined();
  });

  it("çözülemeyen tonda null döner", () => {
    expect(songTonality("", "major", "maj-aeolian")).toBeNull();
  });
});
