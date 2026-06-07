'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getQuizQuestions, submitQuiz } from '@/lib/erp-client';
import { captureTrackingParams, getTrackingContext } from '@/lib/tracking';
import { withReferralCode } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import QuizBadge from '@/components/badge/QuizBadge';
import { Timer, ChevronRight, Trophy, RotateCcw, AlertCircle, Users } from 'lucide-react';
import type { QuizQuestion, QuizResult, QuizAnswer } from '@/types';
import Link from 'next/link';

const TIMER_SECONDS = 30;
const DEFAULT_CAMPUS = process.env.NEXT_PUBLIC_DEFAULT_CAMPUS_SLUG ?? '';
const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AcadERP';

const CATEGORIES = ['web', 'accounting', 'marketing', 'general'] as const;

type Phase = 'pick' | 'playing' | 'identify' | 'result';

export default function QuizPage() {
  const t = useTranslations('quiz');
  const tb = useTranslations('badge');
  const tc = useTranslations('challenge');
  const locale = useLocale();
  const searchParams = useSearchParams();

  const campusSlug = searchParams.get('campus') ?? DEFAULT_CAMPUS;
  const initialCategory = searchParams.get('category') ?? '';

  const [phase, setPhase] = useState<Phase>('pick');
  const [category, setCategory] = useState(initialCategory);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [error, setError] = useState('');
  const [partnerCode, setPartnerCode] = useState<string | undefined>(undefined);
  // Optional identity collected before submission so the player can appear on the
  // leaderboard under a pseudonym instead of "Anonyme" (spec §4.3).
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [pendingAnswers, setPendingAnswers] = useState<QuizAnswer[]>([]);

  // Capture partner/UTM attribution on arrival and read the persisted partnerCode.
  useEffect(() => {
    captureTrackingParams(searchParams);
    setPartnerCode(getTrackingContext().partnerCode);
  }, [searchParams]);

  // ── Quiz flow ──────────────────────────────────────────────────────────────

  const finishQuiz = useCallback(
    async (finalAnswers: QuizAnswer[]) => {
      const answered = finalAnswers.filter((a) => a.selectedIndex >= 0);
      const { partnerCode: code, source } = getTrackingContext();
      try {
        const res = await submitQuiz({
          campusSlug,
          sessionToken: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          category,
          answers: answered,
          displayName: displayName.trim() || undefined,
          city: city.trim() || undefined,
          partnerCode: code,
          source,
        });
        setResult(res);
        setSubmitFailed(false);
        track('quiz_completed', { category, score: res.score });
      } catch {
        // The score is computed only by the ERP, so we never fabricate one here.
        setSubmitFailed(true);
      } finally {
        setPhase('result');
      }
    },
    [campusSlug, category, displayName, city],
  );

  const nextQuestion = useCallback(() => {
    const currentQuestion = questions[current];
    const newAnswers: QuizAnswer[] = [
      ...answers,
      { questionId: currentQuestion._id, selectedIndex: selected ?? -1 },
    ];
    setAnswers(newAnswers);
    setSelected(null);
    setTimeLeft(TIMER_SECONDS);

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      // Hold the answers and ask for an optional pseudonym/city before submitting.
      setPendingAnswers(newAnswers);
      setPhase('identify');
    }
  }, [current, questions, selected, answers]);

  // Per-question countdown; auto-advances when it reaches zero.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      nextQuestion();
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, nextQuestion]);

  const startQuiz = async (cat: string) => {
    if (!campusSlug) {
      setError(t('campus_not_configured'));
      return;
    }
    setLoading(true);
    setError('');
    setCategory(cat);
    track('quiz_started', { category: cat });
    try {
      const data = await getQuizQuestions(campusSlug, cat, locale as 'fr' | 'en', 10);
      if (!data.questions.length) {
        setError(t('no_questions'));
        return;
      }
      setQuestions(data.questions);
      setCurrent(0);
      setAnswers([]);
      setSelected(null);
      setTimeLeft(TIMER_SECONDS);
      setSubmitFailed(false);
      setResult(null);
      setPhase('playing');
    } catch {
      setError(t('submit_error'));
    } finally {
      setLoading(false);
    }
  };

  // Submit from the identity step; the spinner shows while the ERP computes the score.
  const submitWithIdentity = async () => {
    setLoading(true);
    await finishQuiz(pendingAnswers);
    setLoading(false);
  };

  const restart = () => {
    setPhase('pick');
    setQuestions([]);
    setResult(null);
    setSubmitFailed(false);
    setAnswers([]);
    setPendingAnswers([]);
    setCurrent(0);
    setError('');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner label={t('loading')} />;

  if (phase === 'pick') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-center text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-center text-gray-500 mb-10">{t('subtitle')}</p>

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        <p className="text-sm font-semibold text-gray-700 mb-3 text-center">{t('choose_category')}</p>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((key) => (
            <button
              key={key}
              onClick={() => startQuiz(key)}
              className="bg-white border-2 border-[#0f2d5e]/20 rounded-2xl p-5 text-center hover:border-[#0f2d5e] hover:shadow-md transition-all font-semibold text-[#0f2d5e]"
            >
              {t(`categories.${key}`)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const question = questions[current];
    const progress = (current / questions.length) * 100;
    const isLast = current + 1 >= questions.length;
    const timerColor = timeLeft <= 10 ? 'text-red-500' : 'text-[#0f2d5e]';

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {t('question_of', { current: current + 1, total: questions.length })}
          </span>
          <span className={`flex items-center gap-1 font-bold text-lg ${timerColor}`}>
            <Timer className="w-4 h-4" />
            {t('time_left', { seconds: timeLeft })}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div className="bg-[#0f2d5e] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <p className="text-lg font-semibold text-gray-900 mb-6">{question.text}</p>
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`w-full text-start px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium
                  ${selected === idx
                    ? 'border-[#0f2d5e] bg-[#0f2d5e]/10 text-[#0f2d5e]'
                    : 'border-gray-200 hover:border-[#0f2d5e]/50 text-gray-700'
                  }`}
              >
                <span className="font-bold me-2">{String.fromCharCode(65 + idx)}.</span> {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={nextQuestion}
          className="w-full bg-[#0f2d5e] text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#0a2347] transition-colors"
        >
          {isLast ? t('finish') : <>{t('next')} <ChevronRight className="w-5 h-5" /></>}
        </button>
      </div>
    );
  }

  // ── Identity phase (optional pseudonym/city before submitting) ─────────────────

  if (phase === 'identify') {
    const fieldClass =
      'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 ' +
      'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] focus:border-transparent';
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-center text-[#0f2d5e] mb-2">{t('identify_title')}</h2>
        <p className="text-center text-gray-500 text-sm mb-8">{t('identify_subtitle')}</p>
        <form
          onSubmit={(e) => { e.preventDefault(); submitWithIdentity(); }}
          className="bg-white rounded-2xl shadow-md p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('display_name_label')}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder={t('display_name_ph')}
              className={fieldClass}
              autoComplete="nickname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('city_label')}</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={40}
              placeholder={t('city_ph')}
              className={fieldClass}
              autoComplete="address-level2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#0f2d5e] text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#0a2347] transition-colors"
          >
            {t('see_score')} <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  // ── Result phase ──────────────────────────────────────────────────────────────

  if (submitFailed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <p className="text-gray-600 mb-8">{t('submit_error')}</p>
        <button
          onClick={restart}
          className="inline-flex items-center gap-2 border-2 border-[#0f2d5e] text-[#0f2d5e] font-semibold px-6 py-3 rounded-full hover:bg-[#0f2d5e]/5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> {t('play_again')}
        </button>
      </div>
    );
  }

  const score = result?.score ?? 0;
  const portalUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = withReferralCode(`${portalUrl}/${locale}/quiz`, partnerCode);
  const shareMessage = t('share_message', {
    score,
    category: t(`categories.${category}` as `categories.${string}`),
    url: shareUrl,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <Trophy className={`w-20 h-20 mx-auto mb-4 ${score >= 70 ? 'text-yellow-400' : 'text-gray-400'}`} />
      <h2 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('score_title')}</h2>
      <p className="text-6xl font-black text-[#0f2d5e] my-6">
        {score}
        <span className="text-2xl text-gray-400">/100</span>
      </p>
      <p className="text-gray-500 mb-8">
        {t('score_result', { correct: result?.correctAnswers ?? 0, total: result?.totalQuestions ?? 0 })}
      </p>

      {/* Challenge a friend (spec §4.3/4.4) — the shared link carries the partnerCode. */}
      <div className="bg-[#0f2d5e]/5 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 text-[#0f2d5e] font-bold mb-1">
          <Users className="w-5 h-5" /> {tc('title')}
        </div>
        <p className="text-sm text-gray-500 mb-4">{tc('subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <WhatsAppButton message={shareMessage} label={tc('share_whatsapp')} source="quiz_challenge" size="lg" />
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 border-2 border-[#0f2d5e] text-[#0f2d5e] font-semibold px-6 py-3 rounded-full hover:bg-[#0f2d5e]/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> {t('play_again')}
          </button>
        </div>
      </div>

      {/* Shareable digital badge (spec §4.10) */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[#0f2d5e] mb-4">{tb('title')}</h3>
        <QuizBadge
          brand={BRAND}
          score={score}
          category={t(`categories.${category}` as `categories.${string}`)}
          name={displayName.trim() || tb('participant')}
          partnerCode={partnerCode}
          shareMessage={shareMessage}
          labels={{
            title: tb('title'),
            download: tb('download'),
            share: tb('share'),
          }}
        />
      </div>

      <Link
        href={`/${locale}#inscription`}
        className="block text-center bg-yellow-400 text-[#0f2d5e] font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors max-w-xs mx-auto"
      >
        {t('register_cta')} →
      </Link>
    </div>
  );
}
