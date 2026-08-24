# CLAUDE.md — Portail de Pré-inscription

Public-facing pre-registration portal for an academic ERP. It is the landing
destination for commercial partners' referral links / QR codes: it captures leads,
runs quizzes + a monthly competition, and shows social proof (testimonials, FAQ,
course previews). Spec: `portail_pre_inscription.pdf` (Design Document v1.0, **not
in this repo**). Public API contract (envelope + the 14 `/api/public/*` endpoints,
incl. the §7 additions `/campuses`, `/course-previews` and the three Phase 3 POSTs):
`docs/api-contract.md`. Vercel deployment: `docs/DEPLOYMENT.md`.

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
PWA: `app/manifest.ts` + `public/sw.js` (registered by `shared/ServiceWorkerRegistration`).

## Layout (`src/`)

- `app/[locale]/` — localized pages: home (`page.tsx`), `quiz`, `classement`, `campus`
  (multi-campus picker), `confidentialite`; Phase 2: `temoignages`, `faq`, `competition`,
  `cours`; Phase 3: `positionnement` (placement test), `alerte` (session alerts),
  `partenaire` (become a partner), `contact`.
- `app/r/[code]/route.ts` — unlocalized partner short link: 302 to the landing with
  `?ref=CODE` (+ `src`/UTM), and fires a non-blocking hit beacon to the ERP via `after()`.
- `app/api/` — server route handlers proxying client-safe calls to the ERP via
  `lib/erp-proxy.ts` (`/api/quiz`, `/api/quiz/submit`, `/api/pre-register`, `/api/contact`,
  `/api/partner-application`, `/api/alert`), keeping `PORTAL_API_KEY` server-side and
  forwarding the real client IP.
- `app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts` — metadata routes.
- `lib/` — `erp-client.ts` (all ERP calls), `campus.ts` (`resolveCampus`),
  `tracking.ts` (partnerCode/UTM cookies), `whatsapp.ts`, `analytics.ts`,
  `i18n-content.ts` (`pickLang` for ERP `{fr,en}` content),
  `feature-refusal.ts` (`isIntakeClosed`).
- `components/` — `forms/`, `layout/` (Navbar, Footer, LanguageSwitcher), `leaderboard/`,
  `faq/`, `competition/`, `badge/`, `shared/`.
- `i18n/config.ts` — **single source of truth** for locales. `messages/*.json` — 8 locales.
- `types/index.ts` — shared API types.

## Key conventions

- **erp-client.ts split:** server-only functions (`getCampus*`, `getCampuses`, `getPrograms`,
  `getLeaderboard`, `getTestimonials`, `getFaq`, `getCompetitionPrizes`,
  `getCoursePreviews`) use `ERP_API_URL` + `PORTAL_API_KEY` directly. Client-safe
  functions (`getQuizQuestions`, `submitQuiz`, `postPreRegister`) go through `/api/*`
  route handlers so the key never reaches the browser; the other forms (contact, partner
  application, alert) `fetch` their `/api/*` route directly.
- **Quiz integrity:** `/api/quiz` returns a `sessionToken` bound to the served question
  set; echo it back on submit — the ERP scores authoritatively (placement test reuses the
  quiz endpoints with `category='placement'`).
- **Campus resolution:** pages read `?ref=` (partner code) or `?slug=`, else
  `DEFAULT_CAMPUS_SLUG`. Use `resolveCampus(ref, slug)` from `lib/campus.ts`. A direct
  visit with >1 active campus redirects to `/[locale]/campus`. `redirect()` throws
  `NEXT_REDIRECT` — **call it outside try/catch**.
- **Campus entitlements:** a `hidden` module answers 404 (indistinguishable from an unknown
  campus — keep calling `notFound()`, never explain). A `read_only` campus answers 403
  `FEATURE_READ_ONLY` on the submission endpoints: use `isIntakeClosed(err|json)` and show
  the dedicated "intake closed" message, not the generic error.
- **Attribution (viral loop):** `tracking.ts` persists `partnerCode` + source + UTM in
  cookies (30 days, `pref`/`psrc`/`putm`). Always propagate `?ref=CODE` into shared
  WhatsApp links and the quiz badge QR via `withReferralCode()`.
- **i18n:** add new keys to **all 8** `messages/*.json` (fr, en, de, it, la, el, ar, zh) —
  keys must stay aligned (build prerenders all locales). `ar` is RTL (handled in the
  locale layout). ERP-provided dynamic content is bilingual `{fr,en}`; render via
  `pickLang(content, locale)` (falls back to `fr`).
- **Caching:** leaderboard `revalidate: 60`, FAQ `86400` (24h, spec §4.11), every other
  server-side read `300`.
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
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — enables Plausible when set;
  `NEXT_PUBLIC_PLAUSIBLE_SRC` overrides the script URL (self-hosted).

## Status

Phases 1 (acquisition), 2 (engagement) and 3 (placement test, session alerts,
become-a-partner, contact, PWA) are implemented and committed on both portal and ERP,
plus the ERP React admin screens. Remaining from the spec: winner email/SMS
notifications, dynamic multilingual ERP content, and the Phase 4 referral analytics
that consume the `/r/[code]` hit beacon.
