/**
 * LES DESTINATIONS CONDITIONNELLES — onglet 17 du référentiel (quinze destinations, neuf questions).
 *
 * Pour ces questions ouvertes, le référentiel ne dit pas « lis la réponse » : il dit, segment par
 * segment, CE QUI DÉCLENCHE une écriture, où elle va, et ce qu'il faut pour l'écrire. Et sinon :
 * « verbatim seul ». Ces questions ne passent donc pas par la lecture générale des textes libres.
 *
 * ── UN PASSAGE PRÉSENT DANS LA RÉPONSE NE PROUVE RIEN DE SON SENS.
 * « La géologie ne m'intéresse pas » contient « la géologie » et n'établit aucun intérêt. Un
 * segment n'est donc retenu que s'il passe TROIS épreuves, toutes nécessaires :
 *
 *   1. LA COPIE EXACTE. Le passage — et chaque précision qui l'accompagne (condition, limite,
 *      titre, auteur…) — figure dans la réponse caractère pour caractère, accents et casse
 *      compris. Sa position est relevée : c'est son rattachement au verbatim.
 *   2. CE QUE LE MODÈLE DÉCLARE DU SEGMENT : l'attitude exprimée, si elle est affirmée ou niée,
 *      la personne concernée, le temps, la condition, la limite de portée. Chaque destination
 *      n'admet que certaines valeurs (EXIGENCES).
 *   3. UN CONTRE-EXAMEN PAR LE CODE de la proposition qui contient le passage : négation, rejet,
 *      autre personne, passé révolu, condition. Ce contre-examen NE PEUT QUE REFUSER. Il ne
 *      donne jamais raison au modèle ; il lui donne tort quand les mots de la phrase le
 *      contredisent.
 *
 * Un segment écarté laisse le verbatim seul, avec son motif. Le contre-examen est lexical : il
 * attrape les contradictions écrites en toutes lettres, pas l'ironie ni l'implicite. Il borne ce
 * qu'un modèle peut faire écrire à tort ; il ne remplace pas l'essai du modèle réellement servi.
 *
 * ── UNE IDENTITÉ N'EST JAMAIS INVENTÉE, NI RAPPROCHÉE SUR UNE RESSEMBLANCE.
 * Une œuvre, un épisode, un lieu, un animal ne deviennent un référent que si la réponse les
 * identifie d'elle-même (voir `resoudre`). Deux noms identiques sont le même référent ; deux
 * noms qui se ressemblent ne le sont pas : c'est une ambiguïté, et elle se règle en demandant.
 */
import Anthropic from '@anthropic-ai/sdk';
import { DESTINATIONS_CONDITIONNELLES } from './contrats-ouverts';
import { ENTITY_RELATIONS, type EntityRelation } from '@/lib/knowledge/vocabulary';

/** Change quand ce module sait écrire une destination qu'il ne savait pas écrire : les lectures
 *  faites sous une version antérieure peuvent alors être reprises (destinations-ecriture.ts). */
export const VERSION_LECTURE = 2;

export interface Destination {
  readonly question: string; readonly rang: string; readonly declencheur: string; readonly signification: string;
  readonly voie: 'HSG_EVIDENCE' | 'FACT'; readonly famille: string | null; readonly cle: string;
  readonly typeEntite: string | null; readonly relation: string | null; readonly stabilite: string | null;
  readonly identifiantRequis: string | null; readonly role: string | null; readonly preuve: string;
}
const nul = (v: unknown): string | null => (!v || v === 'NONE' || v === 'None' || v === 'SANS_OBJET' ? null : String(v));
const TOUTES: Destination[] = (DESTINATIONS_CONDITIONNELLES as readonly Record<string, unknown>[]).map((d) => ({
  question: String(d.question_id), rang: String(d.rang_destination), declencheur: String(d.declencheur), signification: String(d.declencheur_signification),
  voie: d.voie === 'FACT' ? 'FACT' : 'HSG_EVIDENCE', famille: nul(d.famille), cle: String(d.attribut_ou_cle),
  typeEntite: nul(d.type_entite), relation: nul(d.relation), stabilite: nul(d.stabilite), identifiantRequis: nul(d.identifiant_requis),
  role: nul(d.evidence_role), preuve: String(d.preuve_exigee ?? ''),
}));
export const DESTINATIONS_PAR_QUESTION: ReadonlyMap<string, readonly Destination[]> = TOUTES.reduce(
  (m, d) => m.set(d.question, [...(m.get(d.question) ?? []), d]), new Map<string, Destination[]>());
export const cleDestination = (d: Pick<Destination, 'question' | 'rang'>) => `${d.question}#${d.rang}`;

/* ────────────────────────────────────────────────────────────────────────────
 * CE QUE CHAQUE DESTINATION EXIGE D'UN SEGMENT — lu dans la colonne « preuve exigée » du contrat.
 * ──────────────────────────────────────────────────────────────────────────── */
export type Attitude = 'rejet' | 'interet' | 'appreciation' | 'presence_voulue' | 'souhait' | 'projection' | 'mention' | 'referent' | 'autre';
export type Temps = 'actuel' | 'passe_revolu' | 'futur_ou_souhait' | 'hypothetique' | 'indetermine';
export type NatureIdentite = 'oeuvre' | 'episode' | 'lieu' | 'animal';
export interface Exigence {
  /** L'attitude que le segment doit exprimer. `mention` : nommer suffit, aucune attitude n'est retenue. */
  readonly attitude: Attitude;
  /** L'attitude doit être dite PAR LES MOTS DU SEGMENT (« appréciation explicite dans le segment »),
   *  et non portée par la seule question. Un titre cité seul ne suffit alors pas. */
  readonly explicite: boolean;
  readonly temps: readonly Temps[];
  /** Le contre-examen de la proposition s'applique (faux pour un récit : une projection ou un
   *  souvenir contient naturellement des négations, d'autres personnes, du passé). */
  readonly contreExamen: boolean;
  /** Toute négation avant le passage refuse (souhait, élément voulu : « pas de néons », « je ne
   *  veux rien »), même sans verbe d'appréciation à nier. */
  readonly negationGenerale?: true;
  /** La proposition parle légitimement d'un autre (« lui offrir… » : l'animal). */
  readonly autruiAdmis?: true;
  readonly resolution?: NatureIdentite;
  /** La destination porte sur un SECOND segment, distinct de celui qui nomme le référent. */
  readonly secondSegment?: true;
}
const PRESENT: readonly Temps[] = ['actuel', 'indetermine'];
const EXIGENCES: Readonly<Record<string, Exigence>> = {
  'CRE-06#1': { attitude: 'rejet', explicite: false, temps: PRESENT, contreExamen: true },
  'CRE-06#2': { attitude: 'rejet', explicite: false, temps: PRESENT, contreExamen: true },
  'CRE-06#3': { attitude: 'rejet', explicite: false, temps: PRESENT, contreExamen: true },
  'learning2.1459#1': { attitude: 'interet', explicite: false, temps: PRESENT, contreExamen: true },
  'comics.0422#1': { attitude: 'appreciation', explicite: true, temps: PRESENT, contreExamen: true, resolution: 'oeuvre' },
  'comics.0422#2': { attitude: 'mention', explicite: false, temps: ['actuel', 'indetermine', 'passe_revolu', 'futur_ou_souhait', 'hypothetique'], contreExamen: false },
  'drinks.2102#1': { attitude: 'projection', explicite: false, temps: ['hypothetique', 'futur_ou_souhait', 'actuel', 'indetermine'], contreExamen: false },
  'time.1566#1': { attitude: 'projection', explicite: false, temps: ['hypothetique', 'futur_ou_souhait', 'actuel', 'indetermine'], contreExamen: false },
  'pets.0403#1': { attitude: 'souhait', explicite: false, temps: ['actuel', 'futur_ou_souhait', 'indetermine'], contreExamen: true, negationGenerale: true, autruiAdmis: true, resolution: 'animal' },
  'podcast.0467#1': { attitude: 'referent', explicite: false, temps: ['passe_revolu', 'actuel', 'indetermine'], contreExamen: false, resolution: 'episode' },
  'podcast.0467#2': { attitude: 'appreciation', explicite: true, temps: PRESENT, contreExamen: true, resolution: 'episode', secondSegment: true },
  'sensory2.1482#1': { attitude: 'referent', explicite: false, temps: ['passe_revolu', 'actuel', 'indetermine'], contreExamen: false, resolution: 'lieu' },
  'sensory2.1482#2': { attitude: 'appreciation', explicite: true, temps: PRESENT, contreExamen: true, resolution: 'lieu', secondSegment: true },
  'sensory2.1487#1': { attitude: 'presence_voulue', explicite: false, temps: ['hypothetique', 'futur_ou_souhait', 'actuel', 'indetermine'], contreExamen: true, negationGenerale: true },
  'sensory2.1487#2': { attitude: 'presence_voulue', explicite: false, temps: ['hypothetique', 'futur_ou_souhait', 'actuel', 'indetermine'], contreExamen: true, negationGenerale: true },
};
export function exigenceDe(d: Destination): Exigence | null { return EXIGENCES[cleDestination(d)] ?? null; }
for (const d of TOUTES) if (!exigenceDe(d)) throw new Error(`destination ${cleDestination(d)} sans exigence : le contrat a changé, ce module doit être relu`);

/* ────────────────────────────────────────────────────────────────────────────
 * ÉPREUVE 1 — la copie exacte.
 * ──────────────────────────────────────────────────────────────────────────── */
/** Position du passage dans la réponse, à l'identique (forme Unicode composée seulement). */
export function positionExacte(texte: string, passage: string): { debut: number; fin: number } | null {
  const t = texte.normalize('NFC'), p = passage.normalize('NFC');
  if (p.trim().length === 0 || p !== p.trim()) return null;
  const debut = t.indexOf(p);
  return debut < 0 ? null : { debut, fin: debut + p.length };
}

/* ────────────────────────────────────────────────────────────────────────────
 * ÉPREUVE 3 — le contre-examen de la proposition. Ne peut que refuser.
 * ──────────────────────────────────────────────────────────────────────────── */
const bas = (s: string) => s.normalize('NFC').toLowerCase().replace(/[’ʼ`]/g, "'");
const COUPURES = /[.;!?\n]|,?\s(?:mais|par contre|en revanche|alors que|tandis que|contrairement)\s/gi;
/** La proposition qui contient le passage, et la place du passage dedans. */
export function propositionDe(texte: string, debut: number, fin: number): { readonly avant: string; readonly apres: string } {
  const t = texte.normalize('NFC');
  let g = 0, d = t.length;
  for (const m of t.matchAll(COUPURES)) {
    const a = m.index!, b = a + m[0].length;
    if (b <= debut) g = b; else if (a >= fin) { d = a; break; }
  }
  return { avant: bas(t.slice(g, debut)), apres: bas(t.slice(fin, d)) };
}
const APPRECIE = /(ador[eé]|\baim[eé]|appréci|appreci|passionn|fan d|me pla[iî]t|kiffe|raffole|coup de c(?:œ|oe)ur|m'intéress|m'interess|intéress|interess|m'attir|fascin|curieu|envie d|j'aimerais|je voudrais|je rêve d|je reve d)/g;
const REJETTE = /(détest[eé]|detest[eé]|horreur|\bhais\b|insupportable|rebute|dégoût|degout|\bfuis\b|j'évite|m'ennuie|allergique|ras le bol)/g;
const NEUTRE = /(indifférent|indifferent|sans plus|ni chaud ni froid|mitigé|mitige|ne m'a rien fait)/;
const NEG_GENERALE = /(\bne\s|\bn'|\bpas\b|\brien\b|\baucune?\b|\bjamais\b|\bsans\b|\bni\b)/;
const NEG_AVANT = /(\bne\s|\bn'|\bpas\s|\bjamais\s|\bplus\s|\bni\s)[^,]{0,14}$/;
const NEG_APRES = /^[^,]{0,3}\s?(pas|plus|jamais|guère|guere|aucun|aucune|rien)\b/;
const AUTRUI = /\b(mon mari|ma femme|mon conjoint|ma conjointe|mon copain|ma copine|mon compagnon|ma compagne|mon fils|ma fille|mes enfants|mes filles|mes fils|mon père|ma mère|mes parents|mon frère|ma sœur|ma soeur|mon amie?|mes amie?s|mon collègue|ma collègue|il|elle|ils|elles|lui|eux)\b/;
const IMPERSONNEL = /\b(il y a|il y avait|il faut|il faudrait|il fait|il s'agit|il est (?:vrai|possible|important)|qu'il y ait|s'il y a|il me faut|il manque|il suffit)\b/g;
const PASSE_MOTS = /(\bavant\b|\bautrefois\b|\bjadis\b|à l'époque|a l'epoque|quand j'étais|quand j'etais|plus jeune|\bpetite?,|\benfant,|j'ai arrêté|j'ai arrete|il y a longtemps|dans le temps)/;
const VERBE_JE = /(?:\bje\s+|\bj')(?:[\p{L}']+\s)?([\p{L}]+ais)(?![\p{L}])/gu;
const CONDITIONNEL = /(?:erais|irais|drais|rrais|urais|vrais)$/;
/** Un marqueur de passé révolu, ou un imparfait à la première personne (« je détestais »). Le
 *  conditionnel (« j'aimerais ») n'en est pas un. */
export function estAuPasse(proposition: string): boolean {
  if (PASSE_MOTS.test(proposition)) return true;
  return [...proposition.matchAll(VERBE_JE)].some((m) => !CONDITIONNEL.test(m[1]));
}
const CONDITION = /(\bsi (?:je|j'|c'|on|le|la|les|l'|un|une|ça|cela|elle|il|tu)|\bs'il|\bs'ils|sauf si|à condition|a condition|à moins|a moins|tant que|seulement (?:si|quand|pour|en)|uniquement|\bquand (?:c'|il|elle|je|j'|on)|\blorsqu)/;
const NIE_NU = /(\bpas|\bsauf|\bhormis|\bexcepté|\bni|\bsans|\baucune?|\bjamais de|\bsurtout pas(?: de| d')?)\s+(?:(?:le|la|les|du|des|de la|de|un|une)\s+|l'|d')?$/;

export type MotifRefus =
  | 'copie_inexacte' | 'declencheur_inconnu' | 'precision_inexacte'
  | 'attitude_non_conforme' | 'non_affirme' | 'autre_personne' | 'temps_non_conforme' | 'sous_condition' | 'portee_limitee'
  | 'negation_dans_la_proposition' | 'appreciation_dans_la_proposition' | 'sens_incertain' | 'attitude_non_explicite'
  | 'passe_dans_la_proposition' | 'condition_dans_la_proposition' | 'autre_personne_dans_la_proposition' | 'relation_hors_vocabulaire';

/** Le sens que les MOTS de la proposition donnent au passage. */
export type SensLexical = 'positif' | 'negatif' | 'incertain' | 'nu' | 'nie_nu';
export function sensLexical(avant: string, apres: string): SensLexical {
  type M = { pos: number; fin: number; nature: 'app' | 'rej'; cote: 'avant' | 'apres' };
  const trouver = (s: string, cote: 'avant' | 'apres'): M[] => [
    ...[...s.matchAll(APPRECIE)].map((m) => ({ pos: m.index!, fin: m.index! + m[0].length, nature: 'app' as const, cote })),
    ...[...s.matchAll(REJETTE)].map((m) => ({ pos: m.index!, fin: m.index! + m[0].length, nature: 'rej' as const, cote })),
  ];
  // Le marqueur qui GOUVERNE le passage : le dernier avant lui dans la proposition ; à défaut, le premier après.
  const av = trouver(avant, 'avant').sort((a, b) => b.pos - a.pos)[0];
  const ap = trouver(apres, 'apres').sort((a, b) => a.pos - b.pos)[0];
  // Sans verbe qui gouverne avant lui, un passage précédé de « pas », « sauf », « sans »… est nié
  // tel quel (« tout sauf le plastique »).
  if (!av && NIE_NU.test(avant)) return 'nie_nu';
  const m = av ?? ap;
  if (!m) return 'nu';
  const s = m.cote === 'avant' ? avant : apres;
  const nie = NEG_AVANT.test(s.slice(0, m.pos)) || NEG_APRES.test(s.slice(m.fin));
  if (m.nature === 'app') return nie ? 'negatif' : 'positif';
  return nie ? 'incertain' : 'negatif';       // « je ne déteste pas » n'établit ni rejet ni goût
}

/* ────────────────────────────────────────────────────────────────────────────
 * L'EXAMEN D'UN SEGMENT — les trois épreuves.
 * ──────────────────────────────────────────────────────────────────────────── */
export interface IdentiteDeclaree {
  readonly nature: NatureIdentite;
  /** Œuvre : son titre. Épisode : son titre ou son numéro. Lieu, animal : son nom. */
  readonly nom?: string;
  /** Œuvre : auteur. Épisode : l'émission. Lieu : la localité. Animal : l'espèce. */
  readonly rattachement?: string;
  /** Ce que le modèle juge ambigu, dans ses mots (jamais écrit comme connaissance). */
  readonly ambigu?: string;
}
export interface SegmentExamine {
  readonly declencheur: string; readonly passage: string; readonly debut: number; readonly fin: number;
  readonly attitude: Attitude; readonly temps: Temps; readonly relation?: EntityRelation;
  readonly identite?: IdentiteDeclaree; readonly sens: SensLexical;
}
export interface Examen {
  readonly retenus: readonly SegmentExamine[];
  readonly ecartes: readonly { readonly declencheur: string; readonly passage: string; readonly motif: MotifRefus }[];
}
const chaine = (v: unknown): string | undefined => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined);

export function examinerSegments(texte: string, brut: unknown, destinations: readonly Destination[]): Examen {
  const retenus: SegmentExamine[] = []; const ecartes: { declencheur: string; passage: string; motif: MotifRefus }[] = [];
  const parDeclencheur = new Map(destinations.map((d) => [d.declencheur, d]));
  const segments = (brut as { segments?: unknown })?.segments;
  for (const brutSeg of Array.isArray(segments) ? segments : []) {
    const s = brutSeg as Record<string, unknown>;
    const declencheur = chaine(s.declencheur), passage = chaine(s.passage);
    if (!declencheur || !passage) continue;
    const refuser = (motif: MotifRefus) => { ecartes.push({ declencheur, passage, motif }); };
    const d = parDeclencheur.get(declencheur);
    if (!d) { refuser('declencheur_inconnu'); continue; }
    const ex = exigenceDe(d)!;

    // 1 — la copie exacte, du passage et de chaque précision.
    const pos = positionExacte(texte, passage);
    if (!pos) { refuser('copie_inexacte'); continue; }
    const idBrute = (s.identite ?? null) as Record<string, unknown> | null;
    const precisions = [chaine(s.condition), chaine(s.limite), chaine(idBrute?.nom), chaine(idBrute?.rattachement)].filter((x): x is string => !!x);
    if (precisions.some((p) => !positionExacte(texte, p))) { refuser('precision_inexacte'); continue; }

    // 2 — ce que le modèle déclare du segment.
    const attitude = (chaine(s.attitude) ?? 'autre') as Attitude;
    const temps = (chaine(s.temps) ?? 'indetermine') as Temps;
    if (s.affirme !== true) { refuser('non_affirme'); continue; }
    if (ex.attitude !== 'mention' && attitude !== ex.attitude) { refuser('attitude_non_conforme'); continue; }
    if (ex.attitude !== 'mention' && s.personne !== 'soi') { refuser('autre_personne'); continue; }
    if (!ex.temps.includes(temps)) { refuser('temps_non_conforme'); continue; }
    if (ex.contreExamen && chaine(s.condition)) { refuser('sous_condition'); continue; }
    if (ex.contreExamen && chaine(s.limite)) { refuser('portee_limitee'); continue; }
    let relation: EntityRelation | undefined;
    if (d.famille === 'ENTITY') {
      const voulue = d.relation && !d.relation.startsWith('<') ? d.relation : chaine(s.relation);
      if (!voulue || !(ENTITY_RELATIONS as readonly string[]).includes(voulue)) { refuser('relation_hors_vocabulaire'); continue; }
      relation = voulue as EntityRelation;
    }

    // 3 — le contre-examen de la proposition. Il ne peut que refuser.
    const p = propositionDe(texte, pos.debut, pos.fin);
    // Un second segment (« J'ai adoré ») porte lui-même l'attitude : il est lu avec ses propres mots.
    const avant = ex.secondSegment ? `${p.avant}${bas(passage)}` : p.avant, apres = p.apres;
    const sens = sensLexical(avant, apres);
    if (ex.contreExamen) {
      const prop = `${avant} ${apres}`;
      // Une relation NÉGATIVE ou NEUTRE envers un référent se prouve par ses propres mots.
      const relNegative = relation === 'DISLIKE' || relation === 'AVOID';
      if (relation === 'NEUTRAL') {
        if (!NEUTRE.test(prop)) { refuser('attitude_non_explicite'); continue; }
      } else if (ex.attitude === 'rejet' || relNegative) {
        if (sens === 'positif') { refuser('appreciation_dans_la_proposition'); continue; }
        if (sens === 'incertain' || sens === 'nie_nu') { refuser('sens_incertain'); continue; }
        if (relNegative && sens !== 'negatif') { refuser('attitude_non_explicite'); continue; }
      } else {
        if (sens === 'negatif' || sens === 'nie_nu') { refuser('negation_dans_la_proposition'); continue; }
        if (sens === 'incertain') { refuser('sens_incertain'); continue; }
        if (ex.explicite && sens !== 'positif') { refuser('attitude_non_explicite'); continue; }
      }
      if (ex.negationGenerale && NEG_GENERALE.test(avant)) { refuser('negation_dans_la_proposition'); continue; }
      if (!ex.autruiAdmis && AUTRUI.test(prop.replace(IMPERSONNEL, ' '))) { refuser('autre_personne_dans_la_proposition'); continue; }
      if (estAuPasse(prop)) { refuser('passe_dans_la_proposition'); continue; }
      if (CONDITION.test(prop)) { refuser('condition_dans_la_proposition'); continue; }
    }
    const nature = chaine(idBrute?.nature) as NatureIdentite | undefined;
    const identite: IdentiteDeclaree | undefined = idBrute && nature
      ? { nature, ...(chaine(idBrute.nom) ? { nom: chaine(idBrute.nom)! } : {}), ...(chaine(idBrute.rattachement) ? { rattachement: chaine(idBrute.rattachement)! } : {}),
          ...(chaine(idBrute.ambigu) ? { ambigu: chaine(idBrute.ambigu)! } : {}) }
      : undefined;
    if (retenus.some((r) => r.declencheur === declencheur && r.debut === pos.debut && r.fin === pos.fin)) continue;
    retenus.push({ declencheur, passage, debut: pos.debut, fin: pos.fin, attitude, temps, ...(relation ? { relation } : {}), ...(identite ? { identite } : {}), sens });
  }
  return { retenus, ecartes };
}

/* ────────────────────────────────────────────────────────────────────────────
 * LA RÉSOLUTION D'UN RÉFÉRENT — œuvre, épisode, lieu, animal.
 *
 * Il n'existe aucun catalogue des œuvres ou des lieux du monde : « résolu de façon unique »
 * veut donc dire ici « identifié par la réponse elle-même, et distinct de tout ce que la
 * personne a déjà nommé ». Un homonyme que la personne n'a jamais nommé reste invisible ;
 * c'est une limite connue, dite dans le rapport, pas une garantie.
 *
 *   · œuvre   : un titre. L'auteur, s'il est donné, distingue deux titres identiques.
 *   · épisode : l'émission ET un titre ou un numéro d'épisode. L'un sans l'autre n'identifie rien.
 *   · lieu    : un nom propre. « un hammam », « la plage » ne nomment aucun lieu ; « chez ma
 *               grand-mère » désigne un lieu privé, qui n'est pas une entité.
 *   · animal  : un animal que la personne a elle-même déclaré (aucun n'est créé ici).
 * ──────────────────────────────────────────────────────────────────────────── */
export interface EntiteConnue {
  readonly id: string; readonly nature: NatureIdentite; readonly medium: string;
  readonly nom: string; readonly rattachement: string | null;
}
export type MotifNonResolu = 'identite_absente' | 'nom_absent' | 'emission_absente' | 'episode_non_identifie' | 'lieu_generique' | 'lieu_prive' | 'aucun_animal_declare' | 'juge_ambigu_par_le_modele';
export type Resolution =
  | { readonly etat: 'unique'; readonly id: string; readonly nouvelle: boolean; readonly entite: EntiteConnue }
  | { readonly etat: 'ambigu'; readonly raison: 'plusieurs_referents_du_meme_nom' | 'nom_proche_non_identique' | 'plusieurs_animaux' | 'rattachement_different'; readonly choix: readonly EntiteConnue[]; readonly proposee: EntiteConnue | null }
  | { readonly etat: 'non_resolu'; readonly motif: MotifNonResolu; readonly clarifiable: boolean };

/** Clé d'identité : casse, espaces, apostrophes typographiques, guillemets et article défini
 *  initial ne distinguent pas deux noms. Les accents, si. */
export const cleNom = (s: string) => bas(s).replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim().replace(/^(?:le |la |les |l')/, '');
const sansAccent = (s: string) => cleNom(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
export const idEntite = (nature: NatureIdentite, medium: string, nom: string, rattachement: string | null) =>
  `${nature}:${medium}:${cleNom(nom)}${rattachement ? `|${cleNom(rattachement)}` : ''}`;
const GENERIQUE = /^(?:un|une|des|quelques|plusieurs|n'importe quel(?:le)?)\s/;
const PRIVE = /^(?:chez\s|mon\s|ma\s|mes\s|notre\s|nos\s)|\b(?:de|chez) (?:ma|mon|mes|notre|nos) /;

export function resoudre(nature: NatureIdentite, medium: string, s: SegmentExamine, connues: readonly EntiteConnue[]): Resolution {
  const duType = connues.filter((e) => e.nature === nature && e.medium === medium);
  if (nature === 'animal') {
    // Un animal n'est jamais créé par une réponse libre : il faut qu'il ait été déclaré.
    if (duType.length === 0) return { etat: 'non_resolu', motif: 'aucun_animal_declare', clarifiable: true };
    const nomme = s.identite?.nom ? duType.filter((a) => cleNom(a.nom) === cleNom(s.identite!.nom!)) : [];
    if (nomme.length === 1) return { etat: 'unique', id: nomme[0].id, nouvelle: false, entite: nomme[0] };
    if (duType.length === 1 && !s.identite?.nom) return { etat: 'unique', id: duType[0].id, nouvelle: false, entite: duType[0] };
    return { etat: 'ambigu', raison: 'plusieurs_animaux', choix: duType, proposee: null };
  }
  const id = s.identite;
  if (!id || id.nature !== nature) return { etat: 'non_resolu', motif: 'identite_absente', clarifiable: true };
  if (id.ambigu) return { etat: 'non_resolu', motif: 'juge_ambigu_par_le_modele', clarifiable: true };
  if (!id.nom) return { etat: 'non_resolu', motif: nature === 'episode' ? 'episode_non_identifie' : 'nom_absent', clarifiable: true };
  if (nature === 'episode' && !id.rattachement) return { etat: 'non_resolu', motif: 'emission_absente', clarifiable: true };
  if (nature === 'lieu') {
    if (GENERIQUE.test(bas(id.nom))) return { etat: 'non_resolu', motif: 'lieu_generique', clarifiable: true };
    if (PRIVE.test(bas(id.nom))) return { etat: 'non_resolu', motif: 'lieu_prive', clarifiable: false };
  }
  const proposee: EntiteConnue = { id: idEntite(nature, medium, id.nom, id.rattachement ?? null), nature, medium, nom: id.nom, rattachement: id.rattachement ?? null };
  const memeNom = duType.filter((e) => cleNom(e.nom) === cleNom(id.nom!));
  if (memeNom.length > 0) {
    // Compatible : même rattachement, ou l'un des deux n'en donne pas (jamais pour un épisode,
    // qui n'existe que dans son émission).
    const compatibles = memeNom.filter((e) => (e.rattachement && id.rattachement
      ? cleNom(e.rattachement) === cleNom(id.rattachement) : nature !== 'episode'));
    const exacts = compatibles.filter((e) => (e.rattachement ? cleNom(e.rattachement) : null) === (id.rattachement ? cleNom(id.rattachement) : null));
    if (compatibles.length === 1) return { etat: 'unique', id: compatibles[0].id, nouvelle: false, entite: compatibles[0] };
    if (exacts.length === 1) return { etat: 'unique', id: exacts[0].id, nouvelle: false, entite: exacts[0] };
    if (compatibles.length > 1) return { etat: 'ambigu', raison: 'plusieurs_referents_du_meme_nom', choix: compatibles, proposee };
    // Même nom, rattachement explicitement différent : deux référents distincts, sans ambiguïté.
    return { etat: 'unique', id: proposee.id, nouvelle: true, entite: proposee };
  }
  const proches = duType.filter((e) => sansAccent(e.nom) === sansAccent(id.nom!));
  if (proches.length > 0) return { etat: 'ambigu', raison: 'nom_proche_non_identique', choix: proches, proposee };
  return { etat: 'unique', id: proposee.id, nouvelle: true, entite: proposee };
}

/** Le genre d'objet que la question vise : deux titres identiques dans deux genres sont distincts. */
export const MEDIUM_PAR_QUESTION: Readonly<Record<string, string>> = {
  'comics.0422': 'bande_dessinee', 'podcast.0467': 'podcast', 'sensory2.1482': 'lieu', 'pets.0403': 'animal',
};

/* ────────────────────────────────────────────────────────────────────────────
 * COUVERTURE — ce que le code sait écrire, destination par destination.
 * ──────────────────────────────────────────────────────────────────────────── */
export function couvertureDestinations(): { question: string; rang: string; declencheur: string; executee: boolean; exige: string }[] {
  return TOUTES.map((d) => {
    const e = exigenceDe(d)!;
    return { question: d.question, rang: d.rang, declencheur: d.declencheur, executee: true,
      exige: [`attitude ${e.attitude}${e.explicite ? ' explicite' : ''}`, e.resolution ? `référent ${e.resolution} résolu` : null, e.secondSegment ? 'second segment distinct' : null].filter(Boolean).join(' · ') };
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * LE DÉCOUPAGE PAR LE MODÈLE. LÈVE s'il ne répond pas — une panne n'est pas « aucun segment ».
 * ──────────────────────────────────────────────────────────────────────────── */
export const MODELE_DESTINATIONS = 'claude-sonnet-4-6';
export function consigneDeDecoupage(enonce: string, destinations: readonly Destination[], barriere: string): string {
  return `Tu lis UNE réponse à la question « ${enonce} ». Tu DÉCOUPES et tu QUALIFIES ; tu n'interprètes rien et tu ne complètes rien.
Pour chacun des déclencheurs ci-dessous, rends les passages de la réponse qui le satisfont.
${destinations.map((d) => `- ${d.declencheur} : ${d.signification}. Preuve exigée : ${d.preuve}`).join('\n')}

RÈGLES DE COPIE. « passage », « condition », « limite », « identite.nom » et « identite.rattachement » sont copiés de la réponse CARACTÈRE POUR CARACTÈRE (accents, majuscules, fautes comprises). Un passage est le plus court groupe de mots qui nomme la chose. Tu ne corriges, ne traduis, ne complètes jamais.

POUR CHAQUE PASSAGE, déclare ce que la phrase en dit :
- attitude : rejet · interet · appreciation · presence_voulue · souhait · projection · mention · referent · autre.
- affirme : false si la phrase NIE l'attitude (« la géologie ne m'intéresse pas » → interet, affirme=false), si elle est ironique, ou si elle rapporte l'avis de quelqu'un d'autre sans le reprendre.
- personne : soi (la personne qui répond) · autre (son mari, son enfant, un ami…) · indetermine.
- temps : actuel · passe_revolu (« avant j'aimais… ») · futur_ou_souhait · hypothetique · indetermine.
- condition : le passage exact de la condition, s'il y en a une (« sauf si c'est fait main ») ; sinon null.
- limite : le passage exact qui restreint la portée (« pour les enfants », « au travail ») ; sinon null.
- relation (entités seulement) : ${ENTITY_RELATIONS.join(', ')} — seulement si la phrase l'exprime par ses mots. Un comportement (« je l'ai réécouté trois fois », « j'y retourne souvent ») n'est PAS une appréciation. « M'a marqué » non plus.
- identite (œuvre, épisode, lieu, animal) : nature ; nom (titre de l'œuvre ; titre ou numéro de l'épisode ; nom du lieu ; nom de l'animal) ; rattachement (auteur ; émission ; localité ; espèce). Si la réponse ne permet pas de savoir de quoi il s'agit exactement, laisse nom vide et dis pourquoi dans « ambigu ».

Si rien ne satisfait un déclencheur, ne rends rien pour lui. Dans le doute, ne rends rien.
INTERDICTIONS : ${barriere || 'ne déduis rien que la personne n’a pas écrit.'}`;
}
export async function lireSegmentsParModele(enonce: string, texte: string, destinations: readonly Destination[], barriere: string): Promise<unknown> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: MODELE_DESTINATIONS, max_tokens: 1200, system: consigneDeDecoupage(enonce, destinations, barriere),
    tools: [{ name: 'segments', description: 'Passages exacts de la réponse, rangés par déclencheur et qualifiés.', input_schema: { type: 'object' as const,
      properties: { segments: { type: 'array', items: { type: 'object', properties: {
        declencheur: { type: 'string', enum: destinations.map((d) => d.declencheur) }, passage: { type: 'string' },
        attitude: { type: 'string', enum: ['rejet', 'interet', 'appreciation', 'presence_voulue', 'souhait', 'projection', 'mention', 'referent', 'autre'] },
        affirme: { type: 'boolean' }, personne: { type: 'string', enum: ['soi', 'autre', 'indetermine'] },
        temps: { type: 'string', enum: ['actuel', 'passe_revolu', 'futur_ou_souhait', 'hypothetique', 'indetermine'] },
        condition: { type: ['string', 'null'] }, limite: { type: ['string', 'null'] }, relation: { type: 'string', enum: [...ENTITY_RELATIONS] },
        identite: { type: 'object', properties: { nature: { type: 'string', enum: ['oeuvre', 'episode', 'lieu', 'animal'] }, nom: { type: 'string' }, rattachement: { type: 'string' }, ambigu: { type: 'string' } }, required: ['nature'] },
      }, required: ['declencheur', 'passage', 'attitude', 'affirme', 'personne', 'temps'] } } },
      required: ['segments'] } }],
    tool_choice: { type: 'tool', name: 'segments' },
    messages: [{ role: 'user', content: `Réponse : « ${texte} »` }],
  });
  const bloc = msg.content.find((b) => b.type === 'tool_use');
  if (!bloc || bloc.type !== 'tool_use') throw new Error('réponse du modèle sans découpage');
  return bloc.input;
}
