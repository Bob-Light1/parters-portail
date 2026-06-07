/**
 * Server-only helper for the Next.js API routes that proxy requests to the ERP.
 *
 * These routes exist so the secret `PORTAL_API_KEY` never reaches the browser.
 * They also forward the visitor's IP to the ERP: the ERP middleware hashes the
 * IP (SHA-256) for per-IP rate limiting and IP_BURST detection (spec §5.5, §9.2),
 * so without forwarding, every lead would appear to come from the portal's host.
 */

import { NextRequest, NextResponse } from 'next/server';

const ERP_BASE_URL = process.env.ERP_API_URL ?? '';
const PORTAL_KEY = process.env.PORTAL_API_KEY ?? '';

/** Extracts the client IP from the incoming proxy headers. */
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/**
 * Forwards a request to an ERP public endpoint, attaching the portal API key
 * and the original client IP, and relays the ERP response verbatim.
 */
export async function forwardToErp(
  req: NextRequest,
  erpPath: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<NextResponse> {
  if (!ERP_BASE_URL || !PORTAL_KEY) {
    return NextResponse.json(
      { success: false, message: 'Portal is not configured.' },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = { 'X-Portal-Key': PORTAL_KEY };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const clientIp = getClientIp(req);
  if (clientIp) {
    headers['X-Forwarded-For'] = clientIp;
    headers['X-Real-IP'] = clientIp;
  }

  try {
    const res = await fetch(`${ERP_BASE_URL}${erpPath}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: 'Invalid response from the ERP.',
    }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    // ERP unreachable — return a 502 the client can translate.
    return NextResponse.json(
      { success: false, message: 'The ERP is temporarily unreachable.' },
      { status: 502 },
    );
  }
}
