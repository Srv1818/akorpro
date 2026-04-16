const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanLyricsText(raw: string): string {
  // 1) Normalize newlines and remove hidden/control characters.
  let s = (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(ZERO_WIDTH_RE, "")
    .replace(CONTROL_RE, "");

  // 2) Normalize section tags to ChordPro-friendly English tags.
  // [Nakarat] -> [Chorus]
  // [Bölüm 1], [Bolum 2], [Kıta], [Kita 3] -> [Verse]
  s = s
    .replace(/^\s*\[(?:nakarat|chorus)\]\s*$/gim, "[Chorus]")
    .replace(/^\s*\[(?:bölüm|bolum|kıta|kita|verse)(?:\s*\d+)?\]\s*$/gim, "[Verse]");

  // 3) Remove common quotation marks (keep apostrophes).
  //    “ ” „ « » ‹ › ＂
  s = s.replace(/["“”„«»‹›＂]/g, "");

  // 4) Line-based cleanup (preserve stanza spacing as much as possible).
  const lines = s.split("\n").map((line) => line.trimEnd());
  const out: string[] = [];
  const isTag = (line: string) => line === "[Verse]" || line === "[Chorus]";

  for (const line of lines) {
    // Remove common Genius junk lines that may appear in scraped text.
    if (/Read More/i.test(line)) continue;
    if (/^\s*\[?Embed\]?\s*$/i.test(line)) continue;

    if (isTag(line)) {
      // Ensure a blank line before section tags (avoids "sticking" visually).
      const prev = out.length > 0 ? out[out.length - 1] ?? "" : "";
      if (prev.trim() !== "") out.push("");
      out.push(line);
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}
