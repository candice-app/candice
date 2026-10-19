// A3 — Singularité & Pratique : champs TEXTE LIBRE / pratiques du socle → journal FACT.
// Un FACT est conservé VERBATIM (la valeur saisie telle quelle), sans mapping, sans inférence, ne produit
// aucun signal (R16/§11.1) et ne disparaît jamais. questionText = libellé EXACT du composant (repris mot
// pour mot, jamais inventé). factType namespacé par domaine. `sensitive` → FactSensitivity → visibilité
// internal_only (santé/vie privée, §35/R12).

export interface FactFieldSpec {
  readonly factType: string;
  readonly questionText: string;
  readonly sensitive?: boolean;
}

/** SingularityAnswers (11 champs texte libre). `interests` (widget structuré) hors périmètre de ce lot. */
export const SINGULARITY_FACT_FIELDS: Record<string, FactFieldSpec> = {
  adore_faire:       { factType: 'singularity.adore_faire',       questionText: "Ce que j'adore faire" },
  evite_deteste:     { factType: 'singularity.evite_deteste',     questionText: "Ce que j'évite ou déteste" },
  sujets_stimulants: { factType: 'singularity.sujets_stimulants', questionText: 'Les sujets qui me stimulent vraiment' },
  peu_savent:        { factType: 'singularity.peu_savent',        questionText: 'Ce que peu de gens savent sur moi' },
  plus_beau_cadeau:  { factType: 'singularity.plus_beau_cadeau',  questionText: "Le plus beau cadeau ou moment qu'on m'ait offert" },
  detail_compris:    { factType: 'singularity.detail_compris',    questionText: 'Le genre de détail qui me fait me sentir compris(e)' },
  marques_lieux:     { factType: 'singularity.marques_lieux',     questionText: "Les marques, objets ou lieux que j'aime" },
  cadeaux_non:       { factType: 'singularity.cadeaux_non',       questionText: "Les cadeaux que je n'aimerais pas recevoir" },
  envies_reves:      { factType: 'singularity.envies_reves',      questionText: 'Mes envies ou rêves du moment' },
  remarquer:         { factType: 'singularity.remarquer',         questionText: "Ce que j'aimerais qu'on remarque davantage chez moi" },
  sentir_special:    { factType: 'singularity.sentir_special',    questionText: 'Ce qui me fait me sentir spécial(e)' },
};

/** PracticalInfo — champs plats (string | string[]). dates_importantes/role_familial/interests structurés : hors lot. */
export const PRACTICAL_FACT_FIELDS: Record<string, FactFieldSpec> = {
  prenom:            { factType: 'practical.prenom',            questionText: 'Prénom' },
  sexe:              { factType: 'practical.sexe',              questionText: 'Sexe' },
  age:               { factType: 'practical.age',               questionText: 'Âge' },
  profession:        { factType: 'practical.profession',        questionText: 'Profession' },
  allergies:         { factType: 'practical.allergies',         questionText: 'Allergies alimentaires', sensitive: true },
  regime:            { factType: 'practical.regime',            questionText: 'Régime alimentaire' },
  alcool:            { factType: 'practical.alcool',            questionText: "Rapport à l'alcool" },
  mobilite_sante:    { factType: 'practical.mobilite_sante',    questionText: 'Mobilité / santé / confort', sensitive: true },
  taille_vetements:  { factType: 'practical.taille_vetements',  questionText: 'Taille — Vêtements' },
  taille_chaussures: { factType: 'practical.taille_chaussures', questionText: 'Taille — Chaussures' },
  taille_pantalon:   { factType: 'practical.taille_pantalon',   questionText: 'Taille — Pantalon' },
  taille_bague:      { factType: 'practical.taille_bague',      questionText: 'Taille — Bague' },
  parfums:           { factType: 'practical.parfums',           questionText: 'Parfums et odeurs aimées' },
  odeurs_detestees:  { factType: 'practical.odeurs_detestees',  questionText: 'Odeurs ou parfums que je déteste' },
  couleurs_matieres: { factType: 'practical.couleurs_matieres', questionText: 'Couleurs, matières, style' },
  adresse_livraison: { factType: 'practical.adresse_livraison', questionText: 'Adresse de livraison', sensitive: true },
  animaux:           { factType: 'practical.animaux',           questionText: 'Animaux de compagnie' },
};

/** q17 (AvoidStep) — texte libre « ce qu'il vaut mieux éviter ». Verbatim seul : l'EXTRACTION (q17Interdits) reste hors journal (lot futur). */
export const Q17_FACT_FIELD: FactFieldSpec = { factType: 'relational.q17_register', questionText: "Ce qu'il vaut mieux éviter avec moi…" };
