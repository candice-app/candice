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
const BETA_EXEMPT_PREFIXES = ["/api/beta-access", "/api/auth/callback", "/beta-access", "/api/cron"];

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

  // La porte bêta protège candice.app DU PUBLIC, pas une machine de dev. On la rend INOPÉRANTE uniquement
  // en développement local. DEUX conditions, dont une INFALSIFIABLE par une requête :
  //   1. process.env.NODE_ENV !== 'production' — la garantie DURE. Sur Vercel / `next build` / `next start`,
  //      NODE_ENV vaut TOUJOURS 'production' (variable du runtime, jamais portée par la requête). Une requête
  //      ne peut pas la changer → en production ce booléen est TOUJOURS false, donc betaBypass TOUJOURS false,
  //      même si quelqu'un envoie `Host: localhost` à candice.app.
  //   2. l'hôte est local (localhost / 127.0.0.1) — correspond à « sur ma machine ».
  const host = request.nextUrl.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  const betaBypass = process.env.NODE_ENV !== "production" && isLocalHost;

  if (!isBetaExempt && !betaBypass && !request.cookies.get("beta_access")) {
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
