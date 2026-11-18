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
import { ALIAS_BRANCHES, BRANCHES_DU_DOMAINE } from './branches';
import { BANQUE } from './banque';

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

  if (portrait) {
    // Un INTÉRÊT consolidé ouvre son sujet ET sa branche. C'est le terrain dont une
    // question Discovery a besoin pour ne pas sortir de nulle part.
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
        // Le sujet d'un intérêt est un DOMAINE ou un LIBELLÉ ; les questions, elles, sont
        // rangées par identifiant de branche. On ouvre donc aussi les branches que ce nom
        // désigne (table dérivée de la banque) et celles dont c'est le domaine principal.
        for (const b of ALIAS_BRANCHES.get(k) ?? []) branchesOuvertes.add(b);
        for (const b of BRANCHES_DU_DOMAINE.get(k) ?? []) branchesOuvertes.add(b);
      }
      if (parent) {
        branchesOuvertes.add(parent);
        for (const b of ALIAS_BRANCHES.get(parent) ?? []) branchesOuvertes.add(b);
        for (const b of BRANCHES_DU_DOMAINE.get(parent) ?? []) branchesOuvertes.add(b);
      }
    }
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
  const reponsesParBranche = new Map<string, number>();
  try {
    const { data, error } = await client
      .from('profile_completion')
      .select('question_key, is_filled, last_asked_at')
      .eq('user_id', opts.userId)
      .is('contact_id', null);
    if (error) throw new Error(error.message);
    for (const l of (data ?? []) as { question_key: string; is_filled?: boolean; last_asked_at?: string | null }[]) {
      if (!l.question_key) continue;
      if (l.is_filled || l.last_asked_at) dejaPosees.add(l.question_key);
      if (l.is_filled) {
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
  try {
    const { data, error } = await (client as never as {
      from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null): Promise<{ data: unknown[] | null; error: { message: string } | null }> } } };
    }).from('knowledge_facts').select('fact_type, value, about_id').eq('user_id', opts.userId).is('superseded_at', null);
    if (error) throw new Error(error.message);
    for (const f of (data ?? []) as { fact_type: string; value: string; about_id: string }[]) {
      if (f.about_id !== opts.userId) continue;             // le compte lui-même, pas un proche
      if (f.fact_type === FAIT_SUJET_CHOISI || f.fact_type === FAIT_SUJET_ABORDE) sujetsChoisis.add(clef(f.value));
    }
    // Choisir d'explorer un sujet, c'est OUVRIR sa branche : aucune ouverture n'est plus
    // nette que celle-là. Les questions ordinaires de la branche en bénéficient aussi.
    for (const b of sujetsChoisis) branchesOuvertes.add(b);
  } catch (e) {
    manques.push(`sujets choisis illisibles (${e instanceof Error ? e.message : String(e)}) — les questions sensibles restent fermées`);
  }

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
      tags, nePasCreuser: new Set(), branchesOuvertes, niveauParBranche,
      dejaPosees, attributsConnus, sansAlcool,
      // Aucun contexte de vie connu pour l'instant : les conditions qui en dépendent
      // restent indécidables, donc fermées. Les remplir sans savoir ce qu'ils désignent
      // ouvrirait des questions sur une supposition.
      contextesConnus: new Set(), contextesActifs: new Set(),
      sujetsChoisis,
      aliasBranches: ALIAS_BRANCHES,
    },
    manques,
  };
}
