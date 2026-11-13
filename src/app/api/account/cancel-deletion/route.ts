import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Petite page neutre — identique que le jeton ait été trouvé ou non : on ne révèle jamais à un visiteur
// qu'un compte est (ou n'est pas) en cours de suppression.
function pageNeutre(): Response {
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Candice</title></head>
<body style="background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;padding:48px 16px;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#FFFCF8;border-radius:12px;border:1px solid #E8DFD4;padding:40px;">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#2C1A0E;margin:0 0 20px;">Candice</p>
    <p style="font-size:15px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0;">
      C'est bon : si une suppression était programmée pour ton compte, elle est annulée. Tu peux fermer cette page.
    </p>
  </div>
</body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ANNULATION PAR LIEN COURRIEL — GET, authentifié par JETON STOCKÉ (my_profile.deletion_cancel_token).
//
// ⚠ Un lien GET qui change un état est exposé au PRÉCHARGEMENT : clients mail et navigateurs suivent les liens sans
// qu'on clique. C'est acceptable ICI, et UNIQUEMENT ici, parce que l'action préchargée serait l'ANNULATION — la
// direction protectrice : au pire la suppression est annulée plus tôt que voulu, jamais déclenchée. Un lien GET qui
// DÉCLENCHERAIT une suppression serait inadmissible pour exactement la même raison — que personne ne généralise ce
// motif en croyant suivre un précédent.
//
// Le jeton est consommé UNE SEULE FOIS : nullé dans la MÊME écriture que l'annulation (pas après).
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') ?? '';
  if (!UUID.test(t)) return pageNeutre(); // jeton absent ou malformé : même réponse, aucune écriture

  const admin = createAdminClient();
  // Une seule écriture : annulation + consommation du jeton. Ne matche qu'une demande en cours portant CE jeton.
  const { data: annules, error } = await admin
    .from('my_profile')
    .update({
      subscription_status: 'active',
      cancelled_at: null,
      deletion_scheduled_at: null,
      deletion_cancel_token: null,
    })
    .eq('deletion_cancel_token', t)
    .eq('subscription_status', 'cancelled')
    .select('user_id');
  if (error) console.error('[cancel-deletion GET] my_profile update', error.message);

  const annule = annules?.[0];
  if (annule) {
    const { error: eventError } = await admin.from('account_lifecycle_events').insert({
      user_id: annule.user_id,
      event_type: 'deletion_cancelled',
      previous_status: 'cancelled',
      new_status: 'active',
      triggered_by: 'user',
    });
    if (eventError) console.error('[cancel-deletion GET] account_lifecycle_events insert', eventError.message);
  }

  return pageNeutre();
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('my_profile')
    .select('subscription_status, deletion_scheduled_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile?.subscription_status !== 'cancelled' || !profile?.deletion_scheduled_at) {
    return NextResponse.json({ error: 'Aucune suppression programmée' }, { status: 400 });
  }

  const { error: updateError } = await supabase.from('my_profile').update({
    subscription_status: 'active',
    cancelled_at: null,
    deletion_scheduled_at: null,
  }).eq('user_id', user.id);
  if (updateError) {
    console.error('[cancel-deletion] my_profile update', updateError.message);
    return NextResponse.json({ error: "L'annulation de la suppression a échoué." }, { status: 500 });
  }

  const admin = createAdminClient();
  const { error: eventError } = await admin.from('account_lifecycle_events').insert({
    user_id: user.id,
    event_type: 'deletion_cancelled',
    previous_status: 'cancelled',
    new_status: 'active',
    triggered_by: 'user',
  });
  if (eventError) console.error('[cancel-deletion] account_lifecycle_events insert', eventError.message);

  return NextResponse.json({ success: true });
}
