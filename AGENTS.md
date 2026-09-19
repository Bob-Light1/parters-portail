# Public portal agent instructions

## Start and resume

- Read [project context](docs/context.md) and [current task](docs/current_task.md) once at session start.
- Check `git status --short`, the branch and the relevant diff before editing. Preserve unrelated work.
- These are separate repositories, not a monorepo. Verify sibling paths before use.
- Read the detailed references required for the task before implementing; these summaries do not waive their rules.
- A handoff is a dated snapshot, not permission to start its suggested follow-up. The user's current request determines scope.
- Use `rg` and bounded reads; exclude dependencies, caches, build output and generated fixtures from broad searches.
- Write code, comments and documentation in English; preserve product translations in their target languages. Reply in the user's language.
- Never document secrets, real personal data or generated fixture credentials.
- Update `docs/current_task.md` at meaningful milestones and before handing off implementation work: objective, decisions, files, checks, blockers and next action.
- Keep stable navigation in `docs/context.md`; link to canonical decisions rather than copying them. Do not create commits solely for a handoff.
- Distinguish checks run now from historical results. Documentation-only changes need link, accuracy, whitespace and Git-ignore/tracking checks; application changes require the relevant workflow below.

## Task references and invariants

- Before code changes read [CLAUDE.md](CLAUDE.md), especially server/client boundaries, campus resolution, attribution, quiz integrity and localization.
- API work also requires [the contract](docs/api-contract.md), actual `src/lib/erp-client.ts` / `erp-proxy.ts`, the affected handlers and backend `modules/public-portal/` through its facade.
- Keep `PORTAL_API_KEY` server-only. Browser forms call local `/api/*` proxies; no direct database access. Preserve client-IP forwarding without changing backend proxy trust casually.
- Use `resolveCampus`; keep redirects outside catch blocks. Hidden intake remains indistinguishable from missing content; read-only submissions use `isIntakeClosed`.
- Preserve referral cookies, UTM and `withReferralCode` on shared links/QR codes. Submit the served quiz `sessionToken`; scoring belongs to the ERP.
- Read locale inventory from `src/i18n/config.ts`; maintain all eight message catalogs, Arabic RTL and `pickLang` for bilingual ERP content.
- Deployment work requires [DEPLOYMENT.md](docs/DEPLOYMENT.md), `.env.example` and `src/lib/brand.ts`; establishment and campus identity retain their documented precedence.
- Application checks: `npm run lint` and `npm run build`. Cross-repository features also follow [backend CLAUDE.md](../university/backend/CLAUDE.md) §12 and their design/QA workflow. No `npm test` script exists here.
