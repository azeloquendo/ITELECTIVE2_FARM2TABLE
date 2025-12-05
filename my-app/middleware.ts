// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('🛡️ Middleware running for:', request.nextUrl.pathname);
  
  const path = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/roleSelection',
    '/roleSelection/buyer/signin',
    '/roleSelection/buyer/signup',
    '/roleSelection/seller/signin', 
    '/roleSelection/seller/signup',
    '/roleSelection/admin/signin',
    '/farm-feed',
    '/api/public'
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(route + '/')
  );

  if (isPublicRoute) {
    console.log('✅ Public route access allowed:', path);
    return NextResponse.next();
  }

  // Get authentication token from cookies
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  console.log('🔐 Auth check - Token exists:', !!authToken, 'Role:', userRole);

  // If no auth token and trying to access protected route, redirect to login
  if (!authToken) {
    console.log('❌ No auth token, redirecting to role selection');
    const loginUrl = new URL('/roleSelection', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 🟢 LESS STRICT Role-based route protection
  if (path.startsWith('/seller')) {
    if (userRole !== 'seller') {
      console.log('🚫 SELLER route accessed by:', userRole, '- redirecting to their respective dashboard');
      
      // 🟢 DON'T CLEAR COOKIES - just redirect to their correct dashboard
      if (userRole === 'buyer') {
        return NextResponse.redirect(new URL('/buyer/dashboard', request.url));
      } else if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        // Unknown role, go to role selection but DON'T clear cookies
        return NextResponse.redirect(new URL('/roleSelection', request.url));
      }
    }
    console.log('✅ Seller access granted');
  }

  if (path.startsWith('/buyer')) {
    if (userRole !== 'buyer') {
      console.log('🚫 BUYER route accessed by:', userRole, '- redirecting to their respective dashboard');
      
      // 🟢 DON'T CLEAR COOKIES - just redirect to their correct dashboard
      if (userRole === 'seller') {
        return NextResponse.redirect(new URL('/seller/profile', request.url));
      } else if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        // Unknown role, go to role selection but DON'T clear cookies
        return NextResponse.redirect(new URL('/roleSelection', request.url));
      }
    }
    console.log('✅ Buyer access granted');
  }

  // 🟢 Admin route protection
  if (path.startsWith('/admin')) {
    if (userRole !== 'admin') {
      console.log('🚫 ADMIN route accessed by:', userRole, '- redirecting to their respective dashboard');
      
      // 🟢 DON'T CLEAR COOKIES - just redirect to their correct dashboard
      if (userRole === 'seller') {
        return NextResponse.redirect(new URL('/seller/profile', request.url));
      } else if (userRole === 'buyer') {
        return NextResponse.redirect(new URL('/buyer/dashboard', request.url));
      } else {
        // Unknown role, go to role selection but DON'T clear cookies
        return NextResponse.redirect(new URL('/roleSelection', request.url));
      }
    }
    console.log('✅ Admin access granted');
  }

  console.log('✅ Access granted for:', path, 'Role:', userRole);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};