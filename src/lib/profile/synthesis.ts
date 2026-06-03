import type { AttentionDim, FaceResult } from '@/lib/attention/scoring';
import type { RelationalFilters } from '@/lib/lifestyle/scoring';

// ─── Input ────────────────────────────────────────────────────────────────────

// Looser types — data comes as JSON from Supabase jsonb columns
type AxisMap = Record<string, { score: number; intensity: number }> | null;
type ModeMap = Record<string, { label: string; intensity: number } | null> | null;

export interface SingularityInput {
  adore_faire?: string;
  evite_deteste?: string;
  sujets_stimulants?: string;
  peu_savent?: string;
  plus_beau_cadeau?: string;
  detail_compris?: string;
  marques_lieux?: string;
  cadeaux_non?: string;
  envies_reves?: string;
  remarquer?: string;
  sentir_special?: string;
  interests?: { items?: Array<{ id: string; rank: number }>; freeText?: string };
}

export interface VetosInput {
  no_alcohol?: boolean;
  halal?: boolean;
  casher?: boolean;
  mobility_constraints?: boolean;
  allergies?: string[];
}

export interface PracticalInput {
  vetos?: VetosInput;
}

export interface ProfileInput {
  reception: FaceResult;
  expression: FaceResult;
  temperamentAxes: AxisMap;
  temperamentModes: ModeMap;
  lifestyleAxes: AxisMap;
  relationalFilters: RelationalFilters | null;
  practicalInfo: PracticalInput | null;
  singularity: SingularityInput | null;
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface ProfileSynthesisFacts {
  topReceptionDims: AttentionDim[];
  topExpressionDims: AttentionDim[];
  hasReceptionExpressionContrast: boolean;

  touchInsights: string[];
  avoidAlerts: string[];
  relationalFacts: string[];
  communicationFacts: string[];
  idealAttentions: string[];
  avoidAttentions: string[];

  // Deterministic level labels (blocks 9-12)
  spontaneiteLabel: string;
  controleLabel: string;
  sensibiliteDetailsLabel: string;
  besoinEspaceLabel: string;

  // Context for AI
  lifestyleHighlights: string[];
  singularityContext: string[];

  hasTemperamentData: boolean;
  hasLifestyleData: boolean;
  hasPracticalData: boolean;
  hasSingularityData: boolean;
}

export interface SynthesisNarrative {
  block1: string;
  block2_reception_text: string;
  block2_expression_text: string;
  block2_contrast_text: string;
  block3: string[];
  block4: string[];
  block5: string;
  block6: string;
  block7: string[];
  block8: string[];
  block9: string;
  block10: string;
  block11: string;
  block12: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAxis(axes: AxisMap, key: string): number {
  if (!axes) return 0;
  return axes[key]?.score ?? 0;
}

function getMode(modes: ModeMap, key: string): string | null {
  if (!modes) return null;
  const entry = modes[key];
  if (!entry) return null;
  return entry.label ?? null;
}

// Axis polarity: positive = high for the named attribute
function levelLabel(value: number): string {
  if (value > 35) return "plutôt élevé";
  if (value > 10) return "modéré";
  if (value >= -10) return "équilibré";
  if (value >= -35) return "assez discret";
  return "discret";
}

function spontaneiteLabel(score: number): string {
  // negative = spontanéité
  const v = -score;
  if (v > 35) return "plutôt élevée";
  if (v > 10) return "modérée";
  if (v >= -10) return "équilibrée";
  return "plutôt discrète";
}

function controleLabel(score: number): string {
  // positive = contrôle
  return levelLabel(score);
}

function detailsLabel(score: number): string {
  // positive = élevée
  if (score > 35) return "plutôt élevée";
  if (score > 10) return "modérée";
  if (score >= -10) return "équilibrée";
  return "plutôt discrète";
}

function espaceLabel(score: number): string {
  // negative = espace (the positive pole is proximité)
  const v = -score;
  if (v > 35) return "marqué";
  if (v > 10) return "modéré";
  if (v >= -10) return "équilibré";
  return "plutôt discret";
}

// ─── Dim reference data ───────────────────────────────────────────────────────

const DIM_LABELS: Record<AttentionDim, string> = {
  MOT: "les mots sincères et la reconnaissance verbale",
  SER: "les gestes concrets et l'aide spontanée",
  CAD_C: "les cadeaux pensés avec soin et précision",
  CAD_S: "les attentions chargées de sens et d'intention",
  EXP: "les moments vraiment partagés",
  GES: "les petites attentions glissées dans le quotidien",
  SUR: "les surprises bien pensées",
};

const DIM_TOUCH: Record<AttentionDim, string> = {
  MOT: "un mot juste, sincère, dit ou écrit au bon moment",
  SER: "quelqu'un qui allège la charge sans qu'on lui ait rien demandé",
  CAD_C: "un cadeau qui dit clairement : j'ai écouté, j'ai retenu",
  CAD_S: "une attention qui porte une histoire ou une intention",
  EXP: "du temps pleinement présent, sans distraction",
  GES: "les petits gestes réguliers, discrets, glissés dans le quotidien",
  SUR: "l'inattendu bien pensé — pas le chaos, la surprise juste",
};

const DIM_IDEAL: Record<AttentionDim, string> = {
  MOT: "un message sincère et bien formulé, au bon moment",
  SER: "une aide concrète, surtout dans les périodes chargées",
  CAD_C: "un objet précis, pensé pour toi, jamais générique",
  CAD_S: "quelque chose chargé de sens, qui raconte une histoire",
  EXP: "un moment partagé, vraiment partagé — sans téléphone",
  GES: "un geste régulier et discret, ancré dans le quotidien",
  SUR: "une surprise préparée avec justesse, jamais au dernier moment",
};

// ─── Main function ─────────────────────────────────────────────────────────────

export function computeProfileSynthesis(input: ProfileInput): ProfileSynthesisFacts {
  const {
    reception, expression,
    temperamentAxes, temperamentModes,
    lifestyleAxes, relationalFilters,
    practicalInfo, singularity,
  } = input;

  const hasTemperamentData = !!temperamentAxes;
  const hasLifestyleData = !!lifestyleAxes;
  const hasPracticalData = !!practicalInfo;
  const hasSingularityData = !!singularity;

  // --- Attention dims ---
  const topReceptionDims: AttentionDim[] = [
    ...reception.dominant,
    ...reception.secondaire,
    ...reception.tertiaire,
  ].slice(0, 3);

  const topExpressionDims: AttentionDim[] = [
    ...expression.dominant,
    ...expression.secondaire,
  ].slice(0, 2);

  const hasReceptionExpressionContrast =
    topReceptionDims.length > 0 &&
    topExpressionDims.length > 0 &&
    !topExpressionDims.some(d => topReceptionDims.slice(0, 2).includes(d));

  // --- Block 3: Ce qui te touche ---
  const touchInsights: string[] = [];
  for (const dim of topReceptionDims.slice(0, 2)) {
    touchInsights.push(DIM_TOUCH[dim]);
  }
  if (hasTemperamentData) {
    if (getAxis(temperamentAxes, 'sensibiliteDetails') > 30) {
      touchInsights.push("les petits détails — un rien manqué peut peser, un rien juste peut tout changer");
    }
    if (getAxis(temperamentAxes, 'exigenceStanding') > 30) {
      touchInsights.push("la qualité d'exécution — les attentions soignées touchent plus que les grandes");
    }
    if (relationalFilters?.besoinFiabilite) {
      touchInsights.push("la constance et la fiabilité — savoir qu'on peut compter sur quelqu'un");
    }
    if (relationalFilters?.besoinEcoute) {
      touchInsights.push("se sentir vraiment écouté(e), pas juste entendu(e)");
    }
    if (relationalFilters?.besoinProfondeur) {
      touchInsights.push("les connexions profondes, davantage que les interactions superficielles");
    }
  }
  if (singularity?.detail_compris && singularity.detail_compris.trim().length > 3) {
    touchInsights.push(singularity.detail_compris.trim().slice(0, 80));
  }

  // --- Block 4: Ce qu'il vaut mieux éviter ---
  const avoidAlerts: string[] = [];
  if (relationalFilters?.antiSurprisePublique) avoidAlerts.push("les surprises publiques ou devant du monde");
  if (relationalFilters?.antiSurprisePlanning) avoidAlerts.push("les surprises qui bousculent l'organisation");
  if (relationalFilters?.antiSurpriseIntime) avoidAlerts.push("les moments imposés sans préavis");
  if (relationalFilters?.exigenceExecution) avoidAlerts.push("les attentions bâclées ou approximatives");
  if (relationalFilters?.sensibiliteCritique) avoidAlerts.push("les critiques directes, surtout en public");
  if (relationalFilters?.besoinAir) avoidAlerts.push("se sentir envahi(e) ou trop sollicité(e)");
  if (relationalFilters?.q17Interdits && relationalFilters.q17Interdits.length > 0) {
    avoidAlerts.push(...relationalFilters.q17Interdits.slice(0, 2));
  }
  if (practicalInfo?.vetos?.no_alcohol) avoidAlerts.push("les lieux ou sorties centrés sur l'alcool");
  if (practicalInfo?.vetos?.halal || practicalInfo?.vetos?.casher) {
    avoidAlerts.push("les restaurants sans options adaptées au régime alimentaire");
  }
  if (practicalInfo?.vetos?.allergies && practicalInfo.vetos.allergies.length > 0) {
    avoidAlerts.push(`les aliments contenant : ${practicalInfo.vetos.allergies.join(", ")}`);
  }
  if (singularity?.cadeaux_non && singularity.cadeaux_non.trim().length > 3) {
    avoidAlerts.push(`à éviter comme cadeaux : ${singularity.cadeaux_non.trim().slice(0, 60)}`);
  }
  if (singularity?.evite_deteste && singularity.evite_deteste.trim().length > 3) {
    avoidAlerts.push(`évite en général : ${singularity.evite_deteste.trim().slice(0, 60)}`);
  }

  // --- Block 5: Style relationnel ---
  const relationalFacts: string[] = [];
  if (hasTemperamentData) {
    const esp = getAxis(temperamentAxes, 'espaceProsimite');
    const social = getAxis(temperamentAxes, 'energieSociale');
    const stab = getAxis(temperamentAxes, 'stabiliteNouveaute');

    if (esp < -30) relationalFacts.push("besoin d'espace et d'autonomie marqué dans les relations");
    else if (esp > 30) relationalFacts.push("apprécie la proximité et le lien dans les relations");
    else relationalFacts.push("équilibre entre proximité et autonomie");

    if (social < -30) relationalFacts.push("énergie sociale plutôt intérieure — préfère les petits groupes au grand bruit");
    else if (social > 30) relationalFacts.push("aime les interactions et se nourrit de la compagnie des autres");

    if (stab < -30) relationalFacts.push("attaché(e) à la régularité et à la stabilité");
    else if (stab > 30) relationalFacts.push("aime le renouveau et la variété dans les relations");

    if (relationalFilters?.besoinAir) relationalFacts.push("a besoin d'espace entre les interactions, même avec les proches");
  }

  // --- Block 6: Style de communication ---
  const communicationFacts: string[] = [];
  if (hasTemperamentData) {
    const comm = getAxis(temperamentAxes, 'communicationStyle');
    const expr = getAxis(temperamentAxes, 'expressiviteReserve');
    const rythme = getAxis(temperamentAxes, 'rapportTemps');
    const conflitMode = getMode(temperamentModes, 'conflit');
    const canalMode = getMode(temperamentModes, 'canal');
    const decisionMode = getMode(temperamentModes, 'decision');

    if (comm < -30) communicationFacts.push("communication directe et franche, préfère les choses dites clairement");
    else if (comm > 30) communicationFacts.push("communication plutôt nuancée, prend le temps de formuler");
    else communicationFacts.push("communication équilibrée, directe quand nécessaire");

    if (expr < -30) communicationFacts.push("assez expressif(ve) — les émotions circulent assez naturellement");
    else if (expr > 30) communicationFacts.push("retenu(e) dans l'expression émotionnelle, préfère montrer par les actes");

    if (conflitMode) communicationFacts.push(`face au conflit : ${conflitMode}`);
    if (canalMode) communicationFacts.push(`canal préféré : ${canalMode}`);
    if (decisionMode) communicationFacts.push(`décisions : ${decisionMode}`);

    if (rythme > 30) communicationFacts.push("préfère anticiper et avoir de la visibilité à l'avance");
    else if (rythme < -30) communicationFacts.push("gère plutôt au fil de l'eau, apprécie la souplesse");
  }

  // --- Block 7: Attentions idéales ---
  const idealAttentions: string[] = [];
  for (const dim of topReceptionDims.slice(0, 3)) {
    let idea = DIM_IDEAL[dim];
    // Enrich with lifestyle
    if (dim === 'EXP' && getAxis(lifestyleAxes, 'foodie') > 30) {
      idea = "une expérience culinaire choisie avec soin, dans un endroit qui correspond";
    } else if (dim === 'EXP' && getAxis(lifestyleAxes, 'aventureConfort') > 30) {
      idea = "une expérience vivante et mémorable, que tu auras envie de raconter";
    } else if (dim === 'CAD_C' && getAxis(lifestyleAxes, 'premiumSimplicite') > 30) {
      idea = "un cadeau précis et de qualité — qui dit clairement que tu as fait attention";
    }
    idealAttentions.push(idea);
  }
  if (singularity?.envies_reves && singularity.envies_reves.trim().length > 3) {
    idealAttentions.push(`quelque chose lié à tes envies actuelles : ${singularity.envies_reves.trim().slice(0, 60)}`);
  }
  if (singularity?.marques_lieux && singularity.marques_lieux.trim().length > 3) {
    idealAttentions.push(`un choix dans tes univers préférés : ${singularity.marques_lieux.trim().slice(0, 60)}`);
  }

  // --- Block 8: Attentions à éviter ---
  const avoidAttentions: string[] = [];
  if (relationalFilters?.antiSurprisePublique) avoidAttentions.push("les surprises devant un groupe ou en public");
  if (relationalFilters?.exigenceExecution) avoidAttentions.push("les attentions approximatives ou génériques");
  if (singularity?.cadeaux_non && singularity.cadeaux_non.trim().length > 3) {
    avoidAttentions.push(`les cadeaux que tu n'aimes pas : ${singularity.cadeaux_non.trim().slice(0, 60)}`);
  }
  if (practicalInfo?.vetos?.no_alcohol) avoidAttentions.push("les sorties dans des bars ou soirées centrées alcool");
  if (!relationalFilters?.antiSurprisePublique && !relationalFilters?.exigenceExecution && avoidAttentions.length === 0) {
    avoidAttentions.push("les gestes trop génériques, qui auraient pu être faits pour n'importe qui");
  }

  // --- Blocks 9-12: Level labels ---
  const spont = spontaneiteLabel(getAxis(temperamentAxes, 'spontaneiteControle'));
  const ctrl = controleLabel(getAxis(temperamentAxes, 'spontaneiteControle'));
  const details = detailsLabel(getAxis(temperamentAxes, 'sensibiliteDetails'));
  const espace = espaceLabel(getAxis(temperamentAxes, 'espaceProsimite'));

  // --- Lifestyle highlights ---
  const lifestyleHighlights: string[] = [];
  if (getAxis(lifestyleAxes, 'foodie') > 30) lifestyleHighlights.push("gastronome");
  if (getAxis(lifestyleAxes, 'premiumSimplicite') > 30) lifestyleHighlights.push("apprécie la qualité et le soin");
  if (getAxis(lifestyleAxes, 'experienceObjet') > 30) lifestyleHighlights.push("préfère les expériences aux objets");
  if (getAxis(lifestyleAxes, 'aventureConfort') > 30) lifestyleHighlights.push("attrait pour l'aventure");
  if (getAxis(lifestyleAxes, 'aventureConfort') < -30) lifestyleHighlights.push("préfère le confort");
  if (getAxis(lifestyleAxes, 'authenticiteLuxe') > 30) lifestyleHighlights.push("sensible à l'authenticité");
  if (getAxis(lifestyleAxes, 'authenticiteLuxe') < -30) lifestyleHighlights.push("sensible au luxe et à l'esthétique");

  // --- Singularity context ---
  const singularityContext: string[] = [];
  if (singularity?.adore_faire && singularity.adore_faire.trim().length > 3) {
    singularityContext.push(`aime : ${singularity.adore_faire.trim().slice(0, 50)}`);
  }
  if (singularity?.sujets_stimulants && singularity.sujets_stimulants.trim().length > 3) {
    singularityContext.push(`sujets stimulants : ${singularity.sujets_stimulants.trim().slice(0, 50)}`);
  }
  if (singularity?.peu_savent && singularity.peu_savent.trim().length > 3) {
    singularityContext.push(`peu savent que : ${singularity.peu_savent.trim().slice(0, 50)}`);
  }

  return {
    topReceptionDims,
    topExpressionDims,
    hasReceptionExpressionContrast,
    touchInsights: touchInsights.slice(0, 5),
    avoidAlerts: avoidAlerts.slice(0, 5),
    relationalFacts: relationalFacts.slice(0, 4),
    communicationFacts: communicationFacts.slice(0, 4),
    idealAttentions: idealAttentions.slice(0, 5),
    avoidAttentions: avoidAttentions.slice(0, 4),
    spontaneiteLabel: spont,
    controleLabel: ctrl,
    sensibiliteDetailsLabel: details,
    besoinEspaceLabel: espace,
    lifestyleHighlights: lifestyleHighlights.slice(0, 4),
    singularityContext: singularityContext.slice(0, 4),
    hasTemperamentData,
    hasLifestyleData,
    hasPracticalData,
    hasSingularityData,
  };
}

// ─── Fallback narrative (deterministic, no AI) ────────────────────────────────

export function buildFallbackNarrative(facts: ProfileSynthesisFacts): SynthesisNarrative {
  const dim = facts.topReceptionDims[0] ?? 'MOT';
  const dim2 = facts.topReceptionDims[1];

  let block1 = `Tu sembles sensible à ${DIM_LABELS[dim]}.`;
  if (dim2) block1 += ` ${DIM_LABELS[dim2]} compte aussi beaucoup pour toi.`;
  if (facts.hasReceptionExpressionContrast) {
    block1 += " Il est possible que ta façon de donner et de recevoir l'attention diffère — une nuance intéressante.";
  }

  const receptionText = facts.topReceptionDims.length > 0
    ? `Tu reçois l'attention surtout par ${facts.topReceptionDims.map(d => DIM_LABELS[d]).join(" et ")}.`
    : "Tes langages d'attention réception sont variés.";

  const expressionText = facts.topExpressionDims.length > 0
    ? `Tu exprimes naturellement par ${facts.topExpressionDims.map(d => DIM_LABELS[d]).join(" et ")}.`
    : "";

  const contrastText = facts.hasReceptionExpressionContrast
    ? "Tu donnes l'attention différemment de la façon dont tu aimes la recevoir — ce décalage peut créer des malentendus."
    : "";

  const block5 = facts.relationalFacts.length > 0
    ? facts.relationalFacts.join(". ") + "."
    : "Ton style relationnel reflète un équilibre entre proximité et autonomie.";

  const block6 = facts.communicationFacts.length > 0
    ? facts.communicationFacts.join(". ") + "."
    : "Tu communiques avec nuance, à ton rythme propre.";

  return {
    block1,
    block2_reception_text: receptionText,
    block2_expression_text: expressionText,
    block2_contrast_text: contrastText,
    block3: facts.touchInsights,
    block4: facts.avoidAlerts,
    block5,
    block6,
    block7: facts.idealAttentions,
    block8: facts.avoidAttentions,
    block9: facts.spontaneiteLabel,
    block10: facts.controleLabel,
    block11: facts.sensibiliteDetailsLabel,
    block12: facts.besoinEspaceLabel,
  };
}
