// B.2 Phase 7 — lien de partage sortant, côté SERVEUR uniquement.
// (Révision post-revue Estelle : token hashé SHA-256, expiration 30 jours,
//  réclamation par UPDATE atomique.)
//
// Le token brut n'existe qu'à la génération et dans l'URL envoyée : seule
// son empreinte SHA-256 est stockée. Le lien est à usage unique et expire.
// Ordre de réclamation : GAGNER le lien d'abord (UPDATE atomique), créer le
// consent ensuite — aucune course ne peut laisser un consent actif orphelin.

import { createHash } from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type ClaimResult =
  | { ok: true; consentId: string; alreadyClaimed: boolean }
  | { ok: false; reason: "invalid" | "self" };

const INVALID: ClaimResult = { ok: false, reason: "invalid" };

export async function claimShareLink(token: string, userId: string): Promise<ClaimResult> {
  if (!token || !userId) return INVALID;
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("profile_share_links")
    .select("id, owner_id, scope, claimed_by, claimed_at, consent_id, revoked_at, expires_at")
    .eq("token_hash", hashShareToken(token))
    .maybeSingle();

  if (!link || link.revoked_at) return INVALID;
  // Le propriétaire ne réclame JAMAIS son propre lien (erreur douce)
  if (link.owner_id === userId) return { ok: false, reason: "self" };

  // Déjà réclamé : uniquement re-visitable par la même personne (usage unique)
  if (link.claimed_at) {
    if (link.claimed_by !== userId) return INVALID;
    const consentId = link.consent_id
      ?? await ensureConsent(admin, link.owner_id, userId, link.scope ?? []);
    if (!consentId) return INVALID;
    if (!link.consent_id) {
      await admin.from("profile_share_links").update({ consent_id: consentId }).eq("id", link.id);
    }
    return { ok: true, consentId, alreadyClaimed: true };
  }

  if (new Date(link.expires_at as string) <= new Date()) return INVALID;

  // UPDATE ATOMIQUE : usage unique garanti contre les réclamations simultanées
  const { data: won } = await admin
    .from("profile_share_links")
    .update({ claimed_by: userId, claimed_at: new Date().toISOString() })
    .eq("id", link.id)
    .is("claimed_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (!won) return INVALID; // quelqu'un d'autre a gagné la course (ou révocation/expiration entre-temps)

  const consentId = await ensureConsent(admin, link.owner_id, userId, link.scope ?? []);
  if (!consentId) return INVALID;

  await admin.from("profile_share_links").update({ consent_id: consentId }).eq("id", link.id);
  return { ok: true, consentId, alreadyClaimed: false };
}

/** Consent profile_view ACTIF pour (partageur, lecteur) : réutilise ou crée. */
async function ensureConsent(
  admin: SupabaseClient,
  ownerId: string,
  userId: string,
  scope: string[],
): Promise<string | null> {
  const { data: existing } = await admin
    .from("contact_consents")
    .select("id")
    .eq("kind", "profile_view")
    .eq("pilote_id", ownerId)
    .eq("proche_user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (existing) return existing.id as string;

  const now = new Date().toISOString();
  const { data: inserted, error } = await admin
    .from("contact_consents")
    .insert({
      pilote_id:      ownerId,
      proche_user_id: userId,
      requested_by:   ownerId, // Y a initié le partage
      contact_id:     null,
      kind:           "profile_view",
      status:         "active",
      scope,
      responded_at:   now,
      consented_at:   now,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    // Course perdue sur l'index unique : un consent actif vient d'être créé
    const { data: raced } = await admin
      .from("contact_consents")
      .select("id")
      .eq("kind", "profile_view")
      .eq("pilote_id", ownerId)
      .eq("proche_user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    return (raced?.id as string) ?? null;
  }
  return inserted ? (inserted.id as string) : null;
}
