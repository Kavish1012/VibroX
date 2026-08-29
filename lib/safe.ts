/**
 * Media URL sanitization.
 * Cloud-provided URLs (covers, audio) enter the DOM via <img src>,
 * <audio src>, CSS background-image and MediaSession artwork — none of
 * these should ever receive a `javascript:`, `vbscript:` or exotic scheme.
 */
const SAFE_PROTOCOL = /^(?:https?:\/\/|blob:)/i;

export function safeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const v = url.trim();
  if (SAFE_PROTOCOL.test(v)) return v;
  if (/^data:image\/[a-z0-9.+-]+;/i.test(v)) return v;
  return undefined;
}

export function safeMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const v = url.trim();
  if (SAFE_PROTOCOL.test(v)) return v;
  return undefined;
}
