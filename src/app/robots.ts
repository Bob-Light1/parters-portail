import type { MetadataRoute } from 'next';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';

// SEO is a core selling point of the portal (spec §2.2, §5.1). The API proxy
// routes carry no indexable content, so they are disallowed; everything else
// (the localized marketing pages) is open to crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${PORTAL_URL}/sitemap.xml`,
  };
}
