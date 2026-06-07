import { NextRequest } from 'next/server';
import { forwardToErp } from '@/lib/erp-proxy';

// Proxies POST /api/public/quiz/submit. The score is computed entirely by the ERP.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return forwardToErp(req, '/api/public/quiz/submit', { method: 'POST', body });
}
