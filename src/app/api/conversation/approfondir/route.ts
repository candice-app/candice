// POINT D'ENTRÉE RÉEL DE L'APPROFONDISSEMENT.
//
// La personne écrit un récit libre depuis le dashboard (HeroInput / CandiceInput). Jusqu'ici
// /api/confidences répondait une fois et s'arrêtait. Ici Candice mène plusieurs tours : une
// question, la réponse, puis la question suivante CHOISIE d'après cette réponse.
//
// LE FIL VIT CÔTÉ SERVEUR, et ce n'est pas un détail d'implémentation. La validation d'un
// candidat repose sur un SEGMENT qui doit figurer dans les propos. Si le fil arrivait du
// client à chaque appel, un client modifié fabriquerait le récit qui rend n'importe quel
// segment « valide » : le contrôle existerait encore dans le code et ne contrôlerait plus
// rien. Le client n'envoie donc que l'identifiant du fil et la réponse de la personne.
import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  planifierTour, validerCandidats,
  type FilApprofondissement, type Tour, type PersonneDuFil,
} from '@/lib/conversation/approfondissement';
import { persistKnowledge } from '@/lib/knowledge-write/persist';
import { createSourceRecord } from '@/lib/knowledge/sources';
import { createOpenKnowledge } from '@/lib/knowledge/open-knowledge';
import { asSubjectId } from '@/lib/knowledge/identity';
import { normalizeLabel } from '@/lib/knowledge/normalize';
import { JOURNAL_VERSION_STAMP } from '@/lib/knowledge/version';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface LigneFil {
  id: string;
  recit_initial: string;
  tours: Tour[];
  personnes: PersonneDuFil[];
  clos_at: string | null;
}

/** Les mentions d'un récit rapprochées des contacts de la personne. Une mention qui
 *  correspond à PLUSIEURS contacts reste ambiguë — on ne choisit pas pour elle. */
function resoudrePersonnes(texte: string, contacts: { id: string; name: string }[]): PersonneDuFil[] {
  const vus = new Map<string, PersonneDuFil>();
  const plat = texte.toLowerCase();
  for (const c of contacts) {
    const prenom = c.name.split(/\s+/)[0];
    if (!prenom || prenom.length < 2) continue;
    if (!plat.includes(prenom.toLowerCase())) continue;
    const homonymes = contacts.filter((o) => o.name.split(/\s+/)[0].toLowerCase() === prenom.toLowerCase());
    vus.set(prenom.toLowerCase(), {
      mention: prenom,
      contactId: homonymes.length === 1 ? c.id : null,
      ambigu: homonymes.length > 1,
    });
  }
  return [...vus.values()];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { filId?: string; message?: string };
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: 'message requis' }, { status: 400 });

  const admin = createAdminClient();
  const { data: contacts } = await supabase
    .from('contacts').select('id, name').eq('user_id', user.id).is('archived_at', null);
  const listeContacts = (contacts ?? []) as { id: string; name: string }[];

  // ── Charger le fil, ou l'ouvrir. Jamais reconstruit depuis le client.
  let ligne: LigneFil | null = null;
  if (body.filId) {
    const { data } = await supabase
      .from('conversation_threads').select('id, recit_initial, tours, personnes, clos_at')
      .eq('id', body.filId).eq('user_id', user.id).maybeSingle();
    ligne = (data ?? null) as LigneFil | null;
    if (!ligne) return NextResponse.json({ error: 'fil introuvable' }, { status: 404 });
    if (ligne.clos_at) return NextResponse.json({ error: 'fil clos' }, { status: 409 });
  }

  let fil: FilApprofondissement;
  let questionPosee: string | null = null;

  if (!ligne) {
    const personnes = resoudrePersonnes(message, listeContacts);
    const { data, error } = await supabase.from('conversation_threads').insert({
      user_id: user.id, about_kind: 'account', about_id: user.id,
      recit_initial: message, tours: [], personnes,
    }).select('id').single();
    if (error || !data) return NextResponse.json({ error: 'ouverture du fil impossible' }, { status: 500 });
    fil = { filId: data.id, about: { kind: 'account', id: user.id as never }, recitInitial: message, tours: [], personnes };
  } else {
    // La question à laquelle elle répond est la DERNIÈRE que Candice a posée, conservée
    // côté serveur. On ne la prend pas du client : il pourrait en inventer une autre.
    const dernier = (ligne.tours as Tour[]).at(-1);
    questionPosee = dernier && dernier.reponse === '' ? dernier.question : null;
    const tours: Tour[] = questionPosee
      ? [...(ligne.tours as Tour[]).slice(0, -1), { question: questionPosee, reponse: message, ts: new Date().toISOString() }]
      : (ligne.tours as Tour[]);
    const nouvelles = resoudrePersonnes(message, listeContacts);
    const personnes = [...(ligne.personnes as PersonneDuFil[])];
    for (const p of nouvelles) if (!personnes.some((q) => q.mention.toLowerCase() === p.mention.toLowerCase())) personnes.push(p);
    fil = { filId: ligne.id, about: { kind: 'account', id: user.id as never }, recitInitial: ligne.recit_initial, tours, personnes };
  }

  // ── Le modèle propose : une relance, des pistes, des candidats.
  const sortie = await planifierTour(anthropic as never, fil);

  // ── La validation est le SEUL passage vers le journal.
  const verdict = validerCandidats(fil, sortie.candidats);

  // ── Écriture : une source par tour, les candidats retenus en dessous. Un échec
  //    d'écriture ne doit pas emporter la conversation — elle continue, et on le dit.
  let ecrit = 0;
  let incidentEcriture: string | null = null;
  if (verdict.retenus.length > 0) {
    const ts = new Date().toISOString();
    const sourceId = crypto.randomUUID();
    const about = { kind: 'account' as const, id: user.id };
    const source = createSourceRecord({
      about: about as never, ownerId: user.id as never, id: sourceId,
      sourceType: 'conversation', questionText: questionPosee ?? 'récit libre',
      rawText: message, timestamp: ts,
    });
    // Tout ce qui n'a pas de destination structurée sûre part en connaissance ouverte,
    // verbatim (§27.6) : le détail confirmé ne disparaît pas faute de case où le ranger.
    const ouvertes = verdict.retenus.map((c) => createOpenKnowledge({
      about: about as never, ownerId: user.id as never, open_knowledge_id: crypto.randomUUID(),
      type: 'descriptive', subject: asSubjectId(normalizeLabel(c.sujet)), subjectLabel: c.sujet,
      relation: c.portee, context: 'GLOBAL', source: sourceId, timestamp: ts,
      confidence: 'low', assertionStatus: c.provenance === 'narrateur_sur_lui' ? 'explicit' : 'inferred',
      version: JOURNAL_VERSION_STAMP,
    } as never));
    try {
      await persistKnowledge(supabase as never, { source, evidences: [], facts: [], openKnowledge: ouvertes as never });
      ecrit = ouvertes.length;
    } catch (e) {
      incidentEcriture = (e as Error).message;
      console.error('[approfondir] écriture refusée :', incidentEcriture);
    }
  }

  // ── Enregistrer le tour. La relance est stockée avec une réponse VIDE : c'est elle que
  //    le prochain appel viendra compléter, et c'est pourquoi le client n'a pas à la renvoyer.
  const toursEnBase: Tour[] = sortie.relance
    ? [...fil.tours, { question: sortie.relance, reponse: '', ts: new Date().toISOString() }]
    : [...fil.tours];
  await admin.from('conversation_threads').update({
    tours: toursEnBase, personnes: fil.personnes,
    clos_at: sortie.relance ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', fil.filId).eq('user_id', user.id);

  return NextResponse.json({
    filId: fil.filId,
    relance: sortie.relance,
    clos: sortie.relance === null,
    tours: fil.tours.length,
    // Ce qui a été retenu et ce qui a été refusé, avec le motif : la personne — et nous —
    // doit pouvoir voir POURQUOI quelque chose n'a pas été gardé.
    retenus: verdict.retenus.map((c) => ({ sujet: c.sujet, segment: c.segment, portee: c.portee, provenance: c.provenance, destination: c.destination })),
    refuses: verdict.refuses.map((r) => ({ sujet: r.candidat.sujet, motif: r.motif })),
    ecrit,
    ...(incidentEcriture ? { incidentEcriture } : {}),
  });
}
