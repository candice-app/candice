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
import type { EtatDiscovery } from './conditions';
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

function profondeur(reponses: number): 'A' | 'B' | 'C' {
  if (reponses >= SEUILS_PROFONDEUR.C) return 'C';
  if (reponses >= SEUILS_PROFONDEUR.B) return 'B';
  return 'A';
}

/** Normalisation partagée : les branches du référentiel s'écrivent en slug ET en français. */
const clef = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

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
      tags.set(`INTEREST.${clef(String(i.subject))}`, 'positive');
      tags.set(`INTEREST.${clef(i.subjectLabel)}`, 'positive');
      branchesOuvertes.add(clef(String(i.subject)));
      branchesOuvertes.add(clef(i.subjectLabel));
    }
    for (const c of portrait.contexts) tags.set(`CONTEXT.${clef(String(c.construct))}`, 'positive');
    // Les attributs DÉJÀ renseignés : ce qu'on ne redemande pas. On prend le dernier
    // segment du construct, qui est l'attribut au sens du référentiel
    // (`PREFERENCE.<domaine>.<attribut>`).
    for (const p of portrait.preferences) {
      const segments = String(p.path).split('.');
      attributsConnus.add(segments[segments.length - 1]);
    }
    for (const g of portrait.guardrails) {
      const segments = String(g.code).split('.');
      if (segments.length > 1) attributsConnus.add(segments[1]);
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
    },
    manques,
  };
}
