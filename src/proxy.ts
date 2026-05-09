import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const protectedRoutes = ["/dashboard", "/contacts"];
const authRoutes = ["/login", "/register"];

// Routes that bypass the beta gate entirely
const BETA_EXEMPT_EXACT = new Set(["/", "/beta-access"]);
const BETA_EXEMPT_PREFIXES = ["/api/beta-access", "/api/auth/callback", "/beta-access"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Beta gate ─────────────────────────────────────────────────────────────
  const isBetaExempt =
    BETA_EXEMPT_EXACT.has(pathname) ||
    BETA_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isBetaExempt && !request.cookies.get("beta_access")) {
    const url = new URL("/beta-access", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
