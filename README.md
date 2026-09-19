# Public pre-registration portal

Standalone Next.js 15 App Router / TypeScript portal for the multi-campus academic ERP.
It handles applicant intake, referral attribution, quizzes and placement tests,
campus selection, public course content, contact and session alerts.
The software showcase and signed-in workspaces live in the separate ERP frontend.

## Start here

Read [AGENTS.md](AGENTS.md), [project context](docs/context.md) and the
[current handoff](docs/current_task.md) for session setup.
[CLAUDE.md](CLAUDE.md) contains engineering conventions;
[the API contract](docs/api-contract.md) describes backend integration;
[the deployment guide](docs/DEPLOYMENT.md) covers Vercel configuration and checks.

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure the local environment before using the app at `http://localhost:3000`.
`ERP_API_URL` points to the backend origin, without `/api` or a trailing slash;
`PORTAL_API_KEY` must match the backend and stays server-only.
Use the campus fallback variables and `NEXT_PUBLIC_PORTAL_URL` as documented in
[the environment sample](.env.example). Never commit real secrets.

## Architecture

- [Localized pages](src/app/[locale]/) and server components read the ERP through
  [erp-client.ts](src/lib/erp-client.ts).
- Browser submissions use [local API handlers](src/app/api/) and
  [erp-proxy.ts](src/lib/erp-proxy.ts), keeping `X-Portal-Key` out of the browser.
- All business persistence and authoritative quiz scoring belong to the backend.
- [Locale configuration](src/i18n/config.ts) defines eight locales; translations
  live in [src/messages](src/messages/). Preserve Arabic RTL and bilingual ERP content.
- [Brand configuration](src/lib/brand.ts) provides the Wewigo product fallback,
  optional establishment override and public assets. Preserve campus identity.
  Public environment changes require rebuilding.

## Checks and deployment

```bash
npm run lint
npm run build
npm run start
```

There is no `npm test` script. The build and lint checks do not establish that the
live ERP integration works; follow the deployment guide's smoke checks as well.
The application requires a Next.js server runtime, including its API proxies;
it is not a static export. No deployment status is asserted by this README.
