import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BookOpen, Users, TrendingUp, Building } from 'lucide-react';
import { getCampuses, getPrograms } from '@/lib/erp-client';
import { resolveCampus } from '@/lib/campus';
import { withReferralCode } from '@/lib/whatsapp';
import PreRegisterForm from '@/components/forms/PreRegisterForm';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import type { CampusInfo, CampusStats } from '@/types';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '';

// ── Dynamic metadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'home' });

  let campusName = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AcadERP';
  try {
    const campus = await resolveCampus(ref, slug);
    campusName = campus.campusName;
  } catch {
    /* Unknown campus — fall back to the generic brand title. */
  }

  return {
    title: `${campusName} — ${t('cta_register')}`,
    description: t('hero_subtitle'),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type StatItem = { icon: typeof Users; label: string; value: string };

/**
 * Builds the home credibility counters from the campus stats returned by the ERP.
 * Falls back to representative defaults when a campus has not configured them yet,
 * so the section never renders empty.
 */
function buildStats(
  stats: CampusStats | undefined,
  locale: string,
  labels: { students: string; placement: string; partners: string },
): StatItem[] {
  const students = stats?.studentsTrained ?? 2000;
  const placement = stats?.placementRate ?? 85;
  const partners = stats?.partnerCompanies ?? 120;
  const number = (value: number) => value.toLocaleString(locale);

  return [
    { icon: Users, label: labels.students, value: `${number(students)}+` },
    { icon: TrendingUp, label: labels.placement, value: `${placement}%` },
    { icon: Building, label: labels.partners, value: `${number(partners)}+` },
  ];
}

// ── Page ────────────────────────────────────────────────────────────────────

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string; program?: string }>;
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params;
  const { ref, slug, program } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tr = await getTranslations({ locale, namespace: 'register' });

  const defaultSlug = process.env.DEFAULT_CAMPUS_SLUG ?? '';

  // Direct visit (no ?ref / ?slug): if the establishment has several campuses,
  // show the selection page first (spec §3.4).
  if (!ref && !slug) {
    let multiCampus = false;
    try {
      multiCampus = (await getCampuses()).length > 1;
    } catch {
      // ERP unavailable — skip selection and fall back to the default campus.
    }
    // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
    if (multiCampus) redirect(`/${locale}/campus`);
  }

  let campus: CampusInfo | null = null;
  let programs: string[] = [];

  try {
    campus = await resolveCampus(ref, slug);
    programs = (await getPrograms(campus.campusSlug)).programs;
  } catch {
    // ERP unavailable — render a graceful, non-blocking fallback.
  }

  const partnerCode = campus?.partnerCode ?? (ref ? ref.toUpperCase() : undefined);
  // Carry the resolved campus slug into the quiz so partner-driven visitors get
  // their campus's questions/leaderboard, not the default one (campus isolation, spec §8.1).
  const quizHref = withReferralCode(
    `/${locale}/quiz${campus ? `?campus=${encodeURIComponent(campus.campusSlug)}` : ''}`,
    partnerCode,
  );
  const sharePortalMessage = t('share_portal_message', {
    url: withReferralCode(PORTAL_URL, partnerCode),
  });
  const stats = buildStats(campus?.stats, locale, {
    students: t('students_trained'),
    placement: t('placement_rate'),
    partners: t('partner_companies'),
  });

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#0f2d5e] to-[#1a4a8f] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {campus?.logoUrl && (
            <Image
              src={campus.logoUrl}
              alt={campus.campusName}
              width={160}
              height={64}
              className="h-16 w-auto mx-auto mb-6 object-contain"
              unoptimized
            />
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            {campus?.campusName && (
              <>
                {campus.campusName}
                <br />
              </>
            )}
            <span className="text-yellow-400">{t('hero_title')}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">{t('hero_subtitle')}</p>
          {campus?.nextBatchDate && (
            <p className="text-sm text-yellow-300 mb-8">
              {t('next_batch')}{' '}
              <strong>
                {new Date(campus.nextBatchDate).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#inscription"
              className="bg-yellow-400 text-[#0f2d5e] font-bold px-8 py-4 rounded-full hover:bg-yellow-300 transition-colors text-lg"
            >
              {t('cta_register')}
            </a>
            <Link
              href={quizHref}
              className="border-2 border-white/60 text-white font-bold px-8 py-4 rounded-full hover:border-white hover:bg-white/10 transition-colors text-lg"
            >
              {t('cta_quiz')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pre-registration form ── */}
      <section id="inscription" className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{tr('title')}</h2>
          <p className="text-center text-gray-500 mb-8">{tr('subtitle')}</p>
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
              <PreRegisterForm
                programs={programs}
                campusSlug={campus?.campusSlug ?? defaultSlug}
                partnerCodeProp={partnerCode}
                defaultProgram={program}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-[#0f2d5e]/10 rounded-full flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#0f2d5e]" />
              </div>
              <p className="text-3xl font-extrabold text-[#0f2d5e]">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quiz CTA ── */}
      <section className="py-16 bg-yellow-50 border-t border-yellow-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-gray-900">{t('quiz_section_title')}</h2>
          <p className="text-gray-600 mb-6">{t('quiz_section_subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={quizHref}
              className="bg-[#0f2d5e] text-white font-bold px-8 py-3 rounded-full hover:bg-[#0a2347] transition-colors"
            >
              {t('cta_quiz')}
            </Link>
            <WhatsAppButton message={sharePortalMessage} label={t('share_portal')} source="home_quiz_cta" />
          </div>
        </div>
      </section>
    </div>
  );
}
