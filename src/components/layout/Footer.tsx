import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

/** Establishment brand shown in the navbar and footer. */
const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AcadERP';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-[#0f2d5e] text-white/80 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <p className="font-medium">{t('tagline')}</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href={`/${locale}/faq`} className="hover:text-white transition-colors">{t('faq')}</Link>
          <Link href={`/${locale}/temoignages`} className="hover:text-white transition-colors">{t('testimonials')}</Link>
          <Link href={`/${locale}/confidentialite`} className="hover:text-white transition-colors">{t('privacy')}</Link>
          <Link href={`/${locale}#inscription`} className="hover:text-white transition-colors">{t('contact')}</Link>
          <Link href={`/${locale}#inscription`} className="hover:text-white transition-colors">{t('partner')}</Link>
        </div>
        <p className="text-white/40 text-xs">© {new Date().getFullYear()} {BRAND}</p>
      </div>
    </footer>
  );
}
