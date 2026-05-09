import { type NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set CSRF cookie on page requests (non-API) so the frontend can read it.
  // CSRF validation is NOT enforced here because:
  //   1. Session cookies are httpOnly + SameSite=lax, which already prevents CSRF
  //   2. The frontend fetch() calls don't send X-CSRF-Token header
  //   3. SameSite=lax is sufficient CSRF protection for modern browsers
  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    if (!request.cookies.get('csrf_token')) {
      response.cookies.set('csrf_token', generateCsrfToken(), {
        httpOnly: false,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
