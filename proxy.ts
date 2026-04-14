import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Protect /contractor/* routes (except login and apply)
  if (request.nextUrl.pathname.startsWith("/contractor") &&
      !request.nextUrl.pathname.startsWith("/contractor/login") &&
      !request.nextUrl.pathname.startsWith("/contractor/apply")) {

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
