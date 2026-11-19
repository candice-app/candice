// LE RÉGLAGE DU PROCHE — ce qu'un pilote peut utiliser de ses données pour lui trouver des idées.
//
// C'est LE PROCHE qui ouvre ce réglage, depuis son espace (/moi/idees), jamais le pilote qui le
// demande. Si le pilote demandait l'autorisation, un refus serait visible : le proche paierait
// socialement le fait de dire non, et son silence lui-même deviendrait une information. Le pilote
// n'apprend donc jamais si le réglage est actif.
//
// Un accord DISTINCT par personne et par portée : on n'autorise pas « tout le monde » d'un coup.
//
// AUCUN CLIENT PRIVILÉGIÉ (19 nov.). L'écriture passe par `regler_usage` (migration 121), appelée
// dans la session du proche : la fonction vérifie que la fiche est la sienne, et la garde de la base
// (migration 117) atteste elle-même qui accorde. Fonction absente : 503, jamais un repli.
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
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
  // La portée réglée : par défaut « écarter certaines idées » ; sinon UN usage de données par la
  // recommandation. Une portée inconnue est refusée ici, et de nouveau par la base.
  const portee = porteeDemandee ?? PORTEE_EXCLUSIONS_RECO;
  if (portee !== PORTEE_EXCLUSIONS_RECO && !estUsageValide(portee)) {
    return NextResponse.json({ error: 'portée inconnue' }, { status: 400 });
  }

  const { data, error } = await (supabase as unknown as {
    rpc(f: string, a: Record<string, unknown>): Promise<{ data: string[] | null; error: { message: string; code?: string } | null }>;
  }).rpc('regler_usage', { p_contact: contactId, p_portee: portee, p_accorder: action === 'autoriser' });
  if (error) {
    if (/fiche introuvable/.test(error.message)) return NextResponse.json({ error: 'fiche introuvable' }, { status: 404 });
    if (/portée inconnue/.test(error.message)) return NextResponse.json({ error: 'portée inconnue' }, { status: 400 });
    console.error('[consent/exclusions] réglage impossible', error.code ?? '', error.message);
    return NextResponse.json({ error: 'enregistrement impossible' }, { status: 503 });
  }
  return NextResponse.json({ actif: (data ?? []).includes(portee) });
}
