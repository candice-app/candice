// DIX PROFILS, DE BOUT EN BOUT, LUS PAR CLAUDE — pile locale uniquement.
//
// Ce que l'essai 15 ne pouvait pas faire : il dictait au faux modèle une lecture mécanique
// (« première phrase, famille OTHER ») et cochait les deux premières options de chaque
// question. Il éprouvait la plomberie. Ici, chaque personnage :
//   · répond à l'onboarding EN PERSONNAGE (profils/personnages.json) ;
//   · voit ses réponses libres lues par Claude sous la consigne et le schéma réels
//     (profils/lectures-claude.json), passées par la VRAIE route HTTP ;
//   · répond aux questions que le moteur Discovery lui choisit, EN PERSONNAGE, tour par tour.
// Puis on relit le journal (HSG) de chacun, tel que le portrait le consolide.
//
// CE QUE CELA NE PROUVE PAS : la sortie de l'API de production. Le lecteur est Claude dans
// une session Claude Code, pas un appel `claude-sonnet-4-6` contraint par le schéma d'outil.
//
//   --etape creer                 comptes, onboarding, centres d'intérêt, réponses libres
//   --etape questions [--n 6]     les prochaines questions de chacun → profils/tour.json
//   --etape repondre --fichier F  poste les réponses de F ({ "Sophie": { "<clé>": valeur|[valeurs]|"texte" } })
//   --etape hsg                   le journal de chacun → profils/hsg.json (+ résumé à l'écran)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { compteLocal, pileLocale } from './_compte-local.mts';
import { cookiesDe, poster, obtenirLot, repondre } from './_session-http.mts';
import { VOIX } from './09-faux-comptes.mts';
import { produceSocleAnswer, produceSocleFact } from '../../src/lib/questionnaire/produce-socle.ts';
import { produireInteretsOnboarding } from '../../src/lib/questionnaire/produce-interests.ts';
import { prochainesQuestionsPour } from '../../src/lib/discovery/open-v3/service.ts';
import { lireEtat } from '../../src/lib/discovery/open-v3/etat.ts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';
import { BANQUE } from '../../src/lib/discovery/open-v3/banque.ts';
import { verdictDe } from '../../src/lib/discovery/open-v3/selection.ts';
import { coexistence } from '../../src/lib/discovery/open-v3/coexistence.ts';

const ICI = new URL('./profils/', import.meta.url).pathname;
const lireJson = <T,>(f: string): T => JSON.parse(readFileSync(ICI + f, 'utf8')) as T;
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const etape = arg('etape');
const MODELE = process.env.ANTHROPIC_BASE_URL!;
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const LIBELLES: Record<string, string> = { lecture: 'Lecture', cuisine: 'Cuisine & gastronomie', sport: 'Sport', musique: 'Musique', cinema: 'Ciné & séries', art: 'Art & culture', voyage: 'Voyage', mode: 'Mode & beauté', tech: 'Tech & jeux', nature: 'Nature & jardinage', bienetre: 'Bien-être', deco: 'Déco & maison', vin: 'Vin & spiritueux' };
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Comptes = Record<string, { userId: string; email: string; motDePasse: string }>;
const FICHIER_COMPTES = '/home/claude/pile/profils-comptes.json';

async function session(prenom: string): Promise<{ userId: string; client: SupabaseClient; cookie: string }> {
  const c = (JSON.parse(readFileSync(FICHIER_COMPTES, 'utf8')) as Comptes)[prenom];
  const { url, anon } = pileLocale();
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: c.email, password: c.motDePasse });
  if (error) throw new Error(`connexion ${prenom} : ${error.message}`);
  return { userId: c.userId, client, cookie: await cookiesDe(c.email, c.motDePasse) };
}

if (etape === 'creer') {
  const personnages = lireJson<Record<string, { onboarding: string[]; interets: string[] }>>('personnages.json');
  const lectures = lireJson<Record<string, unknown[]>>('lectures-claude.json');
  const comptes: Comptes = {};
  await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
  for (const voix of VOIX) {
    const p = personnages[voix.prenom];
    const c = await compteLocal(`profil-${sansAccent(voix.prenom)}`);
    comptes[voix.prenom] = { userId: c.userId, email: c.email, motDePasse: c.motDePasse };
    const cookie = await cookiesDe(c.email, c.motDePasse);
    const ts = new Date().toISOString();
    let fermees = 0;
    for (const ref of p.onboarding) fermees += await produceSocleAnswer(c.client as never, { userId: c.userId, selectedOptionRefs: [ref], timestamp: ts });
    const nI = await produireInteretsOnboarding(c.client as never, { userId: c.userId, categories: p.interets.map((id) => ({ id, label: LIBELLES[id] })), timestamp: ts });
    let lus = 0;
    for (const l of voix.libres) {
      const units = lectures[`${voix.prenom}|${l.code}`];
      if (!units) throw new Error(`aucune lecture pour ${voix.prenom}|${l.code}`);
      await produceSocleFact(c.client as never, { userId: c.userId, entries: [{ spec: { factType: l.code, questionText: l.question }, value: l.texte }], timestamp: ts } as never);
      await dicter([{ units }]);
      const r = await poster('/api/knowledge/extract-free-text', cookie, { entries: [{ rawText: l.texte, fieldContext: l.question, questionCode: l.code }], timestamp: ts });
      if (r.status !== 200 || (r.json as { failed?: number }).failed !== 0) throw new Error(`lecture refusée ${voix.prenom}|${l.code} : ${r.status} ${JSON.stringify(r.json)}`);
      lus++;
    }
    console.log(`✓ ${voix.prenom.padEnd(8)} onboarding ${fermees} preuve(s) · ${nI} centre(s) d'intérêt · ${lus} réponse(s) libre(s) lue(s)`);
  }
  writeFileSync(FICHIER_COMPTES, JSON.stringify(comptes, null, 1));
}

if (etape === 'questions') {
  const n = Number(arg('n') ?? 6);
  const tour: Record<string, unknown> = {};
  for (const voix of VOIX) {
    const s = await session(voix.prenom);
    const { etat } = await lireEtat(s.client as never, { userId: s.userId });
    // ADMISSIBLES (la condition est vraie) ≠ PRÉSENTÉES (le lot que la sélection retient).
    const bilan: Record<string, number> = {};
    for (const q of BANQUE) {
      let v: string = etat.dejaPosees.has(q.id) ? 'deja_posee' : verdictDe(q, etat);
      if (v === 'ouvrir') { const c = coexistence(q.id, etat, true); if (!c.poser) v = `coexistence_${c.motif}`; }
      bilan[v] = (bilan[v] ?? 0) + 1;
    }
    const total = bilan.ouvrir ?? 0;
    const qs = (await prochainesQuestionsPour(s.client as never, { userId: s.userId, combien: n })).questions;
    tour[voix.prenom] = { admissibles: total, bilan, branches: [...etat.branchesOuvertes], questions: qs.map((q) => ({ cle: q.question_key, type: q.question_type, texte: q.question_text, options: (q.options ?? []).map((o) => `${o.value}=${o.label}`) })) };
    console.log(`${voix.prenom.padEnd(8)} ${total} admissible(s) ${JSON.stringify(bilan)} · présentées : ${qs.map((q) => q.question_key).join(' ')} · branches : ${[...etat.branchesOuvertes].join(', ') || '—'}`);
  }
  writeFileSync(ICI + (arg('sortie') ?? 'tour.json'), JSON.stringify(tour, null, 1));
}

if (etape === 'repondre') {
  // Les réponses d'un personnage ne partent que pour les questions que le SERVEUR lui propose
  // (lot signé). Une réponse préparée pour une question qu'il ne propose pas n'est pas envoyée :
  // elle est comptée, et dite.
  const fichier = arg('fichier')!;
  const reponses = JSON.parse(readFileSync(existsSync(fichier) ? fichier : ICI + fichier, 'utf8')) as Record<string, Record<string, string | string[] | { texte: string; units: unknown[] }>>;
  let echecs = 0, nonProposees = 0;
  for (const [prenom, parCle] of Object.entries(reponses)) {
    const s = await session(prenom);
    const restantes = new Map(Object.entries(parCle));
    for (let garde = 0; garde < 40 && restantes.size > 0; garde++) {
      let propose = await obtenirLot(s.cookie, 'full');
      let avance = false;
      while (propose && restantes.has(propose.question.question_key)) {
        const cle = propose.question.question_key; const rep = restantes.get(cle)!; restantes.delete(cle);
        let answer: string | string[];
        if (typeof rep === 'object' && !Array.isArray(rep)) { answer = rep.texte; await dicter([{ units: rep.units }]); } else answer = typeof rep === 'string' && propose.question.question_type !== 'text' ? [rep] : rep;
        const r = await repondre(s.cookie, { jeton: propose.jeton, questionKey: cle, answer });
        const src = (await s.client.from('knowledge_sources').select('id').eq('user_id', s.userId).in('question_code', [cle, `discovery.${cle}`])).data ?? [];
        const ev = src.length ? ((await s.client.from('knowledge_evidences').select('target_family, target_construct, preference_value, polarity').in('source_id', src.map((x) => x.id))).data ?? []) : [];
        if (r.status !== 200) echecs++;
        console.log(`${prenom.padEnd(8)} ${cle} → HTTP ${r.status} · ${ev.map((e) => `${e.target_family}:${e.target_construct}${e.preference_value ? '=' + e.preference_value : ''}${e.polarity && e.polarity !== 'positive' ? ' [' + e.polarity + ']' : ''}`).join(' | ') || '(rien d’écrit au journal)'}${r.status !== 200 ? ' ' + (r.motif ?? '') : ''}`);
        avance = true; propose = r.next as typeof propose;
      }
      if (!avance) break;
    }
    if (restantes.size > 0) { nonProposees += restantes.size; console.log(`${prenom.padEnd(8)} ${restantes.size} réponse(s) préparée(s) non envoyée(s) — question non proposée par le serveur : ${[...restantes.keys()].join(' ')}`); }
  }
  console.log(`\n${nonProposees} réponse(s) non envoyée(s), ${echecs} refusée(s).`);
  if (echecs) { console.error(`${echecs} réponse(s) refusée(s)`); process.exit(1); }
}

if (etape === 'hsg') {
  const sortie: Record<string, unknown> = {};
  for (const voix of VOIX) {
    const s = await session(voix.prenom);
    const ev = (await s.client.from('knowledge_evidences').select('*').eq('user_id', s.userId).eq('about_id', s.userId)).data ?? [];
    const ok = (await s.client.from('knowledge_open_knowledge').select('*').eq('user_id', s.userId)).data ?? [];
    const faits = (await s.client.from('knowledge_facts').select('*').eq('user_id', s.userId)).data ?? [];
    const portrait = await lirePortrait(s.client as never, { userId: s.userId });
    // Relevé COMPACT et sans identifiant de compte : ce que le journal dit, pas ses clés techniques.
    const garder = (o: Record<string, unknown>, cles: string[]) => Object.fromEntries(cles.filter((k) => o[k] !== null && o[k] !== undefined && o[k] !== '').map((k) => [k, o[k]]));
    void portrait;
    sortie[voix.prenom] = {
      attendu: voix.attendu,
      preuves: ev.map((e) => garder(e, ['target_family', 'target_construct', 'preference_value', 'polarity', 'relationship', 'relation', 'parent_domain', 'severity', 'strength', 'stability', 'confidence', 'assertion_status', 'source_type', 'superseded_at'])),
      connaissances_ouvertes: ok.map((x) => garder(x, ['subject_label', 'subject', 'relation', 'sensitive', 'assertion_status'])),
      faits: faits.map((f) => garder(f, ['fact_type', 'value', 'superseded_at'])),
    };
    const parFamille: Record<string, number> = {};
    for (const e of ev) parFamille[e.target_family as string] = (parFamille[e.target_family as string] ?? 0) + 1;
    console.log(`${voix.prenom.padEnd(8)} ${ev.length} preuve(s) ${JSON.stringify(parFamille)} · ${ok.length} connaissance(s) ouverte(s) · ${faits.length} fait(s)`);
  }
  writeFileSync(ICI + 'hsg.json', JSON.stringify(sortie, null, 1));
}
