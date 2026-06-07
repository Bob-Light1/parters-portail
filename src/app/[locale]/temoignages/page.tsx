import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Quote, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { resolveCampus } from '@/lib/campus';
import { getTestimonials } from '@/lib/erp-client';
import { pickLang } from '@/lib/i18n-content';
import type { Metadata } from 'next';
import type { Testimonial } from '@/types';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'testimonials' });
  return { title: t('title') };
}

export default async function TestimonialsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'testimonials' });

  let testimonials: Testimonial[] = [];
  try {
    const campus = await resolveCampus(ref, slug);
    testimonials = await getTestimonials(campus.campusSlug, 12);
  } catch {
    /* ERP unavailable — render the empty state below. */
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <Quote className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      {testimonials.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((item) => (
            <article key={item._id} className="bg-white rounded-2xl shadow-md p-6 flex flex-col">
              <p className="text-gray-700 italic mb-5 flex-1">“{pickLang(item.quote, locale)}”</p>
              <div className="flex items-center gap-4">
                {item.photoUrl ? (
                  <Image
                    src={item.photoUrl}
                    alt={item.firstName}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#0f2d5e]/10 flex items-center justify-center text-[#0f2d5e] font-bold text-lg">
                    {item.firstName.charAt(0)}
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-bold text-[#0f2d5e]">{item.firstName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500 text-xs mt-0.5">
                    {item.city && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.city}</span>
                    )}
                    {item.program && (
                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {item.program}</span>
                    )}
                    {item.graduationYear && (
                      <span>{t('promo', { year: item.graduationYear })}</span>
                    )}
                    {item.employer && (
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {item.employer}</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link
          href={`/${locale}#inscription`}
          className="inline-block bg-yellow-400 text-[#0f2d5e] font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
        >
          {t('cta')} →
        </Link>
      </div>
    </div>
  );
}
