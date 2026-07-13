// Levier 2 — auth dé-réseautée partagée (proxy + pages chaudes).
// getUser() fait un aller-retour réseau à l'API Auth Supabase sur CHAQUE appel.
// getClaims() vérifie le JWT en LOCAL (clés asymétriques ES256 du projet).
// La JWKS est mise en cache au niveau MODULE (survit entre requêtes sur une
// instance tiède) et passée à getClaims → zéro appel réseau par requête.
// Sécurité : la vérification cryptographique locale (ES256) vaut celle de
// getUser() ; en repli (JWKS indisponible, algo symétrique), getClaims
// retombe de lui-même sur getUser().

import type { SupabaseClient } from "@supabase/supabase-js";

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

/** Claims du JWT vérifiés localement (null si pas de session). claims.sub = user id. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAuthClaims(supabase: SupabaseClient): Promise<Record<string, any> | null> {
  const keys = await cachedJwksKeys();
  type ClaimsOpts = Parameters<typeof supabase.auth.getClaims>[1];
  const { data } = await supabase.auth.getClaims(
    undefined,
    keys ? ({ keys } as ClaimsOpts) : undefined,
  );
  return (data?.claims as Record<string, unknown> | undefined) ?? null;
}
