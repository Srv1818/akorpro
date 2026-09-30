import { describe, expect, it } from "vitest";
import {
  defaultGamlarScaleLabelForKeyMode,
  gamlarScaleOptionsAll,
  gamlarScaleOptionsForKeyMode,
  inferKeyModeFromOriginalKey,
  keyModeScaleMismatch,
  normalizeGamlarScaleIdForKeyMode,
  realignGamlarScaleIdToKeyMode,
  resolveSongGamlarScaleId,
  splitOriginalKey,
} from "@/lib/music/key-mode-gamlar";

describe("resolveSongGamlarScaleId", () => {
  it("uses stored id when it matches keyMode family", () => {
    expect(resolveSongGamlarScaleId("major", "maj-dorian")).toBe("maj-dorian");
  });

  it("keeps stored id even when it belongs to another family", () => {
    expect(resolveSongGamlarScaleId("major", "nm-aeolian")).toBe("nm-aeolian");
  });

  it("keeps stored id when keyMode is undefined", () => {
    expect(resolveSongGamlarScaleId(undefined, "nm-aeolian")).toBe("nm-aeolian");
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

describe("gamlarScaleOptionsForKeyMode", () => {
  it("listeler yalnız seçili ailenin modlarını içerir", () => {
    const ids = gamlarScaleOptionsForKeyMode("major").map((o) => o.value);
    expect(ids).toEqual([
      "maj-ionian",
      "maj-dorian",
      "maj-phrygian",
      "maj-lydian",
      "maj-mixolydian",
      "maj-aeolian",
      "maj-locrian",
    ]);
  });

  it("doğal minör ailesi kendi kimliklerini verir", () => {
    const ids = gamlarScaleOptionsForKeyMode("natural").map((o) => o.value);
    expect(ids).toContain("nm-phrygian");
    expect(ids).not.toContain("maj-phrygian");
  });

  it("her ailede yedi mod var", () => {
    for (const mode of ["major", "natural", "harmonic", "melodic"] as const) {
      expect(gamlarScaleOptionsForKeyMode(mode)).toHaveLength(7);
    }
  });

  it("etiketler katalogdaki adlar", () => {
    const phrygian = gamlarScaleOptionsForKeyMode("major").find((o) => o.value === "maj-phrygian");
    expect(phrygian?.label).toBe("Phrygian");
  });
});

describe("defaultGamlarScaleLabelForKeyMode", () => {
  it("majör varsayılanı Ionian", () => {
    expect(defaultGamlarScaleLabelForKeyMode("major")).toBe("Ionian (Major)");
  });

  it("harmonik minör varsayılanı kendi ailesinden gelir", () => {
    expect(defaultGamlarScaleLabelForKeyMode("harmonic")).toBe(
      gamlarScaleOptionsForKeyMode("harmonic")[0]?.label,
    );
  });
});

describe("realignGamlarScaleIdToKeyMode", () => {
  it("kısayolu kanonik kimliğe çevirir", () => {
    expect(realignGamlarScaleIdToKeyMode("phrygian", "major")).toBe("maj-phrygian");
  });

  it("aynı aileye ait kimliği olduğu gibi bırakır", () => {
    expect(realignGamlarScaleIdToKeyMode("maj-dorian", "major")).toBe("maj-dorian");
  });

  it("aile uyumsuzluğunu aynı gamın karşılığına çevirir", () => {
    expect(realignGamlarScaleIdToKeyMode("maj-phrygian", "natural")).toBe("nm-phrygian");
    expect(realignGamlarScaleIdToKeyMode("nm-aeolian", "major")).toBe("maj-aeolian");
  });

  it("karşılığı olmayan aile için undefined döner", () => {
    expect(realignGamlarScaleIdToKeyMode("maj-phrygian", "harmonic")).toBeUndefined();
  });

  it("boş ve geçersiz girdiye undefined", () => {
    expect(realignGamlarScaleIdToKeyMode("", "major")).toBeUndefined();
    expect(realignGamlarScaleIdToKeyMode("yok-boyle-bir-mod", "major")).toBeUndefined();
  });

  it("onarılan her değer kendi ton moduyla doğrulamadan geçer", () => {
    for (const mode of ["major", "natural", "harmonic", "melodic"] as const) {
      const out = realignGamlarScaleIdToKeyMode("phrygian", mode);
      if (out) expect(normalizeGamlarScaleIdForKeyMode(out, mode)).toBe(out);
    }
  });
});

describe("splitOriginalKey", () => {
  it("minör eki ayırır", () => {
    expect(splitOriginalKey("C#m")).toEqual({ tonic: "C#", impliedMode: "natural" });
  });

  it("maj eki ayırır", () => {
    expect(splitOriginalKey("Bbmaj")).toEqual({ tonic: "Bb", impliedMode: "major" });
  });

  it("yalnız kökte mod önermez", () => {
    expect(splitOriginalKey(" E ")).toEqual({ tonic: "E" });
  });
});

describe("gamlarScaleOptionsAll", () => {
  it("bütün aileleri aile önekiyle listeler", () => {
    const opts = gamlarScaleOptionsAll();
    expect(opts.find((o) => o.value === "nm-aeolian")?.label).toBe("Doğal minör · Aeolian (Natural Minor)");
    expect(opts.some((o) => o.value === "maj-aeolian")).toBe(true);
    expect(opts.some((o) => o.value === "blues-min-pent")).toBe(true);
  });
});

describe("keyModeScaleMismatch", () => {
  it("majör ton + minör gam uyarır (75 şarkının durumu)", () => {
    expect(keyModeScaleMismatch("major", "maj-aeolian")).toMatch(/minör karakterli/);
    expect(keyModeScaleMismatch(undefined, "maj-phrygian")).toMatch(/minör karakterli/);
  });

  it("uyumlu çiftte sessiz", () => {
    expect(keyModeScaleMismatch("natural", "nm-aeolian")).toBeNull();
    expect(keyModeScaleMismatch("major", "maj-mixolydian")).toBeNull();
  });

  it("minör ton + majör gam uyarır", () => {
    expect(keyModeScaleMismatch("harmonic", "hm-phrygian-dom")).toMatch(/majör karakterli/);
  });

  it("gam yoksa sessiz", () => {
    expect(keyModeScaleMismatch("major", undefined)).toBeNull();
  });
});
