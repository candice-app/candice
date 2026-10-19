// PONT DE PROJECTION LEGACY (hsg §47quater), keyé par optionRef — les DELTAS d'axes du scoring
// tempérament déployé (L'ANCIEN DICTIONNAIRE). ⚠ Interdit à la lecture par le HSG/respirations/analyse :
// alimente UNIQUEMENT la reconstruction de temperament_axes (projection), le temps que la reco migre
// vers les PROFILE constructs V15 (condition de mort, §47quater). Généré par import, jamais retapé.

export interface AxisDelta { readonly axis: string; readonly value: number; }

/** optionRef (actif, tempérament) → deltas d'axes du scoring legacy. 36 entrées. */
export const TEMPERAMENT_DELTAS: Record<string, readonly AxisDelta[]> = {
  '36': [{"axis":"energieSociale","value":-2},{"axis":"espaceProsimite","value":-2}],
  '37': [{"axis":"energieSociale","value":-1},{"axis":"espaceProsimite","value":1}],
  '38': [],
  '39': [{"axis":"energieSociale","value":2},{"axis":"espaceProsimite","value":1}],
  '40': [{"axis":"energieSociale","value":2},{"axis":"stabiliteNouveaute","value":1}],
  '41': [{"axis":"expressiviteReserve","value":2}],
  '42': [{"axis":"espaceProsimite","value":-2}],
  '43': [{"axis":"expressiviteReserve","value":-2}],
  '44': [{"axis":"spontaneiteControle","value":-1}],
  '45': [{"axis":"spontaneiteControle","value":2},{"axis":"rapportTemps","value":1}],
  '46': [{"axis":"communicationStyle","value":-2}],
  '47': [{"axis":"rapportTemps","value":1}],
  '48': [{"axis":"expressiviteReserve","value":1}],
  '49': [{"axis":"communicationStyle","value":1}],
  '50': [{"axis":"communicationStyle","value":1}],
  '51': [{"axis":"stabiliteNouveaute","value":-2}],
  '52': [{"axis":"espaceProsimite","value":-2}],
  '53': [{"axis":"expressiviteReserve","value":-1}],
  '54': [{"axis":"stabiliteNouveaute","value":1}],
  '55': [{"axis":"stabiliteNouveaute","value":-1}],
  '56': [{"axis":"espaceProsimite","value":-1},{"axis":"spontaneiteControle","value":1}],
  '57': [{"axis":"communicationStyle","value":-2}],
  '58': [{"axis":"expressiviteReserve","value":-2}],
  '59': [{"axis":"sensibiliteDetails","value":1}],
  '60': [{"axis":"communicationStyle","value":1}],
  '61': [],
  '62': [{"axis":"sensibiliteDetails","value":1}],
  '63': [{"axis":"spontaneiteControle","value":-1}],
  '64': [{"axis":"espaceProsimite","value":1}],
  '65': [{"axis":"exigenceStanding","value":1},{"axis":"spontaneiteControle","value":1}],
  '66': [{"axis":"rapportTemps","value":1}],
  '67': [{"axis":"expressiviteReserve","value":-2}],
  '68': [{"axis":"expressiviteReserve","value":-1}],
  '69': [],
  '70': [{"axis":"expressiviteReserve","value":2}],
  '71': [{"axis":"expressiviteReserve","value":1},{"axis":"rapportTemps","value":1}],
};
