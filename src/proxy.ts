import { NextRequest, NextResponse, userAgent } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// ── D2 : auth du proxy dé-réseautée ─────────────────────────────────────────
// Avant : getUser() faisait un aller-retour réseau à l'API Auth de Supabase
// sur CHAQUE requête (donc chaque navigation), sur le chemin critique.
// Maintenant : getClaims() vérifie le JWT en LOCAL (clés asymétriques ES256).
// La JWKS est mise en cache au niveau MODULE (survit entre requêtes sur une
// instance tiède) et passée à getClaims → zéro appel réseau par requête.
// Le rafraîchissement de session (cookies) reste assuré : getClaims appelle
// getSession() qui ne va au réseau QUE si le token est près d'expirer.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const JWKS_TTL_MS = 10 * 60 * 1000;
let jwksCache: { keys: unknown[] } | null = null;
let jwksCachedAt = 0;

async function cachedJwksKeys(): Promise<unknown[] | undefined> {
  if (jwksCache && Date.now() - jwksCachedAt < JWKS_TTL_MS) return jwksCache.keys;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`, {
      headers: { apikey: SUPABASE_KEY },
    });
    if (!res.ok) return jwksCache?.keys;
    const data = (await res.json()) as { keys: unknown[] };
    if (data?.keys?.length) {
      jwksCache = data;
      jwksCachedAt = Date.now();
    }
    return jwksCache?.keys;
  } catch {
    return jwksCache?.keys; // repli : dernière JWKS connue, jamais bloquant
  }
}

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
  const keys = await cachedJwksKeys();
  type ClaimsOpts = Parameters<typeof supabase.auth.getClaims>[1];
  const { data: claimsData } = await supabase.auth.getClaims(
    undefined,
    keys ? ({ keys } as ClaimsOpts) : undefined,
  );
  const user = claimsData?.claims ?? null;

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
