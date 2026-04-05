export interface ChordShapeDoc {
  name: string;
  root: string;
  quality: "maj" | "min" | "7" | "m7" | "maj7" | "dim" | "aug" | "sus2" | "sus4" | "add9" | "9" | "m9";
  fingering: string;
  /** Fret positions for diagram: -1 = muted, 0 = open, 1+ = fret */
  frets?: number[];
  /** Barre info */
  barreStart?: number;
  barreEnd?: number;
  barreFret?: number;
  /** Display order within same root+quality group */
  sortOrder?: number;

  schemaVersion: number;
  createdAt: FirebaseFirestore.Timestamp | unknown;
  updatedAt: FirebaseFirestore.Timestamp | unknown;
}

export interface ScaleDoc {
  id: string;
  name: string;
  /** Intervals relative to C */
  notesC: string[];
  /** Category for grouping (e.g. "Diyatonik", "Pentatonik", "Modus") */
  category?: string;
  description?: string;
  sortOrder?: number;
}

export const IMPORT_SONG_SCHEMA = {
  required: ["title", "slug", "artistName", "artistSlug", "chordBody", "originalKey", "difficulty", "genre"],
  optional: [
    "tempo",
    "timeSignature",
    "tuning",
    "capo",
    "copyrightSource",
    "popularity",
    "keyMode",
    "gamlarScaleId",
    "showHarmonyDetails",
    "harmonyDetailsNotes",
  ],
  difficulties: ["kolay", "orta", "zor"],
} as const;
