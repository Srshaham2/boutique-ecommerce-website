import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

/**
 * Backoffice lives on its own subdomain (ADMIN_HOST, e.g. admin.bielux.com).
 * The public storefront must never serve or reveal any /admin route.
 *
 * - On the admin host: requests are served from the `/admin/*` tree (bare paths
 *   are rewritten into it, so admin.bielux.com/orders -> /admin/orders).
 * - On the public host: any /admin path is rewritten to a non-existent route so
 *   it renders the normal 404 — the backoffice looks like it doesn't exist.
 *
 * In every case we still refresh the Supabase session and carry its cookies onto
 * whatever response we return. Per-page/action authorization is enforced by
 * `app/admin/layout.tsx` and `requireAdmin()` — this only handles routing.
 */
const ADMIN_HOST = (process.env.ADMIN_HOST ?? "admin.localhost:3000").toLowerCase()

export async function proxy(request: NextRequest) {
  // Refreshes the session; the returned response carries the updated auth cookies.
  const sessionResponse = await updateSession(request)

  const host = (request.headers.get("host") ?? "").toLowerCase()
  const hostname = host.split(":")[0]
  const isAdminHost = host === ADMIN_HOST || hostname.startsWith("admin.")
  const { pathname } = request.nextUrl

  if (isAdminHost) {
    // Serve everything from the /admin tree; rewrite bare paths into it.
    if (!pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone()
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`
      return withSessionCookies(sessionResponse, NextResponse.rewrite(url))
    }
    return sessionResponse
  }

  // Public host: hide the backoffice entirely.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/_backoffice-not-found" // no matching route -> renders 404
    return withSessionCookies(sessionResponse, NextResponse.rewrite(url))
  }

  return sessionResponse
}

/** Copy the refreshed Supabase auth cookies from one response onto another. */
function withSessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie))
  return to
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
