import { NextRequest } from 'next/server';
import { forwardToErp } from '@/lib/erp-proxy';

// Proxies GET /api/public/quiz, forwarding the original query string.
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  return forwardToErp(req, `/api/public/quiz?${query}`, { method: 'GET' });
}
