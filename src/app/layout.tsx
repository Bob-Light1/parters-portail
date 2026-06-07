import type { Metadata } from 'next';
import './globals.css';

// The <html>/<body> tags and locale handling live in app/[locale]/layout.tsx.
// This root layout only provides global styles and default metadata.
export const metadata: Metadata = {
  title: 'Pre-registration Portal',
  description: 'Join the next generation of professionals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
