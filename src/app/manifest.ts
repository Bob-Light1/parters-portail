import type { MetadataRoute } from 'next';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AcadERP';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND,
    short_name: BRAND,
    description: 'Pre-registration portal',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0f2d5e',
    theme_color: '#0f2d5e',
    categories: ['education'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
