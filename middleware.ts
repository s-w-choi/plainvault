import { type NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, validateCsrfToken } from './src/lib/security/csrf';

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
];

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    if (!request.cookies.get('csrf_token')) {
      response.cookies.set('csrf_token', generateCsrfToken(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }
    return response;
  }

  if (MUTATION_METHODS.includes(request.method)) {
    const isPublicRoute = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
    if (!isPublicRoute) {
      if (!validateCsrfToken(request)) {
        return NextResponse.json(
          { error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF token' } },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
