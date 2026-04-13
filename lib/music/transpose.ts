import { noteNameToPitchClass, pitchClassToChordRootName } from "@/lib/music/note-utils";

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

export type TransposeChordOptions = {
  /** Metinde bemol kök (…b) varsa doğal kökler için de bemol yazımı (C#→Db). */
  preferFlatsForNaturalRoots?: boolean;
};

function useFlatSpellingForTransposedRoot(root: string, preferFlatsForNaturalRoots: boolean): boolean {
  const r = root.trim();
  if (r.includes("#")) return false;
  if (r.length >= 2 && r.charAt(1) === "b") return true;
  return preferFlatsForNaturalRoots;
}

export function transposeChordToken(token: string, semitones: number, options?: TransposeChordOptions): string {
  const m = token.match(/^([A-G](?:#|b)?)((?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*)$/i);
  if (!m) return token;
  const root = m[1];
  const suffix = m[2] ?? "";

  const rootPc = noteNameToPitchClass(root);
  if (rootPc === null) return token;

  const newPc = (rootPc + semitones + 120) % 12;
  const preferFlat = useFlatSpellingForTransposedRoot(root, options?.preferFlatsForNaturalRoots ?? false);
  const newRoot = pitchClassToChordRootName(newPc, preferFlat);
  return `${newRoot}${suffix}`;
}

/**
 * Transpoze yokken gösterim: kök harfini müzik notasyonuna uygun büyütür (d→D, bb→Bb).
 * Transpoze dışında kök büyük/küçük harf düzeni; 0 yarımda kullanılır.
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
  /(?<![\p{L}\p{M}\p{N}_])([A-G](?:#|b)?)((?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*)(?![\p{L}\p{M}\p{N}_])/giu;
const BRACKETED_CHORD_TOKEN_REGEX = /\[([A-G](?:#|b)?(?:(?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*))\]/gi;

/** `preview-client` ile aynı: köşeli akor satırı tespiti + inline akorlar (ham metin; `i` ham küçük harf için). */
const AS_RENDERED_BRACKET_CHORD = /\[([A-G](?:#|b)?(?:(?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*))\]/gi;
const AS_RENDERED_INLINE_CHORD =
  /(?<![\p{L}\p{M}\p{N}_])([A-G](?:#|b)?)((?:mmaj|madd|msus|maj|min|dim|aug|add|sus|m)?(?:\d+)?(?:[b#]\d+)*)(?![\p{L}\p{M}\p{N}_])/giu;

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

/** Metinde en az bir bemol kök (Eb, Bb, …) varsa transpoze çıktısında doğal kökler için bemol ailesi kullanılır. */
export function chordBodyUsesFlatRootNotation(text: string): boolean {
  if (!text) return false;
  const re = new RegExp(CHORD_TOKEN_REGEX.source, CHORD_TOKEN_REGEX.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const root = m[1] ?? "";
    if (root.length >= 2 && root.charAt(1) === "b") return true;
  }
  return false;
}

export function transposeChordBodyText(text: string, semitones: number): string {
  if (!text) return text;
  const normalized = normalizeBracketedChordTokens(text);
  if (!Number.isFinite(semitones)) return normalized;

  const preferFlatsForNaturalRoots = chordBodyUsesFlatRootNotation(text);
  const re = new RegExp(CHORD_TOKEN_REGEX.source, CHORD_TOKEN_REGEX.flags);
  return normalized.replace(re, (full, root: string, suffix: string) => {
    const token = `${root}${suffix}`;
    if (semitones === 0) return formatChordSymbolDisplay(token);
    return transposeChordToken(token, semitones, { preferFlatsForNaturalRoots });
  });
}
