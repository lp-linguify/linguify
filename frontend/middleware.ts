import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Debug function to log detailed information
function debugLog(message: string, details?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`🕰️ [${timestamp}] ${message}`);
  
  if (details) {
    console.log('📝 Additional Details:');
    Object.entries(details).forEach(([key, value]) => {
      console.log(`   • ${key}: ${JSON.stringify(value)}`);
    });
  }
  
  console.log('-----------------------------------');
}

// Routes accessibles sans authentification
const PUBLIC_PATHS = [
  '/home',
  '/features',
  '/pricing',
  '/company',
  '/contact',
  '/register',
  '/callback',
  '/api/auth/callback',
  '/api/auth/login',
  '/annexes/terms',
  '/annexes/legal',
  '/annexes/privacy',
];

// Routes qui nécessitent une authentification
const PROTECTED_PATHS = [
  '/',
  '/learning',
  '/chat',
  '/progress',
  '/task',
  '/settings',
  '/notebook',
  '/coaching',
  '/flashcard',
  '/revision',
  '/community'
];

// Routes d'authentification
const AUTH_PATHS = [
  '/login',
  '/register',
  '/callback'
];

// Assets et ressources statiques à ignorer
const STATIC_PATHS = [
  '/_next',
  '/static',
  '/api/auth',
  '/favicon.ico',
  '/logo',
  '/img',
  '/icons'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log comprehensive request details
  debugLog('🔍 Middleware Intercepted Request', {
    pathname,
    method: request.method,
    host: request.headers.get('host'),
    userAgent: request.headers.get('user-agent'),
    referrer: request.headers.get('referer')
  });

  // Logging all headers
  const headers = Object.fromEntries(request.headers.entries());
  debugLog('🌐 Request Headers', { headers });

  // Detailed cookie logging
  const allCookies = request.cookies.getAll();
  debugLog('🍪 Cookies', { 
    cookieCount: allCookies.length,
    cookies: allCookies.map(cookie => ({
      name: cookie.name, 
      value: cookie.value,
      // Mask sensitive tokens
      maskedValue: cookie.value ? '*'.repeat(Math.min(cookie.value.length, 10)) + '...' : null
    }))
  });

  // Check for specific authentication tokens
  const accessToken = request.cookies.get('access_token');
  const authToken = request.cookies.get('auth_token');
  const sessionToken = request.cookies.get('session');
  
  debugLog('🔐 Authentication Tokens', {
    hasAccessToken: !!accessToken,
    hasAuthToken: !!authToken,
    hasSessionToken: !!sessionToken
  });

  // Comprehensive authentication check
  const isAuthenticated = !!(
    accessToken || 
    authToken || 
    sessionToken || 
    request.headers.get('Authorization')
  );

  debugLog('🔒 Authentication Status', {
    isAuthenticated,
    authMethods: {
      accessToken: !!accessToken,
      authToken: !!authToken,
      sessionToken: !!sessionToken,
      authHeader: !!request.headers.get('Authorization')
    }
  });

  // Ignore static resources
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    debugLog('📁 Static Resource', { 
      action: 'Allow Access',
      reason: 'Matches static path pattern'
    });
    return NextResponse.next();
  }

  // Root path handling
  if (pathname === '/') {
    if (!isAuthenticated) {
      debugLog('🚪 Root Path', {
        action: 'Redirect',
        reason: 'Unauthenticated',
        destination: '/home'
      });
      return NextResponse.redirect(new URL('/home', request.url));
    }
    
    debugLog('🏠 Root Path', {
      action: 'Allow Access',
      reason: 'Authenticated'
    });
    return NextResponse.next();
  }

  // Authentication paths
  if (AUTH_PATHS.some(path => pathname === path)) {
    if (isAuthenticated) {
      debugLog('🔓 Auth Path', {
        action: 'Redirect',
        reason: 'Already Authenticated',
        destination: '/'
      });
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    debugLog('🔑 Auth Path', {
      action: 'Allow Access',
      reason: 'Not Authenticated'
    });
    return NextResponse.next();
  }

  // Public paths
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    debugLog('🌍 Public Path', {
      action: 'Allow Access',
      reason: 'Matches public path pattern'
    });
    return NextResponse.next();
  }

  // Protected paths
  if (PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    if (!isAuthenticated) {
      debugLog('🛡️ Protected Path', {
        action: 'Redirect',
        reason: 'Not Authenticated',
        destination: '/login'
      });
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    debugLog('🔒 Protected Path', {
      action: 'Allow Access',
      reason: 'Authenticated'
    });
    return NextResponse.next();
  }

  // Catch-all for unspecified routes
  debugLog('❓ Unspecified Route', {
    action: 'Allow Access',
    reason: 'No specific routing rule matched'
  });
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};