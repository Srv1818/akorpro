/** Kanonik URL üreticileri — ARCHITECTURE tek kaynak */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://akorpro.com.tr";

export function chordPath(artistSlug: string, songSlug: string): string {
  return `/akor/${artistSlug}/${songSlug}`;
}

export function artistPath(slug: string): string {
  return `/sanatci/${slug}`;
}

export function previewPath(artistSlug: string, songSlug: string): string {
  return `/preview/${artistSlug}/${songSlug}`;
}

export function contributorProfilePath(uid: string): string {
  return `/profil/${uid}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
