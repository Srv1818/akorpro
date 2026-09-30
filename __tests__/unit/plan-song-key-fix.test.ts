import { describe, expect, it } from "vitest";
import { planSongKeyFix } from "@/lib/music/plan-song-key-fix";

describe("planSongKeyFix", () => {
  it("Kara Sevda: majör + Aeolian → doğal minör, gam aynı notalarla taşınır", () => {
    expect(planSongKeyFix({ originalKey: "C#", keyMode: "major", gamlarScaleId: "maj-aeolian" })).toEqual({
      changes: { keyMode: "natural", gamlarScaleId: "nm-aeolian" },
      warnings: [],
    });
  });

  it("Phrygian şarkı da minöre geçer", () => {
    expect(planSongKeyFix({ originalKey: "E", keyMode: "major", gamlarScaleId: "maj-phrygian" }).changes).toEqual({
      keyMode: "natural",
      gamlarScaleId: "nm-phrygian",
    });
  });

  it("'m' ekli ton köke iner ve modu belirler", () => {
    expect(planSongKeyFix({ originalKey: "Dm", keyMode: "major", gamlarScaleId: "maj-aeolian" }).changes).toEqual({
      originalKey: "D",
      keyMode: "natural",
      gamlarScaleId: "nm-aeolian",
    });
    expect(planSongKeyFix({ originalKey: "Am", keyMode: null, gamlarScaleId: null }).changes).toEqual({
      originalKey: "A",
      keyMode: "natural",
    });
  });

  it("uyumlu kayda dokunmaz", () => {
    expect(planSongKeyFix({ originalKey: "G", keyMode: "major", gamlarScaleId: "maj-ionian" })).toEqual({
      changes: {},
      warnings: [],
    });
    expect(planSongKeyFix({ originalKey: "A", keyMode: "natural", gamlarScaleId: "nm-aeolian" }).changes).toEqual({});
  });

  it("harmonik minöre dokunmaz, majör gamı uyarı olarak raporlar", () => {
    const fix = planSongKeyFix({ originalKey: "A", keyMode: "harmonic", gamlarScaleId: "hm-phrygian-dom" });
    expect(fix.changes).toEqual({});
    expect(fix.warnings).toHaveLength(1);
  });

  it("çelişen 'm' eki + majör gam: ton köke iner, mod elle bakılmak üzere bırakılır", () => {
    const fix = planSongKeyFix({ originalKey: "Em", keyMode: "major", gamlarScaleId: "maj-ionian" });
    expect(fix.changes).toEqual({ originalKey: "E" });
    expect(fix.warnings[0]).toMatch(/elle bak/);
  });

  it("kısayol gam kimliğini kanonikleştirir", () => {
    expect(planSongKeyFix({ originalKey: "D", keyMode: "major", gamlarScaleId: "mixolydian" }).changes).toEqual({
      gamlarScaleId: "maj-mixolydian",
    });
  });

  it("katalogda olmayan gamı raporlar", () => {
    expect(planSongKeyFix({ originalKey: "D", keyMode: "major", gamlarScaleId: "yok" }).warnings[0]).toMatch(/katalogda yok/);
  });
});
