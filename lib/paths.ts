/** Kanonik URL üreticileri — ARCHITECTURE tek kaynak */

export function chordPath(artistSlug: string, songSlug: string): string {
  return `/akor/${artistSlug}/${songSlug}`;
}

export function artistPath(slug: string): string {
  return `/sanatci/${slug}`;
}

export function previewPath(artistSlug: string, songSlug: string): string {
  return `/preview/${artistSlug}/${songSlug}`;
}
