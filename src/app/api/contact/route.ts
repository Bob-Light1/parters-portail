import { NextRequest } from 'next/server';
import { forwardToErp } from '@/lib/erp-proxy';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return forwardToErp(req, '/api/public/contact', { method: 'POST', body });
}
