// LES PHRASES DE LA PAGE D'ANALYSE, DÉRIVÉES DU JOURNAL.
//
// CE QU'ELLES ÉTAIENT. Un répertoire de phrases déclenché par des seuils d'axes
// (`temperament_axes`, `lifestyle_axes`) et des drapeaux de `relational_filters` — la
// projection legacy. Elles alimentent le prompt qui écrit la fiche : c'est donc la matière
// même de ce que Candice dit de la personne.
//
// ─────────────────────────────────────────────────────────────────────────────────────
// LE DÉFAUT DE FOND, LE MÊME QUE POUR LE RADAR : ZÉRO N'EST PAS « ÉQUILIBRÉ ».
//
// L'ancien code écrivait « équilibre entre proximité et autonomie » quand l'axe valait
// entre -30 et +30 — y compris quand il valait 0 parce que RIEN n'avait été renseigné.
// Candice affirmait un équilibre chez quelqu'un dont elle ne savait rien, et la phrase
// était indiscernable d'un équilibre réellement constaté.
//
// Ici, une absence ne produit AUCUNE phrase. Une fiche plus courte est une fiche honnête ;
// une fiche complète par comblement ne l'est pas. C'est la règle 7b appliquée à la prose :
// la profondeur suit la connaissance.
// ─────────────────────────────────────────────────────────────────────────────────────
//
// SECOND DÉFAUT CORRIGÉ EN PASSANT : l'ancien chemin lisait `singularity_answers` BRUT —
// envies, cadeaux refusés, ce qu'on évite — en contournant le filtre de visibilité du
// journal. Une réponse libre marquée sensible à l'écriture (santé, allergie, adresse)
// repassait donc par là. Ici, rien n'est lu hors du portrait.
import type { Portrait } from '@/lib/knowledge/portrait';

export interface PhrasesDuJournal {
  /** Ce qui la touche. Vide si le journal n'en dit rien. */
  readonly touche: readonly string[];
  /** Ce qu'il vaut mieux éviter — refus RELATIONNELS. Les contraintes pratiques (santé,
   *  régime, mobilité) n'entrent JAMAIS ici : la fiche est partageable. */
  readonly eviter: readonly string[];
  readonly styleRelationnel: readonly string[];
  readonly communication: readonly string[];
  readonly attentionsIdeales: readonly string[];
  readonly attentionsAEviter: readonly string[];
  readonly gouts: readonly string[];
  /** Combien de preuves soutiennent ces phrases, au total. 0 = Candice ne sait rien. */
  readonly nbPreuves: number;
}

type Signal = { score: string; evidenceCount: number; direction?: string };

/** Établi = au moins une preuve et un score qui n'est pas « inconnu ». */
const etabli = (s: Signal | undefined): boolean =>
  !!s && s.evidenceCount > 0 && s.score !== 'unknown';
/** Marqué = établi ET fort. Ce qui est seulement présent ne se raconte pas comme marquant. */
const marque = (s: Signal | undefined): boolean => etabli(s) && s!.score === 'high';
/** Orienté positivement : une direction `negative` dit le contraire, pas une absence. */
const positif = (s: Signal | undefined): boolean => etabli(s) && s!.direction !== 'negative';
const negatif = (s: Signal | undefined): boolean => etabli(s) && s!.direction === 'negative';

function index(p: Portrait) {
  const profil = new Map<string, Signal>();
  let energie: { position: number | null; evidenceCount: number } | null = null;
  for (const s of p.profile) {
    if ('position' in s) energie = { position: (s as { position: number | null }).position, evidenceCount: s.evidenceCount };
    else profil.set(String((s as { construct: string }).construct), s as unknown as Signal);
  }
  return {
    P: (c: string) => profil.get(c),
    energie,
    besoin: new Map(p.needs.map((s) => [String(s.construct), s as unknown as Signal])),
    moteur: new Map(p.drivers.map((s) => [String(s.construct), s as unknown as Signal])),
    garde: new Set(p.guardrails.map((s) => String(s.code))),
    comportements: p.behaviors,
    recoit: p.affection.receive,
    prefs: new Map(p.preferences.map((s) => [String(s.path), s])),
  };
}

/** Les modalités reçues les mieux établies, les plus fortes d'abord. */
function modalitesRecues(p: Portrait): string[] {
  const rang = { high: 3, medium: 2, low: 1, unknown: 0 } as const;
  return Object.entries(p.affection.receive)
    .filter(([, s]) => etabli(s as unknown as Signal))
    .sort((a, b) => (rang[(b[1] as unknown as Signal).score as keyof typeof rang] ?? 0)
                  - (rang[(a[1] as unknown as Signal).score as keyof typeof rang] ?? 0))
    .map(([m]) => m);
}

const TOUCHE_PAR_MODALITE: Record<string, string> = {
  WORDS: 'les mots sincères, dits au bon moment',
  SERVICES: 'les gestes concrets, l’aide qui arrive sans qu’on la demande',
  PERSONALIZED_GIFT: 'un cadeau pensé pour elle, pas pour n’importe qui',
  SYMBOLIC_GIFT: 'un cadeau qui porte une histoire ou un sens',
  QUALITY_TIME: 'le temps partagé, la présence disponible',
  MICRO_ATTENTIONS: 'les petites attentions du quotidien',
  SURPRISE: 'l’initiative et l’inattendu',
};
const IDEAL_PAR_MODALITE: Record<string, string> = {
  WORDS: 'un mot écrit, choisi, qui dit précisément ce qu’on a remarqué chez elle',
  SERVICES: 'prendre en charge quelque chose qui lui pèse, sans qu’elle ait à le demander',
  PERSONALIZED_GIFT: 'un objet choisi pour elle, avec la précision qui prouve l’attention',
  SYMBOLIC_GIFT: 'un objet qui porte une histoire commune',
  QUALITY_TIME: 'un moment réservé, sans rien d’autre à faire pendant ce temps-là',
  MICRO_ATTENTIONS: 'un petit geste régulier, plutôt qu’un grand geste rare',
  SURPRISE: 'une initiative qu’elle n’a pas eu à organiser',
};

/** Garde-fous → ce qu'il vaut mieux éviter. Seuls les refus RELATIONNELS. */
const EVITER_PAR_GARDE: Record<string, string> = {
  GRD_PUBLIC_EXPOSURE: 'les surprises ou les attentions devant du monde',
  GRD_TOO_MANY_PEOPLE: 'les moments où il y a trop de monde',
  GRD_FORCED_SOCIALIZATION: 'les situations sociales dont on ne peut pas sortir',
  GRD_SCHEDULE_DISRUPTION: 'ce qui bouscule son organisation sans prévenir',
  GRD_LAST_MINUTE: 'le dernier moment, décidé sans elle',
  GRD_LOSS_OF_CONTROL: 'les moments où elle ne décide plus de rien',
  GRD_TOO_INTIMATE: 'ce qui va trop loin dans l’intime',
  GRD_TOO_EMOTIONAL: 'ce qui demande plus d’émotion qu’elle n’en veut montrer',
  GRD_SENTIMENTAL_OVERLOAD: 'la charge sentimentale appuyée',
  GRD_NOISE: 'le bruit',
  GRD_CROWD: 'la foule',
  GRD_STRONG_SMELL: 'les odeurs fortes',
  GRD_LOW_QUALITY: 'ce qui est bâclé',
  GRD_POOR_EXECUTION: 'une bonne idée mal exécutée',
  GRD_IMPERSONAL: 'ce qui est impersonnel',
  GRD_GENERIC: 'ce qui aurait pu être fait pour n’importe qui',
  GRD_TOO_INTRUSIVE: 'ce qui entre sans frapper',
  GRD_STYLE_MISMATCH: 'ce qui ne ressemble pas à son style',
};

const GOUT_PAR_CONSTRUCT: Record<string, string> = {
  IMPORTANCE_AESTHETIC: 'sensible au beau',
  IMPORTANCE_FUNCTIONAL: 'attachée à l’usage et à la praticité',
  IMPORTANCE_AUTHENTICITY: 'attachée au vrai, au caractère, à l’origine',
  APPETENCE_PREMIUM: 'sensible à la qualité et au soin',
  APPETENCE_EXPERIENCE: 'préfère vivre les choses que les posséder',
  APPETENCE_OBJECT: 'attachée aux objets qui durent',
  APPETENCE_SPONTANEITY: 'aime ce qui n’était pas prévu',
  IMPORTANCE_MASTERY: 'sensible au métier et au savoir-faire',
};

/**
 * Traduit le portrait en phrases. AUCUNE phrase pour ce que le journal ne dit pas.
 *
 * Les libellés sont au féminin par défaut, comme le répertoire d'origine ; c'est le prompt
 * qui applique le genre grammatical de la personne — on ne le décide pas ici.
 */
export function phrasesDuJournal(p: Portrait): PhrasesDuJournal {
  const { P, energie, besoin, moteur, garde, comportements, prefs } = index(p);

  // ── CE QUI LA TOUCHE : d'abord ses modalités reçues, puis ce que le journal ajoute.
  const touche: string[] = [];
  for (const m of modalitesRecues(p).slice(0, 2)) {
    if (TOUCHE_PAR_MODALITE[m]) touche.push(TOUCHE_PAR_MODALITE[m]);
  }
  if (marque(P('PROFILE_SENSITIVITY'))) touche.push('les détails — un rien manqué peut peser, un rien juste peut tout changer');
  if (marque(P('PROFILE_EXACTINGNESS'))) touche.push('la qualité d’exécution — une attention soignée touche plus qu’une grande');
  if (etabli(besoin.get('NEED_SEEN_UNDERSTOOD'))) touche.push('se sentir vraiment écoutée, pas seulement entendue');
  if (etabli(besoin.get('NEED_CONNECTION'))) touche.push('les échanges profonds, davantage que les interactions de surface');
  if (etabli(besoin.get('NEED_TRUST'))) touche.push('la constance — savoir qu’on peut compter sur quelqu’un');
  if (etabli(moteur.get('DRV_ATTENTIVENESS'))) touche.push('ce qui montre qu’on l’a écoutée');

  // ── CE QU'IL VAUT MIEUX ÉVITER : les garde-fous, tels qu'ils ont été déclarés.
  //    Les contraintes pratiques (santé, régime, mobilité) n'entrent pas : la fiche est
  //    partageable, et elles vivent dans le bloc d'infos pratiques, sous cadenas.
  const eviter: string[] = [];
  for (const code of garde) {
    const phrase = EVITER_PAR_GARDE[code];
    if (phrase && !eviter.includes(phrase)) eviter.push(phrase);
  }
  if (etabli(besoin.get('NEED_FREEDOM'))) eviter.push('se sentir envahie ou trop sollicitée');
  if (etabli(besoin.get('NEED_RHYTHM_RESPECT'))) eviter.push('ce qui ne respecte pas son rythme');

  // ── STYLE RELATIONNEL. Rien quand rien n'est établi : pas de phrase « équilibrée ».
  const styleRelationnel: string[] = [];
  if (positif(P('PROFILE_AUTONOMY'))) styleRelationnel.push('besoin d’espace et d’autonomie marqué dans les relations');
  if (positif(P('PROFILE_RELATIONALITY'))) styleRelationnel.push('accorde une place structurelle aux relations');
  if (energie && energie.position !== null && energie.evidenceCount > 0) {
    if (energie.position <= 1) styleRelationnel.push('énergie plutôt intérieure — préfère les petits groupes au grand bruit');
    else if (energie.position >= 3) styleRelationnel.push('se nourrit de la compagnie des autres');
  }
  if (positif(P('PROFILE_STRUCTURE'))) styleRelationnel.push('attachée à la régularité et aux repères');
  if (positif(P('PROFILE_OPENNESS'))) styleRelationnel.push('curieuse, attirée par ce qu’elle ne connaît pas encore');

  // ── COMMUNICATION. Les comportements CONSTATÉS, nommés tels quels (règle 7a) : un
  //    comportement est un fait observé, pas un trait à interpréter.
  const communication: string[] = [];
  const canal = prefs.get('PREFERENCE.communication.channel');
  if (canal) communication.push(`canal préféré : ${canal.value}`);
  const style = prefs.get('PREFERENCE.communication.style');
  if (style) communication.push(`manière de communiquer : ${style.value}`);
  for (const b of comportements) {
    if (!etabli(b as unknown as Signal)) continue;
    const ctx = String(b.behaviorContext);
    const motif = String(b.pattern).replace(/_/g, ' ');
    if (ctx === 'conflict_response') communication.push(`face au désaccord : ${motif}`);
    else if (ctx === 'stress_response') communication.push(`sous stress : ${motif}`);
    else if (ctx === 'decision_process') communication.push(`pour décider : ${motif}`);
    else if (ctx === 'emotional_expression') communication.push(`exprime ses émotions : ${motif}`);
  }
  if (positif(P('PROFILE_REFLECTIVENESS'))) communication.push('prend le temps d’analyser avant de conclure');

  // ── ATTENTIONS IDÉALES : dérivées des modalités reçues, affinées par les goûts établis.
  const attentionsIdeales: string[] = [];
  for (const m of modalitesRecues(p).slice(0, 3)) {
    let idee = IDEAL_PAR_MODALITE[m];
    if (!idee) continue;
    if (m === 'QUALITY_TIME' && marque(P('APPETENCE_EXPERIENCE'))) {
      idee = 'une expérience vécue ensemble, qu’elle aura envie de raconter';
    } else if (m === 'PERSONALIZED_GIFT' && marque(P('APPETENCE_PREMIUM'))) {
      idee = 'un cadeau précis et de qualité — qui dit clairement qu’on a fait attention';
    }
    attentionsIdeales.push(idee);
  }
  // Les INTÉRÊTS du journal, nommés tels quels : jamais interprétés (règle 7a).
  const interets = p.interests.filter((i) => etabli(i as unknown as Signal)).slice(0, 3);
  if (interets.length > 0) {
    attentionsIdeales.push(`quelque chose lié à ce qui l’occupe : ${interets.map((i) => i.subjectLabel).join(', ')}`);
  }

  // ── ATTENTIONS À ÉVITER : les entités réellement évitées, et rien d'autre.
  const attentionsAEviter: string[] = [];
  for (const e of p.entities) {
    if (e.relation === 'AVOID' || e.relation === 'DISLIKE') attentionsAEviter.push(e.entityLabel);
  }
  if (garde.has('GRD_GENERIC') || garde.has('GRD_IMPERSONAL')) {
    attentionsAEviter.push('les gestes génériques, qui auraient pu être faits pour n’importe qui');
  }

  // ── GOÛTS : les orientations établies, sans seuil inventé.
  const gouts: string[] = [];
  for (const [construct, phrase] of Object.entries(GOUT_PAR_CONSTRUCT)) {
    if (positif(P(construct))) gouts.push(phrase);
    else if (negatif(P(construct))) gouts.push(`peu sensible à ce que « ${phrase} » décrit`);
  }

  return {
    touche, eviter, styleRelationnel, communication,
    attentionsIdeales, attentionsAEviter, gouts,
    nbPreuves: p.nbPreuves,
  };
}

/**
 * LES CONTRAINTES PRATIQUES — jamais dans un texte, jamais partagées.
 *
 * Régime, alcool, allergies, mobilité. Elles viennent de `practical_info.vetos`, structuré,
 * et PAS du journal : ce sont des faits d'usage que Candice connaît pour AGIR (écarter un
 * restaurant, choisir un lieu accessible), pas pour en parler. Elles alimentent `constraints`,
 * qui n'est pas dans le select partagé.
 *
 * La séparation est STRUCTURELLE, pas lexicale : un filtre par mot-clé sur « allergie »
 * raterait « arachide », « lactose », « sans gluten » — et il les ratait.
 */
export function contraintesPratiquesDe(
  pi: { vetos?: Record<string, unknown>; alcool?: string } | null,
): string[] {
  if (!pi) return [];
  const out: string[] = [];
  const v = pi.vetos ?? {};
  if (v.no_alcohol || pi.alcool === 'jamais') out.push("les lieux ou sorties centrés sur l'alcool");
  if (v.halal || v.casher) out.push('les restaurants sans options adaptées au régime alimentaire');
  if (v.vegetarian || v.vegan) out.push('les lieux sans option végétarienne');
  if (Array.isArray(v.allergies) && v.allergies.length > 0) {
    out.push(`les aliments contenant : ${(v.allergies as string[]).join(', ')}`);
  }
  if (v.mobility_constraints) out.push('les lieux peu accessibles');
  return out;
}
