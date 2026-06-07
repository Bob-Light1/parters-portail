import { getTranslations } from 'next-intl/server';
import { HelpCircle } from 'lucide-react';
import { resolveCampus } from '@/lib/campus';
import { getFaq } from '@/lib/erp-client';
import { pickLang } from '@/lib/i18n-content';
import FaqAccordion, { type FaqItem } from '@/components/faq/FaqAccordion';
import type { Metadata } from 'next';
import type { FaqEntry } from '@/types';

// FAQ is cached 24h on the portal side (spec §4.11). getFaq() requests the ERP
// with revalidate 86400; this page reuses the same cadence.
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  return { title: t('title') };
}

export default async function FaqPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'faq' });

  let entries: FaqEntry[] = [];
  try {
    const campus = await resolveCampus(ref, slug);
    entries = await getFaq(campus.campusSlug);
  } catch {
    /* ERP unavailable — render the empty state below. */
  }

  const items: FaqItem[] = entries.map((e) => ({
    id: e._id,
    question: pickLang(e.question, locale),
    answer: pickLang(e.answer, locale),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <HelpCircle className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{t('empty')}</p>
      ) : (
        <FaqAccordion items={items} />
      )}
    </div>
  );
}
