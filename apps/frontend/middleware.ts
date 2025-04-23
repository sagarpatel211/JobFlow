import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow unrestricted public access for homepage and techstack
  if (pathname === "/" || pathname === "/techstack") {
    return;
  }

  // Skip Next.js internals, static files, and API routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return;
  }

  // Public pages that don't require auth
  const PUBLIC_PATHS = ["/login", "/signup"];

  const token = req.cookies.get("access_token")?.value;

  // No token → only allow public pages
  if (!token) {
    if (!PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return;
  }

  // Verify token by fetching profile from backend
  const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // Invalid token → clear cookie + go to login
  if (!profileRes.ok) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("access_token");
    return res;
  }

  const { is_onboarded } = await profileRes.json();

  // If already authenticated and landing on login/signup, bounce them
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(is_onboarded ? "/dashboard" : "/onboarding", req.url));
  }

  // Not onboarded → force onboarding on all protected pages
  if (!is_onboarded && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Already onboarded → prevent going back to onboarding
  if (is_onboarded && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Otherwise allow
  return;
}
