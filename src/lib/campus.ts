import { getCampusByRef, getCampusBySlug } from './erp-client';
import type { CampusInfo } from '@/types';

/**
 * Resolves the active campus for a public page from the `?ref=` (partner code) or
 * `?slug=` query, falling back to DEFAULT_CAMPUS_SLUG for direct visits.
 *
 * Mirrors the resolution used on the home page (spec §3.4) so every Phase 2 section
 * (testimonials, FAQ, competition, course previews) targets the same campus.
 */
export async function resolveCampus(ref?: string, slug?: string): Promise<CampusInfo> {
  const defaultSlug = process.env.DEFAULT_CAMPUS_SLUG ?? '';
  return ref ? getCampusByRef(ref) : getCampusBySlug(slug ?? defaultSlug);
}
