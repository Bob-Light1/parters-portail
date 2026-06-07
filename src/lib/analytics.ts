'use client';

/**
 * Lightweight analytics wrapper around Plausible (spec §5.4).
 *
 * Plausible is loaded only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set (see the
 * locale layout), so `track()` is a safe no-op in development or when analytics
 * are disabled. UTM parameters are captured automatically by the Plausible
 * script from the page URL.
 */

export type AnalyticsEvent =
  | 'quiz_started'
  | 'quiz_completed'
  | 'pre_register_submitted'
  | 'whatsapp_share_clicked'
  | 'partner_application_submitted';

type PlausibleFn = (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  plausible?.(event, props ? { props } : undefined);
}
