import { NextRequest, NextResponse, after } from 'next/server';

const ERP_BASE_URL = process.env.ERP_API_URL ?? '';

/**
 * Fires a non-blocking referral-hit beacon to the ERP after the redirect has
 * been sent (Next `after()`), so counting a scan/click never adds latency to the
 * redirect. Failures are swallowed — analytics must not affect the visitor.
 */
function trackReferralHit(code: string, isQr: boolean): void {
  if (!ERP_BASE_URL) return;
  const url = `${ERP_BASE_URL}/api/partners/public/track/${encodeURIComponent(code)}${isQr ? '?src=qr' : ''}`;
  after(() => fetch(url, { method: 'POST', cache: 'no-store' }).catch(() => {}));
}

/**
 * Short, re-pointable partner referral redirector.
 *
 * Partners share `/r/{code}`; QR codes encode `/r/{code}?src=qr`. This handler
 * 302-redirects to the portal landing carrying `?ref=CODE` (plus `src` and any
 * UTM params), where the next-intl middleware negotiates the visitor's locale and
 * the pre-registration funnel resolves the campus from the code.
 *
 * Why a short link rather than pointing partners straight at `/?ref=CODE`:
 *   - printed/QR links stay compact and stable even if the landing path changes;
 *   - it is a single server-side choke point to count scans/clicks (Phase 4);
 *   - the destination is re-pointable without reissuing any partner material.
 *
 * A 302 (not 301/308) is intentional: the mapping must stay re-pointable, codes
 * can be deactivated, and each hit is a scan/click we will want to count, so the
 * redirect must not be cached by the browser.
 *
 * This path is excluded from the next-intl middleware matcher so it is never
 * locale-prefixed (`/r/{code}` is locale-agnostic by design).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = code?.trim().toUpperCase();

  const incoming = req.nextUrl.searchParams;
  const preserved = new URLSearchParams();
  if (normalized) preserved.set('ref', normalized);

  // Carry the attribution params the partner appended (scan-vs-click + campaigns).
  const src = incoming.get('src');
  if (src) preserved.set('src', src);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = incoming.get(key);
    if (value) preserved.set(key, value);
  }

  // Count the scan/click (top-of-funnel), off the redirect's critical path.
  if (normalized) trackReferralHit(normalized, src?.toLowerCase() === 'qr');

  const target = req.nextUrl.clone();
  target.pathname = '/';
  target.search = preserved.toString();

  return NextResponse.redirect(target, 302);
}
