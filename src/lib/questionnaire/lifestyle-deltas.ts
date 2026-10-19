// PONT DE PROJECTION LEGACY (hsg §47quater), keyé par optionRef — les DELTAS d'AXES du scoring
// lifestyle déployé (L'ANCIEN DICTIONNAIRE). Contient UNIQUEMENT les deltas d'axes : target 'lifestyle'
// (→ lifestyle_axes) et target 'temperament' (→ suppléances temperament_axes, CROSS-DOMAINE). Les deltas
// 'filter' et 'canal' NE SONT PAS ICI : ils ont un équivalent CANONIQUE (NEED/GUARDRAIL/IMPORTANCE/
// PROFILE/PREFERENCE/FACT) auto-produit par le mapping onboarding (cas 1, règle D2) — donc reconstruits
// du journal, jamais du pont. ⚠ Interdit à la lecture par le HSG/respirations/analyse (condition de mort
// §47quater : meurt quand la reco migre vers les PROFILE constructs V15). q = questionCode (pour
// rejouer la double-application step4/step5 du merge legacy). Généré par import, jamais retapé.

export interface LifestyleBridgeDelta {
  readonly axis: string;
  readonly value: number;
  readonly target: 'lifestyle' | 'temperament';
  readonly q: string; // questionCode (step4/step5) — métadonnée de projection, jamais une connaissance
}

/** optionRef (actif, lifestyle) → deltas d'axes legacy (lifestyle + suppléances tempérament). 42 entrées. */
export const LIFESTYLE_DELTAS: Record<string, readonly LifestyleBridgeDelta[]> = {
  "77": [{"axis":"experienceObjet","value":2,"target":"lifestyle","q":"q13"}],
  "78": [{"axis":"experienceObjet","value":-2,"target":"lifestyle","q":"q13"}],
  "79": [],
  "80": [{"axis":"esthetiqueFonctionnel","value":-2,"target":"lifestyle","q":"q13"}],
  "81": [{"axis":"authenticiteLuxe","value":1,"target":"lifestyle","q":"q13"}],
  "82": [{"axis":"esthetiqueFonctionnel","value":-2,"target":"lifestyle","q":"q14"}],
  "83": [{"axis":"sensibiliteDetails","value":2,"target":"temperament","q":"q14"}],
  "84": [{"axis":"esthetiqueFonctionnel","value":2,"target":"lifestyle","q":"q14"},{"axis":"premiumSimplicite","value":1,"target":"lifestyle","q":"q14"}],
  "85": [{"axis":"authenticiteLuxe","value":1,"target":"lifestyle","q":"q14"}],
  "86": [{"axis":"experienceObjet","value":2,"target":"lifestyle","q":"q14"}],
  "97": [{"axis":"rapportTemps","value":2,"target":"temperament","q":"q4a"},{"axis":"spontaneiteControle","value":1,"target":"temperament","q":"q4a"}],
  "98": [{"axis":"rapportTemps","value":-2,"target":"temperament","q":"q4a"},{"axis":"spontaneiteControle","value":-1,"target":"temperament","q":"q4a"}],
  "99": [{"axis":"rapportTemps","value":1,"target":"temperament","q":"q4a"},{"axis":"exigenceStanding","value":1,"target":"temperament","q":"q4a"}],
  "100": [{"axis":"rapportTemps","value":-1,"target":"temperament","q":"q4a"}],
  "101": [{"axis":"sensibiliteDetails","value":2,"target":"temperament","q":"q4a"}],
  "102": [{"axis":"premiumSimplicite","value":1,"target":"lifestyle","q":"q4b"}],
  "103": [{"axis":"authenticiteLuxe","value":2,"target":"lifestyle","q":"q4b"},{"axis":"premiumSimplicite","value":-1,"target":"lifestyle","q":"q4b"}],
  "104": [{"axis":"esthetiqueFonctionnel","value":2,"target":"lifestyle","q":"q4b"},{"axis":"premiumSimplicite","value":1,"target":"lifestyle","q":"q4b"}],
  "105": [{"axis":"premiumSimplicite","value":-1,"target":"lifestyle","q":"q4b"}],
  "106": [{"axis":"authenticiteLuxe","value":-2,"target":"lifestyle","q":"q4b"},{"axis":"premiumSimplicite","value":1,"target":"lifestyle","q":"q4b"}],
  "106b": [{"axis":"authenticiteLuxe","value":-2,"target":"lifestyle","q":"q4b"},{"axis":"premiumSimplicite","value":1,"target":"lifestyle","q":"q4b"}],
  "107": [{"axis":"spontaneiteControle","value":2,"target":"temperament","q":"q4c"},{"axis":"rapportTemps","value":1,"target":"temperament","q":"q4c"}],
  "108": [],
  "109": [{"axis":"spontaneiteControle","value":-2,"target":"temperament","q":"q4c"}],
  "110": [{"axis":"spontaneiteControle","value":2,"target":"temperament","q":"q4c"},{"axis":"exigenceStanding","value":1,"target":"temperament","q":"q4c"}],
  "111": [{"axis":"spontaneiteControle","value":-1,"target":"temperament","q":"q4c"}],
  "112": [],
  "113": [],
  "114": [],
  "115": [],
  "116": [],
  "117": [{"axis":"energieSociale","value":-1,"target":"temperament","q":"q18"},{"axis":"expressiviteReserve","value":1,"target":"temperament","q":"q18"}],
  "118": [{"axis":"spontaneiteControle","value":1,"target":"temperament","q":"q18"},{"axis":"rapportTemps","value":1,"target":"temperament","q":"q18"}],
  "119": [{"axis":"expressiviteReserve","value":1,"target":"temperament","q":"q18"},{"axis":"espaceProsimite","value":-1,"target":"temperament","q":"q18"}],
  "120": [{"axis":"exigenceStanding","value":1,"target":"temperament","q":"q18"},{"axis":"sensibiliteDetails","value":1,"target":"temperament","q":"q18"}],
  "121": [{"axis":"spontaneiteControle","value":-1,"target":"temperament","q":"q18"}],
  "122": [],
  "123": [],
  "124": [{"axis":"espaceProsimite","value":-2,"target":"temperament","q":"q19"}],
  "125": [],
  "126": [{"axis":"stabiliteNouveaute","value":-1,"target":"temperament","q":"q19"}],
  "127": [],
};
