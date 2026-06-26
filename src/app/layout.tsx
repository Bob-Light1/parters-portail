import type { Metadata, Viewport } from 'next';
import './globals.css';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AcadERP';
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';
const DESCRIPTION = 'Join the next generation of professionals.';

// The <html>/<body> tags and locale handling live in app/[locale]/layout.tsx.
// This root layout provides global styles and default metadata. Open Graph and
// Twitter cards are defined here so that every partner-shared link (the viral
// loop, spec §6.2) renders a rich, branded preview on WhatsApp/Facebook/X.
export const metadata: Metadata = {
  metadataBase: new URL(PORTAL_URL),
  title: {
    default: BRAND,
    template: `%s — ${BRAND}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND,
  appleWebApp: { capable: true, title: BRAND, statusBarStyle: 'default' },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: BRAND,
    title: BRAND,
    description: DESCRIPTION,
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: BRAND }],
  },
  twitter: {
    card: 'summary',
    title: BRAND,
    description: DESCRIPTION,
    images: ['/icon-512.png'],
  },
  // Generic (non-Apple) install hint. Apple's is emitted via `appleWebApp`.
  other: { 'mobile-web-app-capable': 'yes' },
};

// `themeColor` belongs in the viewport export (App Router idiom). Expressing it
// here — rather than as a raw <meta> in a hand-written <head> — lets Next.js own
// the document head, which keeps the global CSS <link> insertion intact and
// avoids the dev-only "preloaded but not used" warning on client navigation.
export const viewport: Viewport = {
  themeColor: '#0f2d5e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
