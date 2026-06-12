import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';

// Public marketing pages exposed to crawlers. Kept in sync with app/[locale]/*.
// `confidentialite` is intentionally listed (privacy policy aids trust/SEO).
const PATHS = [
  '', // home
  'quiz',
  'classement',
  'campus',
  'temoignages',
  'faq',
  'competition',
  'cours',
  'contact',
  'partenaire',
  'positionnement',
  'alerte',
  'confidentialite',
] as const;

// Emits one entry per page with hreflang alternates for every supported locale,
// so search engines serve the right language per region (Africa/America/Europe).
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: string, path: string) =>
    `${PORTAL_URL}/${locale}${path ? `/${path}` : ''}`;

  return PATHS.map((path) => ({
    url: url(defaultLocale, path),
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, url(locale, path)])),
    },
  }));
}
