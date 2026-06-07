# CLAUDE.md — Portail de Pré-inscription

Public-facing pre-registration portal for an academic ERP. It is the landing
destination for commercial partners' referral links / QR codes: it captures leads,
runs quizzes + a monthly competition, and shows social proof (testimonials, FAQ,
course previews). Spec: `portail_pre_inscription.pdf` (Document de Conception v1.0).
Public API contract (envelope + all 11 `/api/public/*` endpoints, incl. the §7 additions
`/campuses` and `/course-previews`): `docs/api-contract.md`.

## Architecture

Standalone **Next.js 15 (App Router)** app, fully decoupled from the ERP — **no direct
DB access**. All data flows over HTTPS to the ERP's public REST endpoints, authenticated
with a shared `X-Portal-Key` header (no JWT on the public side).

```
Browser ──> Portail (Next.js, Vercel) ──X-Portal-Key──> ERP (Node/Express) ──> MongoDB Atlas
```

- **ERP backend repo:** `/home/adminsecu/Projects/university/backend` (Node/Express/Mongoose).
  Public endpoints live in `controllers/public/` + `routers/public.router.js`
  (`/api/public/*`, behind `publicPortalMiddleware`). Admin CRUD for portal content is in
  `controllers/portal-admin/` + `routers/portal-admin.router.js` (`/api/portal-admin/*`, JWT).
- **ERP admin UI repo:** `/home/adminsecu/Projects/university/frontend` (Vite/MUI). Phase 2
  content (testimonials, FAQ, competition, course previews) is managed under `/admin/portal/*`.
- **ERP in prod:** https://foruni-backend.onrender.com

## Stack

Next.js 15 App Router · TypeScript · Tailwind 4 · next-intl 4 · React Hook Form + Zod ·
js-cookie · lucide-react · qrcode (client badge). Plausible analytics (env-gated).

## Layout (`src/`)

- `app/[locale]/` — localized pages: home (`page.tsx`), `quiz`, `classement`, `campus`
  (multi-campus picker), `confidentialite`, and Phase 2: `temoignages`, `faq`,
  `competition`, `cours`.
- `app/api/` — server route handlers that proxy client-safe calls to the ERP
  (`/api/quiz`, `/api/quiz/submit`, `/api/pre-register`) via `lib/erp-proxy.ts`, keeping
  `PORTAL_API_KEY` server-side and forwarding the real client IP.
- `lib/` — `erp-client.ts` (all ERP calls), `campus.ts` (`resolveCampus`),
  `tracking.ts` (partnerCode/UTM cookies), `whatsapp.ts`, `analytics.ts`,
  `i18n-content.ts` (`pickLang` for ERP `{fr,en}` content).
- `components/` — `forms/`, `layout/` (Navbar, Footer, LanguageSwitcher), `leaderboard/`,
  `faq/`, `competition/`, `badge/`, `shared/`.
- `i18n/config.ts` — **single source of truth** for locales. `messages/*.json` — 8 locales.
- `types/index.ts` — shared API types.

## Key conventions

- **erp-client.ts split:** server-only functions (`getCampus*`, `getPrograms`,
  `getLeaderboard`, `getTestimonials`, `getFaq`, `getCompetitionPrizes`,
  `getCoursePreviews`) use `ERP_API_URL` + `PORTAL_API_KEY` directly. Client-safe
  functions (`getQuizQuestions`, `submitQuiz`, `postPreRegister`) go through `/api/*`
  route handlers so the key never reaches the browser.
- **Campus resolution:** pages read `?ref=` (partner code) or `?slug=`, else
  `DEFAULT_CAMPUS_SLUG`. Use `resolveCampus(ref, slug)` from `lib/campus.ts`. A direct
  visit with >1 active campus redirects to `/[locale]/campus`. `redirect()` throws
  `NEXT_REDIRECT` — **call it outside try/catch**.
- **Attribution (viral loop):** `tracking.ts` persists `partnerCode` + source + UTM in
  cookies (30 days, `pref`/`psrc`/`putm`). Always propagate `?ref=CODE` into shared
  WhatsApp links and the quiz badge QR via `withReferralCode()`.
- **i18n:** add new keys to **all 8** `messages/*.json` (fr, en, de, it, la, el, ar, zh) —
  keys must stay aligned (build prerenders all locales). `ar` is RTL (handled in the
  locale layout). ERP-provided dynamic content is bilingual `{fr,en}`; render via
  `pickLang(content, locale)` (falls back to `fr`).
- **Caching:** FAQ uses `revalidate: 86400` (24h, spec §4.11); other Phase 2 reads use 300s.
- **English everywhere.** All file contents (code comments, docs, config comments, READMEs)
  must be written in English. Match surrounding style. The **only** exception is i18n data:
  `messages/*.json` are translations (`fr.json` stays French, etc.) and ERP `{fr,en}` content,
  plus language autonyms like `fr: 'Français'` in `i18n/config.ts`.

## Commands

```bash
npm run dev     # local dev (localhost:3000)
npm run build   # prod build — must pass with all 8 locales prerendered
npm run lint    # eslint (must be clean)
```

## Environment (`.env.local`, see `.env.example`)

- `ERP_API_URL` — ERP base URL (server-side).
- `PORTAL_API_KEY` — shared key sent as `X-Portal-Key` (must match ERP `PORTAL_API_KEY`).
- `DEFAULT_CAMPUS_SLUG` / `NEXT_PUBLIC_DEFAULT_CAMPUS_SLUG` — fallback campus for direct visits.
- `NEXT_PUBLIC_PORTAL_URL` — portal's own public URL (used in share links / badge QR).
- `NEXT_PUBLIC_BRAND_NAME` — establishment name shown in navbar/footer/badge.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — enables Plausible when set.

## Status

Phase 1 (acquisition: home, pre-register, quiz, leaderboard, WhatsApp share) and Phase 2
(testimonials, FAQ, monthly competition + countdown, friend challenge, shareable badge,
course previews) are implemented on both portal and ERP, plus the ERP React admin screens.
Not yet committed. Next: Phase 3 (placement test, session alerts, become-a-partner, PWA,
dynamic multilingual content, winner email/SMS notifications).
