import { describe, expect, it } from "vitest";
import { SLUG_MAX_LENGTH, slugify } from "@/payload/slugify";

describe("slugify", () => {
  it("Türkçe harfleri ASCII'ye indirger", () => {
    expect(slugify("Şarkı Söz")).toBe("sarki-soz");
    expect(slugify("Ömrüm")).toBe("omrum");
    expect(slugify("Çiğdem Güneş")).toBe("cigdem-gunes");
  });

  // Postgres lower()'ı "İ" için Türkçe kuralı uygulamaz; bu yüzden harf
  // değiştirme küçültmeden önce yapılıyor. Regresyon koruması.
  it("büyük İ ve I harflerini doğru indirger", () => {
    expect(slugify("İstanbul")).toBe("istanbul");
    expect(slugify("Işık")).toBe("isik");
    expect(slugify("IŞIK")).toBe("isik");
  });

  it("şapkalı harfleri indirger", () => {
    expect(slugify("Rüzgâr")).toBe("ruzgar");
    expect(slugify("Kâtip")).toBe("katip");
  });

  it("alfanumerik olmayanları tek tireye indirger", () => {
    expect(slugify("Bir  İki --- Üç")).toBe("bir-iki-uc");
    // "&" istisna: düşmüyor, "ve" olarak yazılıyor (bir alttaki teste bakın).
    expect(slugify("A / B / C")).toBe("a-b-c");
  });

  it("baştaki ve sondaki tireleri kırpar", () => {
    expect(slugify("  -Merhaba-  ")).toBe("merhaba");
    expect(slugify("!!!")).toBe("");
  });

  it("boş ve tanımsız girdileri boş string'e çevirir", () => {
    expect(slugify("")).toBe("");
    expect(slugify(null)).toBe("");
    expect(slugify(undefined)).toBe("");
  });

  it("120 karakterde keser", () => {
    const long = "a".repeat(200);
    expect(slugify(long)).toHaveLength(SLUG_MAX_LENGTH);
  });

  // .com.tr'de "İkilem & Tuğba" adresi ikilem-ve-tugba; "&" düşerse o URL kırılır.
  it("& işaretini 've' olarak yazar", () => {
    expect(slugify("İkilem & Tuğba")).toBe("ikilem-ve-tugba");
    expect(slugify("Rock & Roll")).toBe("rock-ve-roll");
    expect(slugify("A&B")).toBe("a-ve-b");
  });

  it("zaten slug olan değeri değiştirmez (idempotent)", () => {
    expect(slugify("eypio")).toBe("eypio");
    expect(slugify(slugify("Ömrüm"))).toBe("omrum");
  });
});
