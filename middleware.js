import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

export default async function middleware(req) {
  const vercelToken = req.cookies.get('_vercel_jwt');
  
  // If there's no token, redirect to the login page
  if (!vercelToken) {
    const url = new URL('/login', req.url);
    return NextResponse.redirect(url);
  }

  try {
    // Forward the token to your API
    const headers = new Headers(req.headers);
    headers.set('Authorization', `Bearer ${vercelToken.value}`);

    // Clone the request with new headers
    const response = NextResponse.next({
      request: {
        headers,
      },
    });

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    const url = new URL('/login', req.url);
    return NextResponse.redirect(url);
  }
}
