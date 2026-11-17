// VÉRIFICATION DU RADAR DÉRIVÉ DU JOURNAL — exécutable sans vitest (node --experimental-strip-types).
//
// Ce fichier n'existe pas pour faire plaisir : il éprouve la règle qui décide de tout le
// module — UNKNOWN N'EST PAS LOW. Un radar qui rend 0 pour « rien de connu » fait dire à
// Candice « la surprise ne lui parle pas » d'une personne qui n'en a jamais parlé.
//
// Chaque cas ASSERTE. Aucun ne se contente de décrire ce qu'il observe : un contrôle qui
// raconte au lieu d'exiger laisse passer exactement ce qu'il prétend surveiller.
import { radarDuPortrait, attentionDuPortrait, ceQuiMarcheDuPortrait } from '../../src/lib/profile/portrait-vers-synthese.ts';

const MODALITES = ['WORDS', 'SERVICES', 'PERSONALIZED_GIFT', 'SYMBOLIC_GIFT',
                   'QUALITY_TIME', 'MICRO_ATTENTIONS', 'SURPRISE'] as const;

let echecs = 0;
function exige(condition: boolean, quoi: string) {
  if (condition) { console.log(`  ✓ ${quoi}`); return; }
  console.error(`  ✗ ÉCHEC — ${quoi}`);
  echecs++;
}

/** Vecteur d'affection VIDE : les 7 modalités présentes, aucune établie. C'est l'état réel
 *  d'une personne qui n'a pas répondu — pas un vecteur absent. */
const vecteurVide = () =>
  Object.fromEntries(MODALITES.map((m) => [m, { score: 'unknown', evidenceCount: 0, confidence: 'none' }]));

function portrait(p: Record<string, unknown> = {}) {
  return {
    scope: { about: { kind: 'account', id: 'u' }, ownerId: 'u' },
    nbPreuves: 0,
    profile: [], interests: [], entities: [], preferences: [], behaviors: [],
    guardrails: [], needs: [], drivers: [], contexts: [],
    affection: { receive: vecteurVide(), give: vecteurVide() },
    ...p,
  } as never;
}
const sig = (score: string, n = 1, direction?: string) =>
  ({ score, evidenceCount: n, confidence: 'medium', ...(direction ? { direction } : {}) });

// ── 1. RIEN DE CONNU → RIEN D'AFFIRMÉ. La règle qui porte le module. ────────
{
  console.log('\n1. Portrait vide — UNKNOWN n\'est pas LOW');
  const r = radarDuPortrait(portrait());
  const dims = ['precision', 'emotion', 'surprise', 'esthetique', 'utilite', 'temps', 'discretion'] as const;
  exige(dims.every((d) => r[d] === null), 'les 7 dimensions valent null, pas 0');
  exige(dims.every((d) => r.fondeSur[d] === 0), 'aucune dimension ne prétend reposer sur une preuve');
  const m = ceQuiMarcheDuPortrait(portrait());
  exige(Object.values(m).every((v) => v === null), '« ce qui marche » est muet, jamais « faible »');
}

// ── 2. UNE SEULE DIMENSION FONDÉE N'EN FONDE PAS D'AUTRES. ──────────────────
{
  console.log('\n2. Une seule modalité connue');
  const r = radarDuPortrait(portrait({
    affection: { receive: { ...vecteurVide(), QUALITY_TIME: sig('high', 3) }, give: vecteurVide() },
  }));
  exige(r.temps !== null && r.temps > 50, 'le temps partagé monte quand il est établi');
  exige(r.precision === null, 'la précision reste muette : rien ne la fonde');
  exige(r.fondeSur.temps === 3, 'le nombre de preuves est celui du journal, pas un arrondi');
}

// ── 3. LE CAS SOPHIE : deux refus de surprise, aucune appétence déclarée. ───
//     Le journal dit « surprise : non ». L'extraction du week-end du Jura dit
//     ENTITY/LOVE. Le radar doit suivre le journal structuré, pas le mot de surface.
{
  console.log('\n3. Garde-fous anti-surprise (cas Sophie)');
  const r = radarDuPortrait(portrait({
    guardrails: [
      { code: 'GRD_SCHEDULE_DISRUPTION', ...sig('high', 1) },
      { code: 'GRD_PUBLIC_EXPOSURE', ...sig('high', 1) },
    ],
    profile: [{ construct: 'PROFILE_STRUCTURE', ...sig('high', 3, 'positive') }],
  }));
  exige(r.surprise !== null && r.surprise < 40, `la surprise descend franchement (obtenu : ${r.surprise})`);
  exige(r.fondeSur.surprise === 5, 'les preuves des garde-fous ET du trait sont comptées');
  exige(r.emotion === null, 'l\'émotion reste muette : aucun garde-fou ne la concerne');
}

// ── 4. UN GARDE-FOU DANS DEUX CONTEXTES EST MIEUX ÉTABLI, JAMAIS MOINS. ────
{
  console.log('\n4. Même garde-fou, deux contextes');
  const un = radarDuPortrait(portrait({ guardrails: [{ code: 'GRD_PUBLIC_EXPOSURE', ...sig('medium', 1) }] }));
  const deux = radarDuPortrait(portrait({ guardrails: [
    { code: 'GRD_PUBLIC_EXPOSURE', ...sig('medium', 1) },
    { code: 'GRD_PUBLIC_EXPOSURE', ...sig('high', 2) },
  ] }));
  exige(deux.fondeSur.discretion > un.fondeSur.discretion, 'deux contextes pèsent plus de preuves qu\'un');
  exige(deux.discretion !== null && un.discretion !== null && deux.discretion >= un.discretion,
        'la répétition ne peut pas affaiblir le signal');
}

// ── 5. PAS DE CONTRASTE SANS LES DEUX CÔTÉS. ───────────────────────────────
{
  console.log('\n5. Contraste reçu / donné');
  const seulementRecu = attentionDuPortrait(portrait({
    affection: { receive: { ...vecteurVide(), WORDS: sig('high', 2) }, give: vecteurVide() },
  }));
  exige(seulementRecu.contraste === null, 'sans le donné, le contraste est une question sans réponse (null, pas false)');
  exige(seulementRecu.recues[0] === 'WORDS', 'la modalité reçue est bien classée');
  exige(seulementRecu.donnees.length === 0, 'le donné n\'est JAMAIS déduit du reçu (R5)');

  const lesDeux = attentionDuPortrait(portrait({
    affection: {
      receive: { ...vecteurVide(), WORDS: sig('high', 2) },
      give: { ...vecteurVide(), SERVICES: sig('high', 2) },
    },
  }));
  exige(lesDeux.contraste === true, 'elle reçoit par les mots et donne par les services : écart');
}

// ── 6. UNE DIRECTION NÉGATIVE TIRE VERS LE BAS, ELLE NE DISPARAÎT PAS. ─────
{
  console.log('\n6. Direction du trait');
  const pos = radarDuPortrait(portrait({ profile: [{ construct: 'IMPORTANCE_FUNCTIONAL', ...sig('high', 2, 'positive') }] }));
  const neg = radarDuPortrait(portrait({ profile: [{ construct: 'IMPORTANCE_FUNCTIONAL', ...sig('high', 2, 'negative') }] }));
  exige(pos.utilite !== null && neg.utilite !== null && pos.utilite > neg.utilite,
        'le même trait, dit dans l\'autre sens, ne donne pas le même nombre');
  exige(neg.fondeSur.utilite === 2, 'une direction négative reste une connaissance, donc des preuves');
}

// ── 7. LE POIDS NÉGATIF ORIENTE, IL N'ALLÈGE PAS. ──────────────────────────
//     Un contributeur de poids -2 doit compter autant dans la normalisation qu'un +2.
//     S'il allégeait le dénominateur, une seule contrariété ferait basculer la dimension.
{
  console.log('\n7. Normalisation par l\'amplitude du poids');
  const r = radarDuPortrait(portrait({
    affection: { receive: { ...vecteurVide(), QUALITY_TIME: sig('high', 1) }, give: vecteurVide() },
    profile: [{ construct: 'APPETENCE_OBJECT', ...sig('high', 1, 'positive') }],
  }));
  exige(r.temps !== null && r.temps > 50 && r.temps < 100,
        `l'appétence pour l'objet tempère le temps sans l'annuler (obtenu : ${r.temps})`);
}

console.log(echecs === 0
  ? '\nOK — 0 échec. UNKNOWN reste UNKNOWN.'
  : `\n${echecs} ÉCHEC(S).`);
process.exit(echecs === 0 ? 0 : 1);
