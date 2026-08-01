import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Presence-only guard: redirects to /login if neither auth cookie is
 * present. httpOnly cookies aren't readable by client JS, but proxy runs
 * server-side and receives the raw Cookie header regardless of that flag.
 * Does not decode/verify the JWT or gate by role — actual authorization is
 * enforced per-request by the backend; this just avoids flashing a
 * protected page at a signed-out visitor.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("access_token") || request.cookies.has("refresh_token");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
