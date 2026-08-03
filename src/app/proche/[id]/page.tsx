// Espace Proche V2 — onglet [Prénom] (Phase 3, option B).
// Rendu des sections = ProfileV2 embedded (identique au pilote, §15).
// Source (décision B) : proche-utilisateur partagé → son analyse via consentement ;
// contact non-utilisateur → faits connus + états vides (aucune génération LLM).

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import { buildProfileV2Data, type ProfileV2Data } from "@/lib/profile/v2-data";
import { thirdPersonV2 } from "@/lib/profile/v2-tiers";
import EspaceProcheShell from "./EspaceProcheShell";

type Gender = "feminine" | "masculine" | "neutral";

function nextBirthday(dob: string | null): { weeks: number } | null {
  if (!dob) return null;
  const m = dob.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, , mm, dd] = m;
  const now = new Date();
  let next = new Date(now.getFullYear(), Number(mm) - 1, Number(dd));
  if (next < now) next = new Date(now.getFullYear() + 1, Number(mm) - 1, Number(dd));
  const days = Math.ceil((next.getTime() - now.getTime()) / 86400000);
  return { weeks: Math.round(days / 7) };
}

export default async function EspaceProchePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect(`/login?next=/proche/${id}`);
  const userId = claims.sub as string;

  const [{ data: contact }, { data: myProfile }, { data: myAnalysis }, { data: recoRows }, { data: carnetRows }, { data: refusalRows }] = await Promise.all([
    supabase.from("contacts")
      .select("id, name, gender, date_de_naissance, postal_address, proche_user_id")
      .eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("my_profile").select("practical_info").eq("user_id", userId).maybeSingle(),
    supabase.from("profile_analysis").select("dimension_scores").eq("user_id", userId).is("contact_id", null).maybeSingle(),
    // On récupère active + refused (hors purchased/déjà-offert) ; le tri propositions
    // vs écartées se fait en JS avec la réapparition PARESSEUSE (aucune écriture au rendu).
    supabase.from("contact_reco_items")
      .select("id, reco_type, title, brand, price_indicative, source_trace, certainty_pct, why_json, need_tag, photo_url, status, reservation_status")
      .eq("pilot_id", userId).eq("contact_id", id).neq("reservation_status", "purchased")
      .order("created_at", { ascending: false }),
    supabase.from("carnet_envies_items")
      .select("id, description, brand_name, heard_quote, price_indicative")
      .eq("contact_id", id).eq("statut", "actif").order("created_at", { ascending: false }),
    supabase.from("reco_refusals")
      .select("id, reco_id, reason, sub_reason, reactivable, reappear_at, created_at")
      .eq("pilot_id", userId).eq("contact_id", id).order("created_at", { ascending: false }),
  ]);
  if (!contact) notFound();

  const procheFirstName = (contact.name as string).split(" ")[0];
  const piloteFirstName =
    (myProfile?.practical_info as { prenom?: string } | null)?.prenom?.trim()
    || (claims.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    || "Toi";

  const gender = (contact.gender as Gender | null) ?? "neutral";
  const dob = (contact.date_de_naissance as string | null) ?? null;
  const bday = nextBirthday(dob);

  // Décision B — pas de génération LLM. Contact non-utilisateur (ou proche non
  // partagé) : synthèse minimale des faits connus, analyse absente → états vides.
  const isSharedUser = false; // le chemin « proche-utilisateur partagé » (analyse + consentement)
                              // sera branché quand un tel proche/consentement existe (hors QA).

  const synthProfile = {
    grammatical_gender: gender,
    practical_info: {
      prenom: procheFirstName,
      ...(dob ? { dates_importantes: [{ label: "Anniversaire", date: dob }] } : {}),
      ...(contact.postal_address ? { adresse: contact.postal_address } : {}),
    },
    attention_reception: null, temperament_axes: null, lifestyle_axes: null,
    singularity_answers: null, religion: null, disability: null, health_comfort: null,
  } as unknown as Parameters<typeof buildProfileV2Data>[0]["profile"];

  const rawData = buildProfileV2Data({
    profile: synthProfile,
    analysis: null,
    firstName: procheFirstName,
    nudges: [],
    hasAvailableQuestions: false,
    avatarUrl: null,
  });
  const procheData: ProfileV2Data = thirdPersonV2({ ...rawData, gender });
  const hasAnalysis = false; // décision B : aucune analyse générée pour un contact non-utilisateur

  // Onglet Nous — jauges superposées (dimension_scores pilote vs proche).
  // Décision B : le proche non-utilisateur n'a pas d'analyse → pas de comparatif.
  const piloteDims = (myAnalysis?.dimension_scores as Record<string, number> | null) ?? null;
  const procheDims = null; // contact non-utilisateur : aucune analyse (comparatif indisponible)

  // Onglet Faire plaisir — recos + carnet + refus.
  type RawReco = {
    id: string; reco_type: string; title: string; brand: string | null;
    price_indicative: string | null; source_trace: string; certainty_pct: number | null;
    why_json: unknown; need_tag: string | null; photo_url: string | null;
    status: string; reservation_status: string;
  };
  type RawRefusal = {
    id: string; reco_id: string; reason: string; sub_reason: string | null;
    reactivable: boolean; reappear_at: string | null; created_at: string;
  };
  const allRecos = (recoRows ?? []) as RawReco[];
  const refusals = (refusalRows ?? []) as RawRefusal[];

  // Dernier refus par reco (refusals déjà triés created_at desc).
  const lastRefusal = new Map<string, RawRefusal>();
  for (const rf of refusals) if (!lastRefusal.has(rf.reco_id)) lastRefusal.set(rf.reco_id, rf);

  const now = Date.now();
  // Réapparition PARESSEUSE : un refus budget/moment dont reappear_at est passé
  // rend le reco de nouveau proposable — sans réécrire le status (aucune écriture au rendu).
  const reappeared = (r: RawReco) => {
    const rf = lastRefusal.get(r.id);
    return !!(rf?.reappear_at && new Date(rf.reappear_at).getTime() <= now);
  };
  const isProposable = (r: RawReco) =>
    r.reservation_status === "available" && (r.status === "active" || reappeared(r));
  const isEcartee = (r: RawReco) =>
    r.status === "refused" && r.reservation_status === "available" && !reappeared(r)
    && (lastRefusal.get(r.id)?.reactivable ?? true);

  const recos = allRecos.filter(isProposable).map(({ status: _s, reservation_status: _rs, ...r }) => r);

  const REASON_LABEL: Record<string, string> = {
    gout: "Pas son goût", budget: "Trop cher", deja: "Déjà offert", moment: "Pas le bon moment",
  };
  const refused = allRecos.filter(isEcartee).map(r => ({
    id: r.id, title: r.title, brand: r.brand,
    reason: lastRefusal.get(r.id)?.reason ?? "gout",
    reasonLabel: REASON_LABEL[lastRefusal.get(r.id)?.reason ?? "gout"] ?? "Écartée",
  }));
  const refusedCount = refused.length;

  const carnet = (carnetRows ?? []) as Array<{
    id: string; description: string; brand_name: string | null;
    heard_quote: string | null; price_indicative: string | null;
  }>;

  return (
    <EspaceProcheShell
      contactId={id}
      pilotId={userId}
      procheFirstName={procheFirstName}
      piloteFirstName={piloteFirstName}
      procheGender={gender}
      mode={isSharedUser ? "shared" : "own_knowledge"}
      birthdayWeeks={bday?.weeks ?? null}
      procheData={procheData}
      hasAnalysis={hasAnalysis}
      piloteDims={piloteDims}
      procheDims={procheDims}
      recos={recos}
      carnet={carnet}
      refused={refused}
      refusedCount={refusedCount}
    />
  );
}
