import { NextRequest, NextResponse, userAgent } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { getAuthClaims } from "@/utils/supabase/claims";

// ── D2 : auth du proxy dé-réseautée ─────────────────────────────────────────
// getUser() faisait un aller-retour réseau à l'API Auth Supabase sur CHAQUE
// requête (donc chaque navigation), sur le chemin critique. getAuthClaims()
// vérifie le JWT en LOCAL (ES256, JWKS en cache module) → zéro appel réseau.
// Le rafraîchissement de session (cookies) reste assuré : getClaims →
// getSession() ne va au réseau QUE si le token est près d'expirer.

// Personal routes inaccessible on desktop
const DESKTOP_GATED_PREFIXES = [
  "/moi",
  "/contacts",
  "/parametres",
  "/dashboard",
  "/historique",
  "/idees",
  "/parler-a-candice",
  "/partage",
  "/profil/",   // /profil/[id] only — /profil-partage/ stays public
];

// Routes that bypass the beta gate entirely
const BETA_EXEMPT_EXACT = new Set(["/beta-access"]);
const BETA_EXEMPT_PREFIXES = ["/api/beta-access", "/api/auth/callback", "/beta-access"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Desktop gating ─────────────────────────────────────────────────────────
  // Redirect personal routes to "continue on phone" screen on non-mobile UA.
  const { device } = userAgent(request);
  const isDesktop = device.type !== "mobile" && device.type !== "tablet";

  if (isDesktop && DESKTOP_GATED_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/continuer-sur-telephone", request.url));
  }

  // ── Beta gate ──────────────────────────────────────────────────────────────
  const isBetaExempt =
    BETA_EXEMPT_EXACT.has(pathname) ||
    BETA_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isBetaExempt && !request.cookies.get("beta_access")) {
    const url = new URL("/beta-access", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // ── Supabase session refresh + auth locale (D2) ────────────────────────────
  const { supabase, supabaseResponse } = createClient(request);
  const user = await getAuthClaims(supabase);

  const protectedRoutes = ["/dashboard", "/contacts"];
  const authRoutes = ["/login", "/register"];

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
