// SENSIBILITÉ AU CONTENU (règle verrouillée 27 oct) — la sensibilité est une propriété de CE QUE DIT
// l'information, PAS du champ où elle a été tapée. Une info de santé écrite dans « ce qu'il vaut mieux
// éviter » reste une info de santé.
//
// RÈGLE appliquée partout (createFact) : une info sensible — santé, allergie, situation médicale, adresse —
//  • est CONSERVÉE et UTILISÉE par le moteur (ex. écarter un restaurant) ;
//  • n'est JAMAIS nommée dans un texte généré (respiration, conclusion, fiche, analyse comparative) ;
//  • ne s'affiche que dans le bloc structuré d'infos pratiques, avec son cadenas et son réglage de partage.
// Concrètement : un FACT au contenu sensible devient `internal_only` → filtré de readSocleFacts (prose).
//
// ⚠ PREMIÈRE COUCHE DÉTERMINISTE (lexique + frontières de mots), testable et sans appel modèle. Elle a des
// angles morts (tournures implicites, langues, fautes). La couche ROBUSTE = un classifieur modèle, à poser
// au lot sensibilité (voir registre). On ferme le cas courant maintenant ; on n'invente pas une garantie
// qu'on ne tient pas.

// Lexique FR, minuscules, sans accents (on normalise avant de chercher). Marqueurs forts de santé/médical,
// allergie/intolérance, et adresse. Mots entiers (frontières) pour éviter « santé de mes projets » etc.
const SENSITIVE_TERMS: readonly string[] = [
  // santé / médical
  'maladie', 'malade', 'medical', 'medicale', 'medicament', 'medicaments', 'traitement medical',
  'chronique', 'handicap', 'handicape', 'handicapee', 'depression', 'depressif', 'anxiete', 'burn-out', 'burnout',
  'cancer', 'diabete', 'diabetique', 'asthme', 'asthmatique', 'cardiaque', 'operation', 'hospitalise', 'hospitalisee',
  'therapie', 'psy', 'psychologue', 'psychiatre', 'trouble', 'fatigue chronique',
  // allergie / intolérance / restriction médicale
  'allergie', 'allergies', 'allergique', 'intolerance', 'intolerant', 'intolerante', 'coeliaque', 'celiaque',
  'sans gluten', 'gluten', 'lactose', 'arachide', 'arachides',
  // grossesse (état de santé)
  'enceinte', 'grossesse',
  // adresse
  'adresse', 'code postal', "j'habite au", 'rue de', 'rue du', 'avenue de', 'boulevard',
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // retire les accents (diacritiques combinants)
}

/**
 * VRAI si le texte contient une info sensible (santé/allergie/médical/adresse), par mot entier.
 * Déterministe. Utilisé par createFact pour verrouiller la visibilité en `internal_only` quel que soit le champ.
 */
export function classifyContentSensitivity(text: string): boolean {
  if (!text) return false;
  const n = normalize(text);
  return SENSITIVE_TERMS.some((term) => {
    const t = normalize(term);
    // frontière de mot aux deux bords (les termes multi-mots gardent leurs espaces internes)
    const re = new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
    return re.test(n);
  });
}
