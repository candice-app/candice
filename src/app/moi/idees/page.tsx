import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import ReglagesIdees, { type Pilote } from "./ReglagesIdees";
import { USAGE_GOUTS } from "@/lib/consent/usage-profil";

// « CE QUE TES PROCHES PEUVENT UTILISER POUR TE TROUVER DES IDÉES » — l'écran du proche.
//
// Décision du 19 nov. (point 10) : la personne doit pouvoir ACCORDER ou RETIRER `reco:gouts`,
// pilote par pilote. Lecture et écriture dans SA session : `mes_autorisations_d_usage()` et la route
// /api/consent/exclusions (→ `regler_usage`, migration 121). Aucun client privilégié. Ce qui est
// affiché vient de la base, jamais d'une supposition : sans lecture, l'écran le dit.
export default async function IdeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/moi/idees");

  let pilotes: Pilote[] | null = null;
  const { data, error } = await (supabase as unknown as {
    rpc(f: string): Promise<{ data: { contact_id: string; pilote_prenom: string | null; portees: string[] | null }[] | null; error: { message: string } | null }>;
  }).rpc("mes_autorisations_d_usage");
  if (error) console.error("[moi/idees] lecture des autorisations impossible", error.message);
  else pilotes = (data ?? []).map((l) => ({ contactId: l.contact_id, prenom: l.pilote_prenom ?? "", gouts: (l.portees ?? []).includes(USAGE_GOUTS) }));

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 40, paddingBottom: 48 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28, color: "var(--ink)", letterSpacing: "-.016em", marginBottom: 12 }}>
          Les idées qu’on te destine
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 24 }}>
          Les personnes qui t’ont ajouté(e) à leur carnet peuvent demander à Candice des idées pour toi. Ici, tu choisis, pour chacune, si ce que tu as dit aimer ou souhaiter peut inspirer ces idées.
          Elles ne voient ni tes réponses, ni ce réglage&nbsp;: une idée ainsi inspirée ne dit pas d’où elle vient.
        </p>
        {pilotes === null
          ? <p role="alert" style={{ fontSize: 14, color: "#8a2c1d" }}>Tes réglages n’ont pas pu être lus. Rien n’a été modifié&nbsp;; réessaie dans un instant.</p>
          : <ReglagesIdees pilotes={pilotes} />}
      </div>
    </DashboardShell>
  );
}
