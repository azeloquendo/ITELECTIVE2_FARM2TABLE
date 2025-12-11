// middleware.ts - Enhanced with improved authentication and routing logic
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route configuration
const ROUTE_CONFIG = {
  // Public routes that don't require authentication
  public: [
    '/',
    '/roleSelection',
    '/roleSelection/buyer/signin',
    '/roleSelection/buyer/signup',
    '/roleSelection/seller/signin', 
    '/roleSelection/seller/signup',
    '/roleSelection/admin/signin',
    '/roleSelection/admin/signup',
    '/roleSelection/forgotPassword',
    '/payment-success',
    '/api',
  ],
  // Protected routes that require authentication
  protected: {
    buyer: ['/buyer'],
    seller: ['/seller'],
    admin: ['/admin'],
  },
  // Routes that redirect authenticated users away
  authRedirect: [
    '/roleSelection',
    '/roleSelection/buyer/signin',
    '/roleSelection/buyer/signup',
    '/roleSelection/seller/signin',
    '/roleSelection/seller/signup',
    '/roleSelection/admin/signin',
    '/roleSelection/admin/signup',
  ],
};

// Helper function to check if path matches a route pattern
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route === path) return true;
    if (route.endsWith('*')) {
      return path.startsWith(route.slice(0, -1));
    }
    return path.startsWith(route + '/');
  });
}

// Helper function to get user's dashboard based on role
function getDashboardForRole(role: string | undefined): string {
  switch (role) {
    case 'buyer':
      return '/buyer/dashboard';
    case 'seller':
      return '/seller/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/roleSelection';
  }
}

// Helper function to check if route requires specific role
function requiresRole(path: string): 'buyer' | 'seller' | 'admin' | null {
  if (matchesRoute(path, ROUTE_CONFIG.protected.buyer)) return 'buyer';
  if (matchesRoute(path, ROUTE_CONFIG.protected.seller)) return 'seller';
  if (matchesRoute(path, ROUTE_CONFIG.protected.admin)) return 'admin';
  return null;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for static files and Next.js internals
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = matchesRoute(path, ROUTE_CONFIG.public);
  
  // Get authentication state from cookies
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value as 'buyer' | 'seller' | 'admin' | undefined;

  // Handle authenticated users trying to access auth pages
  if (authToken && matchesRoute(path, ROUTE_CONFIG.authRedirect)) {
    const dashboard = getDashboardForRole(userRole);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // If public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected route - check authentication
  if (!authToken) {
    // Store the intended destination for redirect after login
    const loginUrl = new URL('/roleSelection', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const requiredRole = requiresRole(path);
  if (requiredRole && userRole !== requiredRole) {
    // User has wrong role - redirect to their dashboard
    const dashboard = getDashboardForRole(userRole);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};