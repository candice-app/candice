// ALLER-RETOUR RÉEL DU JOURNAL — écriture par le vrai chemin, relecture par le vrai lecteur.
//
// À EXÉCUTER UNIQUEMENT une fois la pile locale montée (01-monter-la-pile.sh).
// Tant que Docker et le CLI Supabase ne sont pas là, ce scénario est EN ATTENTE : il ne
// prouve rien d'autre que lui-même, et surtout pas le comportement réel de PostgREST.
//
//   export SUPABASE_URL=http://127.0.0.1:54321
//   export SUPABASE_SERVICE_ROLE_KEY=…        # tapée par Estelle, jamais lue d'un fichier
//   npx tsx scripts/local/02-journal-aller-retour.mts
//
// Ce que le scénario prouve, et que le banc en mémoire ne peut pas prouver :
//   · la pagination RÉELLE de PostgREST (plafond, effet de `order` côté serveur) ;
//   · l'égalité des signaux après une vraie écriture puis une vraie relecture ;
//   · que les formats de date écrits en base ressortent dans une forme qui s'ordonne juste.
import { createClient } from '@supabase/supabase-js';
import { persistKnowledge } from '../../src/lib/knowledge-write/persist';
import { readJournalEvidences } from '../../src/lib/knowledge/read-journal';
import { consolidateInterests } from '../../src/lib/knowledge/consolidate';
import { createSourceRecord } from '../../src/lib/knowledge/sources';
import type { InterestEvidence } from '../../src/lib/knowledge';
import { exigerLocal } from './_garde-locale.mjs';

const URL = process.env.SUPABASE_URL ?? '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!URL || !KEY) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (tape-les, ne les commite pas)');
// Hôte EXACT, protocole et port — pas une recherche de « localhost » dans la chaîne.
exigerLocal({ nom: 'API Supabase', url: URL, port: 54321 });

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

// ÉCRITURE SOUS L'IDENTITÉ DE LA PERSONNE, jamais sous service_role.
// `persist_journal` est SECURITY INVOKER et FORCE user_id = auth.uid() : sans personne
// connectée, il n'y a pas d'auth.uid(), et la fonction n'est de toute façon pas accordée
// à service_role. Écrire comme l'application écrit est non seulement nécessaire, c'est la
// seule façon d'éprouver aussi la RLS au passage.
async function clientDeLaPersonne(email: string, motDePasse: string) {
  const anon = createClient(URL, process.env.SUPABASE_ANON_KEY ?? '', { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: motDePasse });
  if (error || !data.session) throw new Error(`connexion du compte fictif : ${error?.message}`);
  return createClient(URL, process.env.SUPABASE_ANON_KEY ?? '', {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

const N_PREUVES = 1200;   // > plafond PostgREST (1000)
const N_SOURCES = 250;    // > lot d'identifiants (200)

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const ko = (m: string) => { console.error(`\n\x1b[31mÉCHEC — ${m}\x1b[0m`); process.exit(1); };

// Trois formes du MÊME instant : la persistance les accepte, l'ordre doit rester juste.
const FORMES = ['2026-11-01T09:30:00Z', '2026-11-01T09:30:00.000Z', '2026-11-01T10:30:00+01:00'];

async function main() {
  console.log('═══ compte fictif ═══');
  const email = `journal-${Date.now()}@essai.local`;
  const motDePasse = crypto.randomUUID();
  const { data: u, error: eu } = await admin.auth.admin.createUser({
    email, password: motDePasse, email_confirm: true,
  });
  if (eu || !u.user) return ko(`création du compte fictif : ${eu?.message}`);
  const userId = u.user.id;
  const personne = await clientDeLaPersonne(email, motDePasse);
  ok(`compte ${email} · ${userId} · connecté`);

  console.log('═══ écriture : 250 sources, 1 200 preuves ═══');
  const attendu: InterestEvidence[] = [];
  for (let s = 0; s < N_SOURCES; s++) {
    // Les preuves d'une source partagent SON instant (invariant tenu par persistKnowledge).
    // On fait varier la FORME d'une source à l'autre, et deux sources tombent au même instant.
    const forme = FORMES[s % FORMES.length];
    const ts = s < 3 ? forme                                   // 3 premières : même instant, 3 formes
                     : new Date(Date.UTC(2026, 10, 1, 9, 30, 0) + s * 60000).toISOString();
    const sourceId = crypto.randomUUID();
    const about = { kind: 'account' as const, id: userId as never };
    const source = createSourceRecord({
      about, ownerId: userId as never, id: sourceId,
      sourceType: 'onboarding_closed', questionText: 'q', rawText: 'r', timestamp: ts,
    });
    const evs: InterestEvidence[] = [];
    const combien = Math.floor(N_PREUVES / N_SOURCES) + (s < N_PREUVES % N_SOURCES ? 1 : 0);
    for (let k = 0; k < combien; k++) {
      evs.push({
        about, ownerId: userId, evidence_id: crypto.randomUUID(), source_id: sourceId,
        source_type: 'onboarding_closed', raw_information: `sujet ${s}`, confidence: 'low',
        context: 'GLOBAL', timestamp: ts, stability: 'contextual', evidence_role: 'primary',
        assertionBasis: 'self_report', target_family: 'INTEREST',
        subject: `sujet-${s}`, subjectLabel: `sujet ${s}`, target_construct: `sujet-${s}`,
        // relationship EXIGÉ par ev_interest_shape (migration 82, l.103) — voir la sonde 04.
        relationship: 'passion',
        strength: 'moderate', version: { ontology_version: '1', hsg_version: '1' },
      } as unknown as InterestEvidence);
    }
    await persistKnowledge(personne as never, { source, evidences: evs });
    attendu.push(...evs);
  }
  ok(`${attendu.length} preuves écrites par persistKnowledge (RPC persist_journal)`);
  if (attendu.length !== N_PREUVES) return ko(`${attendu.length} preuves construites au lieu de ${N_PREUVES}`);

  console.log('═══ relecture par le lecteur Candice ═══');
  // Relecture sous la MÊME identité : on éprouve la RLS dans les deux sens.
  const relu = await readJournalEvidences(personne as never, { userId });

  if (relu.length !== N_PREUVES) return ko(`${relu.length} preuves relues au lieu de ${N_PREUVES} — PAGINATION`);
  ok(`${relu.length} preuves relues`);

  const idsRelus = relu.map((e) => e.evidence_id);
  if (new Set(idsRelus).size !== idsRelus.length) return ko('DOUBLONS à la relecture — pagination sans ordre stable');
  ok('aucun doublon');

  const manquants = attendu.map((e) => e.evidence_id).filter((id) => !new Set(idsRelus).has(id));
  if (manquants.length) return ko(`${manquants.length} identifiants manquants, p. ex. ${manquants[0]}`);
  ok('aucun identifiant manquant');

  if (new Set(relu.map((e) => e.source_id)).size !== N_SOURCES) return ko('sources réhydratées incomplètes');
  ok(`${N_SOURCES} sources réhydratées (plus d'un lot d'identifiants)`);

  console.log('═══ égalité des signaux ═══');
  const scope = { about: { kind: 'account', id: userId }, ownerId: userId } as never;
  // `lastUpdated` se compare par INSTANT, comme le consolidateur : PostgreSQL peut rendre
  // le même instant dans une autre forme (« +00:00 » au lieu de « Z », millisecondes), et
  // comparer la chaîne brute déclarerait un échec là où il n'y en a pas.
  const sigs = (evs: readonly InterestEvidence[]) =>
    new Map(consolidateInterests(scope, evs).map((s) => {
      if (s.lastUpdated === null) throw new Error(`${s.subject} : lastUpdated absent`);
      const t = Date.parse(s.lastUpdated);
      if (Number.isNaN(t)) throw new Error(`${s.subject} : lastUpdated illisible « ${s.lastUpdated} »`);
      return [String(s.subject), {
        score: s.score, confidence: s.confidence,
        evidenceCount: s.evidenceCount, instant: t,
        evidenceIds: [...s.evidenceIds].sort().join(','),
        contexts: [...s.contexts].sort().join(','),
        stability: s.stability, globalStatus: s.globalStatus,
      }];
    }));
  const avant = sigs(attendu);
  const apres = sigs(relu as InterestEvidence[]);

  // Les ENSEMBLES DE CLÉS se comparent dans LES DEUX SENS : un construct apparu après
  // relecture est aussi grave qu'un construct disparu, et une comparaison de tailles
  // laisserait passer les deux à la fois.
  const disparus = [...avant.keys()].filter((k) => !apres.has(k));
  const apparus = [...apres.keys()].filter((k) => !avant.has(k));
  if (disparus.length) return ko(`${disparus.length} constructs disparus, p. ex. ${disparus[0]}`);
  if (apparus.length) return ko(`${apparus.length} constructs APPARUS après relecture, p. ex. ${apparus[0]}`);
  ok(`${avant.size} constructs des deux côtés, mêmes clés`);

  const divergents = [...avant.keys()].filter(
    (k) => JSON.stringify(avant.get(k)) !== JSON.stringify(apres.get(k)));
  if (divergents.length) {
    for (const k of divergents.slice(0, 5)) {
      console.error(`    ${k}`);
      console.error(`      avant : ${JSON.stringify(avant.get(k))}`);
      console.error(`      après : ${JSON.stringify(apres.get(k))}`);
    }
    return ko(`${divergents.length} constructs divergent entre avant écriture et après relecture`);
  }
  ok('score, confiance, nombre, instant, identifiants, contextes, stabilité, portée : identiques');

  console.log('═══ formes de date et instants égaux ═══');
  const troisPremiers = relu.filter((e) => ['sujet-0', 'sujet-1', 'sujet-2'].includes(String(e.target_construct)));
  const instants = new Set(troisPremiers.map((e) => Date.parse(e.timestamp)));
  if (instants.size !== 1) return ko(`les trois formes du même instant ne se relisent pas égales : ${[...instants]}`);
  ok('trois formes écrites, un seul instant relu');

  console.log('═══ ménage ═══');
  const { error: ed } = await admin.auth.admin.deleteUser(userId);
  if (ed) console.warn(`  ⚠ compte fictif non supprimé (${ed.message}) — à retirer à la main : ${userId}`);
  else ok('compte fictif supprimé');
  console.log('\n\x1b[32mALLER-RETOUR PROUVÉ\x1b[0m');
}
main().catch((e) => ko(e instanceof Error ? e.message : String(e)));
