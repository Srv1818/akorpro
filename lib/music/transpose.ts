import { PC_TO_NAME, noteNameToPitchClass } from "@/lib/music/note-utils";

export function parseTonicFromOriginalKey(key: string): string {
  const k = key.trim();
  if (k.toLowerCase().endsWith("maj")) return k.slice(0, -3).trim();
  if (k.length > 1 && k.toLowerCase().endsWith("m")) return k.slice(0, -1).trim();
  return k;
}

export function signedSemitoneDelta(fromPc: number, toPc: number): number {
  const raw = (toPc - fromPc + 12) % 12;
  return raw > 6 ? raw - 12 : raw;
}

export function transposeChordToken(token: string, semitones: number): string {
  const m = token.match(/^([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4)?(\d+)?$/i);
  if (!m) return token;
  const root = m[1];
  const quality = m[2] ?? "";
  const digits = m[3] ?? "";

  const rootPc = noteNameToPitchClass(root);
  if (rootPc === null) return token;

  const newPc = (rootPc + semitones + 120) % 12;
  const newRoot = PC_TO_NAME[newPc];
  return `${newRoot}${quality}${digits}`;
}

/** Metindeki akor tokenlarıyla aynı desen (transpose ile uyumlu). */
const CHORD_TOKEN_REGEX = /\b([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4)?(\d+)?\b/gi;

/**
 * Metinde geçen akorları ilk göründükleri sırayla, yinelenmeden döndürür (görüntülenen metinle uyumlu olması için transpoze sonrası metin verin).
 */
export function extractUniqueChordTokensInOrder(text: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const re = new RegExp(CHORD_TOKEN_REGEX.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const full = m[0];
    const norm = full.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(full);
  }
  return out;
}

export function transposeChordBodyText(text: string, semitones: number): string {
  if (!text) return text;
  if (!Number.isFinite(semitones) || semitones === 0) return text;

  const re = new RegExp(CHORD_TOKEN_REGEX.source, CHORD_TOKEN_REGEX.flags);
  return text.replace(re, (full, root: string, quality: string | undefined, digits: string | undefined) => {
    const suffix = `${quality ?? ""}${digits ?? ""}`;
    return transposeChordToken(`${root}${suffix}`, semitones);
  });
}
