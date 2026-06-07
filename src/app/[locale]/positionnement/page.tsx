'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getQuizQuestions, submitQuiz } from '@/lib/erp-client';
import { captureTrackingParams, getTrackingContext } from '@/lib/tracking';
import { Timer, ChevronRight, BookOpen, RotateCcw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { QuizQuestion, QuizAnswer, QuizResult } from '@/types';

const TIMER_SECONDS = 45;
const DEFAULT_CAMPUS = process.env.NEXT_PUBLIC_DEFAULT_CAMPUS_SLUG ?? '';
const PLACEMENT_CATEGORY = 'placement';

type Phase = 'start' | 'playing' | 'result';

export default function PlacementPage() {
  const t = useTranslations('placement');
  const locale = useLocale();
  const searchParams = useSearchParams();

  const campusSlug = searchParams.get('campus') ?? DEFAULT_CAMPUS;

  const [phase, setPhase] = useState<Phase>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    captureTrackingParams(searchParams);
  }, [searchParams]);

  const submitPlacement = useCallback(
    async (finalAnswers: QuizAnswer[]) => {
      const answered = finalAnswers.filter((a) => a.selectedIndex >= 0);
      const { partnerCode: code, source } = getTrackingContext();
      try {
        const res = await submitQuiz({
          campusSlug,
          sessionToken: `placement-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          category: PLACEMENT_CATEGORY,
          answers: answered,
          partnerCode: code,
          source,
        });
        setResult(res);
      } catch {
        setError(t('submit_error'));
      } finally {
        setPhase('result');
      }
    },
    [campusSlug, t],
  );

  const nextQuestion = useCallback(() => {
    const q = questions[current];
    const newAnswers: QuizAnswer[] = [
      ...answers,
      { questionId: q._id, selectedIndex: selected ?? -1 },
    ];
    setAnswers(newAnswers);
    setSelected(null);
    setTimeLeft(TIMER_SECONDS);

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      submitPlacement(newAnswers);
    }
  }, [current, questions, selected, answers, submitPlacement]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { nextQuestion(); return; }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, nextQuestion]);

  const startTest = async () => {
    if (!campusSlug) { setError(t('no_questions')); return; }
    setLoading(true);
    setError('');
    try {
      const data = await getQuizQuestions(campusSlug, PLACEMENT_CATEGORY, locale as 'fr' | 'en', 8);
      if (!data.questions.length) { setError(t('no_questions')); setLoading(false); return; }
      setQuestions(data.questions);
      setCurrent(0);
      setAnswers([]);
      setSelected(null);
      setTimeLeft(TIMER_SECONDS);
      setResult(null);
      setError('');
      setPhase('playing');
    } catch {
      setError(t('submit_error'));
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setPhase('start');
    setQuestions([]);
    setResult(null);
    setAnswers([]);
    setCurrent(0);
    setError('');
  };

  if (loading) return <LoadingSpinner label={t('loading')} />;

  if (phase === 'start') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <BookOpen className="w-16 h-16 text-[#0f2d5e] mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('title')}</h1>
        <p className="text-gray-500 mb-8">{t('subtitle')}</p>
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-600 mb-6">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}
        <button
          onClick={startTest}
          className="bg-[#0f2d5e] text-white font-bold px-10 py-3 rounded-full hover:bg-[#0a2347] transition-colors"
        >
          {t('start')}
        </button>
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

  // Result phase
  if (error && !result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <p className="text-gray-600 mb-8">{error}</p>
        <button
          onClick={restart}
          className="inline-flex items-center gap-2 border-2 border-[#0f2d5e] text-[#0f2d5e] font-semibold px-6 py-3 rounded-full hover:bg-[#0f2d5e]/5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> {t('play_again')}
        </button>
      </div>
    );
  }

  const program = result?.recommendedProgram;
  const registerHref = `/${locale}#inscription${program ? `?program=${encodeURIComponent(program)}` : ''}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <BookOpen className="w-16 h-16 text-[#0f2d5e] mx-auto mb-4" />
      <h2 className="text-3xl font-extrabold text-[#0f2d5e] mb-2">{t('result_title')}</h2>
      <p className="text-gray-500 mb-6">{t('result_subtitle')}</p>

      {program ? (
        <div className="bg-[#0f2d5e]/5 rounded-2xl p-8 mb-8">
          <p className="text-2xl font-black text-[#0f2d5e]">{program}</p>
          {result && (
            <p className="text-sm text-gray-500 mt-2">
              {t('score_result', { correct: result.correctAnswers, total: result.totalQuestions })}
            </p>
          )}
        </div>
      ) : (
        result && (
          <p className="text-gray-600 mb-6">
            {t('score_result', { correct: result.correctAnswers, total: result.totalQuestions })}
          </p>
        )
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {program && (
          <Link
            href={registerHref}
            className="bg-yellow-400 text-[#0f2d5e] font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
          >
            {t('register_cta', { program })}
          </Link>
        )}
        <button
          onClick={restart}
          className="inline-flex items-center gap-2 border-2 border-[#0f2d5e] text-[#0f2d5e] font-semibold px-6 py-3 rounded-full hover:bg-[#0f2d5e]/5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> {t('play_again')}
        </button>
      </div>

      {!program && (
        <Link
          href={`/${locale}#inscription`}
          className="block mt-6 text-center bg-[#0f2d5e] text-white font-bold px-8 py-3 rounded-full hover:bg-[#0a2347] transition-colors max-w-xs mx-auto"
        >
          {t('register_cta', { program: '' }).replace(' ', '').trim() || '→'}
        </Link>
      )}
    </div>
  );
}
