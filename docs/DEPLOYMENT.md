# Deployment Guide — Pre-registration Portal (Vercel)

> Complete, step-by-step procedure to put the **partner pre-registration
> portal** online **on Vercel** and make it usable by any visitor (prospects,
> partners, quiz players) from a browser, over HTTPS.
>
> Vercel is the portal's native host: the app is a stateless Next.js 15 server
> application, and Vercel gives it a global CDN, automatic TLS, per-branch
> preview deploys, and correct client-IP forwarding with zero extra config.

---

## 0. What actually runs in production

The portal is **not** a static site. It is a Next.js server application, which is
exactly what Vercel serves:

| Piece | Role | On Vercel |
|---|---|---|
| **Next.js server** | SSR pages (8 locales prerendered) + Server Components that read the ERP with the secret key | Runs on the Vercel runtime — no server to manage |
| **API route handlers** (`app/api/*`) | Proxy client-safe calls (`/api/quiz`, `/api/quiz/submit`, `/api/pre-register`) to the ERP, keeping `PORTAL_API_KEY` server-side and forwarding the **real visitor IP** | Vercel populates `X-Forwarded-For` at the edge, so IP forwarding works automatically |
| **ERP backend** (separate repo) | Source of all data via `/api/public/*`, protected by `X-Portal-Key` | Must be reachable over HTTPS and share the same `PORTAL_API_KEY` |

```
Browser ──> Portal (Next.js @ Vercel) ──X-Portal-Key + X-Forwarded-For──> ERP (Node/Express) ──> MongoDB Atlas
```

There is **no database and no persistent storage** on the portal side — all
state lives in the ERP. That is what makes it a perfect fit for Vercel's
stateless model.

> **Why HTTPS matters:** share links, the badge QR code, referral cookies
> (`pref`/`psrc`/`putm`) and correct IP forwarding all assume a real public
> HTTPS origin. Vercel provides TLS automatically, so this is handled for you —
> but `NEXT_PUBLIC_PORTAL_URL` must point at the final domain (see §5.3).

---

## 1. Prerequisites

1. **A Vercel account** with access to the org/team that will own the project.
2. **The ERP backend already deployed and reachable over HTTPS.**
   Current production ERP: `https://foruni-backend.onrender.com`.
   Its public endpoints (`/api/public/*`) must be live behind
   `publicPortalMiddleware`.
3. **A shared portal key** (`PORTAL_API_KEY`), identical on the ERP and the
   portal. Generate one:
   ```bash
   openssl rand -hex 32
   ```
4. **The GitHub repository** connected to Vercel:
   `git@github.com:Bob-Light1/parters-portail.git`.
5. **A domain (or subdomain)** for the portal, e.g. `portail.votreecole.com`,
   whose DNS you can edit.

> Node.js version is provided by Vercel (set to **20** in project settings).
> You only need Node 20 locally for the pre-deploy checks in §3.

---

## 2. Environment variables

Two classes of variables. **`NEXT_PUBLIC_*` are exposed to the browser** — never
put a secret behind that prefix. Everything else stays server-only, which on
Vercel means it is available to Server Components and route handlers but never
shipped to the client bundle.

| Variable | Scope | Required | Purpose |
|---|---|:--:|---|
| `ERP_API_URL` | server | ✅ | ERP base URL, **no trailing slash** (e.g. `https://foruni-backend.onrender.com`) |
| `PORTAL_API_KEY` | server (**Sensitive**) | ✅ | Shared secret sent as `X-Portal-Key`. Must match the ERP |
| `DEFAULT_CAMPUS_SLUG` | server | ✅ | Fallback campus when no `?ref=` / `?slug=` is given |
| `NEXT_PUBLIC_DEFAULT_CAMPUS_SLUG` | browser | ✅ | Same fallback, needed client-side for the quiz in direct mode |
| `NEXT_PUBLIC_PORTAL_URL` | browser | ✅ | The portal's own public URL. Used in WhatsApp share links **and the badge QR** — must equal the deployed domain |
| `NEXT_PUBLIC_BRAND_NAME` | browser | ✅ | Establishment name shown in navbar/footer/badge/titles |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | browser | optional | Enables Plausible analytics when set (e.g. `portail.votreecole.com`) |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | browser | optional | Plausible script URL (only if self-hosting Plausible) |

Reference template: [`.env.example`](../.env.example). Never commit a real
`.env*` file — `.gitignore` already excludes them.

Example production values:

```dotenv
ERP_API_URL=https://foruni-backend.onrender.com
PORTAL_API_KEY=<64-hex-char secret, identical on the ERP>
DEFAULT_CAMPUS_SLUG=dakar-centre
NEXT_PUBLIC_DEFAULT_CAMPUS_SLUG=dakar-centre
NEXT_PUBLIC_PORTAL_URL=https://portail.votreecole.com
NEXT_PUBLIC_BRAND_NAME=AcadERP
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=portail.votreecole.com
```

> **Set variables per environment.** In Vercel each variable can target
> **Production**, **Preview**, and **Development** separately. Set the values
> above for **Production**; for **Preview** you typically point `ERP_API_URL` at
> a staging ERP and set `NEXT_PUBLIC_PORTAL_URL` to the preview URL (or leave it
> and accept that share links on previews point to prod).

---

## 3. Pre-deploy checks (run locally)

The production build **prerenders all 8 locales** (fr, en, de, it, la, el, ar,
zh); a missing translation key fails the build. Run these before pushing — a
green build locally means a green build on Vercel:

```bash
npm ci            # clean, lockfile-exact install
npm run lint      # must be clean
npm run build     # must pass — all 8 locales prerendered
```

If it fails on a missing i18n key, add that key to **every** `messages/*.json`.

---

## 4. Coupling with the ERP (do this once, on the ERP side)

The portal is useless if the ERP rejects its calls. On the **ERP backend**:

1. Set `PORTAL_API_KEY` to the **exact same value** as the portal.
2. Ensure the public router (`/api/public/*`) is mounted and
   `publicPortalMiddleware` accepts the `X-Portal-Key` header.
3. Confirm the ERP **trusts the proxy IP headers** — the portal forwards the
   real visitor IP as `X-Forwarded-For` / `X-Real-IP` (populated by Vercel's
   edge) so per-IP rate limiting and IP_BURST fraud detection work
   (see [`erp-proxy.ts`](../src/lib/erp-proxy.ts)). In Express this means
   `app.set('trust proxy', true)` so `req.ip` reflects the visitor, not the
   Vercel host.
4. If the ERP enforces a CORS/origin allow-list on public routes, add the
   portal's production origin (`https://portail.votreecole.com`).

Smoke-test the coupling from your machine:

```bash
curl -s https://foruni-backend.onrender.com/api/public/campuses \
  -H "X-Portal-Key: <PORTAL_API_KEY>" | head
```

A JSON envelope `{ success: true, data: [...] }` confirms the key and route.

---

## 5. Deploy on Vercel

### 5.1 First deploy

1. Push the repo to GitHub (already: `Bob-Light1/parters-portail`).
2. In Vercel: **Add New → Project → Import** that repository.
3. Framework preset is auto-detected as **Next.js**. Keep the defaults:
   - Build command: `next build`
   - Output: (Next.js default — do **not** set static export)
   - Install command: `npm ci`
   - Node.js version: **20** (Project → Settings → General).
4. **Environment Variables:** add every variable from §2 for **Production**.
   Mark `PORTAL_API_KEY` as **Sensitive** so it is write-only and never shown
   again in the dashboard.
5. Click **Deploy.** Vercel installs, runs `next build` (prerendering the 8
   locales), and serves the result on its CDN with automatic TLS at a
   `*.vercel.app` URL.

### 5.2 Custom domain

1. Project → **Settings → Domains** → add `portail.votreecole.com`.
2. At your DNS provider, create the record Vercel displays:
   - subdomain → `CNAME` to `cname.vercel-dns.com`
   - apex/root domain → the `A` / `ALIAS` record Vercel gives you.
3. Wait for propagation; Vercel provisions and auto-renews the certificate.

### 5.3 Point the portal at its final URL

**After the domain is live, set `NEXT_PUBLIC_PORTAL_URL` to that exact domain
and redeploy.** This value is baked into the client bundle at build time, so a
change only takes effect on the next deployment. If it is wrong, WhatsApp share
links and the badge QR code point to the wrong host and the referral loop
breaks.

```
NEXT_PUBLIC_PORTAL_URL=https://portail.votreecole.com
```

### 5.4 CLI alternative

```bash
npm i -g vercel
vercel            # first run links the project + imports settings
vercel --prod     # deploy to production
```

---

## 6. Continuous deployment, previews & rollback

- **Auto-deploy:** every push to the **production branch** triggers a
  production build; every PR/branch gets its own **Preview URL** with the
  Preview env vars — use it for QA before promoting.
- **Instant rollback:** Deployments tab → pick a known-good build →
  **Promote to Production** (no rebuild, effective in seconds).
- **Protect previews if needed:** Settings → Deployment Protection (Vercel
  Authentication / password) so staging leads don't hit the real ERP.
- **Build logs & runtime logs:** available per deployment in the dashboard;
  the portal returns a translated 502 (`erp-proxy.ts`) if the ERP is
  unreachable rather than crashing the function.

---

## 7. Post-deploy verification checklist

Run through this against the **live custom domain** before announcing the URL:

- [ ] **Home loads** at `https://portail.votreecole.com` and redirects to a
      locale (`/fr`).
- [ ] **All 8 locales** render: `/fr /en /de /it /la /el /ar /zh`. `ar` is
      right-to-left (check layout direction).
- [ ] **Campus resolution:** a direct visit with >1 active campus redirects to
      `/[locale]/campus`; `?slug=<campus>` and `?ref=<partnerCode>` both resolve.
- [ ] **Pre-registration** submits successfully (creates a lead in the ERP).
- [ ] **Quiz** loads questions, **submit** returns a score, leaderboard updates.
- [ ] **Leaderboard** (`/classement`) shows data.
- [ ] **Referral loop:** open with `?ref=TESTCODE` → WhatsApp share link and the
      badge QR both carry `?ref=TESTCODE` (attribution cookie set for 30 days).
- [ ] **IP forwarding works:** two rapid submissions from the same IP trip the
      ERP's per-IP limit (confirms `X-Forwarded-For` reaches the ERP, not the
      Vercel host).
- [ ] **Secret is server-only:** `PORTAL_API_KEY` never appears in the page
      source or network tab (client calls go through `/api/*`).
- [ ] **Analytics** (if enabled): Plausible receives page views.
- [ ] **Cloudinary images** load (host `res.cloudinary.com` is allow-listed in
      `next.config.ts`).

---

## 8. Operations

- **Analytics:** set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to enable; self-host by also
  setting `NEXT_PUBLIC_PLAUSIBLE_SRC`. (Both are build-time — redeploy after
  changing.)
- **Key rotation:** generate a new `PORTAL_API_KEY`, set it on the ERP first,
  then update the Vercel variable, then redeploy so the new value is picked up.
- **Caching:** FAQ is cached 24h (`revalidate: 86400`), other Phase 2 reads
  300s. Content edited in the ERP admin appears after that TTL — no redeploy
  needed. To force-refresh sooner, redeploy or use On-Demand Revalidation.
- **Scaling:** the portal is stateless — Vercel scales it automatically; there
  is no shared state to coordinate.
- **Env changes take effect on the next deployment.** `NEXT_PUBLIC_*` values are
  compiled into the client bundle, so editing them in the dashboard does nothing
  until you redeploy.

---

## 9. Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails on a missing translation key | i18n keys not aligned across the 8 `messages/*.json` | Add the key to **every** locale file, rebuild |
| Everything returns "Portal is not configured." (500) | `ERP_API_URL` or `PORTAL_API_KEY` unset for the Production environment | Set both server-side vars in Vercel and redeploy |
| Quiz/pre-register 401/403 from ERP | Portal key ≠ ERP key, or public route not mounted | Align `PORTAL_API_KEY`; verify `/api/public/*` + `publicPortalMiddleware` |
| Every lead flagged as same IP / IP_BURST | ERP not trusting proxy headers | `app.set('trust proxy', true)` on the ERP (Vercel already sends the real IP) |
| Share links / QR point to `*.vercel.app` or wrong host | `NEXT_PUBLIC_PORTAL_URL` not set to the custom domain, or changed without redeploy | Set it to the exact production URL and **redeploy** |
| Env var edited but nothing changed | `NEXT_PUBLIC_*` is baked at build time | Trigger a new deployment |
| Direct visit shows the wrong/blank campus | `DEFAULT_CAMPUS_SLUG` / `NEXT_PUBLIC_DEFAULT_CAMPUS_SLUG` unset or wrong | Set both to a valid active campus slug |
