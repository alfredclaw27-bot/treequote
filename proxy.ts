import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { demoModeKey } from "@/config/site";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

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
  matcher: ["/contractor/:path*"],
};
