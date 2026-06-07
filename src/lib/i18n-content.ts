import type { Bilingual } from '@/types';

/**
 * Picks the right language for ERP-provided bilingual content ({fr, en}).
 *
 * The ERP only stores French and English for dynamic content (testimonials, FAQ,
 * prizes, course previews). For any other portal locale we fall back to French,
 * which is the establishment's primary language (spec §5.3).
 */
export function pickLang(content: Bilingual | undefined | null, locale: string): string {
  if (!content) return '';
  return locale === 'en' && content.en ? content.en : content.fr;
}
