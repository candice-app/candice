import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import DashboardShell from "@/components/layout/DashboardShell";
import SuggestionsPanel from "./SuggestionsPanel";
import { Contact, QuestionnaireResponse, ProfileNote, WishlistItem, CadenceLevel } from "@/types";
import type { SynthesisNarrative } from "@/lib/profile/synthesis";
import ContactActions from "./ContactActions";
import ContactNotes from "@/components/dashboard/ContactNotes";
import ContactHeader from "./ContactHeader";
import WishlistSection from "./WishlistSection";
import MatchingCard from "./MatchingCard";
import CadencePerContact from "@/components/dashboard/CadencePerContact";
import PointDivider from "@/components/presence/PointDivider";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import { resolveCadenceForContact } from "@/lib/cadence/resolver";

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

  const [
    { data: contact },
    { data: cachedSuggestions },
    { data: myProfile },
    { data: notesData },
    { data: confidencesData },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, questionnaire_responses(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("suggestions")
      .select("content, generated_at")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
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
  ]);

  if (!contact) notFound();

  const typedContact = contact as Contact & { questionnaire_responses: QuestionnaireResponse[] };
  const admin = createAdminClient();
  const cadenceResolution = await resolveCadenceForContact(user.id, id, admin);
  const isMemoryMode = !!typedContact.is_memory_mode;
  const procheUserId = typedContact.proche_user_id ?? null;

  // Fetch Proche's synthesised profile when linked
  let procheSynthesis: SynthesisNarrative | null = null;
  if (procheUserId) {
    const { data: procheProfile } = await admin
      .from("my_profile")
      .select("profile_synthesis")
      .eq("user_id", procheUserId)
      .maybeSingle();
    procheSynthesis = (procheProfile?.profile_synthesis ?? null) as SynthesisNarrative | null;
  }
  const profile = typedContact.questionnaire_responses?.[0];
  const userHasProfile = !!myProfile;
  const contactNotes = (notesData ?? []) as ProfileNote[];
  const recentConfidences = (confidencesData ?? []) as { id: string; raw_text: string; emotional_tone: string; created_at: string }[];
  const pct = getCompletion(profile);
  const senderFirstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";
  const contactFirstName = typedContact.name.split(" ")[0];
  const importantDates = parseImportantDates(profile?.important_dates ?? null).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const wishlist = (typedContact.gift_wishlist ?? []) as WishlistItem[];

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

        {/* Candice state — no % */}
        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ height: "0.5px", background: "linear-gradient(90deg, var(--champ-line), transparent)", marginBottom: 14 }} />
          <p style={{
            fontSize: 13,
            fontWeight: 300,
            color: pct >= 65 ? "var(--champ)" : "rgba(244,241,232,.5)",
            letterSpacing: ".04em",
          }}>
            {candiceState(pct, contactFirstName)}
          </p>
        </div>
      </div>

      {/* ── Corps blanc ── */}
      <div className="body-pad">

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
          </div>
        )}

        {/* ── Analyse Proche (quand le proche a rejoint Candice) ── */}
        {procheSynthesis && (
          <>
            <PointDivider label={`Analyse de ${contactFirstName}`} />
            <Thread>
              <ThreadItem nodeType="solid" voice>
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
                  {procheSynthesis.block1}
                </p>
              </ThreadItem>
              {procheSynthesis.block3?.slice(0, 3).map((item: string, i: number) => (
                <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                    {item}
                  </p>
                </ThreadItem>
              ))}
              {procheSynthesis.block5 && (
                <ThreadItem nodeType="soft">
                  <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                    {procheSynthesis.block5}
                  </p>
                </ThreadItem>
              )}
            </Thread>
          </>
        )}

        {profile ? (
          <>
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

            {/* Idées pour [Prénom] */}
            {!isMemoryMode && (
              <>
                <PointDivider label={`Idées pour ${contactFirstName}`} />
                <SuggestionsPanel
                  contactId={id}
                  contactName={typedContact.name}
                  initialSuggestions={cachedSuggestions?.content ?? null}
                  generatedAt={cachedSuggestions?.generated_at ?? null}
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
            <WishlistSection contactId={id} initialWishlist={wishlist} />

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
          /* Proche joined Candice — synthesis computing or not yet visible */
          <>
            {!procheSynthesis && (
              <>
                <PointDivider label={`Connaître ${contactFirstName}`} />
                <div style={{ padding: "28px 4px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 8 }}>
                    {contactFirstName} est sur Candice.
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, maxWidth: 300, margin: "0 auto" }}>
                    Son analyse sera disponible dès qu&apos;il ou elle aura consulté son profil.
                  </p>
                </div>
              </>
            )}
            <PointDivider label="À retenir" />
            <WishlistSection contactId={id} initialWishlist={wishlist} />
          </>
        ) : (
          /* No profile and no proche account */
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
            <WishlistSection contactId={id} initialWishlist={wishlist} />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
