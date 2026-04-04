import { describe, expect, it } from "vitest";

import { buildChordEntriesFromGamlarScale } from "@/lib/music/gamlar-scale-triads";

describe("buildChordEntriesFromGamlarScale", () => {
  it("C Ionian: majör diyatonik üçlüler ve Roma rakamları", () => {
    const rows = buildChordEntriesFromGamlarScale(0, "maj-ionian");
    expect(rows).toHaveLength(7);
    expect(rows[0]?.symbol).toBe("C");
    expect(rows[0]?.roman).toBe("I");
    expect(rows[1]?.symbol).toBe("Dm");
    expect(rows[1]?.roman).toBe("ii");
    expect(rows[6]?.symbol).toMatch(/B/);
    expect(rows[6]?.roman).toMatch(/vii/);
  });

  it("A aeolian: doğal minör merkezli (üçlü)", () => {
    const rows = buildChordEntriesFromGamlarScale(9, "nm-aeolian");
    expect(rows).toHaveLength(7);
    expect(rows[0]?.symbol).toMatch(/^Am$/);
    expect(rows[0]?.roman).toBe("i");
  });

  it("C harmonik minör: diyatonik yedililer", () => {
    const rows = buildChordEntriesFromGamlarScale(0, "hm-harmonic");
    expect(rows[0]?.symbol).toMatch(/CmMaj7|Cm\/ma7/i);
    expect(rows[1]?.symbol).toMatch(/m7b5|ø/i);
    expect(rows[4]?.symbol).toMatch(/^G7$/);
    expect(rows[6]?.symbol).toMatch(/dim7|°/i);
  });

  it("C melodik minör: diyatonik yedililer", () => {
    const rows = buildChordEntriesFromGamlarScale(0, "mm-melodic");
    expect(rows[0]?.symbol).toMatch(/CmMaj7|Cm\/ma7/i);
    expect(rows[3]?.symbol).toMatch(/^F7$/);
  });
});
