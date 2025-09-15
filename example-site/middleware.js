import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // In production builds, redirect admin routes to home
  if (process.env.NODE_ENV === 'production' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
