'use client';

/**
 * Client-side visitor tracking.
 *
 * Captures and persists the attribution context that must travel with a lead
 * all the way to the ERP (spec §3.1, §3.3, §4.1, §5.4):
 *   - partnerCode      — from `?ref=CODE`, stored 30 days
 *   - source           — referral_link | qr_code | manual_code | direct
 *   - utmParams        — utm_source / utm_medium / utm_campaign
 *
 * Everything is kept in cookies so the context survives navigation between the
 * landing page, the quiz and the pre-registration form within the 30-day window.
 */

import Cookies from 'js-cookie';
import type { LeadSource, UtmParams } from '@/types';

const PARTNER_COOKIE = 'pref'; // short, discreet
const SOURCE_COOKIE = 'psrc';
const UTM_COOKIE = 'putm';
const COOKIE_DAYS = 30;

export interface TrackingContext {
  partnerCode?: string;
  source: LeadSource;
  utmParams?: UtmParams;
}

const cookieOptions: Cookies.CookieAttributes = {
  expires: COOKIE_DAYS,
  sameSite: 'Lax',
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Reads attribution parameters from the current URL and persists them.
 * Call this once on mount of any public entry page.
 *
 * The `qr` source is signalled by partners via `?src=qr` on their QR-code links,
 * letting the ERP distinguish scanned codes from shared links.
 */
export function captureTrackingParams(params: URLSearchParams): void {
  const ref = params.get('ref')?.trim();
  if (ref) {
    Cookies.set(PARTNER_COOKIE, ref.toUpperCase(), cookieOptions);
    const isQr = params.get('src')?.toLowerCase() === 'qr';
    Cookies.set(SOURCE_COOKIE, isQr ? 'qr_code' : 'referral_link', cookieOptions);
  }

  const utm: UtmParams = {};
  if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!;
  if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!;
  if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!;
  if (Object.keys(utm).length > 0) {
    Cookies.set(UTM_COOKIE, JSON.stringify(utm), cookieOptions);
  }
}

export function getPartnerCode(): string | undefined {
  return Cookies.get(PARTNER_COOKIE);
}

export function getUtmParams(): UtmParams | undefined {
  const raw = Cookies.get(UTM_COOKIE);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as UtmParams;
  } catch {
    return undefined;
  }
}

/** Returns the full attribution context to attach to a submission. */
export function getTrackingContext(): TrackingContext {
  const partnerCode = getPartnerCode();
  const storedSource = Cookies.get(SOURCE_COOKIE) as LeadSource | undefined;
  const source: LeadSource = storedSource ?? (partnerCode ? 'referral_link' : 'direct');
  return { partnerCode, source, utmParams: getUtmParams() };
}

export function clearTracking(): void {
  Cookies.remove(PARTNER_COOKIE);
  Cookies.remove(SOURCE_COOKIE);
  Cookies.remove(UTM_COOKIE);
}
