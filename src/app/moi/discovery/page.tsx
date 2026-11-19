import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import DashboardShell from "@/components/layout/DashboardShell";
import DiscoveryFlow from "./DiscoveryFlow";
import DiscoveryPortes from "./DiscoveryPortes";
import DiscoveryClarifications, { type ClarificationAffichee } from "./DiscoveryClarifications";
import { clarificationsOuvertes } from "@/lib/discovery/open-v3/destinations-ecriture";
import DiscoveryEnvie from "./DiscoveryEnvie";
import { envieAProposer } from "@/lib/discovery/open-v3/envie-carnet";
import { sujetsExplorables, sujetsChoisisPar, sujetsRefusesPar, projetsEnCours, situationsDeclareesDatees, ENTREE_QUOTIDIEN } from "@/lib/discovery/open-v3/service";
import { ENTREE_LARGE } from "@/lib/discovery/open-v3/entree";
import DiscoveryEntree from "./DiscoveryEntree";
import type { Quotidien } from "./DiscoveryPortes";
import { libelleBranche } from "@/lib/discovery/open-v3/correspondances";
import { proposerLot } from "@/lib/discovery/open-v3/reponse";
import type { NextQuestionResult } from "@/lib/discovery/engine";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; section?: string }>;
}) {
  const supabase = await createClient();
  // Levier 2 : auth vérifiée en LOCAL (getClaims) — pas d'aller-retour réseau.
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect("/login");
  const userId = claims.sub as string;

  const { mode: rawMode, section: sectionKey } = await searchParams;
  const mode = rawMode === "full" ? "full" : "quick";

  // ── LES QUESTIONS VIENNENT DE LA BANQUE OPEN V3, et l'état qui décide de leur
  //    ouverture vient du JOURNAL. L'ancien moteur lisait `profile_analysis.sections` pour
  //    évaluer ses déclencheurs — un texte déjà rédigé, donc une conséquence, pas une
  //    cause : on y cherchait l'autorisation de poser une question dans la prose que la
  //    question avait servi à écrire.
  //
  //    Lecture seule, aucun effet de bord : la session naît à la première réponse. Le lot est
  //    SIGNÉ par le serveur ; la réponse devra présenter cette signature (open-v3/lot.ts).
  let initial: NextQuestionResult | null = null;
  try {
    const { premiere, diagnostic, manques } = await proposerLot(supabase, { userId, mode, ...(sectionKey ? { section: sectionKey } : {}) });
    if (manques.length > 0) console.warn("[discovery] état incomplet", manques);
    // « Rien à demander » est un résultat légitime, et il doit être explicable : le
    // diagnostic dit si tout a été posé, si les conditions ferment, ou si on n'a pas su les
    // lire. Un écran vide sans trace est un défaut qu'on ne peut pas corriger.
    if (!premiere) console.info("[discovery] aucune question à poser", diagnostic);
    initial = premiere as NextQuestionResult | null;
  } catch (e) {
    // Sans secret de signature, aucun lot ne peut être proposé : on n'en fabrique pas un
    // que la route refuserait ensuite. L'écran dit qu'il n'y a rien, et l'erreur est tracée.
    console.error("[discovery] aucun lot proposé", e);
  }

  // ── LES DEUX PORTES QUE LA PERSONNE OUVRE ELLE-MÊME : explorer un sujet, déclarer un achat
  //    ou un séjour en préparation. Une lecture qui échoue n'affiche pas un état supposé : les
  //    portes ne sont alors pas rendues, et l'erreur est tracée.
  let portes: { sujets: { branche: string; libelle: string; choisi: boolean }[]; projets: Awaited<ReturnType<typeof projetsEnCours>>; refuses: { branche: string; libelle: string }[]; quotidien: Quotidien } | null = null;
  try {
    const [choisis, projets, refuses, situations] = await Promise.all([
      sujetsChoisisPar(supabase as never, { userId }), projetsEnCours(supabase as never, { userId }), sujetsRefusesPar(supabase as never, { userId }),
      situationsDeclareesDatees(supabase as never, { userId }),
    ]);
    portes = {
      sujets: sujetsExplorables().map((s) => ({ ...s, choisi: choisis.includes(s.branche) })), projets,
      // Un sujet mis de côté s'affiche sous son nom ; sans nom lisible, sous rien — jamais sous son identifiant.
      refuses: refuses.map((b) => ({ branche: b, libelle: libelleBranche(b) ?? "" })).filter((x) => x.libelle),
      // D2 : l'entrée « Ton quotidien », facultative ; ce qui a été déclaré y est relu tel quel.
      quotidien: { enonce: ENTREE_QUOTIDIEN.enonce, aide: ENTREE_QUOTIDIEN.aide, aucune: ENTREE_QUOTIDIEN.aucune,
        options: ENTREE_QUOTIDIEN.options.map((o) => ({ ...o })), declarees: Object.fromEntries([...situations].map(([k, v]) => [k, v.vraie])),
        depuis: [...situations.values()].map((v) => v.depuis).sort().at(-1) ?? null },
    };
  } catch (e) {
    console.error("[discovery] portes illisibles", e);
  }

  // ── LES PRÉCISIONS DEMANDÉES : un référent qu'une réponse libre n'a pas identifié. Une lecture
  //    qui échoue n'en affiche aucune, et l'erreur est tracée.
  let clarifications: ClarificationAffichee[] = [];
  try {
    clarifications = (await clarificationsOuvertes(supabase as never, { userId })).map((c) => ({ id: c.id, enonce: c.enonce, nature: c.nature, passage: c.passage, raison: c.raison, choix: [...c.choix], saisieLibre: c.saisieLibre }));
  } catch (e) {
    console.error("[discovery] clarifications illisibles", e);
  }

  // ── L'ENVIE À PROPOSER AU CARNET (décision n° 5) : proposée, jamais ajoutée d'office.
  let envie: { id: string; titre: string } | null = null;
  try { envie = await envieAProposer(supabase as never, { userId }); } catch (e) { console.error("[discovery] envie illisible", e); }

  return (
    <DashboardShell>
      <div className="content-col" data-page-ready="discovery">
        {/* C4 : une section ciblée (nudge, CTA) ouvre DIRECTEMENT sa question */}
        {/* `key` : après un choix de sujet ou de projet, la page est relue et le parcours repart
            de la question que le moteur choisit maintenant. */}
        {/* D13 : rien en attente → une entrée large (choisir, raconter, passer), jamais un « merci »
            pour une réponse qui n'a pas eu lieu, ni un parcours vide. */}
        {initial === null && !sectionKey
          ? <DiscoveryEntree textes={{ ...ENTREE_LARGE }} sujetsDisponibles={!!portes && portes.sujets.length > 0} />
          : <DiscoveryFlow key={initial?.question.question_key ?? "aucune"} initial={initial} mode={mode} skipIntro={!!sectionKey} />}
        {!sectionKey && <DiscoveryEnvie envie={envie} />}
        {!sectionKey && <DiscoveryClarifications clarifications={clarifications} />}
        {portes && !sectionKey && <DiscoveryPortes sujets={portes.sujets} projets={[...portes.projets]} refuses={portes.refuses} quotidien={portes.quotidien} />}
      </div>
    </DashboardShell>
  );
}
