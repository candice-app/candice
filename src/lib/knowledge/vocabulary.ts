// Vocabulaire canonique du Human Signal Graph.
//
// Source de vérité : docs/ontologie/dictionnaire-canonique.md (sens des concepts)
// + docs/ontologie/onboarding-v15-clos.md (chiffres de contrôle)
// + docs/ontologie/ecarts-constates.md (décisions d'arbitrage déjà prises).
//
// RÈGLE R25 — aucune invention de vocabulaire : chaque code ci-dessous vient
// textuellement de ces documents. Les codes STRUCTURANTS sont FERMÉS
// (types union : un code hors liste ne compile pas). Les vocabulaires
// DESCRIPTIFS sont OUVERTS (chaînes validées contre un registre extensible).
// Les deux régimes sont volontairement visibles dans les types :
//   - fermé  → `type X = (typeof X_CODES)[number]`  (union de littéraux)
//   - ouvert → `type X = string` + `OpenVocabulary<...>`  (alias string + registre)

import { normalizeLabel } from './normalize';

/* ────────────────────────────────────────────────────────────────────────
 * 0. LES 10 FAMILLES CANONIQUES (fermé)
 *    Dictionnaire §0 / HSG §3. FACT et ONTOLOGY_GAP n'en font PAS partie.
 * ──────────────────────────────────────────────────────────────────────── */

export const CANONICAL_FAMILIES = [
  'INTEREST',
  'PREFERENCE',
  'PROFILE',
  'AFFECTION_LANGUAGE',
  'NEED',
  'DRIVER',
  'BEHAVIOR',
  'GUARDRAIL',
  'ENTITY',
  'CONTEXT',
] as const;

export type CanonicalFamily = (typeof CANONICAL_FAMILIES)[number];

export const CANONICAL_FAMILY_LABELS: Record<CanonicalFamily, string> = {
  INTEREST: 'Ce qui intéresse réellement la personne',
  PREFERENCE: 'Ce qu’elle aime, préfère, recherche ou évite concrètement',
  PROFILE: 'Comment elle fonctionne et ce qui compte transversalement dans ses arbitrages',
  AFFECTION_LANGUAGE: 'Par quels signaux elle reçoit et exprime l’affection',
  NEED: 'Ce dont elle a particulièrement besoin émotionnellement ou relationnellement',
  DRIVER: 'Pourquoi quelque chose résonne ou lui fait plaisir',
  BEHAVIOR: 'Comment elle tend à agir ou réagir dans une situation donnée',
  GUARDRAIL: 'Ce qui risque de faire échouer une attention ou doit être évité',
  ENTITY: 'Les personnes, objets, marques, lieux, œuvres, aliments concrets de son univers',
  CONTEXT: 'Ce qui caractérise sa situation de vie et modifie l’interprétation des autres signaux',
};

/* ────────────────────────────────────────────────────────────────────────
 * Échelles d'evidence (force / direction). HSG §5.1.
 *   value  : réservé aux constructs DIRECTIONNELS (PROFILE + continuum).
 *            Le TYPE interdit 0 (0 n'est jamais une evidence — HSG §5.1).
 *   ContinuumValue : SOCIAL_ENERGY seulement, échelle ordinale 0..4 DÉFINITIVE.
 *   strength : réservé aux familles SANS direction (décision 3).
 * ──────────────────────────────────────────────────────────────────────── */

/** Force + direction d'une evidence directionnelle. 0 est volontairement absent. */
export type EvidenceValue = -2 | -1 | 1 | 2;

/**
 * Continuum SOCIAL_ENERGY uniquement. Échelle ordinale 0..4 DÉFINITIVE :
 * 0 = recharge solitaire, 4 = recharge sociale. 0 n'est PAS le milieu de
 * l'échelle — c'est une extrémité (le besoin de moments seul(e)). Aucun
 * recentrage vers −2..+2 n'est fait, ni maintenant ni plus tard : il ferait du
 * zéro le centre et inverserait le sens (la personne « j'ai besoin d'être seule »
 * se retrouverait au milieu au lieu d'être à une extrémité). C'est précisément
 * pourquoi SOCIAL_ENERGY est la SEULE exception à « 0 n'est jamais une evidence »
 * (EvidenceValue) : ici 0 est une position réelle, pas une absence d'information.
 */
export type ContinuumValue = 0 | 1 | 2 | 3 | 4;

/** Degré de soutien d'une evidence non directionnelle (décision 3). */
export type EvidenceStrength = 'weak' | 'moderate' | 'strong';

/* ────────────────────────────────────────────────────────────────────────
 * 1. PROFILE — dictionnaire FERMÉ (Dictionnaire §3, onboarding-clos §PROFILE)
 * ──────────────────────────────────────────────────────────────────────── */

// A. Neuf dimensions de fonctionnement transversal.
export const PROFILE_FUNCTIONING_CODES = [
  'PROFILE_OPENNESS',
  'PROFILE_INTENSITY',
  'PROFILE_SENSITIVITY',
  'PROFILE_STRUCTURE',
  'PROFILE_AUTONOMY',
  'PROFILE_RELATIONALITY',
  'PROFILE_EXACTINGNESS',
  'PROFILE_ADAPTABILITY',
  'PROFILE_REFLECTIVENESS',
] as const;

export type ProfileFunctioningCode = (typeof PROFILE_FUNCTIONING_CODES)[number];

export const PROFILE_FUNCTIONING_LABELS: Record<ProfileFunctioningCode, string> = {
  PROFILE_OPENNESS: 'Ouverture — curiosité, exploration, appétence pour la nouveauté',
  PROFILE_INTENSITY: 'Intensité — tendance à s’investir fortement et à approfondir',
  PROFILE_SENSITIVITY: 'Sensibilité — réceptivité élevée à certains stimuli ou nuances',
  PROFILE_STRUCTURE: 'Structure — importance de l’organisation, de l’anticipation, des repères',
  PROFILE_AUTONOMY: 'Autonomie — importance de décider et préserver son indépendance',
  PROFILE_RELATIONALITY: 'Orientation relationnelle — place structurelle accordée aux relations',
  PROFILE_EXACTINGNESS: 'Niveau d’exigence — attention à la précision, la qualité, l’exécution',
  PROFILE_ADAPTABILITY: 'Adaptabilité — facilité à composer avec le changement et l’imprévu',
  PROFILE_REFLECTIVENESS: 'Réflexivité — tendance à analyser et chercher du sens avant de conclure',
};

// B. Huit orientations transversales de préférence et d'arbitrage.
// Elles restent dans la famille PROFILE (onboarding-clos §PROFILE).
export const PROFILE_ORIENTATION_CODES = [
  'APPETENCE_EXPERIENCE',
  'APPETENCE_OBJECT',
  'IMPORTANCE_AESTHETIC',
  'IMPORTANCE_FUNCTIONAL',
  'IMPORTANCE_AUTHENTICITY',
  'APPETENCE_PREMIUM',
  'APPETENCE_SPONTANEITY',
  'IMPORTANCE_MASTERY',
] as const;

export type ProfileOrientationCode = (typeof PROFILE_ORIENTATION_CODES)[number];

export const PROFILE_ORIENTATION_LABELS: Record<ProfileOrientationCode, string> = {
  APPETENCE_EXPERIENCE: 'Appétence pour les expériences (non opposée aux objets)',
  APPETENCE_OBJECT: 'Appétence pour les objets (non opposée aux expériences)',
  IMPORTANCE_AESTHETIC: 'Importance du beau, de l’harmonie, du design',
  IMPORTANCE_FUNCTIONAL: 'Importance de l’usage, de l’efficacité, de la praticité',
  IMPORTANCE_AUTHENTICITY: 'Importance du vrai, du caractère, de l’origine, de la sincérité',
  APPETENCE_PREMIUM: 'Appétence pour un niveau élevé de prestation, finition, service',
  APPETENCE_SPONTANEITY: 'Plaisir à improviser et décider dans l’instant',
  IMPORTANCE_MASTERY: 'Importance de pouvoir choisir, décider ou valider soi-même',
};

// C. Un continuum (le seul conservé), où 0 est une position réelle.
export const PROFILE_CONTINUUM_CODES = ['SOCIAL_ENERGY'] as const;
export type ProfileContinuumCode = (typeof PROFILE_CONTINUUM_CODES)[number];
export const PROFILE_CONTINUUM_LABELS: Record<ProfileContinuumCode, string> = {
  SOCIAL_ENERGY: 'Énergie sociale — continuum recharge solitaire ←→ recharge sociale',
};

// Sous-facettes de PROFILE_SENSITIVITY (Dictionnaire §3.1).
export const SENSITIVITY_FACETS = ['sensory', 'aesthetic', 'emotional'] as const;
export type SensitivityFacet = (typeof SENSITIVITY_FACETS)[number];
export const SENSITIVITY_FACET_LABELS: Record<SensitivityFacet, string> = {
  sensory: 'Sensibilité sensorielle',
  aesthetic: 'Sensibilité esthétique',
  emotional: 'Sensibilité émotionnelle',
};

/** Tous les constructs PROFILE (dimensions + orientations + continuum). Fermé. */
export const PROFILE_CONSTRUCT_CODES = [
  ...PROFILE_FUNCTIONING_CODES,
  ...PROFILE_ORIENTATION_CODES,
  ...PROFILE_CONTINUUM_CODES,
] as const;
export type ProfileConstructCode =
  | ProfileFunctioningCode
  | ProfileOrientationCode
  | ProfileContinuumCode;

/** Constructs PROFILE directionnels (value ±1/±2, jamais 0). Exclut le continuum. */
export type ProfileDirectionalCode = ProfileFunctioningCode | ProfileOrientationCode;

/* ────────────────────────────────────────────────────────────────────────
 * 2. NEED — dictionnaire FERMÉ (Dictionnaire §5). 16 codes.
 * ──────────────────────────────────────────────────────────────────────── */

export const NEED_CODES = [
  'NEED_SEEN_UNDERSTOOD',
  'NEED_LOVED_MATTER',
  'NEED_RHYTHM_RESPECT',
  'NEED_REASSURANCE',
  'NEED_LIGHTNESS',
  'NEED_CELEBRATION',
  'NEED_RELIEF',
  'NEED_SUPPORT',
  'NEED_ACCEPTANCE',
  'NEED_RECOGNITION',
  'NEED_FREEDOM',
  'NEED_CONNECTION',
  'NEED_TRUST',
  'NEED_CHOSEN',
  'NEED_STIMULATION',
  'NEED_CONTRIBUTION',
] as const;

export type NeedCode = (typeof NEED_CODES)[number];

export const NEED_LABELS: Record<NeedCode, string> = {
  NEED_SEEN_UNDERSTOOD: 'Être vu, écouté et compris dans sa singularité',
  NEED_LOVED_MATTER: 'Sentir qu’on compte affectivement',
  NEED_RHYTHM_RESPECT: 'Voir son rythme, son espace et son tempo respectés',
  NEED_REASSURANCE: 'Être rassuré face à l’incertitude',
  NEED_LIGHTNESS: 'Pouvoir vivre rire, jeu et légèreté',
  NEED_CELEBRATION: 'Se sentir célébré lors des moments importants',
  NEED_RELIEF: 'Être concrètement aidé ou soulagé',
  NEED_SUPPORT: 'Se sentir soutenu et entouré',
  NEED_ACCEPTANCE: 'Être accepté tel qu’on est',
  NEED_RECOGNITION: 'Se sentir reconnu et valorisé',
  NEED_FREEDOM: 'Préserver liberté et espace de décision',
  NEED_CONNECTION: 'Ressentir proximité et connexion',
  NEED_TRUST: 'Pouvoir compter sur la fiabilité de l’autre',
  NEED_CHOSEN: 'Se sentir choisi, désiré ou priorisé',
  NEED_STIMULATION: 'Être nourri intellectuellement, émotionnellement ou expérientiellement',
  NEED_CONTRIBUTION: 'Pouvoir contribuer, aider ou transmettre',
};

/* ────────────────────────────────────────────────────────────────────────
 * 3. AFFECTION_LANGUAGE — FERMÉ (Dictionnaire §4, onboarding-clos §AFFECTION).
 *    7 modalités × 2 directions = 14 codes DÉRIVÉS du croisement (pas écrits 2×).
 * ──────────────────────────────────────────────────────────────────────── */

export const AFFECTION_MODALITIES = [
  'WORDS',
  'SERVICES',
  'PERSONALIZED_GIFT',
  'SYMBOLIC_GIFT',
  'QUALITY_TIME',
  'MICRO_ATTENTIONS',
  'SURPRISE',
] as const;
export type AffectionModality = (typeof AFFECTION_MODALITIES)[number];

export const AFFECTION_DIRECTIONS = ['receive', 'give'] as const;
export type AffectionDirection = (typeof AFFECTION_DIRECTIONS)[number];

export const AFFECTION_MODALITY_LABELS: Record<AffectionModality, string> = {
  WORDS: 'Mots sincères, compliments, paroles explicites',
  SERVICES: 'Aide concrète, service rendu',
  PERSONALIZED_GIFT: 'Cadeau pensé spécifiquement pour la personne',
  SYMBOLIC_GIFT: 'Cadeau chargé de sens, d’histoire ou de symbolique',
  QUALITY_TIME: 'Temps consacré ensemble et présence disponible',
  MICRO_ATTENTIONS: 'Petits gestes, détails et attentions du quotidien',
  SURPRISE: 'Initiative et inattendu',
};

export const AFFECTION_DIRECTION_LABELS: Record<AffectionDirection, string> = {
  receive: 'Réception — ce qui fait sentir l’affection de l’autre',
  give: 'Expression — comment la personne montre son affection',
};

/** Code affectif dérivé : AFFECTION_RECEIVE_WORDS, AFFECTION_GIVE_SERVICES, … */
export type AffectionLanguageCode =
  `AFFECTION_${Uppercase<AffectionDirection>}_${AffectionModality}`;

/** Construit le code affectif à partir de la direction et de la modalité. */
export function affectionCode(
  direction: AffectionDirection,
  modality: AffectionModality,
): AffectionLanguageCode {
  return `AFFECTION_${direction.toUpperCase() as Uppercase<AffectionDirection>}_${modality}`;
}

/** Les 14 codes affectifs, dérivés du croisement 7×2 (jamais écrits deux fois). */
export const AFFECTION_LANGUAGE_CODES: readonly AffectionLanguageCode[] =
  AFFECTION_DIRECTIONS.flatMap((d) =>
    AFFECTION_MODALITIES.map((m) => affectionCode(d, m)),
  );

/** Cadence des attentions (Dictionnaire §4.5), conservée à part de la modalité. */
export const AFFECTION_CADENCES = [
  'regular_micro',
  'rare_marking',
  'contextual',
  'unknown',
] as const;
export type AffectionCadence = (typeof AFFECTION_CADENCES)[number];
export const AFFECTION_CADENCE_LABELS: Record<AffectionCadence, string> = {
  regular_micro: 'Petites attentions régulières',
  rare_marking: 'Grand moment rare mais marquant',
  contextual: 'Selon le contexte',
  unknown: 'Non renseigné',
};

/* ────────────────────────────────────────────────────────────────────────
 * 4. DRIVER — dictionnaire contrôlé FERMÉ (Dictionnaire §6). 25 codes.
 * ──────────────────────────────────────────────────────────────────────── */

export const DRIVER_CODES = [
  'DRV_PERSONALIZATION',
  'DRV_ATTENTIVENESS',
  'DRV_SYMBOLISM',
  'DRV_MEMORY',
  'DRV_STORY',
  'DRV_TRANSMISSION',
  'DRV_SHARED_EXPERIENCE',
  'DRV_CONNECTION',
  'DRV_EFFORT',
  'DRV_ANTICIPATION',
  'DRV_TIMING',
  'DRV_SURPRISE',
  'DRV_DISCOVERY',
  'DRV_EXPERTISE',
  'DRV_AESTHETIC',
  'DRV_QUALITY',
  'DRV_RARITY',
  'DRV_EXCLUSIVITY',
  'DRV_UTILITY',
  'DRV_RELIEF',
  'DRV_COMFORT',
  'DRV_SIMPLICITY',
  'DRV_AUTHENTICITY',
  'DRV_CELEBRATION',
  'DRV_PLAYFULNESS',
] as const;

export type DriverCode = (typeof DRIVER_CODES)[number];

export const DRIVER_LABELS: Record<DriverCode, string> = {
  DRV_PERSONALIZATION: 'C’est spécifiquement adapté à moi',
  DRV_ATTENTIVENESS: 'Cela prouve qu’on m’a écouté ou remarqué',
  DRV_SYMBOLISM: 'Ce que le geste représente compte',
  DRV_MEMORY: 'Cela crée ou réactive un souvenir',
  DRV_STORY: 'Cela possède une histoire intéressante',
  DRV_TRANSMISSION: 'Cela peut être conservé ou transmis',
  DRV_SHARED_EXPERIENCE: 'Le plaisir vient de l’expérience vécue ensemble',
  DRV_CONNECTION: 'Cela renforce directement le lien',
  DRV_EFFORT: 'L’effort investi participe à la valeur',
  DRV_ANTICIPATION: 'Quelqu’un a anticipé un besoin ou une envie',
  DRV_TIMING: 'La justesse du moment compte',
  DRV_SURPRISE: 'L’inattendu augmente le plaisir',
  DRV_DISCOVERY: 'Cela permet une découverte',
  DRV_EXPERTISE: 'Le choix est pointu ou connaisseur',
  DRV_AESTHETIC: 'La beauté crée du plaisir',
  DRV_QUALITY: 'La qualité intrinsèque crée de la valeur',
  DRV_RARITY: 'La rareté elle-même compte',
  DRV_EXCLUSIVITY: 'L’accès privilégié compte',
  DRV_UTILITY: 'L’utilité procure de la valeur',
  DRV_RELIEF: 'Cela enlève une contrainte',
  DRV_COMFORT: 'Cela apporte confort ou douceur',
  DRV_SIMPLICITY: 'La simplicité elle-même plaît',
  DRV_AUTHENTICITY: 'Le caractère vrai, sincère ou sans artifice crée de la valeur',
  DRV_CELEBRATION: 'Mettre en valeur un moment compte',
  DRV_PLAYFULNESS: 'Le jeu, l’amusement, l’humour ou la légèreté créent du plaisir',
};

/* ────────────────────────────────────────────────────────────────────────
 * 5. GUARDRAIL — codes canoniques FERMÉS, groupés par 7 catégories.
 *    Dictionnaire §8.3. severity / scope appartiennent à l'EVIDENCE (R20),
 *    jamais au code.
 *
 *    ⚠ POINT D'ARRÊT (voir rapport) : la source de vérité (Dictionnaire §8.3,
 *    seule à énumérer les codes ; le HSG ne les liste pas) définit 18 codes.
 *    Le chiffre de contrôle du lot attend 19. Aucun 19e code n'existe dans
 *    les documents → aucune invention (R25). Les 18 réels sont transcrits.
 * ──────────────────────────────────────────────────────────────────────── */

export const GUARDRAIL_CATEGORIES = [
  'social',
  'organisation',
  'emotion',
  'sensoriel',
  'qualite',
  'relationnel',
  'style',
] as const;
export type GuardrailCategory = (typeof GUARDRAIL_CATEGORIES)[number];

export const GUARDRAIL_CODES_BY_CATEGORY = {
  social: ['GRD_PUBLIC_EXPOSURE', 'GRD_TOO_MANY_PEOPLE', 'GRD_FORCED_SOCIALIZATION'],
  organisation: ['GRD_SCHEDULE_DISRUPTION', 'GRD_LAST_MINUTE', 'GRD_LOSS_OF_CONTROL'],
  emotion: ['GRD_TOO_INTIMATE', 'GRD_TOO_EMOTIONAL', 'GRD_SENTIMENTAL_OVERLOAD'],
  sensoriel: ['GRD_NOISE', 'GRD_CROWD', 'GRD_STRONG_SMELL'],
  qualite: ['GRD_LOW_QUALITY', 'GRD_POOR_EXECUTION'],
  relationnel: ['GRD_IMPERSONAL', 'GRD_GENERIC', 'GRD_TOO_INTRUSIVE'],
  style: ['GRD_STYLE_MISMATCH'],
} as const satisfies Record<GuardrailCategory, readonly string[]>;

export const GUARDRAIL_CODES = [
  ...GUARDRAIL_CODES_BY_CATEGORY.social,
  ...GUARDRAIL_CODES_BY_CATEGORY.organisation,
  ...GUARDRAIL_CODES_BY_CATEGORY.emotion,
  ...GUARDRAIL_CODES_BY_CATEGORY.sensoriel,
  ...GUARDRAIL_CODES_BY_CATEGORY.qualite,
  ...GUARDRAIL_CODES_BY_CATEGORY.relationnel,
  ...GUARDRAIL_CODES_BY_CATEGORY.style,
] as const;

export type GuardrailCode = (typeof GUARDRAIL_CODES)[number];

export const GUARDRAIL_LABELS: Record<GuardrailCode, string> = {
  GRD_PUBLIC_EXPOSURE: 'Exposition publique',
  GRD_TOO_MANY_PEOPLE: 'Trop de monde',
  GRD_FORCED_SOCIALIZATION: 'Socialisation forcée',
  GRD_SCHEDULE_DISRUPTION: 'Perturbation du planning',
  GRD_LAST_MINUTE: 'Dernière minute',
  GRD_LOSS_OF_CONTROL: 'Perte de contrôle',
  GRD_TOO_INTIMATE: 'Trop intime',
  GRD_TOO_EMOTIONAL: 'Trop émotionnel',
  GRD_SENTIMENTAL_OVERLOAD: 'Surcharge sentimentale',
  GRD_NOISE: 'Bruit',
  GRD_CROWD: 'Foule',
  GRD_STRONG_SMELL: 'Odeur forte',
  GRD_LOW_QUALITY: 'Qualité insuffisante',
  GRD_POOR_EXECUTION: 'Exécution incertaine',
  GRD_IMPERSONAL: 'Impersonnel',
  GRD_GENERIC: 'Générique',
  GRD_TOO_INTRUSIVE: 'Trop intrusif',
  GRD_STYLE_MISMATCH: 'Décalage de style',
};

/** Sévérité d'une evidence guardrail (HSG §16.1). Appartient à l'evidence (R20). */
export const GUARDRAIL_SEVERITIES = ['SOFT', 'HARD'] as const;
export type GuardrailSeverity = (typeof GUARDRAIL_SEVERITIES)[number];

/**
 * Portée d'un guardrail (décision 7 : `scope` dédoublé → `guardrailScope`).
 * HSG §16.2 / Dictionnaire §8.2.
 */
export const GUARDRAIL_SCOPES = ['selection', 'execution', 'context'] as const;
export type GuardrailScope = (typeof GUARDRAIL_SCOPES)[number];

/**
 * Guardrails verticaux extensibles (Dictionnaire §8.3). Chemins LIBRES
 * sous des préfixes connus — ex. food.allergy.*, fashion.never_wear.*.
 * Ce ne sont PAS des codes fermés.
 */
export const GUARDRAIL_VERTICAL_PREFIXES = [
  'food.allergy',
  'food.dislike',
  'fashion.never_wear',
  'travel',
] as const;
export type GuardrailVerticalPrefix = (typeof GUARDRAIL_VERTICAL_PREFIXES)[number];
export type GuardrailVerticalPath = string;

/** Un chemin vertical est reconnu s'il commence par un préfixe connu. */
export function isGuardrailVerticalPath(path: string): boolean {
  return GUARDRAIL_VERTICAL_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}.`),
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * 6. INTEREST (Dictionnaire §1).
 *    parent_domain : OUVERT extensible (29 domaines initiaux).
 *    relationship  : FERMÉ (5 valeurs). Alignement nommage : `subject` + `relationship`.
 * ──────────────────────────────────────────────────────────────────────── */

export const INTEREST_RELATIONSHIPS = [
  'casual',
  'curious',
  'enthusiast',
  'passion',
  'expert',
] as const;
export type InterestRelationship = (typeof INTEREST_RELATIONSHIPS)[number];
export const INTEREST_RELATIONSHIP_LABELS: Record<InterestRelationship, string> = {
  casual: 'Occasionnel',
  curious: 'Curieux',
  enthusiast: 'Passionné amateur',
  passion: 'Passion',
  expert: 'Expert',
};

const INTEREST_PARENT_DOMAIN_SEED = [
  'food_gastronomy',
  'wine_spirits',
  'travel',
  'fashion',
  'beauty_skincare',
  'jewelry_watches',
  'design_decor',
  'architecture',
  'art',
  'photography',
  'music',
  'cinema_series',
  'books_literature',
  'sport_fitness',
  'outdoor_nature',
  'tech',
  'gaming',
  'cars_mobility',
  'craftsmanship',
  'culture_history',
  'science',
  'business_entrepreneurship',
  'personal_development',
  'wellbeing',
  'cooking',
  'gardening',
  'family_parenting',
  'animals',
  'collecting',
] as const;

/** OUVERT : alias string, validé contre un registre extensible. */
export type InterestParentDomain = string;

/* ────────────────────────────────────────────────────────────────────────
 * 7. ENTITY (Dictionnaire §9).
 *    types   : OUVERT (21 types initiaux). relation : FERMÉ (9 valeurs).
 *    Alignement nommage : ENTITY porte `relation`.
 * ──────────────────────────────────────────────────────────────────────── */

export const ENTITY_RELATIONS = [
  'LOVE',
  'LIKE',
  'CURIOUS',
  'WANT_TO_TRY',
  'WANT_TO_OWN',
  'WANT_TO_VISIT',
  'NEUTRAL',
  'DISLIKE',
  'AVOID',
] as const;
export type EntityRelation = (typeof ENTITY_RELATIONS)[number];
export const ENTITY_RELATION_LABELS: Record<EntityRelation, string> = {
  LOVE: 'Adore',
  LIKE: 'Aime bien',
  CURIOUS: 'Curieux de',
  WANT_TO_TRY: 'Aimerait essayer',
  WANT_TO_OWN: 'Aimerait posséder',
  WANT_TO_VISIT: 'Aimerait visiter',
  NEUTRAL: 'Neutre',
  DISLIKE: 'N’aime pas',
  AVOID: 'Évite',
};

const ENTITY_TYPE_SEED = [
  'ENTITY_PERSON',
  'ENTITY_BRAND',
  'ENTITY_PRODUCT',
  'ENTITY_PLACE',
  'ENTITY_RESTAURANT',
  'ENTITY_HOTEL',
  'ENTITY_DESTINATION',
  'ENTITY_ARTIST',
  'ENTITY_AUTHOR',
  'ENTITY_BOOK',
  'ENTITY_FILM_SERIES',
  'ENTITY_MUSIC',
  'ENTITY_SPORT_TEAM',
  'ENTITY_EVENT',
  'ENTITY_HOBBY',
  'ENTITY_OBJECT',
  'ENTITY_FOOD',
  'ENTITY_DRINK',
  'ENTITY_STYLE',
  'ENTITY_COLOR',
  'ENTITY_MATERIAL',
] as const;

/** OUVERT : alias string, validé contre un registre extensible. */
export type EntityType = string;

/* ────────────────────────────────────────────────────────────────────────
 * 8. CONTEXT (Dictionnaire §10). OUVERT validé (10 codes initiaux).
 * ──────────────────────────────────────────────────────────────────────── */

const CONTEXT_CODE_SEED = [
  'CONTEXT_LIFE_STAGE',
  'CONTEXT_RELATIONSHIP',
  'CONTEXT_PARENTING',
  'CONTEXT_PROFESSION',
  'CONTEXT_LOCATION',
  'CONTEXT_HOME',
  'CONTEXT_PET',
  'CONTEXT_CURRENT_PROJECT',
  'CONTEXT_TRANSITION',
  'CONTEXT_CONSTRAINT',
] as const;

/** OUVERT validé : alias string + registre extensible avec validation. */
export type ContextCode = string;

/* ────────────────────────────────────────────────────────────────────────
 * 9. BEHAVIOR (Dictionnaire §7 / HSG §12).
 *    contexts  : 4 initiaux, extensibles.
 *    patterns  : registre normalisé (décision 2 : les noms HSG gagnent).
 * ──────────────────────────────────────────────────────────────────────── */

const BEHAVIOR_CONTEXT_SEED = [
  'stress_response',
  'conflict_response',
  'decision_process',
  'emotional_expression',
] as const;

/** Contextes BEHAVIOR révélables par le Discovery (Dictionnaire §7.2). Non fermé. */
export const BEHAVIOR_CONTEXT_DISCOVERY_HINTS = [
  'distress_response',
  'grief_response',
  'change_response',
  'help_seeking',
  'celebration_behavior',
] as const;

export type BehaviorContext = string;

/**
 * Alias de patterns BEHAVIOR (décision 2). Les noms HSG gagnent :
 * un renommage V15 est normalisé vers le nom canonique HSG.
 * La création d'un pattern cherche d'abord dans le registre avant d'ajouter.
 */
export const BEHAVIOR_PATTERN_ALIASES: Record<string, string> = {
  withdraw_seek_calm: 'withdraw',
  research_thoroughly: 'extensive_research',
};

/** Patterns canoniques nommés par le HSG (Dictionnaire §7.3, ecarts décision 2). */
const BEHAVIOR_PATTERN_SEED = [
  'withdraw',
  'regain_control',
  'use_humor_to_defuse',
  'extensive_research',
] as const;

export type BehaviorPattern = string;

/** Normalise un pattern brut vers son nom canonique (HSG gagne). */
export function normalizeBehaviorPattern(raw: string): string {
  return BEHAVIOR_PATTERN_ALIASES[raw] ?? raw;
}

/* ────────────────────────────────────────────────────────────────────────
 * 10. PREFERENCE (Dictionnaire §2). Chemin PREFERENCE.[context].[attribute]=value.
 *     context / attribute LIBRES. Ce n'est pas un code fermé.
 * ──────────────────────────────────────────────────────────────────────── */

export type PreferencePath = `PREFERENCE.${string}.${string}`;

/** Construit un chemin de préférence canonique. */
export function preferencePath(context: string, attribute: string): PreferencePath {
  return `PREFERENCE.${context}.${attribute}`;
}

/** Un chemin de préférence valide a la forme PREFERENCE.<context>.<attribute>. */
export function isPreferencePath(path: string): path is PreferencePath {
  const parts = path.split('.');
  return parts.length >= 3 && parts[0] === 'PREFERENCE' && parts[1].length > 0 && parts[2].length > 0;
}

/* ────────────────────────────────────────────────────────────────────────
 * Registre de vocabulaire OUVERT extensible.
 * Un code ouvert n'est jamais rejeté faute de figurer dans la liste fermée
 * (R24) ; le registre sert à réutiliser plutôt qu'à multiplier les synonymes
 * (Dictionnaire §15) et à valider la connaissance descriptive structurée.
 * ──────────────────────────────────────────────────────────────────────── */

export interface OpenVocabulary {
  /** Valeurs initiales (graine) issues des documents — chiffre de contrôle, forme BRUTE. */
  readonly seed: readonly string[];
  /** La valeur est-elle déjà connue du registre (à normalisation près) ? */
  has(code: string): boolean;
  /** Toutes les valeurs canoniques connues (graine + ajouts), forme brute conservée. */
  values(): string[];
  /** Enregistre une nouvelle valeur ; une variante normalisée déjà connue n'est pas dupliquée. */
  register(code: string): void;
}

/**
 * Registre ouvert extensible. La NORMALISATION À L'ENREGISTREMENT (Dictionnaire §15)
 * évite de multiplier les synonymes : deux formulations qui normalisent vers la même
 * clé pointent sur une seule valeur canonique (la première enregistrée, verbatim).
 * `normalize` est passée explicitement par registre (identité par défaut).
 */
export function createOpenVocabulary(
  seed: readonly string[],
  normalize: (code: string) => string = (c) => c,
): OpenVocabulary {
  // clé normalisée → valeur canonique brute (première enregistrée).
  const byKey = new Map<string, string>();
  for (const s of seed) {
    const k = normalize(s);
    if (!byKey.has(k)) byKey.set(k, s);
  }
  return {
    seed,
    has: (code) => byKey.has(normalize(code)),
    values: () => [...byKey.values()],
    register: (code) => {
      const k = normalize(code);
      if (!byKey.has(k)) byKey.set(k, code);
    },
  };
}

// Registres ouverts exposés (seed = chiffre de contrôle). 5 registres sur 5 normalisés
// à l'enregistrement : les quatre registres de TYPES via normalizeLabel (lexical), et
// BEHAVIOR_PATTERNS via normalizeBehaviorPattern (alias HSG).
export const INTEREST_PARENT_DOMAINS = createOpenVocabulary(INTEREST_PARENT_DOMAIN_SEED, normalizeLabel);
export const ENTITY_TYPES = createOpenVocabulary(ENTITY_TYPE_SEED, normalizeLabel);
export const CONTEXT_CODES = createOpenVocabulary(CONTEXT_CODE_SEED, normalizeLabel);
export const BEHAVIOR_CONTEXTS = createOpenVocabulary(BEHAVIOR_CONTEXT_SEED, normalizeLabel);
export const BEHAVIOR_PATTERNS = createOpenVocabulary(BEHAVIOR_PATTERN_SEED, normalizeBehaviorPattern);

/* ────────────────────────────────────────────────────────────────────────
 * Types de CONNAISSANCE OUVERTE (lot A ter, Dictionnaire §12). OUVERT validé :
 * la connaissance descriptive est sémantiquement ouverte (architecture open-world).
 * `type` QUALIFIE LA NATURE DESCRIPTIVE de la connaissance, pour la recherche et le
 * routage. Il peut reprendre le nom d'une famille canonique lorsqu'elle constitue la
 * bonne catégorie descriptive (cf. photographie argentique → INTEREST), SANS transformer
 * cette connaissance en evidence de cette famille (voir la frontière dans open-knowledge.ts).
 * La graine = 10 familles canoniques + 'life_priority' (arbitré le 5 oct). 6ᵉ registre normalisé sur 6.
 * ──────────────────────────────────────────────────────────────────────── */
const OPEN_KNOWLEDGE_TYPE_SEED = [...CANONICAL_FAMILIES, 'life_priority'] as const;

/** OUVERT : alias string, validé contre un registre extensible et normalisé. */
export type OpenKnowledgeType = string;
export const OPEN_KNOWLEDGE_TYPES = createOpenVocabulary(OPEN_KNOWLEDGE_TYPE_SEED, normalizeLabel);

/* ────────────────────────────────────────────────────────────────────────
 * CONTEXTES LOCAUX D'EVIDENCE (lot B) — DISTINCT de CONTEXT_CODES (famille CONTEXT).
 * C'est le vocabulaire des SITUATIONS dans lesquelles une evidence est observée
 * (le champ `evidence.context`), pas la famille CONTEXT. Registre NORMALISÉ : il empêche
 * qu'une faute de frappe crée un contexte distinct de plus et déclenche une globalisation
 * à tort (le grain guardrail/consolidation dépend de l'égalité exacte des contextes).
 * 13 valeurs = 10 contextes locaux du socle + distress (soutien) + conflict (q7) +
 * emotional_expression (q11). GLOBAL n'y figure pas : c'est l'opposé d'un contexte local.
 * ⚠ 'distress' ne se traduit JAMAIS en donnée clinique (contexte relationnel, pas santé).
 * ──────────────────────────────────────────────────────────────────────── */
const EVIDENCE_CONTEXT_SEED = [
  'attention_received',
  'gift',
  'gift.material',
  'decision',
  'relationship',
  'surprise',
  'stress',
  'communication',
  'organised_for_me',
  'affection_given',
  'distress',
  'conflict',
  'emotional_expression',
  // 14e contexte (incognito §2) : le phénomène est situé dans la dyade avec le PILOTE
  // (ex. « Julie envoie des vocaux à Estelle »), distinct de 'relationship' (vie relationnelle
  // en général). Jamais hérité du mode ; la provenance n'est pas le contexte. Vocabulaire
  // OUVERT par nature (BEHAVIOR en annonce d'autres via le Discovery) → pas de CHECK en base.
  'relationship_with_reporter',
] as const;
export const EVIDENCE_CONTEXTS = createOpenVocabulary(EVIDENCE_CONTEXT_SEED, normalizeLabel);

/** Un contexte d'evidence valide : GLOBAL (transversal) ou un contexte local connu du registre. */
export function isValidEvidenceContext(context: string): boolean {
  return context === 'GLOBAL' || EVIDENCE_CONTEXTS.has(context);
}

/**
 * GARDE-FOU DE PRODUCTION (« le CHECK au bon étage ») : aucun contexte ne sort de la couche de
 * production s'il n'appartient pas au vocabulaire. Sans lui, une coquille (`stress_reponse`)
 * créerait en silence un groupe de consolidation distinct — le grain de consolidation inclut le
 * contexte — et couperait la connaissance d'une personne en deux. Appliqué aux DEUX jeux (self + incognito).
 */
export function assertValidEvidenceContext(context: string): void {
  if (!isValidEvidenceContext(context)) {
    throw new Error(`[knowledge] contexte hors EVIDENCE_CONTEXTS : « ${context} » — coquille ? il scinderait la consolidation.`);
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * DEPRECATED_AXES — les 15 anciens axes bipolaires du code actuel
 * (9 de temperament/questions.ts + 6 de lifestyle/questions.ts), avec leur
 * type de migration et leurs équivalents canoniques.
 *
 * EXPORTÉ POUR DOCUMENTATION/MIGRATION UNIQUEMENT — jamais utilisé par la
 * logique du module. Les équivalents n'emploient que des codes canoniques
 * existants (aucune invention, R25). Un axe bipolaire viole R4 (pas d'axe
 * bipolaire implicite) : il est « split » en constructs indépendants.
 * ──────────────────────────────────────────────────────────────────────── */

export type AxisMigrationType =
  /** 1:1 vers un unique construct / continuum canonique. */
  | 'direct'
  /** Axe bipolaire décomposé en ≥2 constructs canoniques indépendants. */
  | 'split'
  /** Quitte PROFILE pour une autre famille (PREFERENCE / BEHAVIOR / INTEREST). */
  | 'reclassified';

export interface DeprecatedAxis {
  /** Clé de l'ancien axe dans le code. */
  readonly axis: string;
  /** Module d'origine. */
  readonly source: 'temperament' | 'lifestyle';
  readonly migration: AxisMigrationType;
  /** Codes canoniques cibles (tous existants dans ce vocabulaire). */
  readonly equivalents: readonly string[];
  readonly note: string;
}

export const DEPRECATED_AXES: readonly DeprecatedAxis[] = [
  // temperament/questions.ts (9)
  {
    axis: 'energieSociale',
    source: 'temperament',
    migration: 'direct',
    equivalents: ['SOCIAL_ENERGY'],
    note: 'Continuum conservé — seul axe bipolaire légitime (0 = valeur réelle).',
  },
  {
    axis: 'espaceProsimite',
    source: 'temperament',
    migration: 'split',
    equivalents: ['PROFILE_AUTONOMY', 'PROFILE_RELATIONALITY'],
    note: 'Autonomie ≠ orientation relationnelle ; ne pas croiser avec l’énergie sociale.',
  },
  {
    axis: 'spontaneiteControle',
    source: 'temperament',
    migration: 'split',
    equivalents: ['APPETENCE_SPONTANEITY', 'IMPORTANCE_MASTERY'],
    note: 'Spontanéité non opposée à maîtrise (Dictionnaire §3.2).',
  },
  {
    axis: 'communicationStyle',
    source: 'temperament',
    migration: 'reclassified',
    equivalents: ['PREFERENCE.communication.style'],
    note: 'Préférence déclarée, pas trait PROFILE (onboarding-clos §PREFERENCE, Q9).',
  },
  {
    axis: 'expressiviteReserve',
    source: 'temperament',
    migration: 'reclassified',
    equivalents: ['BEHAVIOR.emotional_expression'],
    note: 'Manière d’exprimer l’émotion en situation → BEHAVIOR (Q11).',
  },
  {
    axis: 'stabiliteNouveaute',
    source: 'temperament',
    migration: 'split',
    equivalents: ['PROFILE_OPENNESS', 'PROFILE_ADAPTABILITY'],
    note: 'Appétence pour la nouveauté ≠ facilité à composer avec le changement.',
  },
  {
    axis: 'sensibiliteDetails',
    source: 'temperament',
    migration: 'direct',
    equivalents: ['PROFILE_SENSITIVITY'],
    note: 'Sensibilité (sous-facettes sensory/aesthetic/emotional).',
  },
  {
    axis: 'exigenceStanding',
    source: 'temperament',
    migration: 'split',
    equivalents: ['PROFILE_EXACTINGNESS', 'APPETENCE_PREMIUM'],
    note: 'Exigence ≠ premium (confusion interdite, onboarding-clos).',
  },
  {
    axis: 'rapportTemps',
    source: 'temperament',
    migration: 'direct',
    equivalents: ['PROFILE_STRUCTURE'],
    note: 'Rapport au temps / anticipation → Structure (Q4a GLOBAL_DIRECT).',
  },
  // lifestyle/questions.ts (6)
  {
    axis: 'foodie',
    source: 'lifestyle',
    migration: 'reclassified',
    equivalents: ['INTEREST:food_gastronomy'],
    note: 'Intérêt pour un domaine, pas un trait transversal.',
  },
  {
    axis: 'premiumSimplicite',
    source: 'lifestyle',
    migration: 'split',
    equivalents: ['APPETENCE_PREMIUM', 'DRV_SIMPLICITY'],
    note: 'Premium et simplicité ne sont pas les deux pôles d’un même axe.',
  },
  {
    axis: 'experienceObjet',
    source: 'lifestyle',
    migration: 'split',
    equivalents: ['APPETENCE_EXPERIENCE', 'APPETENCE_OBJECT'],
    note: 'Non opposées (Dictionnaire §3.4) : deux appétences indépendantes.',
  },
  {
    axis: 'esthetiqueFonctionnel',
    source: 'lifestyle',
    migration: 'split',
    equivalents: ['IMPORTANCE_AESTHETIC', 'IMPORTANCE_FUNCTIONAL'],
    note: 'Non opposées : esthétique et usage sont deux importances distinctes.',
  },
  {
    axis: 'aventureConfort',
    source: 'lifestyle',
    migration: 'split',
    equivalents: ['PROFILE_OPENNESS', 'DRV_COMFORT'],
    note: 'Appétence pour l’aventure vs valeur du confort — indépendantes.',
  },
  {
    axis: 'authenticiteLuxe',
    source: 'lifestyle',
    migration: 'split',
    equivalents: ['IMPORTANCE_AUTHENTICITY', 'APPETENCE_PREMIUM'],
    note: 'Authenticité non opposée au premium (Dictionnaire §3.2).',
  },
];
