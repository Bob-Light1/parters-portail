import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen, PlayCircle, ArrowRight } from 'lucide-react';
import { resolveCampus } from '@/lib/campus';
import { getCoursePreviews } from '@/lib/erp-client';
import { pickLang } from '@/lib/i18n-content';
import type { Metadata } from 'next';
import type { CoursePreview } from '@/types';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  return { title: t('title') };
}

export default async function CoursesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'courses' });

  let previews: CoursePreview[] = [];
  try {
    const campus = await resolveCampus(ref, slug);
    previews = await getCoursePreviews(campus.campusSlug);
  } catch {
    /* ERP unavailable — render the empty state below. */
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <BookOpen className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      {previews.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{t('empty')}</p>
      ) : (
        <div className="space-y-8">
          {previews.map((preview) => {
            // Pre-fill programInterest on the registration form (spec §4.7).
            const ctaHref = `/${locale}?program=${encodeURIComponent(preview.program)}#inscription`;
            return (
              <article key={preview._id} className="bg-white rounded-2xl shadow-md p-6 md:p-8">
                <span className="inline-block text-xs font-semibold text-[#0f2d5e] bg-[#0f2d5e]/10 px-3 py-1 rounded-full mb-3">
                  {preview.program}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{pickLang(preview.title, locale)}</h2>
                <p className="text-gray-600 whitespace-pre-line mb-5">{pickLang(preview.content, locale)}</p>

                {preview.videoUrl && (
                  <a
                    href={preview.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#0f2d5e] font-semibold text-sm mb-5 hover:underline"
                  >
                    <PlayCircle className="w-5 h-5" /> {t('watch_video')}
                  </a>
                )}

                <Link
                  href={ctaHref}
                  className="flex items-center justify-center gap-2 bg-yellow-400 text-[#0f2d5e] font-bold px-6 py-3 rounded-full hover:bg-yellow-300 transition-colors"
                >
                  {t('cta', { program: preview.program })} <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
