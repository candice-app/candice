import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { envoyerCourriel } from '@/lib/mail/transport';
import { envoyerSousLimite, LimiteEnvoiError } from '@/lib/mail/envoi-limite';
import { construireExport } from '@/lib/account/export';
// ⚠ NON routé par envoyerCourriel : cet envoi porte une PIÈCE JOINTE (l'export RGPD), que l'interface Courriel du
// transport ne prend pas en charge. Router ici dépublierait silencieusement la pièce jointe. À router quand le
// transport saura porter une pièce jointe (décision d'Estelle sur l'interface Courriel).

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;
  const admin = createAdminClient();

  // Un seul constructeur pour les deux routes : complet, paginé, sans les données des autres.
  const exportData = await construireExport(admin, { id: uid, email: user.email, created_at: user.created_at });
  if (exportData.lectures_incompletes.length > 0) {
    // Un export tronqué qui se présenterait comme complet serait pire qu'une erreur.
    console.error('[account/export] lectures incomplètes', exportData.lectures_incompletes.join(' | '));
    return NextResponse.json({ error: "L'export n'a pas pu être constitué en entier. Réessaie dans un instant." }, { status: 500 });
  }

  const json = JSON.stringify(exportData, null, 2);
  const encodedData = Buffer.from(json).toString('base64');

  if (!user.email) return NextResponse.json({ error: 'Email non disponible' }, { status: 400 });

  // Passe par le transport unique, pièce jointe comprise. Le transport LOCAL ne
  // journalise que le nom et la taille de la pièce, jamais son contenu : cet export
  // porte l'intégralité des données de la personne.
  try {
    await envoyerSousLimite(admin, { expediteur: uid, type: 'export', aSoi: true }, {
    to: user.email,
    subject: 'Ton export de données Candice (RGPD)',
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;padding:48px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#FFFCF8;border-radius:12px;border:1px solid #E8DFD4;padding:40px;">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#2C1A0E;margin:0 0 24px;">Candice</p>
    <p style="font-size:14px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0 0 16px;">
      Conformément au RGPD, voici l'ensemble des données que Candice détient sur toi. L'export est joint à cet email au format JSON.
    </p>
    <p style="font-size:12px;font-weight:300;color:#9E7B5A;margin:0;">
      Cet export inclut : ton profil, tes proches et ce que tu as saisi sur eux, tes confidences, tes notes, tes souvenirs, ton Carnet d'envies, ce que Candice a retenu pour toi, tes consentements, les recommandations et l'historique de ton compte. Il n'inclut pas les données qui appartiennent à d'autres personnes ; le fichier dit lesquelles.
    </p>
  </div>
</body></html>`,
    pieces: [{
      nom: `candice-export-${new Date().toISOString().slice(0, 10)}.json`,
      contenuBase64: encodedData,
    }],
    });
  } catch (e) {
    if (e instanceof LimiteEnvoiError) return NextResponse.json({ error: e.message }, { status: 429 });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Export envoyé par email.' });
}
