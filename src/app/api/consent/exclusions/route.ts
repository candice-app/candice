// LE RÉGLAGE DE THIBAUD — « écarter certaines idées pour moi ».
//
// C'est LE PROCHE qui ouvre ce réglage, depuis son espace, jamais le pilote qui le demande.
// Si le pilote demandait l'autorisation, un refus serait visible : le proche paierait
// socialement le fait de dire non, et son silence lui-même deviendrait une information.
// Le pilote n'apprend donc jamais si le réglage est actif. C'est la seule disposition où
// « la comparaison reste privée » tient complètement.
//
// Un accord DISTINCT par personne : on n'autorise pas « tout le monde » d'un coup.
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { accorder, retirer, type EtatConsentement } from '@/lib/consent/portees';
import { PORTEE_EXCLUSIONS_RECO } from '@/lib/recommendations/declarations-proche';
import { estUsageValide } from '@/lib/consent/usage-profil';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId, action, portee: porteeDemandee } = await req.json().catch(() => ({})) as
    { contactId?: string; action?: 'autoriser' | 'retirer'; portee?: string };
  if (!contactId || (action !== 'autoriser' && action !== 'retirer')) {
    return NextResponse.json({ error: 'contactId et action requis' }, { status: 400 });
  }
  // La portée réglée : par défaut « écarter certaines idées » ; sinon UN usage de données par
  // la recommandation (une allergie précise, le régime…). Une portée inconnue est refusée :
  // on n'écrit pas dans un consentement un mot que personne ne sait lire.
  const portee = porteeDemandee ?? PORTEE_EXCLUSIONS_RECO;
  if (portee !== PORTEE_EXCLUSIONS_RECO && !estUsageValide(portee)) {
    return NextResponse.json({ error: 'portée inconnue' }, { status: 400 });
  }

  const admin = createAdminClient();

  // La fiche doit être CELLE DE LA PERSONNE QUI DEMANDE. Sans ce contrôle, n'importe qui
  // pourrait accorder — ou retirer — un consentement au nom d'un autre.
  const { data: contact, error: eC } = await admin
    .from('contacts').select('id, user_id, proche_user_id')
    .eq('id', contactId).eq('proche_user_id', user.id).maybeSingle();
  if (eC) return NextResponse.json({ error: 'lecture impossible' }, { status: 500 });
  if (!contact) return NextResponse.json({ error: 'fiche introuvable' }, { status: 404 });

  const piloteId = contact.user_id as string;
  const { data: existante, error: eK } = await admin
    .from('contact_consents').select('id, scope, status')
    .eq('pilote_id', piloteId).eq('contact_id', contactId).eq('status', 'active').maybeSingle();
  if (eK) return NextResponse.json({ error: 'lecture impossible' }, { status: 500 });

  const avant: EtatConsentement | null = existante
    ? { scope: (existante.scope as string[]) ?? [], status: existante.status as EtatConsentement['status'] }
    : null;
  // Le retrait porte sur CETTE portée seulement : si la même ligne couvre d'autres usages,
  // ils sont préservés (voir portees.ts).
  const apres = action === 'autoriser'
    ? accorder(avant, portee)
    : retirer(avant, portee);

  if (existante) {
    const { error } = await admin.from('contact_consents').update({
      scope: apres.scope, status: apres.status,
      responded_at: new Date().toISOString(),
      ...(action === 'autoriser' ? { consented_at: new Date().toISOString() } : {}),
      // LA PREUVE : c'est CETTE personne, dont l'identité vient d'être vérifiée, qui accorde.
      granted_by: user.id, granted_at: new Date().toISOString(),
    }).eq('id', existante.id);
    if (error) return NextResponse.json({ error: 'enregistrement impossible' }, { status: 500 });
  } else if (action === 'autoriser') {
    const { error } = await admin.from('contact_consents').insert({
      pilote_id: piloteId, contact_id: contactId, proche_user_id: user.id,
      status: 'active', scope: apres.scope,
      responded_at: new Date().toISOString(), consented_at: new Date().toISOString(),
      granted_by: user.id,
    });
    if (error) return NextResponse.json({ error: 'enregistrement impossible' }, { status: 500 });
  }
  // Retrait sans ligne existante : rien à faire, et surtout pas une ligne « revoked »
  // fabriquée pour l'occasion, qui laisserait croire qu'un accord a existé.

  return NextResponse.json({ actif: apres.scope.includes(portee) });
}
