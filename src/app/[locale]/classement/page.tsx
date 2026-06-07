import { getTranslations } from 'next-intl/server';
import { getLeaderboard } from '@/lib/erp-client';
import { resolveCampus } from '@/lib/campus';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import AutoRefresh from '@/components/leaderboard/AutoRefresh';
import { Trophy, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { LeaderboardEntry } from '@/types';

export const revalidate = 60;

interface ClassementPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ campus?: string; ref?: string; slug?: string }>;
}

export async function generateMetadata({ params }: ClassementPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });
  return { title: t('title') };
}

export default async function ClassementPage({ params, searchParams }: ClassementPageProps) {
  const { locale } = await params;
  const { campus, ref, slug } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });

  let campusEntries: LeaderboardEntry[] = [];
  let nationalEntries: LeaderboardEntry[] = [];
  let fetchError = false;

  try {
    // Prefer an explicit campus slug; otherwise resolve it from the partner code
    // (?ref=) or ?slug= so partner-driven visitors see their own campus ranking.
    const campusSlug = campus ?? (await resolveCampus(ref, slug)).campusSlug;
    const data = await getLeaderboard(campusSlug);
    campusEntries = data.campus ?? [];
    nationalEntries = data.national ?? [];
  } catch {
    fetchError = true;
  }

  const labels = {
    participant: t('col_participant'),
    score: t('col_score'),
    category: t('col_category'),
    empty: t('empty'),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {!fetchError && <AutoRefresh />}

      {/* Header */}
      <div className="text-center mb-12">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-2">
          <RefreshCw className="w-3 h-3" /> {t('refreshed_every_minute')}
        </p>
      </div>

      {fetchError ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">{t('unavailable')}</p>
          <Link
            href={`/${locale}/quiz`}
            className="inline-block bg-[#0f2d5e] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#0a2347] transition-colors"
          >
            {t('play_to_appear')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <LeaderboardTable entries={campusEntries} title={t('campus_leaderboard')} labels={labels} />
            <LeaderboardTable entries={nationalEntries} title={t('national_leaderboard')} labels={labels} />
          </div>

          <div className="mt-12 text-center">
            <Link
              href={`/${locale}/quiz`}
              className="inline-block bg-yellow-400 text-[#0f2d5e] font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
            >
              {t('play_to_appear')} →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
