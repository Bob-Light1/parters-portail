/**
 * feature-refusal.ts — reading the ERP's per-campus entitlement refusals.
 *
 * The ERP gates every campus module on three states (design doc
 * `backend/docs/architecture/CAMPUS_ENTITLEMENT_DESIGN.md` §4.1). Two of them
 * reach this portal, and only one of them is visible here:
 *
 *  - `hidden`   → the ERP answers **404**, byte for byte the answer it gives for
 *                 a campus that does not exist (§9.2). Nothing to read: the
 *                 pages already call `notFound()`, and that is deliberate — a
 *                 explicit refusal would publish a tenant's commercial standing
 *                 to anyone holding a URL.
 *  - `read_only`→ the site stays up and the five submission endpoints answer
 *                 **403 `FEATURE_READ_ONLY`**. That is what this module reads:
 *                 the campus paused its intake, the visitor did nothing wrong,
 *                 and "an error occurred, please try again" is false on both
 *                 counts — retrying will not help.
 *
 * The backend is the single source of truth for the code (CLAUDE.md §0.1); this
 * file mirrors the one value the portal needs, exactly as the ERP frontend does
 * in `src/config/featureConstants.js`.
 */

/** Mirror of the backend `FEATURE_ERROR_CODES.FEATURE_READ_ONLY`. */
export const FEATURE_READ_ONLY = 'FEATURE_READ_ONLY';

/** The shape the ERP's `sendError()` puts a refusal code in. */
type ErpErrorBody = { errors?: { code?: string } };

/**
 * Reads the refusal code out of a parsed ERP error body, or out of an Error
 * thrown by `erp-client` (which carries the code across the throw).
 *
 * Returns null for anything else — an unreadable body is not a refusal.
 */
export function refusalCode(source: unknown): string | null {
  if (!source || typeof source !== 'object') return null;
  const fromThrow = (source as { code?: unknown }).code;
  if (typeof fromThrow === 'string') return fromThrow;
  const fromBody = (source as ErpErrorBody).errors?.code;
  return typeof fromBody === 'string' ? fromBody : null;
}

/**
 * True when the campus is online but has closed its intake, whether the caller
 * holds the parsed body (the `/api/*` proxy routes relay it verbatim) or the
 * Error thrown by `erp-client`.
 */
export function isIntakeClosed(source: unknown): boolean {
  return refusalCode(source) === FEATURE_READ_ONLY;
}
