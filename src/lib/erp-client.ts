/**
 * erp-client.ts — calls to the academic ERP.
 *
 * SERVER-ONLY functions (Server Components, Route Handlers):
 *   getCampusByRef, getCampusBySlug, getPrograms, getLeaderboard
 *   → use ERP_API_URL + PORTAL_API_KEY (server-side env vars).
 *
 * CLIENT-SAFE functions (Client Components):
 *   getQuizQuestions, submitQuiz, postPreRegister
 *   → go through the Next.js API routes (/api/quiz, /api/pre-register),
 *     which proxy server-side and keep PORTAL_API_KEY secret.
 */

import type {
  CampusInfo,
  CampusSummary,
  PreRegisterPayload,
  QuizQuestion,
  QuizSubmitPayload,
  QuizResult,
  LeaderboardData,
  LeaderboardResponse,
  Testimonial,
  FaqEntry,
  Competition,
  CoursePreview,
  ApiSuccess,
} from '@/types';

const ERP_BASE_URL = process.env.ERP_API_URL ?? '';
const PORTAL_KEY   = process.env.PORTAL_API_KEY ?? '';

// ── Internal fetch (server only) ──────────────────────────────────────────────

async function erpFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ERP_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Portal-Key': PORTAL_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as { message?: string }).message ?? res.statusText;
    const err = new Error(message);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return ((await res.json()) as ApiSuccess<T>).data;
}

// ── Client-safe fetch (goes through the Next.js API routes) ──────────────────

async function portalFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = typeof window !== 'undefined'
    ? ''
    : process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000';

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as { message?: string }).message ?? res.statusText;
    const err = new Error(message);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return ((await res.json()) as ApiSuccess<T>).data;
}

// ── Campus (server only) ──────────────────────────────────────────────────────

export async function getCampusByRef(ref: string): Promise<CampusInfo> {
  return erpFetch<CampusInfo>(`/api/public/campus-info?ref=${encodeURIComponent(ref)}`);
}

export async function getCampusBySlug(slug: string): Promise<CampusInfo> {
  return erpFetch<CampusInfo>(
    `/api/public/campus-info?slug=${encodeURIComponent(slug)}`,
    { next: { revalidate: 300 } } as RequestInit,
  );
}

export async function getPrograms(campusSlug: string): Promise<{ campusName: string; programs: string[] }> {
  return erpFetch(
    `/api/public/programs?campusSlug=${encodeURIComponent(campusSlug)}`,
    { next: { revalidate: 300 } } as RequestInit,
  );
}

export async function getCampuses(): Promise<CampusSummary[]> {
  const { campuses } = await erpFetch<{ campuses: CampusSummary[] }>(
    '/api/public/campuses',
    { next: { revalidate: 300 } } as RequestInit,
  );
  return campuses;
}

// ── Testimonials / FAQ / Competition / Courses (server only, Phase 2) ────────

export async function getTestimonials(campusSlug: string, limit = 6): Promise<Testimonial[]> {
  const { testimonials } = await erpFetch<{ testimonials: Testimonial[] }>(
    `/api/public/testimonials?campusSlug=${encodeURIComponent(campusSlug)}&limit=${limit}`,
    { next: { revalidate: 300 } } as RequestInit,
  );
  return testimonials;
}

// FAQ changes rarely — cached 24h on the portal side (spec §4.11).
export async function getFaq(campusSlug: string): Promise<FaqEntry[]> {
  const { entries } = await erpFetch<{ entries: FaqEntry[] }>(
    `/api/public/faq?campusSlug=${encodeURIComponent(campusSlug)}`,
    { next: { revalidate: 86400 } } as RequestInit,
  );
  return entries;
}

export async function getCompetitionPrizes(campusSlug: string): Promise<Competition | null> {
  const { competition } = await erpFetch<{ competition: Competition | null }>(
    `/api/public/competition/prizes?campusSlug=${encodeURIComponent(campusSlug)}`,
    { next: { revalidate: 300 } } as RequestInit,
  );
  return competition;
}

export async function getCoursePreviews(campusSlug: string, program?: string): Promise<CoursePreview[]> {
  const params = new URLSearchParams({ campusSlug });
  if (program) params.set('program', program);
  const { previews } = await erpFetch<{ previews: CoursePreview[] }>(
    `/api/public/course-previews?${params.toString()}`,
    { next: { revalidate: 300 } } as RequestInit,
  );
  return previews;
}

// ── Pre-registration (client-safe → /api/pre-register) ──────────────────────

export async function postPreRegister(payload: PreRegisterPayload): Promise<{ leadId: string; status: string }> {
  return portalFetch('/api/pre-register', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

// ── Quiz (client-safe → /api/quiz) ────────────────────────────────────────────

export async function getQuizQuestions(
  campusSlug: string,
  category: string,
  lang: 'fr' | 'en' = 'fr',
  limit = 10,
): Promise<{ questions: QuizQuestion[]; campusSlug: string; category: string | null; lang: string }> {
  const params = new URLSearchParams({ campusSlug, category, lang, limit: String(limit) });
  return portalFetch(`/api/quiz?${params.toString()}`);
}

export async function submitQuiz(payload: QuizSubmitPayload): Promise<QuizResult> {
  return portalFetch('/api/quiz/submit', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

// ── Leaderboard (server only) ─────────────────────────────────────────────────

export async function getLeaderboard(
  campusSlug: string,
  options?: { period?: string; category?: string },
): Promise<LeaderboardData> {
  const base = new URLSearchParams({ campusSlug, ...(options ?? {}) });
  const fetchOpts = { next: { revalidate: 60 } } as RequestInit;

  const [campusRes, nationalRes] = await Promise.all([
    erpFetch<LeaderboardResponse>(`/api/public/leaderboard?${base}&scope=campus`,   fetchOpts),
    erpFetch<LeaderboardResponse>(`/api/public/leaderboard?${base}&scope=national`, fetchOpts),
  ]);

  return {
    period:   campusRes.period,
    campus:   campusRes.entries   ?? [],
    national: nationalRes.entries ?? [],
  };
}
