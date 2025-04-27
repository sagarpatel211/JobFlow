import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return;
  }

  // Public pages open to unauthenticated users
  const PUBLIC_PATHS = ["/login", "/signup", "/techstack", "/"];
  const token = req.cookies.get("access_token")?.value;

  // If no token, only allow public paths
  if (!token) {
    if (!PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return;
  }

  // Verify token by fetching profile from backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }
  const profileRes = await fetch(`${apiUrl}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // Invalid token → clear cookie + go to login
  if (!profileRes.ok) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("access_token");
    return res;
  }

  // Parse profile response and assert shape
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { is_onboarded } = (await profileRes.json()) as { is_onboarded: boolean };

  // Prevent authenticated users from accessing login or signup pages
  if (["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
