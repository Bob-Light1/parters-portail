import { getTranslations } from 'next-intl/server';
import { Bell } from 'lucide-react';
import { resolveCampus } from '@/lib/campus';
import AlertForm from '@/components/forms/AlertForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'alert' });
  return { title: t('title') };
}

export default async function AlertePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'alert' });

  let campusSlug: string | undefined;
  let programs: string[] = [];
  try {
    const campus = await resolveCampus(ref, slug);
    campusSlug = campus.campusSlug;
    programs = campus.programs ?? [];
  } catch {
    /* No campus resolved — form works without programs list. */
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Bell className="w-14 h-14 text-[#0f2d5e] mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <AlertForm campusSlug={campusSlug} programs={programs} />
      </div>
    </div>
  );
}
