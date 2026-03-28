/**
 * Defense-in-depth text sanitizer for chord/lyric content.
 *
 * React JSX already escapes text children, but this strips HTML at the data
 * layer so that stored XSS never reaches any rendering path — including
 * potential future `dangerouslySetInnerHTML` usages or API responses.
 *
 * For rich-HTML content (e.g. Markdown previews), add `isomorphic-dompurify`
 * and use its ALLOWED_TAGS / ALLOWED_ATTR whitelist instead.
 */

const SCRIPT_RE = /<script[\s>][\s\S]*?<\/script\s*>/gi;
const TAG_RE = /<\/?[^>]+(>|$)/g;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const JS_PROTOCOL_RE = /javascript\s*:/gi;

export function sanitizeTextContent(raw: string): string {
  return raw
    .replace(SCRIPT_RE, "")
    .replace(EVENT_HANDLER_RE, "")
    .replace(JS_PROTOCOL_RE, "")
    .replace(TAG_RE, "");
}

/**
 * Sanitize a plain-text field (title, artist name, etc.).
 * Strips tags and trims whitespace; returns empty string for falsy input.
 */
export function sanitizePlainField(value: unknown): string {
  if (typeof value !== "string") return "";
  return sanitizeTextContent(value).trim();
}
