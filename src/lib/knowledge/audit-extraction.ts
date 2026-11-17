// LES RÈGLES DE L'AUDIT D'EXTRACTION — ce qui, dans un journal, est un défaut.
//
// Logique PRODUIT, pas un script : c'est ici qu'on dit ce qui ne va pas dans un journal, et
// ça doit être éprouvé comme le reste. Le script `scripts/local/08-audit-extraction.mts` ne
// fait que lire la base et appeler `examiner`.
//
// Chaque règle est née d'un défaut CONSTATÉ sur le compte de test, pas d'une crainte :
//
//  1. UNE RÉPONSE QUI N'A RIEN PRODUIT. Une question répondue sans aucune preuve derrière :
//     la personne a répondu, Candice n'a rien appris. C'est le défaut le plus coûteux parce
//     qu'il est invisible — l'écran a l'air d'avoir marché.
//
//  2. UN CONSTRUCT HORS VOCABULAIRE. `knowledge_evidences.target_construct` n'a AUCUNE
//     contrainte en base : elle accepterait n'importe quelle chaîne. Une écriture hors
//     vocabulaire passe, se consolide, et remonte dans le portrait sous un nom que personne
//     n'a défini — jusque dans les écrans de respiration. Cette règle est le seul filet.
//
//  3. UNE CONTRADICTION ENTRE AIMÉ ET ÉVITÉ. Sur le compte de test, un week-end surprise
//     était enregistré comme AIMÉ alors que deux réponses fermées déclaraient le contraire :
//     « j'aime tout savoir à l'avance » et un garde-fou sur le planning bousculé. Candice
//     tenait les deux et n'en savait rien.
//
//  4. UN DEGRÉ D'ENGAGEMENT HORS ÉCHELLE. « passion » est le seul mot de l'ancien
//     vocabulaire qui franchit la contrainte, parce qu'il existe dans les deux : il est donc
//     signalé à part quand il vient d'une extraction, où il voulait dire « nature du rapport ».
//
//  5. UN REFUS SANS INTENSITÉ. « Surtout pas de fleurs coupées » et « les bijoux, très peu
//     pour moi » sortaient tous deux en `moderate`. Un veto et une mise en retrait
//     enregistrés à l'identique : l'un sera trop appliqué, l'autre pas assez.
//
//  6. UNE DÉCLARATION CLASSÉE COMME INFÉRENCE. Tout le texte libre est marqué `inferred` en
//     dur. Conséquence : dans l'Espace Proche, un refus écrit noir sur blanc ne sera jamais
//     lu, parce que le filtre exige `explicit`.
import { readFileSync } from 'node:fs';

export function vocabulaire(nom: string): Set<string> {
  const src = readFileSync('src/lib/knowledge/vocabulary.ts', 'utf8');
  const m = src.match(new RegExp(`export const ${nom} = \\[(.*?)\\] as const;`, 's'));
  if (!m) throw new Error(`${nom} introuvable dans vocabulary.ts — l'audit ne devine pas un vocabulaire`);
  const v = new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
  if (v.size === 0) throw new Error(`${nom} lu vide — un contrôle sur un ensemble vide ne prouve rien`);
  return v;
}
/** Les codes GRD_ sont étalés depuis un objet : on les prend où ils sont, et on exige d'en trouver. */
function codesGardeFous(): Set<string> {
  const src = readFileSync('src/lib/knowledge/vocabulary.ts', 'utf8');
  const v = new Set([...src.matchAll(/'(GRD_[A-Z_]+)'/g)].map((x) => x[1]));
  if (v.size === 0) throw new Error('aucun code GRD_ trouvé — le contrôle serait creux');
  return v;
}

const DRIVERS = vocabulaire('DRIVER_CODES');
const NEEDS = vocabulaire('NEED_CODES');
const GARDES = codesGardeFous();
const DEGRES = vocabulaire('INTEREST_RELATIONSHIPS');
const RELATIONS = vocabulaire('ENTITY_RELATIONS');
const MODALITES = vocabulaire('AFFECTION_MODALITIES');
const PROFILE_F = vocabulaire('PROFILE_FUNCTIONING_CODES');
const PROFILE_O = vocabulaire('PROFILE_ORIENTATION_CODES');

/** Chemin vertical de garde-fou : libre sous préfixe connu (Dictionnaire §8.3). */
const PREFIXES_VERTICAUX = vocabulaire('GUARDRAIL_VERTICAL_PREFIXES');

export interface Ligne {
  source_id: string; question: string | null; reponse: string | null; source_type: string;
  ts: string | null; assertion_status: string | null;
  famille: string | null; construct: string | null; libelle: string | null;
  relationship: string | null; relation: string | null; strength: string | null;
  severity: string | null; value: number | null; confidence: string | null;
}

function constructConnu(famille: string, construct: string): boolean {
  switch (famille) {
    case 'DRIVER': return DRIVERS.has(construct);
    case 'NEED': return NEEDS.has(construct);
    case 'GUARDRAIL':
      return GARDES.has(construct)
        || [...PREFIXES_VERTICAUX].some((p) => construct === p || construct.startsWith(`${p}.`))
        // Les chemins verticaux produits par Discovery OPEN V3 : <domaine>.<attribut>[.<valeur>].
        || /^[a-z0-9_]+\.[a-z0-9_]+/.test(construct);
    case 'PROFILE': return construct === 'SOCIAL_ENERGY' || PROFILE_F.has(construct) || PROFILE_O.has(construct);
    case 'AFFECTION_LANGUAGE': return /^AFFECTION_(RECEIVE|GIVE)_[A-Z_]+$/.test(construct)
      && MODALITES.has(construct.replace(/^AFFECTION_(RECEIVE|GIVE)_/, ''));
    // INTEREST, ENTITY, PREFERENCE, BEHAVIOR, CONTEXT : vocabulaires OUVERTS par conception.
    // On ne peut donc rien y refuser — et c'est le dire qui compte, pas le taire.
    default: return true;
  }
}

export interface SourceAuditee {
  readonly id: string; readonly question_text: string | null; readonly answer_text: string | null;
  readonly raw_text: string | null; readonly source_type: string;
}
export interface Constat {
  readonly gravite: 'BLOQUANT' | 'À REGARDER';
  readonly quoi: string; readonly detail: string;
}

/**
 * LES RÈGLES, SÉPARÉES DE LA LECTURE.
 *
 * Fonction pure : des lignes en entrée, des constats en sortie. C'est ce qui permet de les
 * éprouver sur des données connues plutôt que de les croire — un audit qu'on n'a pas éprouvé
 * ne garde rien, il rassure.
 */
export function examiner(lignes: readonly Ligne[], sources: readonly SourceAuditee[]): Constat[] {
  const constats: Constat[] = [];
  const ajout = (gravite: 'BLOQUANT' | 'À REGARDER', quoi: string, detail: string) =>
    constats.push({ gravite, quoi, detail });
  // `srcs` : alias local, pour que les règles se lisent comme le relevé qu'elles examinent.
  const srcs: readonly SourceAuditee[] = sources;

  // ── 1. Une source sans aucune preuve : la personne a répondu, Candice n'a rien appris.
  const avecPreuve = new Set(lignes.map((l) => l.source_id));
  for (const s of srcs) {
    if (avecPreuve.has(s.id)) continue;
    ajout('BLOQUANT', 'réponse sans aucune preuve',
      `« ${(s.question_text ?? '?').slice(0, 58)} » → « ${(s.answer_text ?? s.raw_text ?? '').slice(0, 44)} » (${s.source_type})`);
  }

  // ── 2. Un construct hors vocabulaire : il empoisonne le portrait sans être rejeté.
  for (const l of lignes) {
    if (!l.famille || !l.construct) {
      ajout('BLOQUANT', 'preuve sans famille ou sans construct', JSON.stringify(l).slice(0, 110));
      continue;
    }
    if (!constructConnu(l.famille, l.construct)) {
      ajout('BLOQUANT', 'construct hors vocabulaire',
        `${l.famille} / « ${l.construct} » — la base l'a accepté, le portrait l'affichera`);
    }
  }

  // ── 3. Aimé ET évité : la contradiction que personne ne voit.
  const aimes = new Map<string, string>(), evites = new Map<string, string>();
  for (const l of lignes) {
    if (l.famille !== 'ENTITY' || !l.construct) continue;
    if (['LOVE', 'LIKE', 'WANT_TO_OWN', 'WANT_TO_TRY', 'WANT_TO_VISIT'].includes(l.relation ?? '')) {
      aimes.set(l.construct, l.libelle ?? l.construct);
    }
    if (['AVOID', 'DISLIKE'].includes(l.relation ?? '')) evites.set(l.construct, l.libelle ?? l.construct);
  }
  for (const [c, lib] of aimes) {
    if (evites.has(c)) ajout('BLOQUANT', 'entité à la fois aimée et évitée', `« ${lib} »`);
  }
  // Et la contradiction de SENS : une surprise aimée alors qu'un garde-fou la refuse.
  const gardeSurprise = lignes.some((l) => l.famille === 'GUARDRAIL'
    && /SCHEDULE_DISRUPTION|LOSS_OF_CONTROL|LAST_MINUTE|surprise/i.test(l.construct ?? ''));
  for (const [, lib] of aimes) {
    if (gardeSurprise && /surprise/i.test(lib)) {
      ajout('BLOQUANT', 'surprise aimée malgré un garde-fou contraire',
        `« ${lib} » est enregistrée comme aimée alors qu'un garde-fou refuse l'imprévu`);
    }
  }

  // ── 4. Degré d'engagement hors échelle, et « passion » venu d'une extraction.
  for (const l of lignes) {
    if (!l.relationship) continue;
    if (!DEGRES.has(l.relationship)) {
      ajout('BLOQUANT', 'degré d’engagement hors échelle',
        `« ${l.relationship} » sur « ${l.libelle ?? l.construct} »`);
    } else if (l.relationship === 'passion' && l.source_type.startsWith('extraction')) {
      ajout('À REGARDER', 'degré « passion » issu d’une extraction',
        `« ${l.libelle ?? l.construct} » — seul mot commun aux deux vocabulaires, où il voulait dire « nature du rapport »`);
    }
  }

  // ── 5. Un refus sans intensité distinguée.
  const refus = lignes.filter((l) => ['AVOID', 'DISLIKE'].includes(l.relation ?? '') || l.famille === 'GUARDRAIL');
  const intensites = new Set(refus.map((l) => l.severity ?? l.strength ?? '∅'));
  if (refus.length >= 2 && intensites.size === 1) {
    ajout('À REGARDER', 'tous les refus à la même intensité',
      `${refus.length} refus, tous « ${[...intensites][0]} » — un veto et une simple mise en retrait ne se distinguent pas`);
  }

  // ── 6. Une déclaration classée comme inférence.
  for (const l of lignes) {
    if (l.assertion_status !== 'inferred') continue;
    const dit = (l.reponse ?? '').toLowerCase();
    if (/surtout pas|jamais|je refuse|je ne veux pas|je déteste|hors de question/.test(dit)) {
      ajout('BLOQUANT', 'déclaration explicite classée comme inférence',
        `« ${(l.reponse ?? '').slice(0, 64)} » → le filtre des rejets déclarés exige « explicit » : ce refus ne sera jamais lu`);
    }
  }

  return constats;
}

