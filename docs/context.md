# Public portal project context

Last documentation review: 2026-09-19. Navigation map, not deployment certification.

## Scope and boundaries

Standalone Next.js 15 App Router / TypeScript / Tailwind 4 application with next-intl,
React Hook Form and Zod. This repository is `Projects/partner`, outside `university`.
It owns pre-registration, referral links, quizzes, placement, public content and contact flows.
The ERP software showcase is in the [frontend](../../university/frontend/AGENTS.md).
All business data comes from the [backend](../../university/backend/AGENTS.md) public API;
there is no portal database or direct connection to the [AI service](../../university/ai-service/AGENTS.md).

## Navigation

| Entry | Responsibility |
|---|---|
| [localized pages](../src/app/[locale]/) | Landing, campus selection, quiz and applicant pages |
| [API handlers](../src/app/api/), [proxy](../src/lib/erp-proxy.ts) | Server-side key and browser-safe submissions |
| [ERP client](../src/lib/erp-client.ts), [types](../src/types/index.ts) | Requests, response envelopes, caching and payloads |
| [campus resolver](../src/lib/campus.ts), [feature refusal](../src/lib/feature-refusal.ts) | Scope resolution and closed intake |
| [referral route](../src/app/r/[code]/route.ts), [tracking](../src/lib/tracking.ts) | Referral redirects, beacons and attribution |
| [locale registry](../src/i18n/config.ts), [messages](../src/messages/) | Eight locales; distinct from the ERP's ten |
| [brand](../src/lib/brand.ts), [environment sample](../.env.example) | Wewigo product fallback, establishment override, public assets and service wiring |

## Detailed references

[CLAUDE.md](../CLAUDE.md) contains local conventions; [README](../README.md)
covers setup and architecture. The [API contract](api-contract.md) documents
quiz session tokens and caching, and the [deployment guide](DEPLOYMENT.md)
covers environment wiring, branding and proxy verification.
Backend controllers/routes live under `modules/public-portal/`; response helpers
live under `shared/utils/`. Deployment URLs and historical smoke results must be
verified before use; these documents do not establish live deployment status.

Product status is owned by the [backend roadmap](../../university/backend/docs/architecture/ERP_ROADMAP.md),
QA work by its [QA strategy](../../university/backend/docs/architecture/QA_TEST_STRATEGY.md).
Branding decisions live in the [feature design](../../university/backend/docs/architecture/features/product-home-and-branding.md).
See [current task](current_task.md) for the local handoff.
