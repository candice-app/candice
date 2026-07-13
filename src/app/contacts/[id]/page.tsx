import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import DashboardShell from "@/components/layout/DashboardShell";
import { Contact, QuestionnaireResponse, ProfileNote, CadenceLevel } from "@/types";
import type { ContactRecommendations } from "@/lib/recommendations/types";
import { generateProactiveQuestion } from "@/lib/recommendations/questions";
import ContactActions from "./ContactActions";
import ContactNotes from "@/components/dashboard/ContactNotes";
import ContactHeader from "./ContactHeader";
import CarnetV2Section, { type CarnetItemV2 } from "./CarnetV2Section";
import RelancerButton from "./RelancerButton";
import AttentionContextuelle from "./AttentionContextuelle";
import ProactiveQuestion from "./ProactiveQuestion";
import RegisterEditor from "./RegisterEditor";
import MatchingCard from "./MatchingCard";
import CadencePerContact from "@/components/dashboard/CadencePerContact";
import PointDivider from "@/components/presence/PointDivider";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import { resolveCadenceForContact } from "@/lib/cadence/resolver";
import MemoriesSection, { type MemoryRow } from "@/components/contacts/MemoriesSection";
import SituationCard, { type SituationRow } from "@/components/contacts/SituationCard";
import ShareAnalysisButton from "./ShareAnalysisButton";

// ─── Label maps ──────────────────────────────────────────────────────────────

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  core_values: { loyalty: "Loyauté et confiance", growth: "Croissance et apprentissage", fun: "Fun et expériences", stability: "Stabilité" },
  emotional_expression: { openly: "Très ouvertement", selectively: "Sélectivement", through_actions: "Par les actes", rarely: "Rarement / en privé" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  conflict_resolution: { direct: "Affronte directement", processes_first: "A besoin de temps", avoids: "Évite les conflits", humor: "Utilise l'humour" },
  decision_making: { logic: "Logique et données", intuition: "Instinct", consensus: "Avis des autres", research: "Recherche approfondie" },
  stress_response: { withdraws: "Se retire", seeks_support: "Cherche du soutien", action_oriented: "Dans l'action", internalizes: "Intériorise" },
  recognition_preference: { public: "Reconnaissance publique", private: "Reconnaissance privée", personal: "Satisfaction personnelle", celebrate: "Célébrer ensemble" },
  boundaries: { space: "Espace personnel", emotional: "Limites émotionnelles", time: "Temps et planning", privacy: "Vie privée" },
  growth_mindset: { experiences: "Nouvelles expériences", structured: "Apprentissage structuré", reflective: "Réflexion intérieure", community: "Apprentissage par les autres" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux" },
};

function resolve(field: string, value: string | null): string {
  if (!value) return "";
  return value.split(",").filter(Boolean).map(v => LABEL[field]?.[v] ?? v).filter(Boolean).join(", ");
}

// ─── Relational style ─────────────────────────────────────────────────────────

function deriveRelationalStyle(profile: QuestionnaireResponse): string {
  const expr = profile.emotional_expression;
  const comm = profile.communication_style;
  const vals = profile.core_values;
  if (expr?.includes("openly") && vals?.includes("loyalty")) return "Chaleureux(se) et engagé(e) — s'investit pleinement dans ses relations.";
  if (expr?.includes("rarely") && vals?.includes("stability")) return "Réservé(e) et fiable — montre son affection par les actes.";
  if (comm?.includes("direct") && vals?.includes("growth")) return "Direct(e) et orienté(e) évolution — apprécie la clarté et le progrès.";
  if (expr?.includes("through_actions")) return "Expressif(ve) par les gestes — préfère montrer que dire.";
  if (comm?.includes("emotional")) return "Émotionnel(le) et expressif(ve) — cherche la connexion profonde.";
  if (vals?.includes("fun")) return "Joueur(se) et spontané(e) — cultive la légèreté dans ses relations.";
  if (vals?.includes("loyalty")) return "Loyal(e) et constant(e) — présent(e) inconditionnellement.";
  return "Profil équilibré — s'adapte selon le contexte et les personnes.";
}

// ─── Completion (internal use only — no display) ──────────────────────────────

const SCORED_FIELDS: (keyof QuestionnaireResponse)[] = [
  "love_language", "communication_style", "stress_response", "social_energy",
  "appreciation_style", "conflict_resolution", "decision_making", "emotional_expression",
  "core_values", "recognition_preference", "boundaries", "growth_mindset",
  "hobbies", "favorite_foods", "gift_preference", "conversation_topics", "important_dates",
];

function getCompletion(profile: QuestionnaireResponse | undefined): number {
  if (!profile) return 0;
  return Math.round(SCORED_FIELDS.filter(f => !!profile[f]).length / SCORED_FIELDS.length * 100);
}

function candiceState(pct: number, firstName: string): string {
  if (pct >= 65) return `Candice anticipe pour ${firstName}`;
  if (pct >= 30) return `Candice connaît bien ${firstName}`;
  return `Candice commence à connaître ${firstName}`;
}

// ─── Important dates ──────────────────────────────────────────────────────────

interface ImportantDate { label: string; date: string; }

function parseImportantDates(raw: string | null): ImportantDate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return (parsed as ImportantDate[]).filter(d => d.date);
  } catch { /* legacy */ }
  return [];
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const year = now.getFullYear();
  const parts = dateStr.includes("-") ? dateStr.split("-").slice(-2).map(Number) : [0, 0];
  const [month, day] = parts;
  if (!month || !day) return Infinity;
  let next = new Date(year, month - 1, day);
  if (next < now) next = new Date(year + 1, month - 1, day);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: contact },
    { data: myProfile },
    { data: notesData },
    { data: confidencesData },
    { data: recoData },
    { data: pendingQuestionData },
    { count: feedbackCount },
    { data: memoriesData },
    { data: situationsData },
    { data: inviteLinkData },
    { data: consentData },
    { data: contactAnalysisData },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, questionnaire_responses(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("my_profile")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_notes")
      .select("id, contact_id, user_id, note, created_at")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("confidences")
      .select("id, raw_text, emotional_tone, created_at")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("contact_recommendations")
      .select("ideas, blind_spot, kadence, generated_at")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("context_journal")
      .select("id, question, answer")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .is("answer", null)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("attention_log")
      .select("*", { count: "exact", head: true })
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .not("feedback", "is", null),
    supabase
      .from("memories")
      .select("id, sanitized_summary, memory_type, category, sentiment, status, confidence_score, sensitivity_level, created_at")
      .eq("contact_id", id)
      .eq("pilot_id", user.id)
      .neq("status", "masqué")
      .neq("status", "archivé")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("memories")
      .select("id, reformulated_text, category, tonality, emotional_intensity, probable_needs, created_at")
      .eq("contact_id", id)
      .eq("pilot_id", user.id)
      .eq("type", "situation")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invite_links")
      .select("id")
      .eq("pilote_id", user.id)
      .eq("contact_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("contact_consents")
      .select("id, status")
      .eq("pilote_id", user.id)
      .eq("contact_id", id)
      .in("status", ["pending", "active"])
      .maybeSingle(),
    supabase
      .from("profile_analysis")
      .select("id")
      .eq("user_id", user.id)
      .eq("contact_id", id)
      .maybeSingle(),
  ]);

  if (!contact) notFound();

  const typedContact = contact as Contact & { questionnaire_responses: QuestionnaireResponse[] };
  const admin = createAdminClient();
  const cadenceResolution = await resolveCadenceForContact(user.id, id, admin);
  const isMemoryMode = !!typedContact.is_memory_mode;
  const procheUserId = typedContact.proche_user_id ?? null;
  const inviteStatus: "none" | "pending" | "confirmed" = procheUserId
    ? "confirmed"
    : inviteLinkData
      ? "pending"
      : "none";

  // Fetch Proche's analysis when linked
  type ProcheAnalysis = {
    summary: string | null;
    sections: Record<string, { text?: string; chips?: string[] }> | null;
    gender: string | null;
    confidence: number | null;
  };
  let procheAnalysis: ProcheAnalysis | null = null;
  let procheComplete = false;
  let incomingConsentData: { id: string; status: string } | null = null;
  if (procheUserId) {
    const [{ data: procheAnalysisRow }, { data: procheProfile }, { data: incomingConsentRaw }] = await Promise.all([
      admin
        .from("profile_analysis")
        .select("summary, sections, gender, confidence")
        .eq("user_id", procheUserId)
        .is("contact_id", null)
        .maybeSingle(),
      admin
        .from("my_profile")
        .select("attention_reception, temperament_axes, lifestyle_axes, practical_info")
        .eq("user_id", procheUserId)
        .maybeSingle(),
      // B→A : consentement où B est pilote et A est proche (lecture via RLS proche_read_own_consents)
      supabase
        .from("contact_consents")
        .select("id, status")
        .eq("pilote_id", procheUserId)
        .eq("proche_user_id", user.id)
        .in("status", ["pending", "active", "revoked"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    procheAnalysis = procheAnalysisRow as ProcheAnalysis | null;
    procheComplete = !!(
      procheProfile?.attention_reception &&
      procheProfile?.temperament_axes &&
      procheProfile?.lifestyle_axes &&
      procheProfile?.practical_info
    );
    incomingConsentData = incomingConsentRaw as { id: string; status: string } | null;
  }
  const profile = typedContact.questionnaire_responses?.[0];
  const userHasProfile = !!myProfile;
  const contactNotes = (notesData ?? []) as ProfileNote[];
  const recentConfidences = (confidencesData ?? []) as { id: string; raw_text: string; emotional_tone: string; created_at: string }[];
  const pct = getCompletion(profile);
  const senderFirstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";
  const contactFirstName = typedContact.name.split(" ")[0];
  const importantDates = parseImportantDates(profile?.important_dates ?? null).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  // Carnet d'envies V2 — backing carnet_envies_items (fusion faite, migration 67).
  const { data: carnetRows } = await supabase
    .from("carnet_envies_items")
    .select("id, description, brand_name, source_link, heard_quote, price_indicative, occasion, source, photo_url, statut, created_at")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });
  const carnetItems: CarnetItemV2[] = await Promise.all(
    ((carnetRows ?? []) as Array<Record<string, unknown>>).map(async r => {
      const photo = (r.photo_url as string | null) ?? null;
      let signed: string | null = null;
      if (photo) signed = /^https?:\/\//i.test(photo)
        ? photo
        : ((await admin.storage.from("contact-photos").createSignedUrl(photo, 3600)).data?.signedUrl ?? null);
      return {
        id: r.id as string,
        description: r.description as string,
        brand_name: (r.brand_name as string | null) ?? null,
        source_link: (r.source_link as string | null) ?? null,
        heard_quote: (r.heard_quote as string | null) ?? null,
        price_indicative: (r.price_indicative as string | null) ?? null,
        occasion: (r.occasion as CarnetItemV2["occasion"]) ?? null,
        source: (r.source as CarnetItemV2["source"]) ?? null,
        photo_url: photo,
        photoSignedUrl: signed,
        statut: (r.statut as string | null) ?? null,
        created_at: r.created_at as string,
      };
    }),
  );

  // Recommendations — pre-loaded from contact_recommendations table
  const initialRecommendations: ContactRecommendations | null = recoData
    ? {
        ideas: (recoData.ideas ?? []) as ContactRecommendations["ideas"],
        blindSpot: (recoData.blind_spot ?? null) as ContactRecommendations["blindSpot"],
        kadence: (recoData.kadence ?? "moyenne") as ContactRecommendations["kadence"],
        generatedAt: "",
      }
    : null;

  // Proactive question — seed one if none exists in last 7 days (only when there's profile data)
  let pendingQuestion: { id: string; question: string } | null = pendingQuestionData
    ? { id: pendingQuestionData.id, question: pendingQuestionData.question }
    : null;

  if (!pendingQuestion && !isMemoryMode && (procheUserId || !!profile)) {
    const { data: anyRecent } = await supabase
      .from("context_journal")
      .select("id")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo)
      .limit(1)
      .maybeSingle();

    if (!anyRecent) {
      const { data: recentQs } = await supabase
        .from("context_journal")
        .select("question")
        .eq("contact_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const recentlyAsked = (recentQs ?? []).map((r) => r.question);
      const question = generateProactiveQuestion(contactFirstName, recentlyAsked);
      const { data: inserted } = await supabase
        .from("context_journal")
        .insert({ user_id: user.id, contact_id: id, question })
        .select("id")
        .single();
      if (inserted) pendingQuestion = { id: inserted.id, question };
    }
  }

  const procheStateLabel: string | null = procheUserId
    ? procheComplete
      ? `Candice anticipe pour ${contactFirstName}`
      : procheAnalysis?.summary
      ? `Candice connaît bien ${contactFirstName}`
      : `Candice commence à connaître ${contactFirstName}`
    : null;
  const headerState = procheStateLabel ?? candiceState(pct, contactFirstName);
  const headerStateColor = procheUserId
    ? procheComplete || !!procheAnalysis?.summary ? "var(--champ)" : "rgba(244,241,232,.5)"
    : pct >= 65 ? "var(--champ)" : "rgba(244,241,232,.5)";

  let photoSignedUrl: string | null = null;
  if (typedContact.photo_url) {
    const { data } = await admin.storage
      .from("contact-photos")
      .createSignedUrl(typedContact.photo_url, 3600);
    photoSignedUrl = data?.signedUrl ?? null;
  }

  // Profile traits to show (only filled ones, in priority order)
  const traitRows: { label: string; value: string }[] = [
    { label: "Langage d'amour", value: resolve("love_language", profile?.love_language ?? null) },
    { label: "Communication", value: resolve("communication_style", profile?.communication_style ?? null) },
    { label: "Se sent apprécié(e) par", value: resolve("appreciation_style", profile?.appreciation_style ?? null) },
    { label: "Énergie sociale", value: resolve("social_energy", profile?.social_energy ?? null) },
    { label: "Sous stress", value: resolve("stress_response", profile?.stress_response ?? null) },
    { label: "Valeurs fondamentales", value: resolve("core_values", profile?.core_values ?? null) },
    { label: "Expression émotionnelle", value: resolve("emotional_expression", profile?.emotional_expression ?? null) },
    { label: "Gestion des conflits", value: resolve("conflict_resolution", profile?.conflict_resolution ?? null) },
    { label: "Prise de décision", value: resolve("decision_making", profile?.decision_making ?? null) },
    { label: "Reconnaissance", value: resolve("recognition_preference", profile?.recognition_preference ?? null) },
    { label: "Limites importantes", value: resolve("boundaries", profile?.boundaries ?? null) },
    { label: "Développement", value: resolve("growth_mindset", profile?.growth_mindset ?? null) },
    { label: "Loisirs", value: profile?.hobbies ?? "" },
    { label: "Cadeaux", value: resolve("gift_preference", profile?.gift_preference ?? null) },
  ].filter(r => r.value);

  return (
    <DashboardShell>
      <div data-page-ready="contact" style={{ display: "contents" }} />

      {/* ── Header band — pine encre ── */}
      <div
        className="hero-mass"
        style={{
          padding: "0 0 32px",
          background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
        }}
      >
        {/* Back link */}
        <div style={{ padding: "18px 24px 0" }}>
          <Link href="/contacts" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 12, fontWeight: 300,
              color: "rgba(244,241,232,.5)",
              letterSpacing: ".08em",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              ← Mes proches
            </span>
          </Link>
        </div>

        {/* Header content */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <ContactHeader
            contactId={id}
            name={typedContact.name}
            relationship={typedContact.relationship}
            phone={typedContact.phone}
            email={typedContact.email}
            signedUrl={photoSignedUrl}
            memoryMode={isMemoryMode}
            dateDeNaissance={typedContact.date_de_naissance ?? null}
          />
          {!isMemoryMode && (
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <ContactActions
                contactId={id}
                contactName={typedContact.name}
                contactEmail={typedContact.email}
                contactFirstName={contactFirstName}
                completionPct={pct}
                lastReminderSentAt={typedContact.last_reminder_sent_at ?? null}
                senderFirstName={senderFirstName}
                hasProche={!!procheUserId}
              />
            </div>
          )}
        </div>

        {/* Mode badge + Candice state */}
        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ height: "0.5px", background: "linear-gradient(90deg, var(--champ-line), transparent)", marginBottom: 12 }} />

          {/* Confirmed vs incognito badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase",
              color: inviteStatus === "confirmed"
                ? "rgba(23,62,49,.85)"
                : inviteStatus === "pending"
                  ? "rgba(205,185,135,.9)"
                  : "rgba(244,241,232,.38)",
              background: inviteStatus === "confirmed"
                ? "rgba(23,62,49,.55)"
                : inviteStatus === "pending"
                  ? "rgba(205,185,135,.15)"
                  : "rgba(244,241,232,.07)",
              border: `0.5px solid ${inviteStatus === "confirmed"
                ? "rgba(23,62,49,.5)"
                : inviteStatus === "pending"
                  ? "rgba(205,185,135,.4)"
                  : "rgba(244,241,232,.15)"}`,
              borderRadius: 20, padding: "3px 10px",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: inviteStatus === "confirmed"
                  ? "var(--pine)"
                  : inviteStatus === "pending"
                    ? "var(--champ)"
                    : "rgba(244,241,232,.3)",
                flexShrink: 0,
              }} />
              {inviteStatus === "confirmed"
                ? "Profil confirmé"
                : inviteStatus === "pending"
                  ? "Invitation envoyée"
                  : "Pas encore invité(e)"}
            </span>
          </div>

          <p style={{
            fontSize: 13,
            fontWeight: 300,
            color: headerStateColor,
            letterSpacing: ".04em",
          }}>
            {headerState}
          </p>
          {(feedbackCount ?? 0) >= 3 && (
            <p style={{
              fontSize: 11,
              fontWeight: 300,
              color: "rgba(244,241,232,.38)",
              letterSpacing: ".04em",
              marginTop: 5,
              fontStyle: "italic",
            }}>
              Candice apprend votre histoire
            </p>
          )}
        </div>
      </div>

      {/* ── Corps blanc ── */}
      <div className="body-pad">

        {/* ── Situation actuelle (juste sous le header) ── */}
        {(situationsData ?? []).length > 0 && (
          <SituationCard
            situations={(situationsData ?? []) as SituationRow[]}
            contactId={id}
            contactFirstName={contactFirstName}
          />
        )}

        {/* Memory mode notice */}
        {isMemoryMode && (
          <div style={{
            margin: "20px 0 0",
            padding: "10px 14px",
            background: "var(--champ-soft)",
            border: "0.5px solid var(--champ-line)",
            borderRadius: 8,
          }}>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-2)", fontStyle: "italic" }}>
              En souvenir — ce profil est conservé en lecture seule.
            </p>
          </div>
        )}

        {/* Notes Candice (quick add) */}
        {!isMemoryMode && (
          <div style={{ marginTop: 20 }}>
            <ContactNotes
              contactId={id}
              contactName={typedContact.name}
              initialNotes={contactNotes}
            />
            <RegisterEditor
              contactId={id}
              initialRegister={typedContact.relationship_register ?? null}
            />
          </div>
        )}

        {/* ── Analyse Proche (quand le proche a rejoint Candice) ── */}
        {procheAnalysis?.summary && (
          <>
            <PointDivider label={`${contactFirstName} selon Candice`} />
            <Thread>
              {/* Résumé global */}
              <ThreadItem nodeType="solid" voice>
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
                  {procheAnalysis.summary}
                </p>
              </ThreadItem>

              {/* Ce qui touche */}
              {procheAnalysis?.sections?.what_touches?.text && (
                <ThreadItem nodeType="anticipe">
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                    Ce qui la/le touche
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                    {procheAnalysis.sections.what_touches.text}
                  </p>
                  {(procheAnalysis.sections.what_touches.chips ?? []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {(procheAnalysis.sections.what_touches.chips ?? []).map((chip, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 300, padding: "3px 9px", borderRadius: 20, background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.12)", color: "var(--pine)" }}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </ThreadItem>
              )}

              {/* Attentions idéales */}
              {procheAnalysis?.sections?.attention?.text && (
                <ThreadItem nodeType="soft">
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                    Comment lui montrer qu&apos;on pense à elle/lui
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                    {procheAnalysis.sections.attention.text}
                  </p>
                </ThreadItem>
              )}

              {/* À éviter */}
              {procheAnalysis?.sections?.avoid?.text && (
                <ThreadItem nodeType="soft">
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                    À éviter
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                    {procheAnalysis.sections.avoid.text}
                  </p>
                  {(procheAnalysis.sections.avoid.chips ?? []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {(procheAnalysis.sections.avoid.chips ?? []).map((chip, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 300, padding: "3px 9px", borderRadius: 20, background: "rgba(205,185,135,.08)", border: "0.5px solid rgba(205,185,135,.25)", color: "var(--ink-2)" }}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </ThreadItem>
              )}

            </Thread>
            {!procheComplete && (
              <div style={{ padding: "4px 4px 0" }}>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic", lineHeight: 1.65, marginBottom: 12 }}>
                  Candice ne peut pas encore tout prendre en compte — {contactFirstName} n&apos;a pas terminé son profil.
                </p>
                <RelancerButton contactId={id} procheName={contactFirstName} />
              </div>
            )}
          </>
        )}

        {/* ── Partage d'analyse — deux directions indépendantes ── */}
        {/* Visible uniquement si B a un compte (procheUserId est posé) */}
        {procheUserId && (
          <>
            <PointDivider label="Partager avec ce proche" />
            <div style={{ padding: "0 4px 4px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* A→B : A partage son analyse avec B */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
                  Ton analyse avec {contactFirstName}
                </p>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 12 }}>
                  Partage l&apos;analyse relationnelle avec {contactFirstName} — uniquement ce que Candice a déduit,
                  jamais tes notes ou données brutes.
                </p>
                <ShareAnalysisButton
                  contactId={id}
                  hasAnalysis={!!contactAnalysisData}
                  existingConsent={consentData ? { id: consentData.id, status: consentData.status } : null}
                />
              </div>

              {/* B→A : purement informatif, affiché uniquement si un consent existe */}
              {(incomingConsentData?.status === "active" || incomingConsentData?.status === "pending") && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
                    {contactFirstName} partage son analyse avec toi
                  </p>
                  {incomingConsentData.status === "active" ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.14)",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pine)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "var(--pine)", fontWeight: 500 }}>
                        {contactFirstName} partage son analyse avec toi
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(205,185,135,.1)", border: "0.5px solid rgba(205,185,135,.3)",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--champ)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "#7a6420", fontWeight: 500 }}>
                        {contactFirstName} t&apos;a proposé de partager son analyse
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {profile ? (
          <>
            {/* Compléter le profil — shown when response exists but has no data yet */}
            {pct === 0 && !isMemoryMode && !procheUserId && (
              <>
                <PointDivider label={`Connaître ${contactFirstName}`} />
                <div style={{ padding: "32px 4px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 8 }}>
                    Candice attend de connaître {contactFirstName}.
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px" }}>
                    Remplissez le profil pour que Candice puisse anticiper les bons gestes.
                  </p>
                  <Link href={`/contacts/${id}/questionnaire`}>
                    <button className="btn-primary">Compléter le profil →</button>
                  </Link>
                </div>
              </>
            )}

            {/* Ce que Candice sait */}
            {traitRows.length > 0 && (
              <>
                <PointDivider label="Ce que Candice sait" />
                <Thread>
                  {/* Relational style — voix Candice */}
                  <ThreadItem nodeType="solid" voice>
                    <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
                      {deriveRelationalStyle(profile)}
                    </p>
                  </ThreadItem>
                  {/* Individual traits */}
                  {traitRows.map((row, i) => (
                    <ThreadItem key={row.label} nodeType="soft">
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 3 }}>
                          {row.label}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.5 }}>
                          {row.value}
                        </p>
                      </div>
                    </ThreadItem>
                  ))}
                  {/* Matching avec moi */}
                  {userHasProfile && (
                    <ThreadItem nodeType="soft">
                      <MatchingCard contactId={id} userHasProfile={userHasProfile} />
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* Dates importantes */}
            {importantDates.length > 0 && (
              <>
                <PointDivider label="Dates importantes" />
                <Thread>
                  {importantDates.map((d) => {
                    const days = daysUntil(d.date);
                    const isUrgent = days <= 14;
                    const dayLabel = days === 0 ? "aujourd'hui"
                      : days === 1 ? "demain"
                      : days === Infinity ? "—"
                      : `dans ${days} jours`;
                    return (
                      <ThreadItem key={d.label + d.date} nodeType={isUrgent ? "anticipe" : "soft"}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.4 }}>{d.label}</p>
                            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", marginTop: 2 }}>{d.date}</p>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 500,
                            color: isUrgent ? "var(--canvas)" : "var(--pine)",
                            background: isUrgent ? "var(--pine)" : "var(--champ-soft)",
                            border: "0.5px solid var(--champ-line)",
                            padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                          }}>
                            {dayLabel}
                          </span>
                        </div>
                      </ThreadItem>
                    );
                  })}
                </Thread>
              </>
            )}

            {/* Attentions pour [Prénom] */}
            {!isMemoryMode && (
              <>
                <PointDivider label={`Attentions pour ${contactFirstName}`} />
                {pendingQuestion && (
                  <ProactiveQuestion
                    questionId={pendingQuestion.id}
                    question={pendingQuestion.question}
                  />
                )}
                <AttentionContextuelle
                  contactId={id}
                  contactFirstName={contactFirstName}
                  initialRecommendations={initialRecommendations}
                />
              </>
            )}

            {/* Confidences */}
            {recentConfidences.length > 0 && (
              <>
                <PointDivider label={`Ce que tu m'as dit de ${contactFirstName}`} />
                <Thread>
                  {recentConfidences.map(conf => (
                    <ThreadItem key={conf.id} nodeType="soft">
                      <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
                        {new Date(conf.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)", fontStyle: "italic", lineHeight: 1.6 }}>
                        &ldquo;{conf.raw_text.length > 120 ? conf.raw_text.slice(0, 120) + "…" : conf.raw_text}&rdquo;
                      </p>
                    </ThreadItem>
                  ))}
                </Thread>
              </>
            )}

            {/* À retenir */}
            <PointDivider label="À retenir" />
            <CarnetV2Section contactId={id} contactFirstName={contactFirstName} initialItems={carnetItems} />

            {/* Cadence */}
            <PointDivider label="Fréquence d'attention" />
            <div style={{ paddingBottom: 8 }}>
              <CadencePerContact
                contactId={id}
                resolution={cadenceResolution}
                initialOverride={(typedContact.cadence_override as CadenceLevel) ?? null}
              />
            </div>
          </>
        ) : procheUserId ? (
          /* Proche joined Candice — analysis not yet available */
          <>
            {!procheAnalysis?.summary && (
              <>
                <PointDivider label={`Connaître ${contactFirstName}`} />
                <div style={{ padding: "28px 4px 20px" }}>
                  <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 8 }}>
                    {contactFirstName} est sur Candice.
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 20 }}>
                    Son analyse sera disponible dès qu&apos;il ou elle aura répondu aux premières questions.
                  </p>
                  <RelancerButton contactId={id} procheName={contactFirstName} />
                </div>
              </>
            )}
            <PointDivider label="À retenir" />
            <CarnetV2Section contactId={id} contactFirstName={contactFirstName} initialItems={carnetItems} />
          </>
        ) : inviteStatus === "pending" ? (
          /* Invite sent — proche hasn't registered yet */
          <>
            <PointDivider label={`Connaître ${contactFirstName}`} />
            <div style={{ padding: "28px 4px 20px" }}>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 8 }}>
                L&apos;invitation a été envoyée à {contactFirstName}.
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 20 }}>
                Dès qu&apos;il ou elle crée son compte, Candice pourra anticiper les bons gestes pour lui ou elle.
              </p>
              <RelancerButton
                contactId={id}
                procheName={contactFirstName}
                inviteStatus="pending"
                contactEmail={typedContact.email}
              />
            </div>

            <PointDivider label="À retenir" />
            <CarnetV2Section contactId={id} contactFirstName={contactFirstName} initialItems={carnetItems} />
          </>
        ) : (
          /* Never invited */
          <>
            <PointDivider label={`Connaître ${contactFirstName}`} />
            <div style={{ padding: "32px 4px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 8 }}>
                Candice attend de connaître {contactFirstName}.
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px" }}>
                Envoyez-lui un lien ou remplissez le profil vous-même — Candice pourra alors anticiper les bons gestes.
              </p>
              <Link href={`/contacts/${id}/questionnaire`}>
                <button className="btn-primary">Compléter le profil →</button>
              </Link>
            </div>

            <PointDivider label="À retenir" />
            <CarnetV2Section contactId={id} contactFirstName={contactFirstName} initialItems={carnetItems} />
          </>
        )}

        {/* Ce que Candice retient — memories from W1/W2 workflows */}
        {(memoriesData ?? []).length > 0 && (
          <>
            <PointDivider label="Ce que Candice retient" />
            <MemoriesSection
              contactId={id}
              initialMemories={(memoriesData ?? []) as MemoryRow[]}
            />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
