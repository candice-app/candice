import type { LifestyleAxes, RelationalFilters } from './scoring';

export interface LifestyleBreathFacts {
  step: 4 | 5;
  // Lifestyle axes (score, intensity)
  foodie:                { score: number; intensity: number };
  premiumSimplicite:     { score: number; intensity: number };
  experienceObjet:       { score: number; intensity: number };
  esthetiqueFonctionnel: { score: number; intensity: number };
  aventureConfort:       { score: number; intensity: number };
  authenticiteLuxe:      { score: number; intensity: number };
  // Relational filters (Step 5)
  antiSurprisePublique:  boolean;
  antiSurprisePlanning:  boolean;
  antiSurpriseIntime:    boolean;
  exigenceExecution:     boolean;
  ouvertSurprise:        boolean;
  besoinEcoute:          boolean;
  peurOubli:             boolean;
  besoinAir:             boolean;
  sensibiliteCritique:   boolean;
  besoinFiabilite:       boolean;
  besoinProfondeur:      boolean;
  sensibiliteChargeMetale: boolean;
  q17Text:      string;
  q17Interdits: string[];
  // Contradiction flags (Step 4)
  sensibleMaisFacile:   boolean; // premium + simplicite convergent
  aventureAuthentique:  boolean; // aventure + authenticite
  // Step 5 contradiction flags
  besoinAirEtEcoute:   boolean; // besoinAir + besoinEcoute
}

export function computeLifestyleBreathFacts(
  axes: LifestyleAxes,
  filters: RelationalFilters,
  step: 4 | 5,
): LifestyleBreathFacts {
  const sensibleMaisFacile =
    axes.premiumSimplicite.score > 30 && axes.premiumSimplicite.score < 70;

  const aventureAuthentique =
    axes.aventureConfort.score > 40 && axes.authenticiteLuxe.score > 40;

  const besoinAirEtEcoute = filters.besoinAir && filters.besoinEcoute;

  return {
    step,
    foodie:                axes.foodie,
    premiumSimplicite:     axes.premiumSimplicite,
    experienceObjet:       axes.experienceObjet,
    esthetiqueFonctionnel: axes.esthetiqueFonctionnel,
    aventureConfort:       axes.aventureConfort,
    authenticiteLuxe:      axes.authenticiteLuxe,
    antiSurprisePublique:  filters.antiSurprisePublique,
    antiSurprisePlanning:  filters.antiSurprisePlanning,
    antiSurpriseIntime:    filters.antiSurpriseIntime,
    exigenceExecution:     filters.exigenceExecution,
    ouvertSurprise:        filters.ouvertSurprise,
    besoinEcoute:          filters.besoinEcoute,
    peurOubli:             filters.peurOubli,
    besoinAir:             filters.besoinAir,
    sensibiliteCritique:   filters.sensibiliteCritique,
    besoinFiabilite:       filters.besoinFiabilite,
    besoinProfondeur:      filters.besoinProfondeur,
    sensibiliteChargeMetale: filters.sensibiliteChargeMetale,
    q17Text:               filters.q17Text,
    q17Interdits:          filters.q17Interdits,
    sensibleMaisFacile,
    aventureAuthentique,
    besoinAirEtEcoute,
  };
}

export function buildLifestyleFallbackText(facts: LifestyleBreathFacts): string {
  if (facts.step === 4) {
    const parts: string[] = [];

    if (facts.experienceObjet.score > 40) {
      parts.push("Ce qui compte pour toi, c'est ce que tu vis — pas ce que tu accumules.");
    } else if (facts.experienceObjet.score < -40) {
      parts.push("Tu aimes que les choses durent, que les attentions se voient et se gardent.");
    }

    if (facts.foodie.score > 40) {
      parts.push("La table est un vrai terrain d'attention pour toi.");
    }

    if (facts.premiumSimplicite.score < -30) {
      parts.push("L'intention sincère pèse plus que le standing.");
    } else if (facts.premiumSimplicite.score > 40) {
      parts.push("La qualité et le soin de l'exécution ne t'échappent jamais.");
    }

    if (parts.length === 0) {
      parts.push("On cerne mieux ce qui compte pour toi — et ce qui tombe à côté.");
    }

    parts.push("Ton profil relationnel continue de prendre forme.");
    return parts.join(" ");
  }

  // Step 5
  const parts: string[] = [];

  if (facts.besoinAir) {
    parts.push("Ton besoin d'air n'est pas de la froideur — c'est ton équilibre.");
  } else if (facts.peurOubli) {
    parts.push("Ce qui compte, c'est de compter vraiment pour quelqu'un.");
  } else if (facts.besoinEcoute) {
    parts.push("Être vraiment écouté(e) n'est pas anodin pour toi.");
  }

  if (facts.antiSurprisePublique || facts.antiSurprisePlanning) {
    parts.push("Ces réponses permettent d'éviter les attentions bien intentionnées mais mal calibrées.");
  }

  if (parts.length === 0) {
    parts.push("Ces réponses sont parmi les plus précieuses — elles permettent d'éviter ce qui blesse.");
  }

  parts.push("Ton portrait relationnel est presque complet.");
  return parts.join(" ");
}
