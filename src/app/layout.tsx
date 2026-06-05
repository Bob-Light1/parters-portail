import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portail de Pré-inscription',
  description: 'Rejoignez la prochaine génération de professionnels.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
