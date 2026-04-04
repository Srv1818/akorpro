import { Chord, Interval, Note, Scale } from "tonal";

import {
  defaultGamlarScaleId,
  gamlarScaleById,
  normalizeGamlarScaleId,
  type GamlarFamilyId,
} from "@/data/gamlar-scale-catalog";
import type { ChordQuality, Co5ChordEntry, Co5ChordPanel } from "@/lib/music/co5-chord-types";
import { PC_TO_NAME } from "@/lib/music/note-utils";

function formatSym(s: string): string {
  return s.replace(/dim/gi, "°").replace(/aug/gi, "aug");
}

function qualityOf(sym: string): ChordQuality {
  if (/m7b5|ø/i.test(sym)) return "half-dim";
  if (/dim|°/i.test(sym)) return "diminished";
  if (/aug|\+/i.test(sym)) return "augmented";
  const c = Chord.get(sym);
  if (!c.empty) {
    const q = c.quality.toLowerCase();
    if (q === "minor") return "minor";
    if (q === "augmented") return "augmented";
    if (q === "diminished") return "diminished";
  }
  if (/7$/.test(sym) && !/m7|maj7/i.test(sym)) return "dominant";
  return "major";
}

function panelOf(q: ChordQuality): Co5ChordPanel {
  if (q === "minor") return "minor";
  if (q === "diminished" || q === "half-dim") return "dim";
  return "major";
}

type TriadKind = "major" | "minor" | "diminished" | "augmented";

function classifyTriad(root: string, third: string, fifth: string): TriadKind {
  const s3 = Interval.semitones(Interval.distance(root, third));
  const s5 = Interval.semitones(Interval.distance(root, fifth));
  if (s3 === 4 && s5 === 7) return "major";
  if (s3 === 3 && s5 === 7) return "minor";
  if (s3 === 3 && s5 === 6) return "diminished";
  if (s3 === 4 && s5 === 8) return "augmented";
  return "major";
}

function triadChordName(root: string, kind: TriadKind): string {
  if (kind === "major") return root;
  if (kind === "minor") return `${root}m`;
  if (kind === "diminished") return `${root}dim`;
  return `${root}aug`;
}

const ROMAN_BASE = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

function romanForDegree(degreeIndex: number, kind: TriadKind): string {
  const base = ROMAN_BASE[degreeIndex] ?? "?";
  const lower = base.toLowerCase();
  if (kind === "major") return base;
  if (kind === "minor") return lower;
  if (kind === "diminished") return `${lower}°`;
  return `${lower}+`;
}

/** Tonal `Chord.getChord` ikinci argümanı — diyatonik yedili için */
function chordTypeTokenFromSeventhIntervals(s3: number, s5: number, s7: number): string {
  const k = `${s3},${s5},${s7}`;
  const map: Record<string, string> = {
    "3,6,9": "dim7",
    "3,6,10": "m7b5",
    "3,7,10": "m7",
    "3,7,11": "mMaj7",
    "4,7,10": "7",
    "4,7,11": "maj7",
    "4,8,10": "aug7",
    "4,8,11": "maj7#5",
  };
  return map[k] ?? "7";
}

function familyUsesSeventhChords(family: GamlarFamilyId | undefined): boolean {
  return family === "harmonic-minor" || family === "melodic-minor";
}

/** Katalogdaki C kökü akor dizisini seçilen köke taşır (pentatonik / blues). */
function transposeChordLineFromC(line: string, targetTonicName: string): string {
  const ivl = Note.distance("C", targetTonicName);
  if (!ivl) return line;

  const useEmDash = line.includes("—");
  const sep = useEmDash ? /\s*—\s*/ : /,\s*/;
  const joiner = useEmDash ? " — " : ", ";
  const parts = line.split(sep);

  return parts
    .map((part) => {
      const t = part.trim();
      if (!t) return t;
      const paren = t.match(/^\((.+)\)$/);
      const inner = paren ? paren[1].trim() : t;
      const c = Chord.get(inner);
      if (c.empty) return part;
      const tr = Chord.transpose(inner, ivl);
      return paren ? `(${tr})` : tr;
    })
    .join(joiner);
}

function lineLooksLikeChordProgressionList(s: string): boolean {
  const parts = s.split(/\s*—\s*/);
  if (parts.length < 2) return false;
  return parts.every((p) => {
    const inner = p.trim().replace(/^\((.+)\)$/, "$1").trim();
    return inner.length > 0 && !Chord.get(inner).empty;
  });
}

export type GamlarChordExampleStrings = {
  triads: string;
  sevenths: string | null;
  /** true ise 7'li satırı akor listesi olarak göster; false ise açıklama metni */
  seventhsIsChordList: boolean;
  tonicLabel: string;
};

/**
 * Seçilen tonal merkez ve gam için 3'lü / 7'li örnek satırları.
 * 7 notalı diyatonik dizilerde Tonal ile hesaplanır; pentatonik ve blues’ta C katalog satırı transpoze edilir.
 */
export function gamlarChordExampleStrings(
  tonicPitchClass: number,
  scaleCatalogId: string | null | undefined,
  tonicNoteNameOverride?: string,
): GamlarChordExampleStrings | null {
  const id = normalizeGamlarScaleId(scaleCatalogId) ?? defaultGamlarScaleId();
  const entry = gamlarScaleById(id);
  if (!entry?.formula) return null;

  const pc = ((tonicPitchClass % 12) + 12) % 12;
  const tonicName = tonicNoteNameOverride ?? PC_TO_NAME[pc] ?? "C";

  const sc = Scale.get([tonicName, entry.tonalType]);
  const notes = sc.notes;
  if (!notes?.length) return null;

  const n = notes.length;

  if (n === 7) {
    const triads: string[] = [];
    const sevenths: string[] = [];
    for (let i = 0; i < 7; i++) {
      const root = notes[i];
      const third = notes[(i + 2) % n];
      const fifth = notes[(i + 4) % n];
      const seventh = notes[(i + 6) % n];
      const kind = classifyTriad(root, third, fifth);
      const rawTriad = triadChordName(root, kind);
      triads.push(formatSym(Chord.get(rawTriad).symbol));

      const s3 = Interval.semitones(Interval.distance(root, third));
      const s5 = Interval.semitones(Interval.distance(root, fifth));
      const s7 = Interval.semitones(Interval.distance(root, seventh));
      const typeTok = chordTypeTokenFromSeventhIntervals(s3, s5, s7);
      const raw7 = Chord.getChord(typeTok, root);
      sevenths.push(formatSym(raw7.symbol));
    }
    return {
      triads: triads.join(" — "),
      sevenths: sevenths.join(" — "),
      seventhsIsChordList: true,
      tonicLabel: tonicName,
    };
  }

  const triads = transposeChordLineFromC(entry.triadsExample ?? "", tonicName);
  let sevenths: string | null = null;
  let seventhsIsChordList = false;
  const raw7 = entry.seventhsExample?.trim();
  if (raw7) {
    if (lineLooksLikeChordProgressionList(raw7)) {
      sevenths = transposeChordLineFromC(raw7, tonicName);
      seventhsIsChordList = true;
    } else {
      sevenths = raw7;
      seventhsIsChordList = false;
    }
  }

  return {
    triads,
    sevenths,
    seventhsIsChordList,
    tonicLabel: tonicName,
  };
}

/**
 * Gamlar kataloğundaki bir gam + tonal merkez (0–11) için diyatonik akorlar — 5'li çember panelleriyle uyumlu.
 * Harmonik ve melodik minör ailelerinde yedililer (gelişmiş), diğerlerinde üçlüler.
 */
export function buildChordEntriesFromGamlarScale(
  tonicPitchClass: number,
  scaleCatalogId: string | null | undefined
): Co5ChordEntry[] {
  const id = normalizeGamlarScaleId(scaleCatalogId) ?? defaultGamlarScaleId();
  const entry = gamlarScaleById(id);
  if (!entry) return [];

  const pc = ((tonicPitchClass % 12) + 12) % 12;
  const tonicName = PC_TO_NAME[pc] ?? "C";
  const sc = Scale.get([tonicName, entry.tonalType]);
  const notes = sc.notes;
  if (!notes?.length) return [];

  const n = notes.length;
  if (n < 7) return [];

  const want7 = familyUsesSeventhChords(entry.category);

  const out: Co5ChordEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const root = notes[i];
    const third = notes[(i + 2) % n];
    const fifth = notes[(i + 4) % n];
    const kind = classifyTriad(root, third, fifth);

    let sym: string;
    let q: ChordQuality;

    if (want7) {
      const seventh = notes[(i + 6) % n];
      const s3 = Interval.semitones(Interval.distance(root, third));
      const s5 = Interval.semitones(Interval.distance(root, fifth));
      const s7 = Interval.semitones(Interval.distance(root, seventh));
      const typeTok = chordTypeTokenFromSeventhIntervals(s3, s5, s7);
      const raw = Chord.getChord(typeTok, root);
      sym = formatSym(raw.symbol);
      q = qualityOf(sym);
    } else {
      const rawName = triadChordName(root, kind);
      sym = formatSym(Chord.get(rawName).symbol);
      q = qualityOf(sym);
    }

    out.push({
      degree: i,
      roman: romanForDegree(i, kind),
      symbol: sym,
      quality: q,
      panel: panelOf(q),
    });
  }
  return out;
}
