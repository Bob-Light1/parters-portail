# Public API Contract — Pre-registration Portal

> **Addendum to spec §7** (`portail_pre_inscription.pdf`, Design Document v1.0).
> Documents the actual contract exposed by the ERP under `/api/public/*` and consumed
> by the portal via [`src/lib/erp-client.ts`](../src/lib/erp-client.ts).
>
> Status: **verified end-to-end** on 2026-06-07 (stabilization audit, phase A).
> Notably covers the two endpoints missing from the original spec §7:
> `GET /campuses` and `GET /course-previews`.

---

## 1. Response envelope (cross-cutting contract)

Every `/api/public/*` route responds with the **same envelope**, produced by
`utils/response-helpers.js` on the ERP side. No public controller emits a raw `res.json`.

### Success

```jsonc
{
  "success": true,
  "message": "Human-readable message.",
  "data": { /* payload — see each endpoint */ },
  "meta": { /* optional: pagination, etc. */ }
}
```

- `data` is **omitted** when there is no payload (e.g. a bodyless acknowledgement).
- The portal always unwraps `body.data` (see `erpFetch`/`portalFetch`).

### Error

```jsonc
{
  "success": false,
  "message": "Human-readable error.",
  "errors": [ /* optional: validation details */ ],
  "retryAfter": 60   // only on 429 (rate limit)
}
```

| Case | Code | Source |
|---|---|---|
| Missing/invalid portal key | `401` | `publicPortal.middleware` |
| Portal not configured (fail-closed) | `503` | `publicPortal.middleware` |
| Validation | `400` | helpers / global handler (`ValidationError`) |
| Resource not found | `404` | `sendNotFound` |
| Conflict (duplicate key) | `409` | global handler (`11000`) |
| Rate limit exceeded | `429` | `rate-limiter` (`+ retryAfter`) |
| Server error | `500` | global handler |

**Typed exceptions**: the global Express error handler (`server.js`) maps known errors
(`ValidationError`→400, `JsonWebTokenError`/`TokenExpiredError`→401, code `11000`→409,
`LIMIT_FILE_SIZE`→400) onto the envelope above; `stack` is only included when
`NODE_ENV=development`. On the portal side, `erp-client` throws an `Error` whose
`message` comes from `body.message` and carries the HTTP `status`.

### Cross-cutting security

- **`X-Portal-Key`** header required on every route (compared with `timingSafeEqual`).
- The client IP is **hashed** (`req.ipHash`, SHA-256) — never stored in clear.
- Whitelist `.select()` on every model; the quiz `correctIndex` is never exposed.

---

## 2. Endpoints

Base: `/api/public` — mounted **before** the JWT middlewares. All behind `publicPortalMiddleware`.

| # | Method | Path | Spec | Note |
|---|---|---|---|---|
| 1 | GET | `/campus-info` | §3 | resolve via `?ref` or `?slug` |
| 2 | GET | `/campuses` | **§7 (addition)** | multi-campus selection page |
| 3 | POST | `/pre-register` | §5 | rate-limited **10/h/IP** |
| 4 | GET | `/programs` | §4.4 | |
| 5 | GET | `/quiz` | §4.2 | `$sample`, no `correctIndex` |
| 6 | POST | `/quiz/submit` | §4.3 | |
| 7 | GET | `/leaderboard` | §4.3 | `scope=campus\|national` |
| 8 | GET | `/testimonials` | §4.10 | |
| 9 | GET | `/faq` | §4.11 | 24 h portal cache |
| 10 | GET | `/competition/prizes` | §4.12 | |
| 11 | GET | `/course-previews` | **§7 (addition)** | Phase 2 course previews |

---

### 1. `GET /campus-info`

Resolves a campus from a partner code or a slug. **Exactly one** of the two params is required.

| Param | Type | Required | Notes |
|---|---|---|---|
| `ref` | string | one of the two | partner code (normalized to UPPERCASE) |
| `slug` | string | one of the two | `campusSlug` (normalized to lowercase) |

`data`:

```jsonc
{
  "campusSlug": "dakar-centre",
  "campusName": "…",
  "logoUrl": "… | null",
  "city": "… | null",
  "country": "… | null",
  "programs": [ /* … */ ],
  "nextBatchDate": "ISO | null",
  "lang": "fr",
  "stats": { "studentsTrained": 0, "placementRate": 0, "partnerCompanies": 0 },
  "partnerCode": "ABC123"   // present only when resolved via ?ref
}
```

Errors: `400` (no param), `404` (`Partner code` or `Campus`). An archived campus never
leaks through a still-active partner code (`status:active` filter on both sides).

---

### 2. `GET /campuses`  — *§7 addition*

Lists public campuses (`status:active` **and** `campusSlug != null`), sorted by name.
Feeds the portal selection page (`/[locale]/campus`) when a visitor arrives without
`?ref` or `?slug` and the institution has several campuses (spec §3.4).

No parameter. `data`:

```jsonc
{
  "campuses": [
    {
      "campusSlug": "dakar-centre",
      "campusName": "…",
      "logoUrl": "… | null",
      "city": "… | null",
      "country": "… | null"
    }
  ]
}
```

Consumed by `getCampuses()` in `erp-client.ts`.

---

### 3. `POST /pre-register`

Creates a lead. **Rate-limited to 10 requests/hour/IP** (spec §5.5). Anti-fraud (spec §9.2):
honeypot, self-referral, deduplication, IP_BURST (≥5 leads/10 min from the same hash).
The portal proxies via `/api/pre-register` (key never exposed to the browser).

`data` (creation or existing lead):

```jsonc
{ "leadId": "…", "status": "new | …" }
```

Depending on the path (honeypot/dedup), it may return `200` with no `data` (silent ack).

---

### 4. `GET /programs`

| Param | Required | |
|---|---|---|
| `campusSlug` | yes | |

`data`: `{ "campusName": "…", "programs": [ /* … */ ] }`

---

### 5. `GET /quiz`

| Param | Required | Default |
|---|---|---|
| `campusSlug` | yes | |
| `category` | no | all |
| `limit` | no | 10 |

Random draw (`$sample`) **without** the `correctIndex` field. `data`:

```jsonc
{ "campusSlug": "…", "category": "… | null", "lang": "fr", "questions": [ /* … */ ] }
```

Proxied via `/api/quiz`.

---

### 6. `POST /quiz/submit`

Body: `{ campusSlug, sessionToken, category, answers:[{questionId,selectedIndex}], displayName?, city? }`.
`displayName`/`city` are **optional** and feed the named leaderboard (otherwise "Anonyme").

`data`:

```jsonc
{ "sessionId": "…", "score": 0, "correctAnswers": 0, "totalQuestions": 0, "period": "YYYY-MM" }
```

Proxied via `/api/quiz/submit`.

---

### 7. `GET /leaderboard`

| Param | Required | Notes |
|---|---|---|
| `campusSlug` | required if `scope=campus` | ignored if `scope=national` |
| `period` | no | `YYYY-MM`, default = current month |
| `category` | no | |
| `scope` | no | `campus` (default, top 50) \| `national` (top 20) |

> **Important**: the filter is driven by `scope`, **not** by the presence of `campusSlug`.
> The portal sends `campusSlug` even on the national call; applying it there would wrongly
> collapse the national leaderboard into a copy of the campus one (bug fixed on 2026-06-07).

`data`:

```jsonc
{
  "period": "YYYY-MM",
  "scope": "campus",
  "category": "… | null",
  "campusSlug": "… | null",
  "total": 12,
  "entries": [
    { "rank": 1, "displayName": "Awa M.", "city": "Douala", "country": "…",
      "score": 90, "category": "…", "completedAt": "ISO" }
  ]
}
```

No personal data (email, phone, IP) is exposed.

---

### 8. `GET /testimonials`

| Param | Required | Default |
|---|---|---|
| `campusSlug` | yes | |
| `limit` | no | 6 |

`data`: `{ "testimonials": [ /* bilingual {fr,en} content */ ] }`

---

### 9. `GET /faq`

| Param | Required | |
|---|---|---|
| `campusSlug` | yes | |

`data`: `{ "entries": [ /* {fr,en} */ ] }`. Cached for **24 h** on the portal (`revalidate: 86400`, spec §4.11).

---

### 10. `GET /competition/prizes`

| Param | Required | |
|---|---|---|
| `campusSlug` | yes | |

`data` (active competition):

```jsonc
{ "competition": { "period": "YYYY-MM", "prizes": [ /* … */ ], "closingDate": "ISO", "winners": [ /* … */ ] } }
```

If there is no active competition: `{ "competition": null }`.

---

### 11. `GET /course-previews`  — *§7 addition*

Published course previews for a campus (spec §4.7). Returns `isPublished:true` excerpts,
sorted by `order` then `createdAt` descending. Bilingual `{fr,en}` content passed through as-is.

| Param | Required | |
|---|---|---|
| `campusSlug` | yes | |
| `program` | no | optional filter |

`data`:

```jsonc
{ "previews": [ { "program": "…", "title": {"fr":"…","en":"…"}, "content": {"fr":"…","en":"…"}, "videoUrl": "… | null" } ] }
```

Consumed by `getCoursePreviews()` in `erp-client.ts`.

---

## 3. Portal-side caching

| Endpoint | `revalidate` |
|---|---|
| FAQ | `86400` (24 h, spec §4.11) |
| other Phase 2 reads (testimonials, competition, course-previews, campus by slug) | `300` (5 min) |
| quiz / pre-register / leaderboard | not cached (dynamic) |
