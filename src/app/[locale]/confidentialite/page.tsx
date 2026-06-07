import { getTranslations } from 'next-intl/server';
import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return { title: t('title') };
}

// Section keys rendered in order; each has a `<key>_title` and `<key>_body`.
const SECTIONS = ['data', 'use', 'ip', 'rights', 'sharing'] as const;

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-8 h-8 text-[#0f2d5e]" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e]">{t('title')}</h1>
      </div>
      <p className="text-sm text-gray-400 mb-8">{t('updated')}</p>

      <p className="text-gray-700 leading-relaxed mb-8">{t('intro')}</p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t(`${section}_title`)}</h2>
            <p className="text-gray-700 leading-relaxed">{t(`${section}_body`)}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        {t('contact')}
      </p>
    </div>
  );
}
