// B.2 Phase 6 — Y répond à « X veut voir ton profil. Que partages-tu ? »
// 1) tout · 2) sections choisies (socle verrouillé) · 3) rien de visible
// mais Candice peut aider (aveugle) · refuser.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import V4Shell from "@/components/layout/V4Shell";
import DemandeClient from "./DemandeClient";

export default async function DemandePage({
  params,
}: {
  params: Promise<{ consentId: string }>;
}) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/moi/partage/demandes/${consentId}`);

  // La demande doit me concerner en tant que partageur (RLS pilote_manage_consents)
  const { data: consent } = await supabase
    .from("contact_consents")
    .select("id, status, requested_by")
    .eq("id", consentId)
    .eq("kind", "profile_view")
    .eq("pilote_id", user.id)
    .maybeSingle();

  if (!consent) {
    return (
      <V4Shell active="profile">
        <StateMessage
          title="Demande introuvable."
          body="Ce lien ne correspond à aucune demande te concernant."
        />
      </V4Shell>
    );
  }

  let requesterFirstName = "Quelqu'un";
  if (consent.requested_by) {
    const admin = createAdminClient();
    const { data: { user: requester } } = await admin.auth.admin.getUserById(consent.requested_by as string);
    requesterFirstName = (requester?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Quelqu'un";
  }

  if (consent.status !== "pending") {
    return (
      <V4Shell active="profile">
        <StateMessage
          title="Tu as déjà répondu."
          body={consent.status === "rejected"
            ? `La demande de ${requesterFirstName} a été refusée.`
            : `Ton choix de partage avec ${requesterFirstName} est déjà enregistré.`}
        />
      </V4Shell>
    );
  }

  return (
    <V4Shell active="profile">
      <DemandeClient consentId={consent.id} requesterFirstName={requesterFirstName} />
    </V4Shell>
  );
}

function StateMessage({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--ink)", lineHeight: 1.4, marginBottom: 10 }}>
        {title}
      </p>
      <p style={{ fontSize: 13.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 20 }}>
        {body}
      </p>
      <Link href="/moi" style={{ fontSize: 13, fontWeight: 600, color: "var(--pine)", textDecoration: "none", display: "inline-flex", minHeight: 44, alignItems: "center" }}>
        Retour à ma fiche →
      </Link>
    </div>
  );
}
