// ── Campus ────────────────────────────────────────────────────────────────────

export interface CampusStats {
  studentsTrained: number | null;
  placementRate: number | null;
  partnerCompanies: number | null;
}

export interface CampusInfo {
  campusSlug: string;
  campusName: string;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  programs: string[];
  nextBatchDate: string | null;
  lang: string;
  stats?: CampusStats;
  partnerCode?: string;
}

export interface CampusSummary {
  campusSlug: string;
  campusName: string;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
}

// ── Pre-registration ──────────────────────────────────────────────────────────

export type LeadSource = 'referral_link' | 'qr_code' | 'manual_code' | 'direct';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface PreRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programInterest?: string;
  country?: string;
  city?: string;
  partnerCode?: string;
  campusSlug?: string;
  source: LeadSource;
  utmParams?: UtmParams;
  honeypot: '';
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  _id: string;
  text: string;
  options: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lang: 'fr' | 'en';
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface QuizSubmitPayload {
  campusSlug: string;
  sessionToken: string;
  category: string;
  answers: QuizAnswer[];
  displayName?: string;
  city?: string;
  country?: string;
  partnerCode?: string;
  source?: LeadSource;
}

export interface QuizResult {
  sessionId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  period: string;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  sessionId: string;
  rank: number;
  displayName: string;
  city: string | null;
  country: string | null;
  score: number;
  category: string;
  completedAt: string;
}

export interface LeaderboardResponse {
  period:     string;
  scope:      'campus' | 'national';
  category:   string | null;
  campusSlug: string | null;
  total:      number;
  entries:    LeaderboardEntry[];
}

export interface LeaderboardData {
  period:   string;
  campus:   LeaderboardEntry[];
  national: LeaderboardEntry[];
}

// ── Bilingual content (Phase 2) ───────────────────────────────────────────────

/** Bilingual string as stored in the ERP. `en` may be null when only French is filled. */
export interface Bilingual {
  fr: string;
  en: string | null;
}

// ── Testimonials (Phase 2) ─────────────────────────────────────────────────────

export interface Testimonial {
  _id: string;
  firstName: string;
  city: string | null;
  graduationYear: number | null;
  program: string | null;
  quote: Bilingual;
  photoUrl: string | null;
  employer: string | null;
}

// ── FAQ (Phase 2) ──────────────────────────────────────────────────────────────

export interface FaqEntry {
  _id: string;
  question: Bilingual;
  answer: Bilingual;
  category: string;
}

// ── Competition (Phase 2) ──────────────────────────────────────────────────────

export interface CompetitionPrizeItem {
  rank: number;
  description: Bilingual;
  value: string | null;
}

export interface CompetitionWinner {
  rank: number;
  displayName: string | null;
  score: number;
}

export interface Competition {
  period: string;
  prizes: CompetitionPrizeItem[];
  closingDate: string;
  winners: CompetitionWinner[];
}

// ── Course previews (Phase 2) ──────────────────────────────────────────────────

export interface CoursePreview {
  _id: string;
  program: string;
  title: Bilingual;
  content: Bilingual;
  videoUrl: string | null;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}
