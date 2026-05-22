import type { TemperamentAxes, TemperamentModes } from './scoring';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemperamentBreathFacts {
  step: 2 | 3;

  // Axis snapshots (score, intensity)
  energieSociale:      { score: number; intensity: number };
  espaceProsimite:     { score: number; intensity: number };
  spontaneiteControle: { score: number; intensity: number };
  expressiviteReserve: { score: number; intensity: number };
  stabiliteNouveaute:  { score: number; intensity: number };
  communicationStyle:  { score: number; intensity: number };
  rapportTemps:        { score: number; intensity: number };

  conflitMode:  string | null;
  stressMode:   string | null;
  decisionMode: string | null;
  canalMode:    string | null;

  // Derived contradiction flags (see bible examples)
  extravertiBesoinProfondeur: boolean; // extra fort + expressivité forte
  controleStressConvergent:   boolean; // contrôle fort + stress=contrôle
  evitementStabilite:         boolean; // conflit=évitant + stabilite forte
  reserveExpressionActes:     boolean; // réserve forte + (step=3 only)
  maturationDecalage:         boolean; // decision=maturation + rapportTemps positif
}

// ─── Threshold helpers ────────────────────────────────────────────────────────

function isClear(score: number): boolean {
  return Math.abs(score) >= 25;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function computeTemperamentBreathFacts(
  axes: TemperamentAxes,
  modes: TemperamentModes,
  step: 2 | 3,
): TemperamentBreathFacts {
  const conflitMode  = modes.conflit?.label  ?? null;
  const stressMode   = modes.stress?.label   ?? null;
  const decisionMode = modes.decision?.label ?? null;
  const canalMode    = modes.canal?.label    ?? null;

  const es = axes.energieSociale;
  const ep = axes.espaceProsimite;
  const sc = axes.spontaneiteControle;
  const er = axes.expressiviteReserve;
  const sn = axes.stabiliteNouveaute;
  const cs = axes.communicationStyle;
  const rt = axes.rapportTemps;

  // Extraverti fort MAIS besoin de profondeur (expressivité signale profondeur = er < 0)
  const extravertiBesoinProfondeur = es.score > 40 && er.score < -15 && isClear(es.score);

  // Contrôle fort ET stress par le contrôle — convergent, nette
  const controleStressConvergent = sc.score > 40 && stressMode === 'contrôle';

  // Évitement du conflit + besoin de stabilité
  const evitementStabilite = conflitMode === 'évitant' && sn.score < -20;

  // Réserve forte : exprime par les actes (step 3 context)
  const reserveExpressionActes = er.score > 30 && step === 3;

  // Décision par maturation + rapport au temps fort (besoin de temps global)
  const maturationDecalage = decisionMode === 'maturation' && rt.score > 20;

  return {
    step,
    energieSociale:      { score: es.score, intensity: es.intensity },
    espaceProsimite:     { score: ep.score, intensity: ep.intensity },
    spontaneiteControle: { score: sc.score, intensity: sc.intensity },
    expressiviteReserve: { score: er.score, intensity: er.intensity },
    stabiliteNouveaute:  { score: sn.score, intensity: sn.intensity },
    communicationStyle:  { score: cs.score, intensity: cs.intensity },
    rapportTemps:        { score: rt.score, intensity: rt.intensity },
    conflitMode,
    stressMode,
    decisionMode,
    canalMode,
    extravertiBesoinProfondeur,
    controleStressConvergent,
    evitementStabilite,
    reserveExpressionActes,
    maturationDecalage,
  };
}

// ─── Fallback text (deterministic) ───────────────────────────────────────────

export function buildTemperamentFallbackText(facts: TemperamentBreathFacts): string {
  if (facts.step === 2) {
    if (facts.extravertiBesoinProfondeur) {
      return "Quelque chose d'intéressant apparaît : tu sembles puiser ton énergie dans les autres, mais ce que tu cherches vraiment, ce n'est pas l'agitation — c'est la profondeur. Beaucoup de présences autour de toi, mais peu de liens qui comptent vraiment.";
    }
    if (facts.energieSociale.score < -30 && facts.espaceProsimite.score < -30) {
      return "On voit apparaître un équilibre assez net : tu aimes le lien, mais tu as besoin de le doser. Quand tu te retires, ce n'est pas de la distance — c'est ta façon de te recharger.";
    }
    if (facts.evitementStabilite) {
      return "Tu sembles tenir à l'harmonie au point de parfois taire ce qui te dérange. C'est précieux pour la paix d'une relation — mais tout ne se dit pas chez toi à voix haute.";
    }
    if (facts.controleStressConvergent) {
      return "On devine quelqu'un qui se rassure en gardant la main. L'imprévu n'est pas ton terrain de jeu favori, surtout sous pression. C'est une façon d'être qui mérite d'être connue.";
    }
    return "Ton profil relationnel commence à prendre forme — on comprend mieux comment tu fonctionnes dans le lien.";
  }

  // Step 3
  if (facts.reserveExpressionActes && facts.expressiviteReserve.score > 30) {
    return "Tu n'es pas du genre à beaucoup verbaliser tes émotions — mais ça ne veut pas dire que tu en as peu. Chez toi, l'attention se prouve plus qu'elle ne se dit. C'est un détail que peu de gens lisent correctement.";
  }
  if (facts.maturationDecalage) {
    return "On voit revenir un même fil : tu as besoin de temps. Pour décider, pour comprendre ce que tu ressens, pour répondre. Ce n'est pas de la distance — c'est ton rythme intérieur.";
  }
  if (facts.communicationStyle.score < -30 && facts.decisionMode && ['rationnel', 'analytique'].includes(facts.decisionMode)) {
    return "Ton profil se précise : tu fonctionnes à la clarté. Tu préfères qu'on te parle franchement et tu décides en pesant les choses. Avec toi, mieux vaut être net que flou.";
  }
  return "Ton profil relationnel continue de prendre forme — Candice comprend mieux comment tu communiques et tu décides.";
}
