'use client';

/**
 * Language switcher.
 *
 * Replaces the leading locale segment of the current path and preserves the
 * query string — this keeps the partner tracking parameter (`?ref=CODE`) intact
 * when the visitor changes language.
 */

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { locales, localeLabels, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const activeLocale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function switchTo(locale: Locale) {
    setOpen(false);
    if (locale === activeLocale) return;

    // Swap the first path segment (the locale) and keep the rest of the path.
    const segments = pathname.split('/');
    segments[1] = locale;
    const query = searchParams.toString();
    router.push(`${segments.join('/')}${query ? `?${query}` : ''}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('switch')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-white/10 transition-colors text-sm font-medium"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{activeLocale}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 mt-2 w-44 max-h-72 overflow-auto bg-white text-gray-900 rounded-xl shadow-lg ring-1 ring-black/5 py-1 z-50"
        >
          {locales.map((locale) => (
            <li key={locale} role="option" aria-selected={locale === activeLocale}>
              <button
                type="button"
                onClick={() => switchTo(locale)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                <span>{localeLabels[locale]}</span>
                {locale === activeLocale && <Check className="w-4 h-4 text-[#0f2d5e]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
