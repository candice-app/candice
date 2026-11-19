// ESSAI DU VÉRITABLE EXTRACTEUR, SUR DONNÉES FICTIVES — préparé le 19 nov., à lancer par Estelle.
//
// Ce que les autres essais ne prouvent pas : partout ailleurs, le modèle est SIMULÉ (on lui dicte
// sa lecture). Ici, les mêmes fonctions de l'application appellent le vrai modèle, avec la vraie
// consigne et le vrai schéma, sur des réponses INVENTÉES. On compare ce qui s'écrit à ce qui doit
// s'écrire — y compris les cas où RIEN ne doit s'écrire (négation, autre personne, passé,
// condition, ironie).
//
// SÉCURITÉ, et elle est structurelle :
//   · AUCUNE BASE : les écritures vont dans une base EN MÉMOIRE (la même que les essais unitaires).
//     Le script n'importe aucun client Supabase ; il ne peut ni lire ni écrire la production.
//   · LA CLÉ reste dans l'environnement du processus. Le script ne l'affiche jamais, ne l'écrit
//     dans aucun fichier, et refuse de démarrer si elle est absente — ou si l'adresse du modèle
//     pointe le faux modèle local (l'essai ne prouverait rien).
//   · LES DONNÉES sont fictives : aucun compte, aucune personne réelle.
//
// LANCEMENT (Terminal du Mac, dans ~/candice, après `npm install`) :
//     read -s ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY      ← la clé se tape sans s'afficher
//     npx tsx scripts/local/34-essai-extracteur-reel.mts
//     unset ANTHROPIC_API_KEY
// Le rapport s'écrit dans docs/discovery/essai-extracteur-reel.json (sans la clé, sans en-tête).
// Coût : une vingtaine d'appels courts au modèle.
import { writeFileSync } from 'node:fs';
import { fausseBase } from '../../src/lib/knowledge/__tests__/fausse-base.ts';
import { enregistrerReponseOuverte } from '../../src/lib/discovery/open-v3/service.ts';
import { MODELE_DESTINATIONS } from '../../src/lib/discovery/open-v3/destinations.ts';

if (!process.env.ANTHROPIC_API_KEY) { console.error('ARRÊT — aucune clé dans l’environnement. Voir l’en-tête du script.'); process.exit(2); }
if (process.env.ANTHROPIC_BASE_URL && /127\.0\.0\.1|localhost/.test(process.env.ANTHROPIC_BASE_URL)) {
  console.error('ARRÊT — ANTHROPIC_BASE_URL pointe un modèle local : l’essai doit parler au vrai modèle.'); process.exit(2);
}
console.log(`clé présente : oui (jamais affichée) · modèle des destinations : ${MODELE_DESTINATIONS}\n`);

type Base = ReturnType<typeof fausseBase>;
const preuves = (b: Base) => (b.tables.knowledge_evidences ?? []) as Record<string, unknown>[];
const faits = (b: Base) => ((b.tables.knowledge_facts ?? []) as Record<string, unknown>[]).filter((f) => String(f.fact_type).startsWith('discovery.fait.') || String(f.fact_type).startsWith('discovery.envie'));
const ouvertes = (b: Base) => (b.tables.knowledge_open_knowledge ?? []) as Record<string, unknown>[];
const resume = (b: Base) => ({
  preuves: preuves(b).map((e) => `${e.target_family}:${e.subject_label ?? e.target_construct}${e.polarity && e.polarity !== 'positive' ? ` [${e.polarity}]` : ''}${e.stability ? ` (${e.stability})` : ''}`),
  faits: faits(b).map((f) => `${f.fact_type}=${String(f.value).slice(0, 80)}`),
  ouvertes: ouvertes(b).map((o) => String(o.subject_label ?? o.subject)),
});
const contient = (liste: string[], mot: string) => liste.some((x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(mot));

interface Cas { id: string; question: string; texte: string; attendu: string; juger: (r: ReturnType<typeof resume>, brut: unknown) => boolean }
const RIEN = (r: ReturnType<typeof resume>) => r.preuves.length === 0 && r.faits.length === 0;
const CAS: Cas[] = [
  // ── Onglet 17, learning2.1459 « Quels sujets t’intéressent ponctuellement ? » ───────────────
  { id: 'sujet-present', question: 'learning2.1459', texte: 'En ce moment la géologie, et un peu l’histoire des cartes anciennes.',
    attendu: 'deux intérêts (géologie, histoire des cartes), stabilité contextual', juger: (r) => contient(r.preuves, 'geologie') && contient(r.preuves, 'cartes') && r.preuves.every((p) => p.includes('contextual')) },
  { id: 'sujet-nie', question: 'learning2.1459', texte: 'La géologie ne m’intéresse pas du tout, contrairement à ce qu’on croit.', attendu: 'rien (négation)', juger: RIEN },
  { id: 'sujet-autre-personne', question: 'learning2.1459', texte: 'Mon frère est passionné de géologie, moi je l’écoute.', attendu: 'rien (autre personne)', juger: RIEN },
  { id: 'sujet-passe', question: 'learning2.1459', texte: 'J’adorais la géologie quand j’étais petite.', attendu: 'rien (passé)', juger: RIEN },
  { id: 'sujet-condition', question: 'learning2.1459', texte: 'Si j’avais le temps, peut-être la géologie.', attendu: 'rien (condition)', juger: RIEN },
  { id: 'sujet-ironie', question: 'learning2.1459', texte: 'La géologie, passionnant, vraiment… je plaisante.', attendu: 'rien (ironie dite)', juger: RIEN },
  // ── Onglet 17, CRE-06 « une technique, un style ou une matière que tu n’aimes vraiment pas » ─
  { id: 'rejet-technique-style', question: 'CRE-06', texte: 'Je n’aime vraiment pas le macramé, et le style shabby chic me hérisse.',
    attendu: 'deux rejets (technique, style), stabilité undetermined', juger: (r) => r.preuves.length >= 2 && r.preuves.every((p) => p.includes('[rejet]') && p.includes('undetermined')) },
  { id: 'rejet-inverse', question: 'CRE-06', texte: 'Franchement j’adore le macramé, je n’ai rien contre aucune technique.', attendu: 'rien (aucun rejet dit)', juger: RIEN },
  // ── Onglet 17, comics.0422 « titres, auteurs » ───────────────────────────────────────────────
  { id: 'auteur-et-titre', question: 'comics.0422', texte: 'Tout ce que fait Moebius, et la série Blacksad.',
    attendu: 'un fait auteur (Moebius) ; le titre écrit comme référent ou mis en clarification, jamais inventé', juger: (r) => contient(r.faits, 'moebius') },
  { id: 'auteur-nie', question: 'comics.0422', texte: 'Pas Moebius, je n’ai jamais accroché.', attendu: 'rien (négation)', juger: RIEN },
  // ── Onglet 17, time.1566 et drinks.2102 (projection déclarée) ────────────────────────────────
  { id: 'projection', question: 'time.1566', texte: 'L’an prochain, j’aimerais prendre un mois entier pour marcher jusqu’à Compostelle.', attendu: 'un fait de projection', juger: (r) => r.faits.length >= 1 },
  { id: 'projection-autre', question: 'time.1566', texte: 'Ma sœur veut partir un mois à Compostelle.', attendu: 'rien (autre personne)', juger: RIEN },
  // ── Contrat dédié food2.0882A (envie culinaire) ──────────────────────────────────────────────
  { id: 'envie', question: 'food2.0882A', texte: 'J’ai très envie de ramen tonkotsu en ce moment.', attendu: 'une envie, à proposer au Carnet (rien ajouté d’office)', juger: (r, brut) => (brut as { envie?: { ecrite: boolean } }).envie?.ecrite === true },
  { id: 'pas-envie', question: 'food2.0882A', texte: 'Rien de particulier, je mange de tout.', attendu: 'aucune envie', juger: (_r, brut) => (brut as { envie?: { ecrite: boolean } }).envie?.ecrite !== true },
];

const resultats: { id: string; question: string; texte: string; attendu: string; observe: unknown; conforme: boolean; erreur?: string }[] = [];
let n = 0;
for (const c of CAS) {
  const b = fausseBase();
  const userId = `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  try {
    const brut = await enregistrerReponseOuverte(b.client, { userId, questionId: c.question, texte: c.texte, acteId: `essai-${c.id}` });
    const r = resume(b);
    const enAttente = (brut as { extractionEnAttente?: boolean }).extractionEnAttente === true;
    const conforme = !enAttente && c.juger(r, brut);
    resultats.push({ id: c.id, question: c.question, texte: c.texte, attendu: c.attendu, observe: { ...r, extractionEnAttente: enAttente, releve: (brut as { destinations?: { releve: unknown } }).destinations?.releve }, conforme });
    console.log(`${conforme ? '✓' : '✗'} ${c.id.padEnd(22)} ${c.attendu}\n    observé : ${JSON.stringify(r)}${enAttente ? ' — LECTURE EN ATTENTE (le modèle n’a pas répondu)' : ''}`);
  } catch (e) {
    resultats.push({ id: c.id, question: c.question, texte: c.texte, attendu: c.attendu, observe: null, conforme: false, erreur: e instanceof Error ? e.message.replace(/sk-ant-[A-Za-z0-9_-]+/g, '[clé masquée]') : 'erreur' });
    console.log(`✗ ${c.id} : erreur ${resultats.at(-1)!.erreur}`);
  }
}
const ok = resultats.filter((r) => r.conforme).length;
writeFileSync('docs/discovery/essai-extracteur-reel.json', JSON.stringify({
  date: new Date().toISOString(), modele_destinations: MODELE_DESTINATIONS, cas: resultats.length, conformes: ok,
  note: 'Vrai modèle, données fictives, base en mémoire. Aucune clé ni en-tête dans ce fichier.', resultats,
}, null, 1));
console.log(`\n${ok}/${resultats.length} conformes. Rapport : docs/discovery/essai-extracteur-reel.json`);
process.exit(ok === resultats.length ? 0 : 1);
