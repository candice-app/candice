// LE PORTRAIT — ce que Candice sait d'une personne, lu depuis le journal.
//
// LE CHAÎNON QUI MANQUAIT. Le journal s'écrit correctement depuis des mois : sources,
// preuves, provenance, consolidation. Et rien ne le relisait. Les écrans de respiration
// reformulaient les tags que la PAGE venait de leur envoyer ; la page d'analyse finale
// lisait `my_profile` et `discovery_answers`, c'est-à-dire l'ancienne projection. Tout ce
// que Candice apprenait finement était écrit, conservé, consolidé — et invisible.
//
// Ce module est le lecteur unique de ce que Candice sait. Il lit le journal, consolide par
// famille, et rend un portrait prêt à être reformulé. Rien d'autre ne doit reconstruire
// cette vue : deux lecteurs divergeraient, et la divergence se verrait dans ce que Candice
// dit à la personne.
//
// ⚠ POURQUOI LA LECTURE EST CÔTÉ SERVEUR, et pas un tableau de tags envoyé par la page.
// Tant que la page envoie les tags, un client modifié peut faire dire à Candice n'importe
// quoi sur la personne — il suffit de changer le corps de la requête. Ce n'est pas une
// préférence d'architecture : c'est la même faille que le fil de conversation, où le récit
// venait du client et rendait la vérification des segments vide de sens. Ce que Candice
// affirme d'une personne ne doit venir que de ce qu'elle a réellement écrit dans le journal.
//
// Ce module ne CONCLUT rien et n'infère rien : il agrège des preuves déjà écrites, avec la
// provenance et les règles de consolidation du journal. Ce qui n'a pas été dit n'apparaît
// pas, et un construct sans preuve reste absent — jamais « faible » (R1 : UNKNOWN ≠ LOW).
import { readJournalEvidences } from './read-journal';
import {
  consolidateProfile, consolidateInterests, consolidateEntities, consolidatePreferences,
  consolidateBehavior, consolidateGuardrails, consolidateNeeds, consolidateDrivers,
  consolidateContexts, consolidateAffection,
} from './consolidate';
import type { Evidence } from './evidence';
import type { KnowledgeScope, UserId } from './identity';
import type {
  ProfileSignal, SocialEnergySignal, InterestSignal, EntitySignal, PreferenceSignal,
  BehaviorSignal, GuardrailSignal, NeedSignal, DriverSignal, ContextSignal, AffectionSignalSet,
} from './signal';

export interface Portrait {
  readonly scope: KnowledgeScope;
  /** Nombre de preuves REELLEMENT lues. Zéro = Candice ne sait rien, et doit le dire. */
  readonly nbPreuves: number;
  readonly profile: readonly (ProfileSignal | SocialEnergySignal)[];
  readonly interests: readonly InterestSignal[];
  readonly entities: readonly EntitySignal[];
  readonly preferences: readonly PreferenceSignal[];
  readonly behaviors: readonly BehaviorSignal[];
  readonly guardrails: readonly GuardrailSignal[];
  readonly needs: readonly NeedSignal[];
  readonly drivers: readonly DriverSignal[];
  readonly contexts: readonly ContextSignal[];
  readonly affection: AffectionSignalSet;
}

type ClientLecture = Parameters<typeof readJournalEvidences>[0];

/** Répartit les preuves par famille, sans en perdre ni en inventer. Une famille inconnue
 *  n'est pas silencieusement ignorée : elle remonte, pour qu'on la voie. */
function parFamille(evidences: readonly Evidence[]): {
  groupes: Record<string, Evidence[]>; inconnues: string[];
} {
  const CONNUES = new Set(['PROFILE', 'INTEREST', 'ENTITY', 'PREFERENCE', 'BEHAVIOR',
    'GUARDRAIL', 'NEED', 'DRIVER', 'CONTEXT', 'AFFECTION_LANGUAGE']);
  const groupes: Record<string, Evidence[]> = {};
  const inconnues = new Set<string>();
  for (const e of evidences) {
    const f = (e as { target_family: string }).target_family;
    if (!CONNUES.has(f)) { inconnues.add(f); continue; }
    (groupes[f] ??= []).push(e);
  }
  return { groupes, inconnues: [...inconnues] };
}

export class PortraitFamilleInconnueError extends Error {}

/**
 * Lit le journal d'une personne et rend ce que Candice sait d'elle.
 *
 * `aboutId` absent = le compte de la personne elle-même. Renseigné = la fiche d'un proche.
 *
 * Échoue BRUYAMMENT sur une famille inconnue : une preuve d'une famille que la
 * consolidation ne sait pas traiter serait silencieusement absente du portrait, et Candice
 * parlerait d'une personne en ignorant une partie de ce qu'elle a elle-même écrit.
 */
export async function lirePortrait(
  client: ClientLecture,
  opts: { userId: string; aboutId?: string },
): Promise<Portrait> {
  // ⚠ LE FILTRE `about` EST OBLIGATOIRE, ET IL MANQUAIT.
  //
  //    `knowledge_evidences` porte le DÉTENTEUR (`user_id`) et la PERSONNE DÉCRITE
  //    (`about_id`). Les preuves d'un proche ont le MÊME `user_id` que celles du pilote —
  //    c'est le pilote qui les détient — et un `about_id` différent. Lire sur le seul
  //    `user_id` rendait donc le journal du pilote ET de tous ses proches, mélangés.
  //
  //    Conséquences, toutes silencieuses : une entité que le PROCHE évite pouvait apparaître
  //    sur la fiche du pilote, les traits d'un proche déplaçaient le radar du pilote, et une
  //    question Discovery pouvait s'ouvrir parce qu'un proche s'intéresse à la céramique.
  //
  //    `readJournalEvidences` n'applique le filtre que si `aboutId` est fourni. On le fournit
  //    TOUJOURS : absent, c'est le compte de la personne elle-même, dont l'`about_id` vaut
  //    son userId (accountAbout). Le scope annonçait déjà « account » — il annonçait juste
  //    autre chose que ce que la lecture rendait.
  const evidences = await readJournalEvidences(client, {
    userId: opts.userId,
    aboutId: opts.aboutId ?? opts.userId,
  });
  const about = { kind: opts.aboutId ? 'contact' : 'account', id: opts.aboutId ?? opts.userId };
  const scope = { about, ownerId: opts.userId } as unknown as KnowledgeScope;

  const { groupes, inconnues } = parFamille(evidences);
  if (inconnues.length > 0) {
    throw new PortraitFamilleInconnueError(
      `famille(s) sans consolidation : ${inconnues.join(', ')} — le portrait serait incomplet sans le dire`);
  }
  const g = (f: string) => (groupes[f] ?? []) as never;

  return {
    scope,
    nbPreuves: evidences.length,
    profile: consolidateProfile(scope, g('PROFILE')),
    interests: consolidateInterests(scope, g('INTEREST')),
    entities: consolidateEntities(scope, g('ENTITY')),
    preferences: consolidatePreferences(scope, g('PREFERENCE')),
    behaviors: consolidateBehavior(scope, g('BEHAVIOR')),
    guardrails: consolidateGuardrails(scope, g('GUARDRAIL')),
    needs: consolidateNeeds(scope, g('NEED')),
    drivers: consolidateDrivers(scope, g('DRIVER')),
    contexts: consolidateContexts(scope, g('CONTEXT')),
    affection: consolidateAffection(scope, g('AFFECTION_LANGUAGE')),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Mise en mots pour un prompt — la forme que les écrans consomment.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface TagPortrait {
  readonly code: string;
  readonly libelle?: string;
  readonly intensite?: string;
  readonly base: string;
  readonly nbPreuves: number;
}

/**
 * Traduit le portrait en tags, forme que les écrans de respiration savent déjà reformuler.
 *
 * On ne transmet QUE ce qui est consolidé, avec son compte de preuves : la règle 7b
 * (« la profondeur suit la connaissance ») n'est tenable que si le prompt reçoit la
 * matière réelle, pas une liste aplatie où deux preuves ressemblent à vingt.
 *
 * Un construct dont le score est `unknown` n'est PAS transmis : l'absence de preuve n'est
 * pas une information sur la personne, et la faire apparaître inviterait à la commenter.
 */
export function tagsDuPortrait(p: Portrait): TagPortrait[] {
  const t: TagPortrait[] = [];
  const pousser = (code: string, s: { score: string; evidenceCount: number; confidence: string },
                   libelle?: string, intensite?: string) => {
    if (s.score === 'unknown' || s.evidenceCount === 0) return;
    t.push({ code, libelle, intensite, base: s.confidence, nbPreuves: s.evidenceCount });
  };

  for (const s of p.profile) {
    const code = 'position' in s ? 'SOCIAL_ENERGY' : s.construct;
    pousser(String(code), s, undefined, 'position' in s ? String(s.position ?? '') : s.direction);
  }
  for (const s of p.interests) pousser(`INTEREST:${s.subject}`, s, s.subjectLabel, s.relationship);
  for (const s of p.entities) pousser(`ENTITY:${s.entity}`, s, s.entityLabel, s.relation);
  // Une préférence peut porter PLUSIEURS valeurs (réponse multiple) : un tag par valeur.
  // Un REJET n'est pas présenté comme un goût : le libellé le dit en toutes lettres, pour
  // qu'aucun lecteur (texte généré, respiration) ne puisse le prendre pour une préférence.
  const PREFIXE_POLARITE: Record<string, string> = {
    rejet: 'écarté : ', condition: 'sous condition : ', absence_de_critere: 'sans préférence : ',
  };
  for (const s of p.preferences) {
    const details = s.valuesDetail?.length ? s.valuesDetail : [{ value: s.value }];
    for (const d of details) {
      pousser(`PREFERENCE:${s.path}`, s, `${PREFIXE_POLARITE[(d as { polarity?: string }).polarity ?? ''] ?? ''}${d.value}`);
    }
  }
  for (const s of p.behaviors) pousser(`BEHAVIOR:${s.behaviorContext}`, s, s.pattern);
  for (const s of p.guardrails) pousser(`GUARDRAIL:${s.code}`, s, undefined, s.severity);
  for (const s of p.needs) pousser(`NEED:${s.construct}`, s);
  for (const s of p.drivers) pousser(`DRV:${s.construct}`, s);
  for (const s of p.contexts) pousser(`CONTEXT:${s.construct}`, s);
  for (const sens of ['receive', 'give'] as const) {
    for (const [modalite, sig] of Object.entries(p.affection[sens])) {
      pousser(`AFFECTION_${sens.toUpperCase()}_${modalite}`, sig);
    }
  }
  return t;
}
