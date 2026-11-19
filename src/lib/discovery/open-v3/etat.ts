// CE QUE CANDICE SAIT, MIS EN FORME POUR LE MOTEUR.
//
// Le sélecteur est pur : il reçoit un état, il rend une question. Ce fichier est le seul
// endroit où cet état est CONSTRUIT, et il le construit depuis le journal — pas depuis
// `my_profile`, pas depuis les réponses brutes, pas depuis ce que la page a envoyé.
//
// ⚠ TOUT CE QUI N'EST PAS LU RESTE VIDE, ET UN ÉTAT VIDE FERME LES QUESTIONS. C'est le
// sens de marche : une lecture qui échoue doit faire poser MOINS de questions, jamais plus.
// On ne remplit donc aucun champ « par défaut optimiste ».
import { lirePortrait, type Portrait } from '@/lib/knowledge/portrait';
import { clef, type EtatDiscovery } from './conditions';
import { SELECTEURS } from './dependances';
import { poolDe } from './coexistence';
import { ALIAS_BRANCHES, SOUS_PARTIES, TAGS_ATTENDUS, memeSujet, ouvertParCategorie, ouvertParDomaineJournal } from './correspondances';
import { BANQUE } from './banque';
import { produireDepuisOption } from './produire';

/* ────────────────────────────────────────────────────────────────────────────
 * LA PROFONDEUR D'UNE BRANCHE.
 *
 * Le référentiel garde ses questions derrière « Niveau B Hôtellerie », « AXE 2 — … —
 * niveau B » : une question de profondeur B ne se pose que si la branche a atteint cette
 * profondeur. Reste à dire quand elle l'atteint, et le référentiel ne le dit pas.
 *
 * Le choix ci-dessous est un choix de RYTHME, pas une donnée : une branche s'approfondit
 * à mesure qu'on y a répondu. Il est nommé ici, en un seul endroit, pour qu'Estelle puisse
 * le changer sans chercher — plutôt que dilué dans une condition où personne ne le verrait.
 *
 * Il va dans le sens lent : B après trois réponses, C après huit. Une question profonde
 * posée trop tôt coûte la confiance ; posée trop tard, elle coûte une occasion.
 * ──────────────────────────────────────────────────────────────────────────── */
export const SEUILS_PROFONDEUR = { B: 3, C: 8 } as const;

/** La personne a demandé à explorer ce sujet. `value` = la branche. */
export const FAIT_SUJET_CHOISI = 'discovery.sujet_choisi';
/** La personne a parlé de ce sujet d'elle-même, dans un texte libre. `value` = la branche. */
export const FAIT_SUJET_ABORDE = 'discovery.sujet_aborde';
/**
 * Un PROJET en cours : un achat ou un séjour que la personne a saisi ou choisi (décision n° 4
 * du 18 nov.). Sa valeur est un JSON `{ id, type, branche, objet, debut, fin? }`. Il cesse
 * d'être en cours quand il est supersédé (terminé, annulé) ou que sa date de fin est passée.
 */
export const FAIT_PROJET = 'discovery.projet';
const BRANCHES_BANQUE = new Set(BANQUE.map((q) => q.branche));
/** La personne a demandé qu'on ne lui pose plus de questions sur ce sujet. `value` = la branche. */
export const FAIT_SUJET_REFUSE = 'discovery.sujet_refuse';

/* ────────────────────────────────────────────────────────────────────────────
 * « TRÈS PEU DE PLACE » — les contrats qui disent une faible place ACTUELLE.
 *
 * Vingt options de la banque portent ces mots sur une question de place (« Quelle place la
 * lecture occupe-t-elle réellement dans ta vie ? »). Leur valeur, telle que le journal la
 * conserve, est relevée ici ; rien d'autre n'est tenu pour une faible place — ni « ce n'est pas
 * mon truc » (une appréciation), ni « rarement » (une fréquence).
 * ──────────────────────────────────────────────────────────────────────────── */
const PLACES_FAIBLES = new Set<string>();
const PLACE_DU_DOMAINE = new Map<string, Set<string>>();
for (const q of BANQUE) for (const o of q.options) {
  if (o.attribut !== 'domain_importance' || !/^tr[èe]s peu de place/i.test(o.libelle)) continue;
  const p = produireDepuisOption(q, o);
  if (p.type !== 'evidence') continue;
  const domaine = String(o.domaine ?? q.branche);
  PLACES_FAIBLES.add(`${domaine}|${String((p.evidence as { preferenceValue?: unknown }).preferenceValue ?? '')}`);
  PLACE_DU_DOMAINE.set(q.branche, new Set([...(PLACE_DU_DOMAINE.get(q.branche) ?? []), domaine]));
}
export interface Projet { readonly id: string; readonly type: 'achat' | 'sejour'; readonly branche: string; readonly objet: string; readonly debut: string; readonly fin?: string }
/** Lit la valeur d'un fait de projet. `null` si elle n'en est pas une : rien n'est deviné. */
export function lireProjet(valeur: string): Projet | null {
  try {
    const p = JSON.parse(valeur) as Partial<Projet>;
    if (typeof p.id !== 'string' || (p.type !== 'achat' && p.type !== 'sejour') || typeof p.branche !== 'string'
      || typeof p.objet !== 'string' || !p.objet.trim() || typeof p.debut !== 'string') return null;
    if (p.fin !== undefined && typeof p.fin !== 'string') return null;
    return p as Projet;
  } catch { return null; }
}

function profondeur(reponses: number): 'A' | 'B' | 'C' {
  if (reponses >= SEUILS_PROFONDEUR.C) return 'C';
  if (reponses >= SEUILS_PROFONDEUR.B) return 'B';
  return 'A';
}


/** Index : pour chaque question, sa branche — sous ses deux écritures possibles. */
const BRANCHE_PAR_QUESTION = new Map(BANQUE.map((q) => [q.id, q.branche] as const));

export interface LectureEtat {
  readonly etat: EtatDiscovery;
  /** Ce qui n'a pas pu être lu. Vide = l'état est complet. Jamais avalé en silence. */
  readonly manques: readonly string[];
}

interface ClientLecture {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        is(col: string, val: null): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
        maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * Construit l'état Discovery d'une personne.
 *
 * Trois sources, et une seule autorité sur ce que Candice SAIT : le journal.
 *   · le journal       → les intérêts, les contextes, les attributs déjà renseignés ;
 *   · profile_completion → les questions déjà posées (sa colonne `question_key` est un
 *                          texte libre : les identifiants OPEN V3 y entrent tels quels,
 *                          aucune migration n'est nécessaire) ;
 *   · my_profile.practical_info → le seul « ne jamais demander » déclaré hors journal :
 *                          la personne ne boit pas.
 *
 * Les CONTEXTES DE VIE restent vides : le moteur n'en connaît aucun pour l'instant, et une
 * condition qui en dépend est donc indécidable, donc fermée. Les remplir sans savoir ce
 * qu'ils désignent ouvrirait des questions sur une supposition.
 */
export async function lireEtat(
  client: ClientLecture,
  opts: { userId: string },
): Promise<LectureEtat> {
  const manques: string[] = [];

  // ── 1. LE JOURNAL. S'il est illisible, l'état reste vide et presque tout se ferme :
  //       c'est le bon sens de marche, mais il faut le DIRE.
  let portrait: Portrait | null = null;
  try {
    portrait = await lirePortrait(client as never, { userId: opts.userId });
  } catch (e) {
    manques.push(`journal illisible (${e instanceof Error ? e.message : String(e)}) — presque toutes les questions resteront fermées`);
  }

  const tags = new Map<string, string>();
  const attributsConnus = new Set<string>();
  const branchesOuvertes = new Set<string>();
  const nePasCreuser = new Set<string>();
  const placeFaible = new Set<string>();

  const questionsSignalees = new Set<string>();
  // Les branches qu'un INTÉRÊT a ouvertes : c'est à elles que « un seul domaine visible »
  // s'applique (les deux générations, la branche de la refonte de même nom).
  const ouvertesParInteret = new Set<string>();
  if (portrait) {
    // UN INTÉRÊT OUVRE CE QUE LA TABLE EXPLICITE DIT QU'IL OUVRE, et rien d'autre.
    //   · son sujet ou son libellé EST le nom d'une branche (« lecture », « voyage ») ;
    //   · c'est une catégorie de l'onboarding : la table dit quelles branches elle ouvre —
    //     pas toutes celles qui lui ressemblent (« Mode & beauté » n'ouvre ni les sacs ni les
    //     montres) — et, pour « Vin & spiritueux », quelle seule sous-partie ;
    //   · il porte un domaine parent du journal : la table le traduit (`books_literature` →
    //     reading, reading2).
    // Ouvrir une branche permet de poser ses questions. Cela n'écrit aucune préférence.
    for (const i of portrait.interests) {
      const parent = i.parent_domain ? clef(String(i.parent_domain)) : null;
      for (const k of [clef(String(i.subject)), clef(i.subjectLabel)]) {
        tags.set(`INTEREST.${k}`, 'positive');
        // ⚠ LA PORTÉE D'UN INTÉRÊT RATTACHÉ. « Les enfants », coché parmi les CAUSES qui
        //    touchent la personne, est un intérêt pour cette cause — pas pour la branche
        //    « Enfants », qui parle de ses propres enfants. Un intérêt qui porte un domaine
        //    parent n'ouvre donc que ce domaine ; son sujet reste un tag, rien de plus.
        if (parent) continue;
        branchesOuvertes.add(k);
        for (const b of ALIAS_BRANCHES.get(k) ?? []) ouvertesParInteret.add(b);
        const o = ouvertParCategorie(k);
        for (const b of o.branches) ouvertesParInteret.add(b);
        for (const q of o.questions) questionsSignalees.add(q);
      }
      if (parent) {
        branchesOuvertes.add(parent);
        const o = ouvertParDomaineJournal(parent);
        for (const b of o.branches) ouvertesParInteret.add(b);
        for (const q of o.questions) questionsSignalees.add(q);
      }
    }
    for (const b of ouvertesParInteret) for (const v of memeSujet(b)) branchesOuvertes.add(v);
    for (const c of portrait.contexts) {
      tags.set(`CONTEXT.${clef(String(c.construct))}`, 'positive');
      // « `CONTEXT.x.present=true` » : la présence d'un signal, quelle que soit sa valeur.
      tags.set(`CONTEXT.${String(c.construct)}.present`, 'true');
    }
    for (const i of portrait.interests) tags.set(`INTEREST.${String(i.subject)}.present`, 'true');
    // Les attributs DÉJÀ renseignés : ce qu'on ne redemande pas. On prend le dernier
    // segment du construct, qui est l'attribut au sens du référentiel
    // (`PREFERENCE.<domaine>.<attribut>`).
    //
    // ⚠ PAR DOMAINE, PAS GLOBALEMENT. La première version ne gardait que le nom de
    //    l'attribut : dès qu'une personne avait dit ce qu'elle recherche chez les animaux
    //    (`value_sought`), toutes les questions `value_sought` de tous les domaines — voyage,
    //    travail, sport — passaient pour « déjà renseignées » et se fermaient. On garde donc
    //    « <domaine>.<attribut> », et la sélection compare la même forme.
    for (const p of portrait.preferences) {
      const segments = String(p.path).split('.');           // PREFERENCE.<domaine>.<attribut>
      if (segments.length >= 3) attributsConnus.add(`${segments[1]}.${segments[2]}`);
      // « `PREFERENCE.x.y.present=true` » : une préférence existe sur ce chemin.
      tags.set(`${String(p.path)}.present`, 'true');
    }
    // ── UNE FAIBLE PLACE N'EST PAS UN REFUS (décision du 19 nov.). La première version
    //    lisait « Très peu de place » comme un rejet du domaine et cessait d'y poser des
    //    questions. Cette réponse décrit la place ACTUELLE du domaine : elle ne dit ni que la
    //    personne ne l'aime pas, ni qu'elle ne veut pas l'explorer, ni qu'elle refuse qu'on lui
    //    en parle. Elle ne ferme donc rien. Elle fait seulement passer les autres sujets
    //    d'abord (voir `placeFaible` dans la sélection). Seul un refus EXPLICITE de la personne
    //    (« ne plus me questionner là-dessus ») arrête les questions d'un sujet.
    for (const p of portrait.preferences) {
      const segments = String(p.path).split('.');
      if (segments.length !== 3 || segments[2] !== 'domain_importance') continue;
      if (!PLACES_FAIBLES.has(`${segments[1]}|${String(p.value)}`)) continue;
      for (const b of BRANCHES_BANQUE) if (PLACE_DU_DOMAINE.get(b)?.has(segments[1])) placeFaible.add(poolDe(b));
    }
    for (const g of portrait.guardrails) {
      const segments = String(g.code).split('.');           // <domaine>.<attribut>.<valeur>
      if (segments.length > 1) attributsConnus.add(`${segments[0]}.${segments[1]}`);
    }
    // Une branche où un garde-fou existe est une branche dont on a parlé.
    for (const g of portrait.guardrails) branchesOuvertes.add(clef(String(g.code).split('.')[0]));
  }

  // ── 2. LES QUESTIONS DÉJÀ POSÉES. Posées, pas seulement répondues : une question
  //       écartée par la personne ne revient pas lui être resservie.
  const dejaPosees = new Set<string>();
  const optionsChoisies = new Map<string, Set<string>>();
  let dernierePosee: string | undefined; let dernierMoment = '';
  const reponsesParBranche = new Map<string, number>();
  const repondues = new Set<string>();
  try {
    const { data, error } = await client
      .from('profile_completion')
      .select('question_key, is_filled, last_asked_at, answer_data')
      .eq('user_id', opts.userId)
      .is('contact_id', null);
    if (error) throw new Error(error.message);
    for (const l of (data ?? []) as { question_key: string; is_filled?: boolean; last_asked_at?: string | null; answer_data?: unknown }[]) {
      if (!l.question_key) continue;
      if (l.last_asked_at && l.last_asked_at > dernierMoment) { dernierMoment = l.last_asked_at; dernierePosee = l.question_key; }
      // Ce que la personne a répondu aux questions qui font le tri d'une sous-partie
      // (« Sous-branche : manga apprécié (0415) ») : l'identité des options, telle que la
      // progression la conserve. Une réponse passée ou vide ne désigne rien.
      if (l.is_filled && SELECTEURS.has(l.question_key) && l.answer_data != null) {
        const v = l.answer_data;
        optionsChoisies.set(l.question_key, new Set((Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === 'string')));
      }
      if (l.is_filled || l.last_asked_at) dejaPosees.add(l.question_key);
      if (l.is_filled) {
        repondues.add(l.question_key);
        const b = BRANCHE_PAR_QUESTION.get(l.question_key);
        if (b) reponsesParBranche.set(b, (reponsesParBranche.get(b) ?? 0) + 1);
      }
    }
  } catch (e) {
    // SANS cette lecture, on ne sait pas ce qui a déjà été posé — et on reposerait des
    // questions déjà vues. On le signale, et l'appelant doit s'abstenir plutôt que risquer
    // de resservir la même question à quelqu'un.
    manques.push(`progression illisible (${e instanceof Error ? e.message : String(e)}) — risque de reposer une question déjà vue`);
  }

  // ── 2 bis. LE JOURNAL FAIT FOI SUR CE QUI A ÉTÉ RÉPONDU. La progression est écrite APRÈS
  //       la connaissance : une panne entre les deux laisse une réponse au journal et aucune
  //       trace dans la progression. Sans cette lecture, la question revenait — ou, pire, une
  //       question de tri répondue ne désignait plus sa sous-partie. Une réponse écrite au
  //       journal est une question posée, et les options cochées se relisent sur sa source.
  try {
    const lire = async (type: string) => {
      const { data, error } = await (client as never as {
        from(t: string): { select(c: string): { eq(c: string, v: string): { eq(c: string, v: string): Promise<{ data: unknown[] | null; error: { message: string } | null }> } } };
      }).from('knowledge_sources').select('question_code, option_ref, ts, about_id').eq('user_id', opts.userId).eq('source_type', type);
      if (error) throw new Error(error.message);
      return (data ?? []) as { question_code: string | null; option_ref: string | null; ts: string; about_id: string }[];
    };
    const [fermees, ouvertes] = await Promise.all([lire('discovery_closed'), lire('discovery_open')]);
    const dernier = new Map<string, { ts: string; option_ref: string | null }>();
    for (const x of [...fermees, ...ouvertes]) {
      if (x.about_id !== opts.userId || !x.question_code) continue;
      const id = x.question_code.replace(/^discovery\./, '');
      if (!BRANCHE_PAR_QUESTION.has(id)) continue;
      const d = dernier.get(id);
      if (!d || new Date(x.ts).getTime() > new Date(d.ts).getTime()) dernier.set(id, { ts: x.ts, option_ref: x.option_ref });
    }
    for (const [id, d] of dernier) {
      if (!dejaPosees.has(id) || !repondues.has(id)) {
        const b = BRANCHE_PAR_QUESTION.get(id);
        if (b && !repondues.has(id)) reponsesParBranche.set(b, (reponsesParBranche.get(b) ?? 0) + 1);
      }
      dejaPosees.add(id); repondues.add(id);
      if (SELECTEURS.has(id) && d.option_ref) optionsChoisies.set(id, new Set(d.option_ref.split(',').filter(Boolean)));
    }
  } catch (e) {
    manques.push(`progression illisible (réponses du journal : ${e instanceof Error ? e.message : String(e)}) — risque de reposer une question déjà vue`);
  }

  // ── 3 bis. LES SUJETS QUE LA PERSONNE A CHOISI D'EXPLORER, ou abordés d'elle-même.
  //       Seule clé des questions sensibles à « ouverture sur démarche explicite » (branche
  //       « causes »). Deux preuves possibles, toutes deux ÉCRITES par un acte de la personne :
  //         · un FAIT `discovery.sujet_choisi`, posé quand elle demande à explorer le sujet,
  //           et retiré (supersédé) quand elle revient dessus ;
  //         · un FAIT `discovery.sujet_aborde`, posé quand un de ses textes libres a parlé
  //           du sujet.
  //       Un lien reçu dans une notification, un score, une réponse à une question fermée
  //       n'y figurent pas — et une lecture qui échoue laisse l'ensemble VIDE, donc fermé.
  const sujetsChoisis = new Set<string>();
  // Les projets en cours. `undefined` tant que la lecture n'a pas réussi : « on ne sait pas »
  // n'est pas « il n'y en a pas », et les conditions qui en dépendent restent non résolues.
  let projetsLus: Map<string, Set<'achat' | 'sejour'>> | undefined;
  const projets = new Map<string, Set<'achat' | 'sejour'>>();
  const maintenant = new Date().toISOString();
  try {
    const { data, error } = await (client as never as {
      from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null): Promise<{ data: unknown[] | null; error: { message: string } | null }> } } };
    }).from('knowledge_facts').select('fact_type, value, about_id').eq('user_id', opts.userId).is('superseded_at', null);
    if (error) throw new Error(error.message);
    for (const f of (data ?? []) as { fact_type: string; value: string; about_id: string }[]) {
      if (f.about_id !== opts.userId) continue;             // le compte lui-même, pas un proche
      if (f.fact_type === FAIT_SUJET_CHOISI || f.fact_type === FAIT_SUJET_ABORDE) {
        sujetsChoisis.add(clef(f.value));
        // Un sujet vaut pour son DOMAINE : choisir « Voyage » ouvre les deux générations de
        // la branche, et l'identifiant est gardé tel que la banque l'écrit.
        for (const b of BRANCHES_BANQUE) if (b === f.value || poolDe(b) === poolDe(f.value)) sujetsChoisis.add(b);
      }
      // UN REFUS EXPLICITE est le seul acte qui arrête les questions d'un sujet. Il vaut pour
      // le sujet entier (ses deux générations), et il se retire comme il s'est posé.
      if (f.fact_type === FAIT_SUJET_REFUSE) for (const b of memeSujet(f.value)) nePasCreuser.add(b);
      if (f.fact_type === FAIT_PROJET) {
        const p = lireProjet(f.value);
        // Un séjour terminé n'ouvre plus ses questions : la date de fin passée suffit, sans
        // attendre que quelqu'un le déclare clos.
        if (!p || (p.fin && p.fin < maintenant)) continue;
        const pool = poolDe(p.branche);
        projets.set(pool, new Set([...(projets.get(pool) ?? []), p.type]));
      }
    }
    // Choisir d'explorer un sujet, c'est OUVRIR sa branche : aucune ouverture n'est plus
    // nette que celle-là. Les questions ordinaires de la branche en bénéficient aussi.
    for (const b of sujetsChoisis) branchesOuvertes.add(b);
    // Explorer un sujet l'ouvre en entier : la branche de la refonte de même nom s'ouvre avec.
    for (const b of [...sujetsChoisis]) if (BRANCHES_BANQUE.has(b)) for (const v of memeSujet(b)) { branchesOuvertes.add(v); sujetsChoisis.add(v); }
    projetsLus = projets;
  } catch (e) {
    manques.push(`sujets choisis illisibles (${e instanceof Error ? e.message : String(e)}) — les questions sensibles restent fermées`);
  }

  // ── LE TAG QU'UNE BRANCHE DE LA REFONTE ATTEND (`INTEREST.creativity=positive` sur « CRE- »).
  //    Ses propres conditions le nomment ; il est vrai quand cette branche est ouverte — par un
  //    intérêt ou par la démarche de la personne. Lu dans les conditions, jamais déduit.
  for (const b of branchesOuvertes) for (const t of TAGS_ATTENDUS.get(b) ?? []) tags.set(t, 'positive');

  // ── 3. LA PROFONDEUR ATTEINTE, branche par branche. Une branche jamais ouverte n'a
  //       pas de niveau : elle est absente de la table, et les portes « Niveau … » ferment.
  const niveauParBranche = new Map<string, 'A' | 'B' | 'C'>();
  for (const b of branchesOuvertes) niveauParBranche.set(b, profondeur(reponsesParBranche.get(b) ?? 0));
  for (const [b, n] of reponsesParBranche) {
    niveauParBranche.set(clef(b), profondeur(n));
    branchesOuvertes.add(clef(b));
  }

  // ── 4. LE SEUL REFUS DÉCLARÉ HORS JOURNAL.
  let sansAlcool = false;
  try {
    const { data, error } = await client
      .from('my_profile').select('practical_info').eq('user_id', opts.userId).maybeSingle();
    if (error) throw new Error(error.message);
    const pi = (data as { practical_info?: { vetos?: Record<string, unknown>; alcool?: string } } | null)?.practical_info;
    sansAlcool = pi?.vetos?.no_alcohol === true || pi?.alcool === 'jamais';
  } catch (e) {
    // On ne SAIT pas si la personne boit. Par prudence on considère qu'elle ne boit pas :
    // une question alcool posée à quelqu'un qui n'en veut pas est une maladresse qu'on
    // évite, alors que l'inverse ne coûte qu'une question en moins.
    sansAlcool = true;
    manques.push(`rapport à l'alcool inconnu (${e instanceof Error ? e.message : String(e)}) — les questions alcool restent fermées`);
  }

  return {
    etat: {
      tags, nePasCreuser, branchesOuvertes, niveauParBranche,
      dejaPosees, attributsConnus, sansAlcool,
      // Aucun contexte de vie connu pour l'instant : les conditions qui en dépendent
      // restent indécidables, donc fermées. Les remplir sans savoir ce qu'ils désignent
      // ouvrirait des questions sur une supposition.
      contextesConnus: new Set(), contextesActifs: new Set(),
      sujetsChoisis, optionsChoisies, ...(projetsLus ? { projets: projetsLus } : {}), ...(dernierePosee ? { dernierePosee } : {}),
      aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES, questionsSignalees, placeFaible,
    },
    manques,
  };
}
