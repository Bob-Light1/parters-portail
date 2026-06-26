import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Matches every route except Next internals, static files, API routes and the
  // `/r/{code}` referral redirector (which must stay locale-agnostic, not be
  // rewritten to `/fr/r/...`).
  matcher: ['/((?!_next|_vercel|api|r/|.*\\..*).*)'],
};
