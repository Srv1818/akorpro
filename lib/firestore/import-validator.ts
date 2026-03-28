import { IMPORT_SONG_SCHEMA } from "@/lib/types/chord-library";

export type ImportSongRow = {
  title: string;
  slug: string;
  artistName: string;
  artistSlug: string;
  chordBody: string;
  originalKey: string;
  difficulty: string;
  genre: string;
  tempo?: number | string;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  copyrightSource?: string;
  popularity?: number;
};

export type ValidationError = {
  row: number;
  field: string;
  message: string;
};

export function validateImportPayload(
  rows: unknown[],
): { valid: ImportSongRow[]; errors: ValidationError[] } {
  const valid: ImportSongRow[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (typeof row !== "object" || row === null) {
      errors.push({ row: i, field: "_root", message: "Satır obje değil." });
      continue;
    }

    const rec = row as Record<string, unknown>;
    let rowValid = true;

    for (const field of IMPORT_SONG_SCHEMA.required) {
      if (!rec[field] || (typeof rec[field] === "string" && !(rec[field] as string).trim())) {
        errors.push({ row: i, field, message: `"${field}" zorunlu.` });
        rowValid = false;
      }
    }

    if (rec.difficulty && !IMPORT_SONG_SCHEMA.difficulties.includes(rec.difficulty as never)) {
      errors.push({
        row: i,
        field: "difficulty",
        message: `Geçersiz zorluk: "${rec.difficulty}". Beklenen: ${IMPORT_SONG_SCHEMA.difficulties.join(", ")}`,
      });
      rowValid = false;
    }

    if (rec.capo !== undefined && (typeof rec.capo !== "number" || rec.capo < 0)) {
      errors.push({ row: i, field: "capo", message: "capo negatif olamaz." });
      rowValid = false;
    }

    if (rowValid) {
      valid.push(rec as unknown as ImportSongRow);
    }
  }

  return { valid, errors };
}
