import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

// Mirrors login page's ROLE_PORTAL_MAP (app/(auth)/login/page.tsx) — keep
// both in sync if a role or portal is ever added/renamed.
const ROLE_PORTAL_MAP: Record<string, string> = {
  super_admin: "/super-admin",
  center_admin: "/",
  admin: "/",
  teacher: "/teacher",
  student: "/student",
};

// Path prefixes that belong to a specific portal and the roles allowed in
// it. The admin portal is everything NOT claimed by one of the others
// (route group `(admin)` maps to `/`), so it's handled as a fallback rather
// than listed here.
const PORTAL_GUARDS: { prefix: string; roles: string[] }[] = [
  { prefix: "/super-admin", roles: ["super_admin"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/student", roles: ["student"] },
];
const ADMIN_ROLES = ["center_admin", "admin"];

/**
 * Presence + role guard. Presence: redirects to /login if neither auth
 * cookie is present. httpOnly cookies aren't readable by client JS, but
 * proxy runs server-side and receives the raw Cookie header regardless of
 * that flag.
 *
 * Role: also redirects a signed-in user away from a portal that isn't
 * theirs (e.g. a student hitting /teacher) using the `user_role` httpOnly
 * cookie the backend sets alongside the tokens (see
 * backend/common/cookies.py::set_auth_cookies). This does NOT decode or
 * verify the JWT, and is not itself the security boundary — real
 * authorization is enforced per-request by the backend's RBAC (see
 * backend/foundation, HasModulePermission). It exists to stop the frontend
 * from rendering another role's screens at all, rather than relying solely
 * on individual API calls 403ing underneath a half-rendered page.
 *
 * Fails open if `user_role` is missing on an otherwise-valid session (e.g.
 * a session started before this cookie existed) — the visitor is left on
 * whatever page they requested rather than being bounced, since we can't
 * tell where they *do* belong. They'll get a fresh role cookie next login
 * or token refresh.
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

  const role = request.cookies.get("user_role")?.value;
  if (role) {
    const guard = PORTAL_GUARDS.find((g) => pathname === g.prefix || pathname.startsWith(`${g.prefix}/`));
    const inAdminPortal = !guard && !pathname.startsWith("/super-admin") && !pathname.startsWith("/teacher") && !pathname.startsWith("/student");

    const allowed = guard ? guard.roles.includes(role) : inAdminPortal ? ADMIN_ROLES.includes(role) : true;

    if (!allowed) {
      const home = ROLE_PORTAL_MAP[role];
      return NextResponse.redirect(new URL(home ?? "/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
