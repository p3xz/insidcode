import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function applyAdminSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "private, no-store, no-cache, max-age=0, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/") || isApiAdmin;

  const secrets = [process.env.AUTH_SECRET, process.env.NEXTAUTH_SECRET].filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );

  const hasSecureCookie =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token.0");
  const hasStandardCookie =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("authjs.session-token.0");

  let token = null;
  if (secrets.length > 0 && (hasSecureCookie || hasStandardCookie)) {
    if (hasSecureCookie) {
      token = await getToken({
        req,
        secret: secrets,
        secureCookie: true,
      });
    }
    if (!token && hasStandardCookie) {
      token = await getToken({
        req,
        secret: secrets,
        secureCookie: false,
      });
    }
  }

  // Logged-in active users visiting /login go directly to their workspace
  if (pathname === "/login") {
    if (token && token.userId && token.isBanned !== true) {
      return NextResponse.redirect(new URL("/problems", req.url));
    }
    return NextResponse.next();
  }

  // Admin routes: strict fail-closed Edge guard + security headers
  if (isAdminRoute) {
    if (!token || !token.userId) {
      if (isApiAdmin) {
        return applyAdminSecurityHeaders(
          NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
        );
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return applyAdminSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (token.isBanned === true) {
      if (isApiAdmin) {
        return applyAdminSecurityHeaders(
          NextResponse.json({ error: "Your account has been suspended." }, { status: 403 })
        );
      }
      return applyAdminSecurityHeaders(NextResponse.redirect(new URL("/suspended", req.url)));
    }

    if (token.role !== "admin") {
      if (isApiAdmin) {
        const method = req.method.toUpperCase();
        // Let state-changing mutations hit the route handler's requireAdminMutationUser()
        // so unauthorized probing triggers automatic suspension + audit logging and still returns 403.
        if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
          return applyAdminSecurityHeaders(
            NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 })
          );
        }
        return applyAdminSecurityHeaders(NextResponse.next());
      }
      return applyAdminSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
    }

    return applyAdminSecurityHeaders(NextResponse.next());
  }

  // Member routes (/problems, /duel, /leaderboard, /stats, /profile, /settings, /onboarding, /notifications)
  if (!token || !token.userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.isBanned === true) {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/problems",
    "/problems/:path*",
    "/duel",
    "/duel/:path*",
    "/leaderboard",
    "/stats",
    "/profile/:path*",
    "/settings",
    "/onboarding",
    "/notifications/:path*",
    "/login",
  ],
};
