import { NextRequest } from 'next/server';
import { forwardToErp } from '@/lib/erp-proxy';

// Proxies POST /api/public/pre-register, keeping the portal API key server-side.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return forwardToErp(req, '/api/public/pre-register', { method: 'POST', body });
}
