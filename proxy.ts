import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { demoModeKey, adminCookieKey } from "@/config/site";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Secret /admin gate. Invisible when locked: a missing/invalid key 404s
  // rather than showing a login page, so the route's existence isn't
  // advertised. Visiting /admin?key=<ADMIN_SECRET> sets an httpOnly cookie
  // (30d) and redirects to the clean /admin URL; the cookie is what every
  // later visit checks. When ADMIN_SECRET isn't set (local dev), /admin
  // stays open.
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      const keyParam = request.nextUrl.searchParams.get("key");
      if (keyParam === adminSecret) {
        const redirectResponse = NextResponse.redirect(new URL("/admin", request.url));
        redirectResponse.cookies.set(adminCookieKey, adminSecret, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          secure: process.env.NODE_ENV === "production",
        });
        return redirectResponse;
      }

      if (request.cookies.get(adminCookieKey)?.value !== adminSecret) {
        return new NextResponse("Not Found", { status: 404 });
      }
    }
  }

  // Allow demo mode bypass. The `?demo=true` query param covers the very
  // first navigation (from the login page, before the cookie is set); the
  // cookie (mirrored from localStorage by lib/demo.ts) covers every
  // navigation after that, since this middleware can't read localStorage.
  if (
    request.nextUrl.searchParams.get("demo") === "true" ||
    request.cookies.get(demoModeKey)?.value === "contractor"
  ) {
    return response;
  }

  // Protect /contractor/* routes (except login and apply)
  if (
    request.nextUrl.pathname.startsWith("/contractor") &&
    !request.nextUrl.pathname.startsWith("/contractor/login") &&
    !request.nextUrl.pathname.startsWith("/contractor/apply")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/contractor/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/contractor/:path*", "/admin", "/admin/:path*"],
};
