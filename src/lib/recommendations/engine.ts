import Anthropic from '@anthropic-ai/sdk';
import type { AttentionDim } from '@/lib/attention/scoring';
import type {
  RecoInput, RecoIdea, BlindSpotInsight, ContactRecommendations,
  KadenceProfile, RecoCanal,
} from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Dimension labels ─────────────────────────────────────────────────────────

export const DIM_FR: Record<AttentionDim, string> = {
  MOT:   'les mots sincères et la reconnaissance verbale',
  SER:   'les actes de service et le soutien concret',
  CAD_C: 'les cadeaux choisis avec précision',
  CAD_S: 'les cadeaux chargés de sens et de symbole',
  EXP:   'les moments de qualité partagés',
  GES:   'les petits gestes réguliers du quotidien',
  SUR:   'les surprises inattendues',
};

const DIM_IDEAL_CANAL: Record<AttentionDim, RecoCanal> = {
  MOT:   'message',
  SER:   'service',
  CAD_C: 'cadeau',
  CAD_S: 'cadeau',
  EXP:   'en_personne',
  GES:   'message',
  SUR:   'experience',
};

// ─── Kadence from profile ─────────────────────────────────────────────────────

export function computeKadenceFromProfile(input: RecoInput): KadenceProfile {
  const { reception, relationalFilters, classicProfile } = input;

  if (reception) {
    const n = reception.normalized;
    const ges = n.GES ?? 0;
    const exp = n.EXP ?? 0;
    const sur = n.SUR ?? 0;

    if (ges >= 70 || (ges >= 50 && (relationalFilters?.peurOubli || relationalFilters?.besoinFiabilite)))
      return 'haute';
    if (exp >= 70 || sur >= 70)
      return 'basse';
  }

  if (relationalFilters) {
    if (relationalFilters.peurOubli || relationalFilters.besoinFiabilite) return 'haute';
    if (relationalFilters.besoinAir || relationalFilters.antiSurpriseIntime) return 'basse';
  }

  if (classicProfile) {
    const ll = classicProfile.love_language;
    if (ll === 'words' || ll === 'time') return 'haute';
  }

  return 'moyenne';
}

// ─── Blind spot ───────────────────────────────────────────────────────────────

export function detectBlindSpot(input: RecoInput): BlindSpotInsight | null {
  const { reception, piloteExpression, contactFirstName } = input;
  if (!reception || !piloteExpression) return null;

  const topProche = [...reception.dominant, ...reception.secondaire].slice(0, 3);
  if (topProche.length === 0) return null;

  const piloteExpresses = new Set([
    ...piloteExpression.dominant,
    ...piloteExpression.secondaire,
  ]);

  const blindDims = topProche.filter((d) => !piloteExpresses.has(d));
  if (blindDims.length === 0) return null;

  const dimNames = blindDims.slice(0, 2).map((d) => DIM_FR[d]).join(' et ');

  return {
    dims: blindDims.slice(0, 2) as AttentionDim[],
    note: `${contactFirstName} est particulièrement sensible à ${dimNames} — c'est là que tu peux avoir le plus d'impact avec de petits efforts.`,
  };
}

// ─── Hard filters / veto list ─────────────────────────────────────────────────

export function buildVetoList(input: RecoInput): string[] {
  const v: string[] = [];
  const { vetos, relationalFilters, classicProfile, singularity } = input;

  if (vetos?.no_alcohol)
    v.push('alcool', 'vin', 'champagne', 'bière', 'whisky', 'spiritueux', 'cocktail');
  if (vetos?.halal)
    v.push('porc', 'cochon', 'jambon', 'lard', 'bacon', 'alcool');
  if (vetos?.casher)
    v.push('porc', 'fruits de mer', 'crustacés', 'homard', 'crevettes');
  if (vetos?.mobility_constraints)
    v.push('randonnée', 'marche', 'trekking', 'escaliers', 'montée');
  if (vetos?.allergies?.length)
    v.push(...vetos.allergies);

  if (relationalFilters?.antiSurprisePublique)
    v.push('surprise publique', 'devant tout le monde', 'annonce publique');
  if (relationalFilters?.antiSurprisePlanning)
    v.push('sans prévenir', 'improviste');
  if (relationalFilters?.antiSurpriseIntime)
    v.push('visite surprise', 'débarquer');
  if (relationalFilters?.q17Interdits?.length)
    v.push(...relationalFilters.q17Interdits);

  if (classicProfile?.things_to_avoid) v.push(classicProfile.things_to_avoid);
  if (singularity?.evite_deteste) v.push(singularity.evite_deteste);
  if (singularity?.cadeaux_non) v.push(singularity.cadeaux_non);

  return [...new Set(v.filter(Boolean))];
}

function passesVeto(idea: RecoIdea, vetoList: string[]): boolean {
  const text = `${idea.title} ${idea.justification}`.toLowerCase();
  return !vetoList.some((v) => v && text.includes(v.toLowerCase()));
}

// ─── Deterministic fallback ───────────────────────────────────────────────────

function buildFallbackIdeas(input: RecoInput): RecoIdea[] {
  const { reception, classicProfile, contactFirstName } = input;

  let topDim: AttentionDim = 'GES';
  if (reception) {
    const top = [...reception.dominant, ...reception.secondaire, ...reception.tertiaire];
    if (top.length > 0) topDim = top[0];
  } else if (classicProfile) {
    const ll = classicProfile.love_language;
    if (ll === 'words') topDim = 'MOT';
    else if (ll === 'acts') topDim = 'SER';
    else if (ll === 'gifts') topDim = 'CAD_C';
    else if (ll === 'time') topDim = 'EXP';
  }

  return [{
    title: `Une attention pour ${contactFirstName}`,
    justification: `${contactFirstName} est particulièrement sensible à ${DIM_FR[topDim]}.`,
    dim: topDim,
    canal: DIM_IDEAL_CANAL[topDim],
    intensite: 'légère',
    declencheur: 'Cette semaine',
  }];
}

// ─── Context string ───────────────────────────────────────────────────────────

function buildContextString(input: RecoInput): string {
  const lines: string[] = [];
  const { contactFirstName, relationship, reception, relationalFilters, singularity, classicProfile, vetos } = input;

  lines.push(`PROCHE : ${contactFirstName} (${relationship})`);

  if (reception) {
    const top = [...reception.dominant, ...reception.secondaire].slice(0, 3);
    if (top.length > 0)
      lines.push(`LANGAGES D'ATTENTION (ce qui le/la touche le plus) : ${top.map((d) => DIM_FR[d]).join(', ')}`);
    if (reception.tertiaire.length > 0)
      lines.push(`Secondaires : ${reception.tertiaire.map((d) => DIM_FR[d]).join(', ')}`);
  }

  if (relationalFilters) {
    const rf: string[] = [];
    if (relationalFilters.antiSurprisePublique) rf.push("n'aime pas les surprises publiques");
    if (relationalFilters.antiSurprisePlanning) rf.push("n'aime pas les plans imposés sans préavis");
    if (relationalFilters.peurOubli)            rf.push('a besoin d\'être régulièrement pensé(e)');
    if (relationalFilters.besoinAir)            rf.push('a besoin d\'espace et d\'autonomie');
    if (relationalFilters.sensibiliteCritique)  rf.push('sensible aux critiques — formuler avec soin');
    if (relationalFilters.besoinFiabilite)      rf.push('valorise la constance et la fiabilité');
    if (relationalFilters.besoinEcoute)         rf.push('a besoin de se sentir vraiment écouté(e)');
    if (relationalFilters.besoinProfondeur)     rf.push('préfère la profondeur aux échanges superficiels');
    if (rf.length > 0) lines.push(`CARACTÉRISTIQUES RELATIONNELLES : ${rf.join('; ')}`);
    if (relationalFilters.q17Interdits?.length > 0)
      lines.push(`VETOS RELATIONNELS : ${relationalFilters.q17Interdits.join(', ')}`);
    if (relationalFilters.q17Text) lines.push(`Note : ${relationalFilters.q17Text}`);
  }

  if (singularity) {
    if (singularity.adore_faire)     lines.push(`ADORE : ${singularity.adore_faire}`);
    if (singularity.sujets_stimulants) lines.push(`CE QUI L'ANIME : ${singularity.sujets_stimulants}`);
    if (singularity.envies_reves)    lines.push(`ENVIES / RÊVES : ${singularity.envies_reves}`);
    if (singularity.plus_beau_cadeau) lines.push(`MEILLEUR CADEAU REÇU : ${singularity.plus_beau_cadeau}`);
    if (singularity.marques_lieux)   lines.push(`MARQUES / LIEUX : ${singularity.marques_lieux}`);
    if (singularity.sentir_special)  lines.push(`CE QUI LE/LA FAIT SE SENTIR SPÉCIAL(E) : ${singularity.sentir_special}`);
    if (singularity.detail_compris)  lines.push(`DÉTAIL QUI PROUVE QU'ON L'A COMPRIS(E) : ${singularity.detail_compris}`);
  }

  if (classicProfile) {
    if (classicProfile.hobbies)           lines.push(`LOISIRS : ${classicProfile.hobbies}`);
    if (classicProfile.favorite_foods)    lines.push(`PLATS PRÉFÉRÉS : ${classicProfile.favorite_foods}`);
    if (classicProfile.conversation_topics) lines.push(`SUJETS : ${classicProfile.conversation_topics}`);
  }

  // Hard filters — veto absolu
  const vetoList = buildVetoList(input);
  if (vetoList.length > 0)
    lines.push(`FILTRES DURS — VETO ABSOLU (ne jamais mentionner) : ${vetoList.join(', ')}`);

  if (input.importantDates.length > 0) {
    const upcoming = input.importantDates.slice(0, 2).map((d) => `${d.label} (${d.date})`).join(', ');
    lines.push(`DATES IMPORTANTES PROCHES : ${upcoming}`);
  }

  if (input.recentContext)
    lines.push(`CONTEXTE RÉCENT : ${input.recentContext}`);

  if (input.recentlyProposed.length > 0)
    lines.push(`DÉJÀ PROPOSÉ RÉCEMMENT (ne pas répéter) : ${input.recentlyProposed.join(', ')}`);

  return lines.join('\n');
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es Candice, un copilote relationnel premium. Tu génères des recommandations d'attention adaptées à chaque proche — jamais de rappels génériques.

Règles absolues :
- Chaque idée s'ancre sur UN signal précis et nommé du profil (justification vide ou générique = rejet)
- Jamais rien qui figure dans les filtres durs (veto absolu)
- Idées concrètes, actionnables cette semaine
- Ton : chaud, personnel, jamais clinique ni SaaS
- Zéro score, zéro %, zéro jargon psy
- 1 à 3 idées, chaque idée cible une dimension différente si possible
- La justification est une phrase courte, toujours ancrée dans un élément concret

Réponds uniquement avec un tableau JSON :
[
  {
    "title": "Titre court et concret (max 7 mots)",
    "justification": "Phrase courte ancrée dans le profil (ex: '${'{'}prénom{'}'} est sensible aux petits gestes réguliers')",
    "dim": "MOT" | "SER" | "CAD_C" | "CAD_S" | "EXP" | "GES" | "SUR",
    "canal": "message" | "appel" | "en_personne" | "cadeau" | "service" | "experience",
    "intensite": "légère" | "modérée" | "forte",
    "declencheur": "Cette semaine" | "Ce soir" | "Dans 2-3 jours" | "Quand il/elle semble stressé(e)" | (autre formulation courte et chaleureuse)
  }
]`;

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function generateRecommendations(input: RecoInput): Promise<ContactRecommendations> {
  const kadence = computeKadenceFromProfile(input);
  const blindSpot = detectBlindSpot(input);
  const vetoList = buildVetoList(input);
  const context = buildContextString(input);

  const userPrompt = `Génère 1 à 3 recommandations d'attention concrètes et adaptées pour ${input.contactFirstName}.

${context}

Respecte strictement les filtres durs. Ancre chaque idée sur un signal nommé. Réponds uniquement avec le JSON.`;

  let ideas: RecoIdea[] = [];

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as RecoIdea[];
      ideas = parsed.filter((idea) => passesVeto(idea, vetoList));

      if (blindSpot) {
        ideas = ideas.map((idea) => ({
          ...idea,
          isBlindSpot: blindSpot.dims.includes(idea.dim),
        }));
      }
    }
  } catch {
    // fall through to deterministic fallback
  }

  if (ideas.length === 0) {
    ideas = buildFallbackIdeas(input);
    if (blindSpot && ideas[0]) {
      ideas[0].isBlindSpot = blindSpot.dims.includes(ideas[0].dim);
    }
  }

  return {
    ideas: ideas.slice(0, 3),
    blindSpot,
    kadence,
    generatedAt: new Date().toISOString(),
  };
}
