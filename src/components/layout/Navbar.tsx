'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

/** Establishment brand shown in the navbar and footer. */
const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AcadERP';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/quiz`, label: t('quiz') },
    { href: `/${locale}/classement`, label: t('leaderboard') },
    { href: `/${locale}/competition`, label: t('competition') },
    { href: `/${locale}/temoignages`, label: t('testimonials') },
    { href: `/${locale}/cours`, label: t('courses') },
    { href: `/${locale}/faq`, label: t('faq') },
  ];

  return (
    <nav className="bg-[#0f2d5e] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="w-6 h-6" />
          <span>{BRAND}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-yellow-300 transition-colors">
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
          <Link
            href={`/${locale}#inscription`}
            className="bg-yellow-400 text-[#0f2d5e] px-4 py-2 rounded-full font-bold hover:bg-yellow-300 transition-colors"
          >
            {t('register_cta')}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <button
            className="p-2 rounded"
            onClick={() => setOpen(!open)}
            aria-label={t('menu')}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0a2347] px-4 pb-4 flex flex-col gap-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 border-b border-white/10 hover:text-yellow-300"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={`/${locale}#inscription`}
            onClick={() => setOpen(false)}
            className="mt-2 bg-yellow-400 text-[#0f2d5e] text-center py-2 rounded-full font-bold"
          >
            {t('register_cta')}
          </Link>
        </div>
      )}
    </nav>
  );
}
