import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { MapPin, ChevronRight } from 'lucide-react';
import { getCampuses } from '@/lib/erp-client';
import type { Metadata } from 'next';
import type { CampusSummary } from '@/types';

export const revalidate = 300;

interface CampusPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CampusPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'campus_select' });
  return { title: t('title') };
}

export default async function CampusSelectionPage({ params }: CampusPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'campus_select' });

  let campuses: CampusSummary[] = [];
  try {
    campuses = await getCampuses();
  } catch {
    // Leave the list empty — the fallback message below is shown.
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-center text-[#0f2d5e] mb-2">{t('title')}</h1>
      <p className="text-center text-gray-500 mb-10">{t('subtitle')}</p>

      {campuses.length === 0 ? (
        <p className="text-center text-gray-400">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {campuses.map((campus) => (
            <Link
              key={campus.campusSlug}
              href={`/${locale}?slug=${encodeURIComponent(campus.campusSlug)}`}
              className="group bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-[#0f2d5e] hover:shadow-md transition-all"
            >
              {campus.logoUrl ? (
                <Image
                  src={campus.logoUrl}
                  alt={campus.campusName}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-contain flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#0f2d5e]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[#0f2d5e]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{campus.campusName}</p>
                {(campus.city || campus.country) && (
                  <p className="text-sm text-gray-500 truncate">
                    {[campus.city, campus.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#0f2d5e] transition-colors rtl:rotate-180" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
