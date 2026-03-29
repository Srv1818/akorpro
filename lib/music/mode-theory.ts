import { Chord, Note, Scale } from "tonal";
import { CO5_LABELS, CO5_PITCH_CLASSES, PC_TO_NAME, noteNameToPitchClass } from "@/lib/music/note-utils";

export type ParentScaleFamily = "natural" | "harmonic" | "melodic";

const REF_MODE_NAMES: Record<ParentScaleFamily, string> = {
  natural: "C major",
  harmonic: "C harmonic minor",
  melodic: "C melodic minor",
};

/** Tonal `Scale.modeNames` ile uyumlu 7 mod adı (referans tonik C veya C) */
export function modeTypeNames(parent: ParentScaleFamily): string[] {
  const pairs = Scale.modeNames(REF_MODE_NAMES[parent]);
  return pairs.map((p) => p[1]);
}

export function modeLabelsTr(parent: ParentScaleFamily): readonly string[] {
  switch (parent) {
    case "natural":
      return [
        "1 — İyonian (Majör)",
        "2 — Dorian",
        "3 — Frigian",
        "4 — Lidyen",
        "5 — Miksolidyen",
        "6 — Eolian (Doğal minör)",
        "7 — Lokrian",
      ];
    case "harmonic":
      return [
        "1 — Harmonik minör",
        "2 — Lokrian ♮6",
        "3 — Majör artırılmış",
        "4 — Dorian #4",
        "5 — Frigian dominant",
        "6 — Lidyen #9",
        "7 — Ultralokrian",
      ];
    case "melodic":
      return [
        "1 — Melodik minör",
        "2 — Dorian ♭2",
        "3 — Lidyen artırılmış",
        "4 — Lidyen dominant",
        "5 — Miksolidyen ♭6",
        "6 — Lokrian ♮2",
        "7 — Altered",
      ];
  }
}

export function parentScaleFamilyLabelTr(p: ParentScaleFamily): string {
  switch (p) {
    case "natural":
      return "Doğal (Majör / Minör)";
    case "harmonic":
      return "Harmonik";
    case "melodic":
      return "Melodik";
  }
}

export type TriadQuality = "major" | "minor" | "diminished" | "augmented";

export type DiatonicTriad = {
  degree: number;
  roman: string;
  rootPc: number;
  rootName: string;
  symbol: string;
  quality: TriadQuality;
};

function triadQualityFromNotes(root: string, third: string, fifth: string): TriadQuality {
  const r = Note.chroma(root);
  const t = Note.chroma(third);
  const f = Note.chroma(fifth);
  if (r === undefined || t === undefined || f === undefined) return "minor";
  const d3 = (t - r + 12) % 12;
  const d5 = (f - r + 12) % 12;
  if (d3 === 4 && d5 === 7) return "major";
  if (d3 === 3 && d5 === 7) return "minor";
  if (d3 === 3 && d5 === 6) return "diminished";
  if (d3 === 4 && d5 === 8) return "augmented";
  return "minor";
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

function romanNumeral(degreeIndex: number, q: TriadQuality): string {
  let s = ROMAN[degreeIndex] ?? "?";
  if (q === "minor" || q === "diminished") s = s.toLowerCase();
  if (q === "diminished") s += "°";
  if (q === "augmented") s += "+";
  return s;
}

/** Çemberdeki tercih edilen tonik yazımı (CO5 ile uyumlu) */
export function tonicNameFromPitchClass(pc: number): string {
  const idx = CO5_PITCH_CLASSES.indexOf(pc as (typeof CO5_PITCH_CLASSES)[number]);
  if (idx >= 0) return CO5_LABELS[idx];
  return PC_TO_NAME[((pc % 12) + 12) % 12] ?? "C";
}

export function getModeScaleNotes(tonicPc: number, parent: ParentScaleFamily, modeIndex: number): string[] {
  const tonicName = tonicNameFromPitchClass(((tonicPc % 12) + 12) % 12);
  const types = modeTypeNames(parent);
  const scaleType = types[modeIndex];
  if (!scaleType) return Scale.get(`${tonicName} major`).notes;
  const s = Scale.get(`${tonicName} ${scaleType}`);
  return s.notes;
}

export function getDiatonicTriads(scaleNotes: string[]): DiatonicTriad[] {
  const out: DiatonicTriad[] = [];
  for (let i = 0; i < 7; i++) {
    const root = scaleNotes[i];
    const third = scaleNotes[(i + 2) % 7];
    const fifth = scaleNotes[(i + 4) % 7];
    const q = triadQualityFromNotes(root, third, fifth);
    const detected = Chord.detect([root, third, fifth]);
    const symbol = detected[0] ?? root;
    const rpc = noteNameToPitchClass(Note.simplify(root));
    out.push({
      degree: i + 1,
      roman: romanNumeral(i, q),
      rootPc: rpc ?? 0,
      rootName: Note.simplify(root),
      symbol,
      quality: q,
    });
  }
  return out;
}

export function scalePitchClassSet(scaleNotes: string[]): Set<number> {
  const set = new Set<number>();
  for (const n of scaleNotes) {
    const pc = noteNameToPitchClass(Note.simplify(n));
    if (pc !== null) set.add(pc);
  }
  return set;
}

/** Çember segmenti: majör üçlü kök → dış halka; relatif minör kök → orta; vii° kök → iç */
export function wedgeIndexForTriadHighlight(t: DiatonicTriad): { ring: "outer" | "middle" | "inner"; wedgeIndex: number } | null {
  const pc = ((t.rootPc % 12) + 12) % 12;
  if (t.quality === "major" || t.quality === "augmented") {
    const wi = CO5_PITCH_CLASSES.indexOf(pc as (typeof CO5_PITCH_CLASSES)[number]);
    if (wi < 0) return null;
    return { ring: "outer", wedgeIndex: wi };
  }
  if (t.quality === "minor") {
    const majorPc = (pc - 9 + 12) % 12;
    const wi = CO5_PITCH_CLASSES.indexOf(majorPc as (typeof CO5_PITCH_CLASSES)[number]);
    if (wi < 0) return null;
    return { ring: "middle", wedgeIndex: wi };
  }
  if (t.quality === "diminished") {
    const majorPc = (pc + 1) % 12;
    const wi = CO5_PITCH_CLASSES.indexOf(majorPc as (typeof CO5_PITCH_CLASSES)[number]);
    if (wi < 0) return null;
    return { ring: "inner", wedgeIndex: wi };
  }
  return null;
}

export function relativeMinorRootPc(majorPc: number): number {
  return (majorPc + 9) % 12;
}

export function leadingToneRootPc(majorPc: number): number {
  return (majorPc + 11) % 12;
}
