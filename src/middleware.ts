import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Matches every route except Next internals, static files and API routes.
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
};
