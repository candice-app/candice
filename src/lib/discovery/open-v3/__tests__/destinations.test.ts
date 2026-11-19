import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { enregistrerReponseOuverte, rejouerLecturesEnAttente, sourceLectureDestinations } from '../service';
import { couvertureDestinations, DESTINATIONS_PAR_QUESTION, examinerSegments, positionExacte, resoudre, sensLexical, propositionDe, VERSION_LECTURE, type EntiteConnue } from '../destinations';
import { clarificationsOuvertes, declarerAnimal, repondreClarification, FAIT_ENTITE, FAIT_LECTURE } from '../destinations-ecriture';

const U = '00000000-0000-4000-8000-0000000000d7';
type Seg = Record<string, unknown>;
/** Un segment tel qu'un modèle le rendrait quand il juge tout conforme. */
const seg = (declencheur: string, passage: string, attitude: string, plus: Seg = {}): Seg =>
  ({ declencheur, passage, attitude, affirme: true, personne: 'soi', temps: 'actuel', condition: null, limite: null, ...plus });
const lecteur = (...segments: Seg[]) => async () => ({ segments });
const dest = (q: string) => DESTINATIONS_PAR_QUESTION.get(q)!;
const examen = (q: string, texte: string, ...s: Seg[]) => examinerSegments(texte, { segments: s }, dest(q));
const issue = (q: string, texte: string, s: Seg) => { const e = examen(q, texte, s); return e.retenus.length === 1 ? 'retenu' : e.ecartes[0]?.motif; };
const faits = (b: ReturnType<typeof fausseBase>) => (b.tables.knowledge_facts ?? []).filter((f) => String(f.fact_type).startsWith('discovery.fait.') && !f.superseded_at);
const preuves = (b: ReturnType<typeof fausseBase>) => (b.tables.knowledge_evidences ?? []).filter((e) => !e.superseded_at);

describe('onglet 17 — couverture', () => {
  it('quinze destinations, neuf questions, chacune avec son exigence', () => {
    expect(couvertureDestinations()).toHaveLength(15);
    expect(DESTINATIONS_PAR_QUESTION.size).toBe(9);
  });
});

describe('épreuve 1 — la copie est exacte, accents et casse compris', () => {
  it('un passage sans son accent n’est pas une copie', () => {
    expect(positionExacte('Je déteste le macramé.', 'le macramé')).toEqual({ debut: 11, fin: 21 });
    expect(positionExacte('Je déteste le macramé.', 'le macrame')).toBeNull();
    expect(positionExacte('Je déteste le macramé.', 'Le macramé')).toBeNull();
  });
  it('une précision inventée (titre, condition) écarte le segment entier', () => {
    expect(issue('CRE-06', 'Je déteste le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet', { condition: 'sauf le dimanche' }))).toBe('precision_inexacte');
  });
});

describe('le sens que les mots de la proposition donnent au passage', () => {
  const sens = (texte: string, passage: string) => { const p = positionExacte(texte, passage)!; const { avant, apres } = propositionDe(texte, p.debut, p.fin); return sensLexical(avant, apres); };
  it.each([
    ['J’adore la géologie.', 'la géologie', 'positif'],
    ['La géologie ne m’intéresse pas.', 'La géologie', 'negatif'],
    ['Je n’aime pas la géologie.', 'la géologie', 'negatif'],
    ['Je déteste la géologie.', 'la géologie', 'negatif'],
    ['Je ne déteste pas la géologie.', 'la géologie', 'incertain'],
    ['La géologie.', 'La géologie', 'nu'],
    ['Tout sauf la géologie.', 'la géologie', 'nie_nu'],
    ['J’adore l’aquarelle, je déteste le macramé.', 'le macramé', 'negatif'],
    ['J’adore l’aquarelle, je déteste le macramé.', 'l’aquarelle', 'positif'],
    ['Je n’aime pas la peinture mais j’adore la géologie.', 'la géologie', 'positif'],
  ])('%s → « %s » : %s', (texte, passage, attendu) => { expect(sens(texte, passage)).toBe(attendu); });
});

describe('épreuves 2 et 3 — chaque destination, ses cas probants, négatifs et contradictoires', () => {
  // [question, texte, segment rendu par le modèle, issue attendue]
  const CAS: [string, string, Seg, string][] = [
    // CRE-06 — une technique, un style, une matière REJETÉS.
    ['CRE-06', 'Je déteste le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet'), 'retenu'],
    ['CRE-06', 'Le macramé.', seg('SEGMENT_TECHNIQUE', 'Le macramé', 'rejet'), 'retenu'],
    ['CRE-06', 'J’adore le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet'), 'appreciation_dans_la_proposition'],
    ['CRE-06', 'Je ne déteste pas le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet'), 'sens_incertain'],
    ['CRE-06', 'Mon mari déteste le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet'), 'autre_personne_dans_la_proposition'],
    ['CRE-06', 'Mon mari déteste le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet', { personne: 'autre' }), 'autre_personne'],
    ['CRE-06', 'Avant je détestais le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet'), 'passe_dans_la_proposition'],
    ['CRE-06', 'Avant je détestais le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet', { temps: 'passe_revolu' }), 'temps_non_conforme'],
    ['CRE-06', 'Je n’aime pas le macramé sauf si c’est fait main.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet'), 'condition_dans_la_proposition'],
    ['CRE-06', 'Je n’aime pas le macramé sauf si c’est fait main.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet', { condition: 'sauf si c’est fait main' }), 'sous_condition'],
    ['CRE-06', 'Je n’aime pas le macramé pour les enfants.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet', { limite: 'pour les enfants' }), 'portee_limitee'],
    ['CRE-06', 'Je déteste le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet', { affirme: false }), 'non_affirme'],
    ['CRE-06', 'Je déteste le macramé.', seg('SEGMENT_TECHNIQUE', 'le macramé', 'appreciation'), 'attitude_non_conforme'],
    ['CRE-06', 'Je déteste le macramé.', seg('SEGMENT_INVENTE', 'le macramé', 'rejet'), 'declencheur_inconnu'],
    ['CRE-06', 'Je n’aime pas le style rococo.', seg('SEGMENT_STYLE', 'le style rococo', 'rejet'), 'retenu'],
    ['CRE-06', 'J’aime beaucoup le style rococo.', seg('SEGMENT_STYLE', 'le style rococo', 'rejet'), 'appreciation_dans_la_proposition'],
    ['CRE-06', 'Le plastique, j’ai horreur de ça.', seg('SEGMENT_MATIERE', 'Le plastique', 'rejet'), 'retenu'],
    ['CRE-06', 'Tout sauf le plastique.', seg('SEGMENT_MATIERE', 'le plastique', 'rejet'), 'sens_incertain'],
    // learning2.1459 — un sujet d'INTÉRÊT.
    ['learning2.1459', 'En ce moment la géologie.', seg('SUJET_DECLARE', 'la géologie', 'interet'), 'retenu'],
    ['learning2.1459', 'La géologie ne m’intéresse pas.', seg('SUJET_DECLARE', 'La géologie', 'interet'), 'negation_dans_la_proposition'],
    ['learning2.1459', 'La géologie ne m’intéresse pas.', seg('SUJET_DECLARE', 'La géologie', 'interet', { affirme: false }), 'non_affirme'],
    ['learning2.1459', 'Je déteste la géologie.', seg('SUJET_DECLARE', 'la géologie', 'interet'), 'negation_dans_la_proposition'],
    ['learning2.1459', 'Ma fille se passionne pour la géologie.', seg('SUJET_DECLARE', 'la géologie', 'interet'), 'autre_personne_dans_la_proposition'],
    ['learning2.1459', 'Petite, j’adorais la géologie.', seg('SUJET_DECLARE', 'la géologie', 'interet'), 'passe_dans_la_proposition'],
    ['learning2.1459', 'La géologie si c’est bien expliqué.', seg('SUJET_DECLARE', 'La géologie', 'interet'), 'condition_dans_la_proposition'],
    ['learning2.1459', 'La géologie.', seg('SUJET_DECLARE', 'la geologie', 'interet'), 'copie_inexacte'],
    ['learning2.1459', 'Je n’aime pas l’histoire mais la géologie me fascine.', seg('SUJET_DECLARE', 'la géologie', 'interet'), 'retenu'],
    // comics.0422 — œuvre appréciée EXPLICITEMENT ; auteur seulement mentionné.
    ['comics.0422', 'J’adore Blacksad.', seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Blacksad' } }), 'retenu'],
    ['comics.0422', 'Blacksad, Akira.', seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Blacksad' } }), 'attitude_non_explicite'],
    ['comics.0422', 'Je n’ai pas aimé Blacksad.', seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Blacksad' } }), 'negation_dans_la_proposition'],
    ['comics.0422', 'Mon fils adore Blacksad.', seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Blacksad' } }), 'autre_personne_dans_la_proposition'],
    ['comics.0422', 'J’adore Blacksad.', seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Black Sad' } }), 'precision_inexacte'],
    ['comics.0422', 'Je n’aime pas Moebius.', seg('AUTEUR_MENTIONNE', 'Moebius', 'mention'), 'retenu'],
    ['comics.0422', 'Tout Moebius.', seg('AUTEUR_MENTIONNE', 'Mœbius', 'mention'), 'copie_inexacte'],
    // drinks.2102, time.1566 — une PROJECTION : la négation y est du contenu, pas un démenti.
    ['drinks.2102', 'Un thé au jardin, sans téléphone, pas de bruit.', seg('PROJECTION_DECLAREE', 'Un thé au jardin, sans téléphone, pas de bruit', 'projection', { temps: 'hypothetique' }), 'retenu'],
    ['drinks.2102', 'Je n’ai pas de moment idéal.', seg('PROJECTION_DECLAREE', 'moment idéal', 'projection', { affirme: false }), 'non_affirme'],
    ['drinks.2102', 'Je bois un café tous les matins.', seg('PROJECTION_DECLAREE', 'un café tous les matins', 'autre'), 'attitude_non_conforme'],
    ['time.1566', 'Réveil sans alarme, marché, sieste.', seg('PROJECTION_DECLAREE', 'Réveil sans alarme, marché, sieste', 'projection', { temps: 'hypothetique' }), 'retenu'],
    ['time.1566', 'Réveil sans alarme.', seg('PROJECTION_DECLAREE', 'Réveil sans alarme', 'projection', { personne: 'autre' }), 'autre_personne'],
    ['time.1566', 'Réveil sans alarme.', seg('PROJECTION_DECLAREE', 'Réveil tardif', 'projection'), 'copie_inexacte'],
    // pets.0403 — un SOUHAIT pour l'animal.
    ['pets.0403', 'J’aimerais lui offrir un arbre à chat.', seg('SOUHAIT_AVEC_IDENTIFIANT', 'un arbre à chat', 'souhait', { temps: 'futur_ou_souhait' }), 'retenu'],
    ['pets.0403', 'Il a déjà tout, je ne veux rien lui acheter, même pas un arbre à chat.', seg('SOUHAIT_AVEC_IDENTIFIANT', 'un arbre à chat', 'souhait'), 'negation_dans_la_proposition'],
    ['pets.0403', 'Avant je voulais un arbre à chat.', seg('SOUHAIT_AVEC_IDENTIFIANT', 'un arbre à chat', 'souhait'), 'passe_dans_la_proposition'],
    ['pets.0403', 'Un arbre à chat.', seg('SOUHAIT_AVEC_IDENTIFIANT', 'Un arbre à chat', 'mention'), 'attitude_non_conforme'],
    // podcast.0467 — un épisode RÉFÉRENT ; une relation dite par un SECOND segment.
    ['podcast.0467', 'L’épisode 12 de Transfert m’a marquée.', seg('REFERENT_RESOLU', 'L’épisode 12 de Transfert', 'referent', { temps: 'passe_revolu', identite: { nature: 'episode', nom: '12', rattachement: 'Transfert' } }), 'retenu'],
    ['podcast.0467', 'Aucun épisode ne m’a marquée.', seg('REFERENT_RESOLU', 'épisode', 'referent', { affirme: false }), 'non_affirme'],
    ['podcast.0467', 'L’épisode 12 de Transfert. J’ai adoré.', seg('RELATION_EXPLICITE_DISTINCTE', 'J’ai adoré', 'appreciation', { relation: 'LOVE' }), 'retenu'],
    ['podcast.0467', 'L’épisode 12 de Transfert. Je l’ai réécouté trois fois.', seg('RELATION_EXPLICITE_DISTINCTE', 'Je l’ai réécouté trois fois', 'appreciation', { relation: 'LIKE' }), 'attitude_non_explicite'],
    ['podcast.0467', 'L’épisode 12 de Transfert. Je n’ai pas aimé.', seg('RELATION_EXPLICITE_DISTINCTE', 'Je n’ai pas aimé', 'appreciation', { relation: 'LIKE' }), 'negation_dans_la_proposition'],
    ['podcast.0467', 'L’épisode 12 de Transfert. Je n’ai pas aimé.', seg('RELATION_EXPLICITE_DISTINCTE', 'Je n’ai pas aimé', 'appreciation', { relation: 'DISLIKE' }), 'retenu'],
    ['podcast.0467', 'L’épisode 12 de Transfert. J’ai adoré.', seg('RELATION_EXPLICITE_DISTINCTE', 'J’ai adoré', 'appreciation', { relation: 'ADORE' }), 'relation_hors_vocabulaire'],
    // sensory2.1482 — un lieu RÉFÉRENT ; une relation dite par un SECOND segment.
    ['sensory2.1482', 'Les thermes de Vals, pour le silence.', seg('REFERENT_RESOLU', 'Les thermes de Vals', 'referent', { temps: 'passe_revolu', identite: { nature: 'lieu', nom: 'Les thermes de Vals' } }), 'retenu'],
    ['sensory2.1482', 'Aucun lieu en particulier.', seg('REFERENT_RESOLU', 'lieu', 'referent', { affirme: false }), 'non_affirme'],
    ['sensory2.1482', 'Les thermes de Vals. J’y retourne souvent.', seg('RELATION_EXPLICITE_DISTINCTE', 'J’y retourne souvent', 'appreciation', { relation: 'LOVE' }), 'attitude_non_explicite'],
    ['sensory2.1482', 'Les thermes de Vals. J’adore cet endroit.', seg('RELATION_EXPLICITE_DISTINCTE', 'J’adore cet endroit', 'appreciation', { relation: 'LOVE' }), 'retenu'],
    ['sensory2.1482', 'Les thermes de Vals. Mon mari adore cet endroit.', seg('RELATION_EXPLICITE_DISTINCTE', 'adore cet endroit', 'appreciation', { relation: 'LOVE' }), 'autre_personne_dans_la_proposition'],
    // sensory2.1487 — des éléments VOULUS dans un lieu idéal.
    ['sensory2.1487', 'Il faudrait absolument des plantes et du bois clair.', seg('ELEMENT_ESTHETIQUE', 'du bois clair', 'presence_voulue', { temps: 'hypothetique' }), 'retenu'],
    ['sensory2.1487', 'Des plantes, surtout pas de néons.', seg('ELEMENT_ESTHETIQUE', 'néons', 'presence_voulue', { temps: 'hypothetique' }), 'negation_dans_la_proposition'],
    ['sensory2.1487', 'Une odeur de cèdre.', seg('ELEMENT_SENSORIEL', 'Une odeur de cèdre', 'presence_voulue', { temps: 'hypothetique' }), 'retenu'],
    ['sensory2.1487', 'Aucune musique.', seg('ELEMENT_SENSORIEL', 'musique', 'presence_voulue', { temps: 'hypothetique' }), 'negation_dans_la_proposition'],
    ['sensory2.1487', 'Ma fille voudrait une odeur de cèdre.', seg('ELEMENT_SENSORIEL', 'une odeur de cèdre', 'presence_voulue', { temps: 'hypothetique' }), 'autre_personne_dans_la_proposition'],
  ];
  it.each(CAS)('%s · « %s » → %j : %s', (q, texte, s, attendu) => { expect(issue(q, texte, s)).toBe(attendu); });
  it('chaque destination a au moins un cas retenu et un cas refusé', () => {
    for (const [q, ds] of DESTINATIONS_PAR_QUESTION) for (const d of ds) {
      const cas = CAS.filter(([cq, , s]) => cq === q && s.declencheur === d.declencheur);
      expect(cas.some((c) => c[3] === 'retenu'), `${q} ${d.declencheur} : cas retenu`).toBe(true);
      expect(cas.some((c) => c[3] !== 'retenu'), `${q} ${d.declencheur} : cas refusé`).toBe(true);
    }
  });
});

describe('la résolution d’un référent — jamais inventée, jamais sur une ressemblance', () => {
  const s = (nature: 'oeuvre' | 'episode' | 'lieu' | 'animal', nom?: string, rattachement?: string, ambigu?: string) =>
    ({ declencheur: '', passage: nom ?? '', debut: 0, fin: 1, attitude: 'referent' as const, temps: 'actuel' as const, sens: 'nu' as const,
       identite: { nature, ...(nom ? { nom } : {}), ...(rattachement ? { rattachement } : {}), ...(ambigu ? { ambigu } : {}) } });
  const e = (nature: EntiteConnue['nature'], medium: string, nom: string, rattachement: string | null = null): EntiteConnue => ({ id: `${nature}:${medium}:${nom}|${rattachement}`, nature, medium, nom, rattachement });
  it('un titre jamais cité : un référent nouveau', () => {
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Blacksad'), [])).toMatchObject({ etat: 'unique', nouvelle: true });
  });
  it('le même titre, à la casse et à l’article près : le même référent', () => {
    const connues = [e('lieu', 'lieu', 'Les thermes de Vals')];
    expect(resoudre('lieu', 'lieu', s('lieu', 'thermes de Vals'), connues)).toMatchObject({ etat: 'unique', nouvelle: false, id: connues[0].id });
  });
  it('un nom qui ne diffère que par un accent : ambiguïté, pas rapprochement', () => {
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Asterix'), [e('oeuvre', 'bande_dessinee', 'Astérix')])).toMatchObject({ etat: 'ambigu', raison: 'nom_proche_non_identique' });
  });
  it('deux œuvres du même titre déjà citées, sans auteur pour trancher : ambiguïté', () => {
    const connues = [e('oeuvre', 'bande_dessinee', 'Nausicaä', 'Miyazaki'), e('oeuvre', 'bande_dessinee', 'Nausicaä', 'Bastien Vivès')];
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Nausicaä'), connues)).toMatchObject({ etat: 'ambigu', raison: 'plusieurs_referents_du_meme_nom' });
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Nausicaä', 'Miyazaki'), connues)).toMatchObject({ etat: 'unique', nouvelle: false, id: connues[0].id });
  });
  it('même titre, auteur explicitement différent : deux référents distincts', () => {
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Nausicaä', 'Bastien Vivès'), [e('oeuvre', 'bande_dessinee', 'Nausicaä', 'Miyazaki')])).toMatchObject({ etat: 'unique', nouvelle: true });
  });
  it('le même titre dans un autre genre n’est pas le même référent', () => {
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Blacksad'), [e('oeuvre', 'jeu_video', 'Blacksad')])).toMatchObject({ etat: 'unique', nouvelle: true });
  });
  it('un épisode sans émission, ou sans titre ni numéro, n’est pas identifié', () => {
    expect(resoudre('episode', 'podcast', s('episode', '12'), [])).toMatchObject({ etat: 'non_resolu', motif: 'emission_absente', clarifiable: true });
    expect(resoudre('episode', 'podcast', s('episode', undefined, 'Transfert'), [])).toMatchObject({ etat: 'non_resolu', motif: 'episode_non_identifie' });
  });
  it('« un hammam » ne nomme aucun lieu ; « chez ma grand-mère » est un lieu privé, pas une entité', () => {
    expect(resoudre('lieu', 'lieu', s('lieu', 'un hammam à Istanbul'), [])).toMatchObject({ etat: 'non_resolu', motif: 'lieu_generique', clarifiable: true });
    expect(resoudre('lieu', 'lieu', s('lieu', 'chez ma grand-mère'), [])).toMatchObject({ etat: 'non_resolu', motif: 'lieu_prive', clarifiable: false });
  });
  it('ce que le modèle juge ambigu n’est pas résolu', () => {
    expect(resoudre('oeuvre', 'bande_dessinee', s('oeuvre', 'Corto', undefined, 'personnage ou série ?'), [])).toMatchObject({ etat: 'non_resolu', motif: 'juge_ambigu_par_le_modele' });
  });
  it('un animal n’est jamais créé par une réponse : aucun déclaré → non résolu ; un seul → lui ; plusieurs → il faut son nom', () => {
    const rex = e('animal', 'animal', 'Rex', 'chien'), mina = e('animal', 'animal', 'Mina', 'chat');
    expect(resoudre('animal', 'animal', s('animal'), [])).toMatchObject({ etat: 'non_resolu', motif: 'aucun_animal_declare' });
    expect(resoudre('animal', 'animal', s('animal'), [rex])).toMatchObject({ etat: 'unique', id: rex.id });
    expect(resoudre('animal', 'animal', s('animal'), [rex, mina])).toMatchObject({ etat: 'ambigu', raison: 'plusieurs_animaux' });
    expect(resoudre('animal', 'animal', s('animal', 'Mina'), [rex, mina])).toMatchObject({ etat: 'unique', id: mina.id });
    expect(resoudre('animal', 'animal', s('animal', 'Minette'), [rex, mina])).toMatchObject({ etat: 'ambigu' });
  });
});

describe('ce qui s’écrit, de bout en bout', () => {
  it('« …que tu n’aimes vraiment pas ? » : une préférence en rejet, de stabilité NON ÉTABLIE, rôle secondaire, sans veto', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'CRE-06', texte: 'Je déteste le macramé.', acteId: 'lot-1', lecteur: lecteur(seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet')) });
    expect(r.destinations).toMatchObject({ preuves: 1, clarifications: 0 });
    expect(preuves(b)).toHaveLength(1);
    expect(preuves(b)[0]).toMatchObject({ target_family: 'PREFERENCE', preference_value: 'le macramé', polarity: 'rejet', stability: 'undetermined', evidence_role: 'secondary', assertion_status: 'inferred' });
    expect(preuves(b).some((e) => e.target_family === 'GUARDRAIL' || e.target_family === 'ENTITY')).toBe(false);
  });
  it('« La géologie ne m’intéresse pas » : aucun intérêt n’est écrit, le relevé dit pourquoi, le verbatim reste', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie ne m’intéresse pas.', acteId: 'lot-1', lecteur: lecteur(seg('SUJET_DECLARE', 'La géologie', 'interet')) });
    expect(preuves(b)).toHaveLength(0);
    expect(r.destinations!.releve).toEqual([{ declencheur: 'SUJET_DECLARE', debut: null, fin: null, issue: 'ecarte', motif: 'negation_dans_la_proposition' }]);
    expect(b.tables.knowledge_facts.some((f) => f.fact_type === 'discovery.learning2.1459' && f.value === 'La géologie ne m’intéresse pas.')).toBe(true);
    const releve = JSON.parse(String(b.tables.knowledge_facts.find((f) => f.fact_type === FAIT_LECTURE)!.value));
    expect(releve).toMatchObject({ version: VERSION_LECTURE, question: 'learning2.1459', verbatim: r.verbatimSourceId });
  });
  it('un intérêt retenu porte sa position dans la phrase', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'En ce moment la géologie.', acteId: 'lot-1', lecteur: lecteur(seg('SUJET_DECLARE', 'la géologie', 'interet')) });
    expect(preuves(b)[0]).toMatchObject({ target_family: 'INTEREST', raw_information: 'la géologie', stability: 'contextual', evidence_role: 'secondary' });
    expect(preuves(b)[0].relationship ?? null).toBeNull();
    expect(r.destinations!.releve).toEqual([{ declencheur: 'SUJET_DECLARE', debut: 13, fin: 24, issue: 'ecrit' }]);
  });
  it('une œuvre appréciée : un référent au registre, avec sa provenance, et une relation LIKE — rien envers l’auteur', async () => {
    const b = fausseBase();
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'comics.0422', texte: 'J’adore Blacksad, et tout Moebius.', acteId: 'lot-1',
      lecteur: lecteur(seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Blacksad' } }), seg('AUTEUR_MENTIONNE', 'Moebius', 'mention')) });
    const registre = b.tables.knowledge_facts.filter((f) => f.fact_type === FAIT_ENTITE);
    expect(registre).toHaveLength(1);
    expect(JSON.parse(String(registre[0].value))).toMatchObject({ id: 'oeuvre:bande_dessinee:blacksad', nom: 'Blacksad', provenance: { question: 'comics.0422', passage: { debut: 8, fin: 16 } } });
    expect(preuves(b)).toHaveLength(1);
    expect(preuves(b)[0]).toMatchObject({ target_family: 'ENTITY', entity_id: 'oeuvre:bande_dessinee:blacksad', relation: 'LIKE', stability: 'undetermined' });
    expect(faits(b)).toHaveLength(1);
    expect(JSON.parse(String(faits(b)[0].value))).toMatchObject({ valeur: 'Moebius', sens: 'mention' });
  });
  it('un épisode sans son émission : rien n’est écrit, une clarification s’ouvre ; la personne précise, et le fait s’écrit avec la relation en attente', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'podcast.0467', texte: 'L’épisode 12. J’ai adoré.', acteId: 'lot-1',
      lecteur: lecteur(seg('REFERENT_RESOLU', 'L’épisode 12', 'referent', { temps: 'passe_revolu', identite: { nature: 'episode', nom: '12' } }), seg('RELATION_EXPLICITE_DISTINCTE', 'J’ai adoré', 'appreciation', { relation: 'LOVE' })) });
    expect(r.destinations).toMatchObject({ preuves: 0, faits: 0, clarifications: 1 });
    const ouvertes = await clarificationsOuvertes(b.client, { userId: U });
    expect(ouvertes).toHaveLength(1);
    expect(ouvertes[0]).toMatchObject({ question: 'podcast.0467', nature: 'episode', passage: 'L’épisode 12', saisieLibre: true });
    // Une précision qui n'identifie toujours rien (pas d'émission) ne ferme rien.
    expect(await repondreClarification(b.client, { userId: U, clarificationId: ouvertes[0].id, reponse: { nom: '12' } })).toMatchObject({ etat: 'encore_ambigue' });
    const fin = await repondreClarification(b.client, { userId: U, clarificationId: ouvertes[0].id, reponse: { nom: '12', rattachement: 'Transfert' } });
    expect(fin).toMatchObject({ etat: 'ecrite', preuves: 1, faits: 1 });
    expect(await clarificationsOuvertes(b.client, { userId: U })).toHaveLength(0);
    expect(preuves(b)[0]).toMatchObject({ target_family: 'ENTITY', relation: 'LOVE', entity_id: 'episode:podcast:12|transfert' });
    expect(JSON.parse(String(faits(b)[0].value))).toMatchObject({ referent: 'episode:podcast:12|transfert', declencheur: 'REFERENT_RESOLU' });
  });
  it('« laisse tomber » ferme la clarification sans rien écrire ; un choix non proposé est refusé ; un autre compte ne la voit pas', async () => {
    const b = fausseBase();
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'sensory2.1482', texte: 'Un hammam à Istanbul.', acteId: 'lot-1',
      lecteur: lecteur(seg('REFERENT_RESOLU', 'Un hammam à Istanbul', 'referent', { temps: 'passe_revolu', identite: { nature: 'lieu', nom: 'Un hammam à Istanbul' } })) });
    const [c] = await clarificationsOuvertes(b.client, { userId: U });
    expect(await clarificationsOuvertes(b.client, { userId: '00000000-0000-4000-8000-00000000ffff' })).toHaveLength(0);
    await expect(repondreClarification(b.client, { userId: '00000000-0000-4000-8000-00000000ffff', clarificationId: c.id, reponse: { aucun: true } })).rejects.toThrow(/inconnue/);
    await expect(repondreClarification(b.client, { userId: U, clarificationId: c.id, reponse: { choix: 'lieu:lieu:invente' } })).rejects.toThrow(/proposé/);
    expect(await repondreClarification(b.client, { userId: U, clarificationId: c.id, reponse: { aucun: true } })).toMatchObject({ etat: 'abandonnee' });
    expect(faits(b)).toHaveLength(0);
    expect(await clarificationsOuvertes(b.client, { userId: U })).toHaveLength(0);
  });
  it('un souhait pour l’animal : sans animal déclaré, clarification ; avec un seul, le fait porte SON identifiant', async () => {
    const b = fausseBase();
    const l = lecteur(seg('SOUHAIT_AVEC_IDENTIFIANT', 'un arbre à chat', 'souhait', { temps: 'futur_ou_souhait' }));
    const r1 = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'pets.0403', texte: 'J’aimerais lui offrir un arbre à chat.', acteId: 'lot-1', lecteur: l });
    expect(r1.destinations).toMatchObject({ faits: 0, clarifications: 1 });
    const { petId } = await declarerAnimal(b.client, { userId: U, nom: 'Mina', espece: 'chat' });
    expect((await declarerAnimal(b.client, { userId: U, nom: 'mina', espece: 'Chat' })).etat).toBe('deja_connu');
    const [c] = await clarificationsOuvertes(b.client, { userId: U });
    expect(await repondreClarification(b.client, { userId: U, clarificationId: c.id, reponse: { choix: petId } })).toMatchObject({ etat: 'ecrite', faits: 1 });
    expect(JSON.parse(String(faits(b)[0].value))).toMatchObject({ valeur: 'un arbre à chat', pet_id: petId, animal: 'Mina' });
    await expect(declarerAnimal(b.client, { userId: U, nom: ' ', espece: 'chat' })).rejects.toThrow(/nom et son espèce/);
  });
  it('une projection est UN fait, marqué comme projection, sans aucune préférence', async () => {
    const b = fausseBase();
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'drinks.2102', texte: 'Un thé au jardin, sans téléphone.', acteId: 'lot-1',
      lecteur: lecteur(seg('PROJECTION_DECLAREE', 'Un thé au jardin', 'projection', { temps: 'hypothetique' }), seg('PROJECTION_DECLAREE', 'sans téléphone', 'projection', { temps: 'hypothetique' })) });
    expect(preuves(b)).toHaveLength(0);
    expect(faits(b)).toHaveLength(1);
    expect(JSON.parse(String(faits(b)[0].value))).toMatchObject({ sens: 'projection', valeur: 'Un thé au jardin … sans téléphone', passages: [{ debut: 0, fin: 16 }, { debut: 18, fin: 32 }] });
  });
  it('les éléments d’un lieu idéal gardent leur contexte hypothétique', async () => {
    const b = fausseBase();
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'sensory2.1487', texte: 'Il faudrait absolument du bois clair.', acteId: 'lot-1', lecteur: lecteur(seg('ELEMENT_ESTHETIQUE', 'du bois clair', 'presence_voulue', { temps: 'hypothetique' })) });
    expect(preuves(b)[0]).toMatchObject({ target_family: 'PREFERENCE', context: 'lieu_ideal_hypothetique', polarity: 'positive', stability: 'undetermined' });
  });
});

describe('pannes, rejeu et reprise', () => {
  it('modèle en panne : le verbatim est gardé, rien n’est lu', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'lot-1', lecteur: async () => { throw new Error('panne'); } });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: true });
    expect(preuves(b)).toHaveLength(0);
    expect(b.tables.knowledge_sources.some((s) => s.id === sourceLectureDestinations(r.verbatimSourceId))).toBe(false);
  });
  it('la même lecture rejouée n’écrit rien deux fois', async () => {
    const b = fausseBase(); const l = lecteur(seg('SUJET_DECLARE', 'La géologie', 'interet'));
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'lot-1', lecteur: l });
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'lot-1', lecteur: l });
    expect(preuves(b)).toHaveLength(1);
  });
  it('REPRISE : une réponse lue par l’ancien lecteur (destination indisponible) est relue, et l’ancienne lecture est remplacée', async () => {
    const b = fausseBase();
    // État laissé par le lecteur v1 : le verbatim, et une lecture « faite » qui n'avait rien pu écrire.
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'CRE-06', texte: 'Je déteste le macramé.', acteId: 'lot-1', lecteur: async () => { throw new Error('panne'); } });
    const v1 = sourceLectureDestinations(r.verbatimSourceId, 1);
    b.tables.knowledge_sources.push({ id: v1, user_id: U, about_id: U, source_type: 'extraction_inferred', question_code: 'discovery.CRE-06', raw_text: 'Je déteste le macramé.', ts: '2026-11-19T08:00:00.000Z' });
    b.tables.knowledge_facts.push({ id: 'releve-v1', user_id: U, about_id: U, source: v1, fact_type: 'discovery.lecture', value: '{}', superseded_at: null });
    expect(v1).not.toBe(sourceLectureDestinations(r.verbatimSourceId));
    // Le rejeu trouve le verbatim sans lecture de la version courante : il relit.
    const { ecrireDestinations } = await import('../destinations-ecriture');
    const { question } = await import('../banque');
    const d = await ecrireDestinations(b.client, { userId: U, question: question('CRE-06')!, texte: 'Je déteste le macramé.', barriere: '', verbatimSourceId: r.verbatimSourceId, timestamp: '2026-11-19T09:00:00.000Z', lecteur: lecteur(seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet')) });
    expect(d).toMatchObject({ preuves: 1, reprises: 1 });
    expect(b.tables.knowledge_facts.find((f) => f.id === 'releve-v1')!.superseded_at).toBeTruthy();
    void rejouerLecturesEnAttente;
  });
});
