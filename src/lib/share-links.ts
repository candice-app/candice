// B.2 Phase 7 — réclamation d'un lien de partage sortant (SERVEUR uniquement).
//
// Le lien est à usage unique : la première personne CONNECTÉE qui le réclame
// obtient un consent profile_view ACTIF (le consentement de Y date de la
// génération du lien, scope choisi avant envoi). Un lien ne donne jamais
// accès sans compte. Utilisé par l'API de claim ET par /rejoindre/[token].

import { createAdminClient } from "@/utils/supabase/admin";

export type ClaimResult =
  | { ok: true; consentId: string; alreadyClaimed: boolean }
  | { ok: false; reason: "invalid" | "self" };

export async function claimShareLink(token: string, userId: string): Promise<ClaimResult> {
  if (!token || !userId) return { ok: false, reason: "invalid" };
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("profile_share_links")
    .select("id, owner_id, scope, claimed_by, claimed_at, consent_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.revoked_at) return { ok: false, reason: "invalid" };
  if (link.owner_id === userId) return { ok: false, reason: "self" };

  // Déjà réclamé : uniquement par la même personne (usage unique)
  if (link.claimed_at) {
    if (link.claimed_by === userId && link.consent_id) {
      return { ok: true, consentId: link.consent_id as string, alreadyClaimed: true };
    }
    return { ok: false, reason: "invalid" };
  }

  // Consent actif déjà existant pour cette paire → on le réutilise
  const { data: existing } = await admin
    .from("contact_consents")
    .select("id")
    .eq("kind", "profile_view")
    .eq("pilote_id", link.owner_id)
    .eq("proche_user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  let consentId = existing?.id as string | undefined;

  if (!consentId) {
    const now = new Date().toISOString();
    const { data: inserted, error } = await admin
      .from("contact_consents")
      .insert({
        pilote_id:      link.owner_id,
        proche_user_id: userId,
        requested_by:   link.owner_id, // Y a initié le partage
        contact_id:     null,
        kind:           "profile_view",
        status:         "active",
        scope:          link.scope ?? [],
        responded_at:   now,
        consented_at:   now,
      })
      .select("id")
      .single();

    if (error?.code === "23505") {
      // Course perdue : un consent actif vient d'être créé — on le récupère
      const { data: raced } = await admin
        .from("contact_consents")
        .select("id")
        .eq("kind", "profile_view")
        .eq("pilote_id", link.owner_id)
        .eq("proche_user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      consentId = raced?.id as string | undefined;
    } else if (!error && inserted) {
      consentId = inserted.id as string;
    }
  }

  if (!consentId) return { ok: false, reason: "invalid" };

  // Marquer le lien réclamé — usage unique (condition claimed_at IS NULL :
  // en cas de course sur le lien lui-même, un seul claim gagne)
  const { data: marked } = await admin
    .from("profile_share_links")
    .update({ claimed_by: userId, claimed_at: new Date().toISOString(), consent_id: consentId })
    .eq("id", link.id)
    .is("claimed_at", null)
    .select("id")
    .maybeSingle();

  if (!marked) {
    // Quelqu'un d'autre a réclamé entre-temps
    const { data: recheck } = await admin
      .from("profile_share_links")
      .select("claimed_by, consent_id")
      .eq("id", link.id)
      .maybeSingle();
    if (recheck?.claimed_by === userId && recheck.consent_id) {
      return { ok: true, consentId: recheck.consent_id as string, alreadyClaimed: true };
    }
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, consentId, alreadyClaimed: false };
}
