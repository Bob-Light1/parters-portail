import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Trophy, Gift, Medal } from 'lucide-react';
import { resolveCampus } from '@/lib/campus';
import { getCompetitionPrizes } from '@/lib/erp-client';
import { pickLang } from '@/lib/i18n-content';
import { withReferralCode } from '@/lib/whatsapp';
import CountdownTimer from '@/components/competition/CountdownTimer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import type { Metadata } from 'next';
import type { Competition } from '@/types';

export const revalidate = 300;

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'competition' });
  return { title: t('title') };
}

export default async function CompetitionPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'competition' });

  let competition: Competition | null = null;
  try {
    const campus = await resolveCampus(ref, slug);
    competition = await getCompetitionPrizes(campus.campusSlug);
  } catch {
    /* ERP unavailable — render the empty state below. */
  }

  // Propagate the partner code across the viral loop (spec §4.4): from ?ref or the
  // 30-day attribution cookie set on arrival.
  const partnerCode = ref?.toUpperCase() ?? (await cookies()).get('pref')?.value;
  const shareUrl = withReferralCode(`${PORTAL_URL}/${locale}/competition`, partnerCode);

  if (!competition) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Trophy className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-400 py-8">{t('no_competition')}</p>
        <Link
          href={`/${locale}/quiz`}
          className="inline-block bg-[#0f2d5e] text-white font-bold px-8 py-3 rounded-full hover:bg-[#0a2347] transition-colors"
        >
          {t('play_cta')} →
        </Link>
      </div>
    );
  }

  const labels = {
    days: t('days'),
    hours: t('hours'),
    minutes: t('minutes'),
    seconds: t('seconds'),
    closed: t('closed'),
  };
  const shareMessage = t('share_message', { url: shareUrl });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle', { period: competition.period })}</p>
      </div>

      {/* Countdown */}
      <div className="mb-12">
        <p className="text-center text-sm font-semibold text-gray-600 mb-4">{t('closes_in')}</p>
        <CountdownTimer closingDate={competition.closingDate} labels={labels} />
      </div>

      {/* Prizes */}
      <h2 className="text-xl font-bold text-[#0f2d5e] mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5" /> {t('prizes_title')}
      </h2>
      <div className="space-y-3 mb-12">
        {competition.prizes.map((prize) => (
          <div
            key={prize.rank}
            className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-black">
              {prize.rank}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{pickLang(prize.description, locale)}</p>
              {prize.value && <p className="text-sm text-gray-500">{prize.value}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Winners (populated after monthly closing) */}
      {competition.winners.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-[#0f2d5e] mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5" /> {t('winners_title')}
          </h2>
          <div className="space-y-2 mb-12">
            {competition.winners.map((w) => (
              <div key={w.rank} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-4 py-2">
                <span className="font-semibold text-[#0f2d5e]">#{w.rank} {w.displayName ?? '—'}</span>
                <span className="text-gray-500">{w.score}/100</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Share + register */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <WhatsAppButton message={shareMessage} label={t('share_whatsapp')} source="competition" size="lg" />
        <Link
          href={`/${locale}#inscription`}
          className="inline-block bg-yellow-400 text-[#0f2d5e] font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
        >
          {t('register_cta')} →
        </Link>
      </div>
    </div>
  );
}
