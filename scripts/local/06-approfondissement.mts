// L'ÉCHANGE COMPLET — du récit libre jusqu'à ce que le moteur propose ou écarte.
//
// Ce que cet essai prouve, et qu'aucun test unitaire ne peut prouver :
//   · plusieurs tours menés à partir d'un seul récit, la relance choisie d'après la réponse ;
//   · ce qui est RETENU et ce qui est REFUSÉ, avec le segment qui l'étaye et son motif ;
//   · ce qui est réellement ÉCRIT en base, et relu ;
//   · le cas décisif : je dis « il a adoré », Thibaud a déclaré qu'il déteste, et
//     l'activité est écartée — sans que rien de ce qu'il a déclaré ne me revienne.
//
// Le modèle est SIMULÉ : les relances sont écrites à la main pour que l'échange soit
// reproductible. Le bilan le dit explicitement — une relance simulée et une relance
// réellement produite par le modèle n'ont pas la même valeur de preuve, et les confondre
// rendrait ce bilan faux. TOUT LE RESTE est réel : vraie base, vraie écriture, vraie
// relecture, vraie lecture autorisée.
//
//   bash scripts/local/00-lancer.sh echange
import { createClient } from '@supabase/supabase-js';
import { persistKnowledge } from '../../src/lib/knowledge-write/persist';
import { readJournalEvidences } from '../../src/lib/knowledge/read-journal';
import { createSourceRecord } from '../../src/lib/knowledge/sources';
import { validerCandidats, matiereDuFil, type FilApprofondissement, type SortieDeTour } from '../../src/lib/conversation/approfondissement';
import { lireRejetsDuProche, PORTEE_EXCLUSIONS_RECO } from '../../src/lib/recommendations/declarations-proche';
import { candidateRejectedBy } from '../../src/lib/recommendations/rejection-match';
import { exigerLocal } from './_garde-locale.mjs';

const URL = process.env.SUPABASE_URL ?? '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!URL || !KEY) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
exigerLocal({ nom: 'API Supabase', url: URL, port: 54321 });
const admin = createClient(URL, KEY, { auth: { persistSession: false } });

const V = '\x1b[32m', R = '\x1b[31m', J = '\x1b[33m', N = '\x1b[0m', G = '\x1b[2m';
const ok = (m: string) => console.log(`  ${V}✓${N} ${m}`);
const non = (m: string) => console.log(`  ${R}✗${N} ${m}`);
const titre = (m: string) => console.log(`\n${J}═══ ${m} ═══${N}`);
let echecs = 0;
const exiger = (c: boolean, m: string) => { if (c) ok(m); else { non(m); echecs++; } };

async function compte(prefixe: string) {
  const email = `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@essai.local`;
  const motDePasse = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`compte ${prefixe} : ${error?.message}`);
  const anon = createClient(URL, process.env.SUPABASE_ANON_KEY ?? '', { auth: { persistSession: false } });
  const { data: s, error: e2 } = await anon.auth.signInWithPassword({ email, password: motDePasse });
  if (e2 || !s.session) throw new Error(`connexion ${prefixe} : ${e2?.message}`);
  const client = createClient(URL, process.env.SUPABASE_ANON_KEY ?? '', {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${s.session.access_token}` } },
  });
  return { id: data.user.id, email, client };
}

// ── L'ÉCHANGE, tour par tour. Les relances sont écrites à la main (modèle SIMULÉ) ──────
const RECIT = 'J’ai fait du pain au levain avec Thibaud ce week-end. J’ai détesté.';

const TOURS: { question: string; reponse: string; sortie: SortieDeTour }[] = [
  {
    question: 'Qu’est-ce qui t’a déplu ?',
    reponse: 'Attendre entre chaque étape. Pétrir, par contre, j’ai adoré.',
    sortie: {
      relance: 'Tu fais parfois du pain autrement ?',
      pistes: ['un goût plus large pour la cuisine ?', 'ce que Thibaud en a pensé'],
      candidats: [
        { segment: 'Attendre entre chaque étape', sujet: 'attente entre les étapes', aQuiCaSeRapporte: { kind: 'account', mention: null }, provenance: 'narrateur_sur_lui', destination: 'OPEN_KNOWLEDGE', portee: 'l’attente DANS cette recette — ni le pain, ni la cuisine' },
        { segment: 'Pétrir, par contre, j’ai adoré', sujet: 'pétrir', aQuiCaSeRapporte: { kind: 'account', mention: null }, provenance: 'narrateur_sur_lui', destination: 'INTEREST', portee: 'le pétrissage' },
      ],
    },
  },
  {
    question: 'Tu fais parfois du pain autrement ?',
    reponse: 'Oui, du pain rapide presque tous les dimanches.',
    sortie: {
      relance: 'Et Thibaud, ça lui a plu de le faire avec toi ?',
      pistes: ['distinguer le plaisir de faire et celui de partager'],
      candidats: [
        { segment: 'du pain rapide presque tous les dimanches', sujet: 'pain rapide', aQuiCaSeRapporte: { kind: 'account', mention: null }, provenance: 'narrateur_sur_lui', destination: 'FACT', portee: 'le pain rapide — PAS le levain' },
        // Le modèle tente une généralisation : les propos ne l'étayent pas.
        { segment: 'elle aime beaucoup la cuisine en général', sujet: 'cuisine', aQuiCaSeRapporte: { kind: 'account', mention: null }, provenance: 'narrateur_sur_lui', destination: 'INTEREST', portee: 'en général' },
      ],
    },
  },
  {
    question: 'Et Thibaud, ça lui a plu de le faire avec toi ?',
    reponse: 'Il avait l’air content.',
    sortie: {
      relance: 'Il te l’a dit, ou c’est l’impression que tu as eue ?',
      pistes: ['séparer mon impression de ses mots'],
      candidats: [
        { segment: 'Il avait l’air content', sujet: 'faire du pain', aQuiCaSeRapporte: { kind: 'contact', mention: 'Thibaud' }, provenance: 'narrateur_impression', destination: 'INTEREST', portee: 'faire du pain' },
      ],
    },
  },
  {
    question: 'Il te l’a dit, ou c’est l’impression que tu as eue ?',
    reponse: 'C’est l’impression que j’ai eue. On n’en a pas reparlé.',
    sortie: { relance: null, pistes: [], candidats: [] }, // s'arrêter est une réponse valable
  },
];

async function main() {
  titre('comptes');
  const pilote = await compte('pilote');
  const thibaud = await compte('thibaud');
  ok(`pilote ${pilote.id.slice(0, 8)} · Thibaud ${thibaud.id.slice(0, 8)}`);

  const { data: contact, error: eC } = await admin.from('contacts')
    .insert({ user_id: pilote.id, name: 'Thibaud', relationship: 'conjoint', proche_user_id: thibaud.id })
    .select('id').single();
  if (eC || !contact) { non(`contact : ${eC?.message}`); return fin(); }
  ok(`fiche « Thibaud » reliée à son compte`);

  // ── 1. L'ÉCHANGE ────────────────────────────────────────────────────────────────────
  titre('1. l’échange — plusieurs tours à partir d’un seul récit');
  console.log(`  ${G}Elle${N} — ${RECIT}`);
  let fil: FilApprofondissement = {
    filId: crypto.randomUUID(), about: { kind: 'account', id: pilote.id as never },
    recitInitial: RECIT, tours: [],
    personnes: [{ mention: 'Thibaud', contactId: contact.id, ambigu: false }],
  };
  const retenus: typeof TOURS[number]['sortie']['candidats'][number][] = [];

  for (const t of TOURS) {
    console.log(`  ${G}Candice${N} — ${t.question}`);
    console.log(`  ${G}Elle${N} — ${t.reponse}`);
    fil = { ...fil, tours: [...fil.tours, { question: t.question, reponse: t.reponse, ts: new Date().toISOString() }] };
    const v = validerCandidats(fil, t.sortie.candidats);
    for (const c of v.retenus) { retenus.push(c); console.log(`      ${V}retenu${N}  ${c.destination.padEnd(14)} « ${c.segment} »  → portée : ${c.portee}`); }
    for (const r of v.refuses) console.log(`      ${R}refusé${N}  ${r.motif.padEnd(14)} « ${r.candidat.segment} »`);
    if (t.sortie.pistes.length) console.log(`      ${G}pistes (n’écrivent rien) : ${t.sortie.pistes.join(' · ')}${N}`);
    if (t.sortie.relance === null) console.log(`      ${G}le fil s’arrête : elle n’a rien à ajouter${N}`);
  }

  titre('2. ce que la validation a tenu, et pourquoi');
  exiger(!retenus.some((c) => c.sujet === 'cuisine'),
    'la généralisation « elle aime la cuisine en général » est REFUSÉE : aucun segment ne l’étaye');
  exiger(!retenus.some((c) => c.aQuiCaSeRapporte.kind === 'contact'),
    'mon impression sur Thibaud n’écrit RIEN sur sa fiche');
  exiger(retenus.some((c) => c.portee.includes('PAS le levain')),
    'la fréquence reste rattachée au pain rapide, pas au levain');
  exiger(retenus.some((c) => c.destination === 'OPEN_KNOWLEDGE' && c.portee.includes('ni le pain')),
    'le rejet garde sa portée réelle : l’attente, pas le pain ni la cuisine');
  exiger(matiereDuFil(fil).includes('presque tous les dimanches') && !matiereDuFil(fil).includes('Qu’est-ce qui t’a déplu'),
    'un segment ne peut être tiré que des PROPOS, jamais des questions de Candice');

  // ── 3. CE QUI EST RÉELLEMENT ÉCRIT ──────────────────────────────────────────────────
  titre('3. écriture réelle en base, puis relecture');
  const ts = new Date().toISOString();
  const sourceId = crypto.randomUUID();
  const about = { kind: 'account' as const, id: pilote.id };
  const source = createSourceRecord({
    about: about as never, ownerId: pilote.id as never, id: sourceId,
    sourceType: 'conversation', questionText: 'récit libre', rawText: RECIT, timestamp: ts,
  });
  const interet = retenus.find((c) => c.destination === 'INTEREST');
  const evidences = interet ? [{
    about, ownerId: pilote.id, evidence_id: crypto.randomUUID(), source_id: sourceId,
    source_type: 'conversation', raw_information: interet.segment, confidence: 'low',
    context: 'GLOBAL', timestamp: ts, stability: 'contextual', evidence_role: 'primary',
    assertionBasis: 'self_report', assertionStatus: 'explicit', target_family: 'INTEREST',
    subject: 'petrir', subjectLabel: interet.sujet, target_construct: 'petrir',
    strength: 'moderate', version: { ontology_version: '1', hsg_version: '1' },
    // relationship ABSENT : l'intérêt est établi, le DEGRÉ ne l'est pas.
  }] : [];

  let ecrit = false;
  try {
    await persistKnowledge(pilote.client as never, { source, evidences: evidences as never, facts: [], openKnowledge: [] });
    ecrit = true;
    ok(`${evidences.length} preuve(s) écrite(s)`);
  } catch (e) {
    const m = (e as Error).message;
    if (/ev_interest_shape/.test(m)) {
      console.log(`  ${J}ATTENDU — ÉCRITURE REFUSÉE${N} : ev_interest_shape exige relationship NON NUL.`);
      console.log(`  ${G}L’intérêt EST établi par les propos, le degré ne l’est PAS. La base refuse donc`);
      console.log(`  d’enregistrer ce que la conversation a appris. C’est exactement la contrainte dont`);
      console.log(`  le traitement attend l’accord d’Estelle — la preuve est ici, par exécution.${N}`);
    } else { non(`écriture : ${m}`); echecs++; }
  }

  if (ecrit) {
    const relu = await readJournalEvidences(pilote.client as never, { userId: pilote.id });
    exiger(relu.length === evidences.length, `${relu.length} preuve(s) relue(s) par le lecteur Candice`);
  }

  // ── 4. LE CAS DÉCISIF ───────────────────────────────────────────────────────────────
  titre('4. le cas décisif — « il a adoré » contre ce que Thibaud a déclaré');

  const tsT = new Date().toISOString();
  const srcT = crypto.randomUUID();
  const aboutT = { kind: 'account' as const, id: thibaud.id };
  await persistKnowledge(thibaud.client as never, {
    source: createSourceRecord({ about: aboutT as never, ownerId: thibaud.id as never, id: srcT, sourceType: 'user_declaration', questionText: 'q', rawText: 'je déteste faire du pain', timestamp: tsT }),
    evidences: [{
      about: aboutT, ownerId: thibaud.id, evidence_id: crypto.randomUUID(), source_id: srcT,
      source_type: 'user_declaration', raw_information: 'je déteste faire du pain', confidence: 'high',
      context: 'GLOBAL', timestamp: tsT, stability: 'stable', evidence_role: 'primary',
      assertionBasis: 'self_report', assertionStatus: 'explicit', target_family: 'ENTITY',
      entity_id: 'faire-du-pain', entityLabel: 'faire du pain', entityType: 'activity',
      target_construct: 'faire-du-pain', relation: 'DISLIKE', strength: 'strong',
      version: { ontology_version: '1', hsg_version: '1' },
    }] as never, facts: [], openKnowledge: [],
  }).then(() => ok('Thibaud a déclaré, sur SON compte, qu’il déteste faire du pain'))
    .catch((e) => { non(`déclaration de Thibaud : ${(e as Error).message}`); echecs++; });

  const IDEE = 'Un atelier pour faire du pain au levain à deux';

  // 4a — sans consentement
  const sans = await lireRejetsDuProche(admin as never, { piloteId: pilote.id, contactId: contact.id });
  exiger(sans.autorise === false && sans.motif === 'aucun_consentement' && sans.rejets.length === 0,
    `sans consentement : aucune donnée de Thibaud employée (motif « ${sans.motif} »)`);
  exiger(candidateRejectedBy(IDEE, sans.rejets) === null,
    '→ l’idée N’EST PAS écartée : son rejet n’est pas utilisable, et mon impression seule ne suffit pas');

  // 4b — avec consentement portant la bonne portée
  const { error: eK } = await admin.from('contact_consents').insert({
    pilote_id: pilote.id, contact_id: contact.id, proche_user_id: thibaud.id,
    status: 'active', scope: ['analysis', PORTEE_EXCLUSIONS_RECO], consented_at: new Date().toISOString(),
  });
  if (eK) { non(`consentement : ${eK.message}`); echecs++; }
  const avec = await lireRejetsDuProche(admin as never, { piloteId: pilote.id, contactId: contact.id });
  exiger(avec.autorise && avec.rejets.length === 1, `avec consentement : ${avec.rejets.length} rejet lu`);
  exiger(candidateRejectedBy(IDEE, avec.rejets) !== null,
    `→ « ${IDEE} » est ÉCARTÉE, malgré mon impression positive`);
  exiger(candidateRejectedBy('Un concert de jazz', avec.rejets) === null,
    '→ une idée étrangère au rejet passe : l’exclusion ne déborde pas');

  // 4c — rien de ce qu'il a déclaré ne me revient
  const fuite = JSON.stringify(avec);
  exiger(!fuite.includes('déteste') && !/passion|LOVE|LIKE/.test(fuite),
    'rien de ce qu’il AIME ne sort du module : seuls ses rejets, et seulement pour retirer');

  // 4d — retrait
  await admin.from('contact_consents').update({ status: 'revoked' }).eq('contact_id', contact.id);
  const apres = await lireRejetsDuProche(admin as never, { piloteId: pilote.id, contactId: contact.id });
  exiger(apres.autorise === false && apres.rejets.length === 0,
    `après retrait : effet immédiat, plus aucune donnée employée (motif « ${apres.motif} »)`);

  await admin.auth.admin.deleteUser(pilote.id).catch(() => {});
  await admin.auth.admin.deleteUser(thibaud.id).catch(() => {});
  fin();
}

function fin() {
  titre('bilan');
  console.log(`  ${G}Relances : SIMULÉES (écrites à la main, pour que l’échange soit reproductible).`);
  console.log(`  Écritures, relectures, lectures autorisées : RÉELLES, base locale.`);
  console.log(`  Les deux n’ont pas la même valeur de preuve.${N}`);
  if (echecs === 0) console.log(`\n${V}ÉCHANGE COMPLET PROUVÉ${N}`);
  else { console.log(`\n${R}${echecs} contrôle(s) en échec${N}`); process.exitCode = 1; }
}

main().catch((e) => { console.error(e); process.exit(1); });
