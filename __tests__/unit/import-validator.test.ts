import { describe, it, expect } from "vitest";
import { validateImportPayload, type ImportSongRow } from "@/lib/firestore/import-validator";

function validRow(overrides: Partial<ImportSongRow> = {}): Record<string, unknown> {
  return {
    title: "Test Şarkı",
    slug: "test-sarki",
    artistName: "Test Sanatçı",
    artistSlug: "test-sanatci",
    chordBody: "Am F C G",
    originalKey: "Am",
    difficulty: "orta",
    genre: "Rock",
    ...overrides,
  };
}

describe("validateImportPayload", () => {
  it("accepts a valid row", () => {
    const { valid, errors } = validateImportPayload([validRow()]);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
    expect(valid[0].title).toBe("Test Şarkı");
  });

  it("accepts multiple valid rows", () => {
    const { valid, errors } = validateImportPayload([
      validRow(),
      validRow({ title: "İkinci Şarkı", slug: "ikinci-sarki" }),
    ]);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });

  it("rejects non-object rows", () => {
    const { valid, errors } = validateImportPayload([null, "string", 42, undefined]);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(4);
    expect(errors.every((e) => e.field === "_root")).toBe(true);
  });

  it("reports missing required fields", () => {
    const { valid, errors } = validateImportPayload([{ title: "Only title" }]);
    expect(valid).toHaveLength(0);
    const fields = errors.map((e) => e.field);
    expect(fields).toContain("slug");
    expect(fields).toContain("artistName");
    expect(fields).toContain("artistSlug");
    expect(fields).toContain("chordBody");
    expect(fields).toContain("originalKey");
    expect(fields).toContain("difficulty");
    expect(fields).toContain("genre");
  });

  it("rejects empty-string required fields", () => {
    const { valid, errors } = validateImportPayload([validRow({ title: "  " })]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => e.field === "title")).toBe(true);
  });

  it("rejects invalid difficulty values", () => {
    const { valid, errors } = validateImportPayload([validRow({ difficulty: "imkansız" })]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => e.field === "difficulty")).toBe(true);
    expect(errors[0].message).toContain("Geçersiz zorluk");
  });

  it("accepts valid difficulty values", () => {
    for (const d of ["kolay", "orta", "zor"]) {
      const { valid } = validateImportPayload([validRow({ difficulty: d })]);
      expect(valid).toHaveLength(1);
    }
  });

  it("rejects invalid keyMode", () => {
    const { valid, errors } = validateImportPayload([
      { ...validRow(), keyMode: "invalid" },
    ]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => e.field === "keyMode")).toBe(true);
  });

  it("accepts valid keyMode values", () => {
    for (const mode of ["major", "natural", "harmonic", "melodic"]) {
      const { valid } = validateImportPayload([{ ...validRow(), keyMode: mode }]);
      expect(valid).toHaveLength(1);
    }
  });

  it("allows omitted keyMode (optional)", () => {
    const row = validRow();
    delete (row as Record<string, unknown>).keyMode;
    const { valid, errors } = validateImportPayload([row]);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  it("rejects gamlarScaleId that does not match keyMode family", () => {
    const { valid, errors } = validateImportPayload([
      { ...validRow(), keyMode: "major", gamlarScaleId: "nm-aeolian" },
    ]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => e.field === "gamlarScaleId")).toBe(true);
  });

  it("accepts gamlarScaleId matching keyMode", () => {
    const { valid, errors } = validateImportPayload([
      { ...validRow(), keyMode: "harmonic", gamlarScaleId: "hm-phrygian-dom" },
    ]);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  it("rejects negative capo", () => {
    const { valid, errors } = validateImportPayload([{ ...validRow(), capo: -1 }]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => e.field === "capo")).toBe(true);
  });

  it("rejects non-number capo", () => {
    const { valid, errors } = validateImportPayload([{ ...validRow(), capo: "abc" }]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => e.field === "capo")).toBe(true);
  });

  it("accepts capo=0", () => {
    const { valid } = validateImportPayload([{ ...validRow(), capo: 0 }]);
    expect(valid).toHaveLength(1);
  });

  it("preserves row index in errors", () => {
    const { errors } = validateImportPayload([validRow(), null, validRow({ title: "" })]);
    expect(errors.some((e) => e.row === 1)).toBe(true);
    expect(errors.some((e) => e.row === 2)).toBe(true);
  });

  it("handles empty input array", () => {
    const { valid, errors } = validateImportPayload([]);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});
