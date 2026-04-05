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

/**
 * Transpoze yokken gösterim: kök harfini müzik notasyonuna uygun büyütür (d→D, bb→Bb).
 * Transpoze ile gelen `PC_TO_NAME` (ör. Bb→A#) davranışını değiştirmez; sadece 0 yarımda kullanılır.
 */
export function formatChordSymbolDisplay(token: string): string {
  const slash = token.indexOf("/");
  const base = slash >= 0 ? token.slice(0, slash) : token;
  const tail = slash >= 0 ? token.slice(slash) : "";

  const m = base.match(/^([A-Ga-g](?:#|b)?)(.*)$/);
  if (!m) return token;
  const root = m[1];
  const rest = m[2];
  const rootNorm =
    root.charAt(0).toUpperCase() +
    (root.length > 1 ? root.slice(1).toLowerCase() : "");
  return rootNorm + rest + tail;
}

/** Metindeki akor tokenlarıyla aynı desen (transpose ile uyumlu). */
const CHORD_TOKEN_REGEX =
  /(?<![\p{L}\p{M}\p{N}_])([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4)?(\d+)?(?![\p{L}\p{M}\p{N}_])/giu;
const BRACKETED_CHORD_TOKEN_REGEX = /\[([A-G](?:#|b)?(?:maj|min|m|dim|aug|sus2|sus4)?(?:\d+)?)\]/gi;

/** `preview-client` ile aynı: köşeli akor satırı tespiti + inline akorlar (ham metin; `i` ham küçük harf için). */
const AS_RENDERED_BRACKET_CHORD = /\[([A-G](?:#|b)?(?:maj|min|m|dim|aug|sus2|sus4)?(?:\d+)?)\]/gi;
const AS_RENDERED_INLINE_CHORD =
  /(?<![\p{L}\p{M}\p{N}_])([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4)?(\d+)?(?![\p{L}\p{M}\p{N}_])/giu;

function normalizeBracketedChordTokens(text: string): string {
  return text.replace(BRACKETED_CHORD_TOKEN_REGEX, (full, chordToken: string, offset: number, source: string) => {
    const prev = offset > 0 ? source[offset - 1] : "";
    const next = offset + full.length < source.length ? source[offset + full.length] : "";
    const prevIsAlnum = prev ? /[\p{L}\p{N}]/u.test(prev) : false;
    const nextIsAlnum = next ? /[\p{L}\p{N}]/u.test(next) : false;
    return `${prevIsAlnum ? " " : ""}${chordToken}${nextIsAlnum ? " " : ""}`;
  });
}

/**
 * Metinde geçen akorları ilk göründükleri sırayla, yinelenmeden döndürür (görüntülenen metinle uyumlu olması için transpoze sonrası metin verin).
 */
export function extractUniqueChordTokensInOrder(text: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const re = new RegExp(CHORD_TOKEN_REGEX.source, CHORD_TOKEN_REGEX.flags);
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

/**
 * Önizleme satır mantığıyla uyumlu: bir satırda en az bir `[Akor]` varsa yalnızca köşeli parantez
 * içindeki semboller akor sayılır (parantez dışındaki C, Am vb. söz metni kalır). Diğer satırlarda
 * üst satır akor düzeni dahil inline desen kullanılır. Şarkı sözlerinde yanlış pozitifleri ve
 * `transposeChordBodyText` sonrası kaybolan `[]` ayrımını önlemek için ham `chordBody` verin.
 */
export function extractUniqueChordTokensAsRendered(text: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const line of text.split("\n")) {
    const bracketMatches = [...line.matchAll(AS_RENDERED_BRACKET_CHORD)];
    if (bracketMatches.length > 0) {
      for (const m of bracketMatches) {
        const inner = m[1]?.trim() ?? "";
        if (!inner) continue;
        const norm = inner.toLowerCase();
        if (seen.has(norm)) continue;
        seen.add(norm);
        out.push(inner);
      }
      continue;
    }

    const re = new RegExp(AS_RENDERED_INLINE_CHORD.source, AS_RENDERED_INLINE_CHORD.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const full = m[0];
      const norm = full.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(full);
    }
  }

  return out;
}

/**
 * `extractUniqueChordTokensAsRendered` ile aynı satır/köşeli kuralları; yinelenen akorlar dahil
 * parçada geçtikleri sırayla döner (akor akışı / armoni özeti için).
 */
export function extractChordTokensInOrderAsRendered(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];

  for (const line of text.split("\n")) {
    const bracketMatches = [...line.matchAll(AS_RENDERED_BRACKET_CHORD)];
    if (bracketMatches.length > 0) {
      for (const m of bracketMatches) {
        const inner = m[1]?.trim() ?? "";
        if (inner) out.push(inner);
      }
      continue;
    }

    const re = new RegExp(AS_RENDERED_INLINE_CHORD.source, AS_RENDERED_INLINE_CHORD.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      out.push(m[0]);
    }
  }

  return out;
}

export function transposeChordBodyText(text: string, semitones: number): string {
  if (!text) return text;
  const normalized = normalizeBracketedChordTokens(text);
  if (!Number.isFinite(semitones)) return normalized;

  const re = new RegExp(CHORD_TOKEN_REGEX.source, CHORD_TOKEN_REGEX.flags);
  return normalized.replace(re, (full, root: string, quality: string | undefined, digits: string | undefined) => {
    const suffix = `${quality ?? ""}${digits ?? ""}`;
    const token = `${root}${suffix}`;
    if (semitones === 0) return formatChordSymbolDisplay(token);
    return transposeChordToken(token, semitones);
  });
}
