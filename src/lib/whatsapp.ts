/**
 * WhatsApp share helpers.
 *
 * Message text is always built from translated strings by the calling component
 * (see the `whatsapp` / `share_*` keys in the message files), so these helpers
 * stay locale-agnostic. The original partnerCode is propagated into shared links
 * to preserve referral attribution across the viral loop (spec §4.4).
 */

const WHATSAPP_BASE_URL = 'https://wa.me/';

/** Builds a wa.me deep link with the message pre-filled. */
export function buildWhatsAppShareUrl(message: string): string {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

/**
 * Appends the partner referral code to a portal URL as `?ref=CODE`.
 * Returns the URL unchanged when no code is available.
 */
export function withReferralCode(url: string, partnerCode?: string): string {
  if (!partnerCode) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ref=${encodeURIComponent(partnerCode)}`;
}
