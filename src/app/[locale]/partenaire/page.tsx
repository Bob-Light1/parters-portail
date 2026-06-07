import { getTranslations } from 'next-intl/server';
import { Handshake } from 'lucide-react';
import { resolveCampus } from '@/lib/campus';
import PartnerApplicationForm from '@/components/forms/PartnerApplicationForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partner_apply' });
  return { title: t('title') };
}

export default async function PartenairePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'partner_apply' });

  let campusSlug: string | undefined;
  try {
    const campus = await resolveCampus(ref, slug);
    campusSlug = campus.campusSlug;
  } catch {
    /* No campus resolved — application works without it. */
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Handshake className="w-14 h-14 text-[#0f2d5e] mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <PartnerApplicationForm campusSlug={campusSlug} />
      </div>
    </div>
  );
}
