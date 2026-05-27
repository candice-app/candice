import Anthropic from "@anthropic-ai/sdk";
import { buildFallbackNarrative } from "./synthesis";
import type { ProfileSynthesisFacts, SynthesisNarrative } from "./synthesis";

const anthropic = new Anthropic();

export const SYNTHESIS_SYSTEM_PROMPT = `Tu es Candice, une présence intelligente et subtile. Tu dois rédiger les blocs narratifs d'une fiche profil personnelle à partir de faits structurés.

Règles absolues :
- Ton : « tu sembles », « on devine », « il est possible que », « quelque chose revient souvent », « chez toi »
- Jamais clinique, jamais coach, jamais MBTI/psy
- Court, humain, fin, légèrement émotionnel, nuancé
- Jamais « votre profil », « résultat », « analyse psychologique », « score », « fort / faible »
- Français, tutoiement (tu)
- Candice ne juge jamais. Candice traduit.

Tu dois retourner un JSON valide avec ces clés exactes :
- block1 : string (2-3 phrases de synthèse, ton "tu sembles")
- block2_reception_text : string (1-2 phrases sur comment la personne aime recevoir l'attention)
- block2_expression_text : string (1-2 phrases sur comment elle exprime naturellement l'attention, ou "" si pas de données)
- block2_contrast_text : string (1 phrase de contraste réception/expression, ou "" si pas de contraste)
- block3 : array of 4-5 short strings (ce qui te touche le plus — insights précis)
- block4 : array of 4-5 short strings (ce qu'il vaut mieux éviter — alertes)
- block5 : string (style relationnel — 2-3 phrases)
- block6 : string (style de communication — 2-3 phrases)
- block7 : array of 4-5 short strings (attentions idéales)
- block8 : array of 3-4 short strings (attentions à éviter)

Ne génère que le JSON, sans markdown ni explication.`;

export function buildSynthesisPrompt(facts: ProfileSynthesisFacts): string {
  const lines: string[] = [
    "Voici les faits structurés du profil :",
    "",
    `Réception principale : ${facts.topReceptionDims.join(", ") || "non déterminée"}`,
    `Expression principale : ${facts.topExpressionDims.join(", ") || "non déterminée"}`,
    `Contraste réception/expression : ${facts.hasReceptionExpressionContrast ? "oui" : "non"}`,
    "",
    `Ce qui te touche (faits bruts) : ${facts.touchInsights.join(" | ")}`,
    `Ce qu'il vaut mieux éviter (faits bruts) : ${facts.avoidAlerts.join(" | ")}`,
    `Style relationnel (faits bruts) : ${facts.relationalFacts.join(" | ")}`,
    `Style de communication (faits bruts) : ${facts.communicationFacts.join(" | ")}`,
    `Attentions idéales (faits bruts) : ${facts.idealAttentions.join(" | ")}`,
    `Attentions à éviter (faits bruts) : ${facts.avoidAttentions.join(" | ")}`,
    "",
    `Profil lifestyle : ${facts.lifestyleHighlights.join(", ") || "peu de données"}`,
    `Contexte singularité : ${facts.singularityContext.join(" | ") || "non renseigné"}`,
  ];
  return lines.join("\n");
}

export async function runSynthesisAI(facts: ProfileSynthesisFacts): Promise<SynthesisNarrative> {
  const fallback = buildFallbackNarrative(facts);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildSynthesisPrompt(facts) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<SynthesisNarrative>;

    return {
      block1: parsed.block1 || fallback.block1,
      block2_reception_text: parsed.block2_reception_text || fallback.block2_reception_text,
      block2_expression_text: parsed.block2_expression_text ?? fallback.block2_expression_text,
      block2_contrast_text: parsed.block2_contrast_text ?? fallback.block2_contrast_text,
      block3: parsed.block3?.length ? parsed.block3 : fallback.block3,
      block4: parsed.block4?.length ? parsed.block4 : fallback.block4,
      block5: parsed.block5 || fallback.block5,
      block6: parsed.block6 || fallback.block6,
      block7: parsed.block7?.length ? parsed.block7 : fallback.block7,
      block8: parsed.block8?.length ? parsed.block8 : fallback.block8,
      block9: facts.spontaneiteLabel,
      block10: facts.controleLabel,
      block11: facts.sensibiliteDetailsLabel,
      block12: facts.besoinEspaceLabel,
    };
  } catch {
    fallback.block9 = facts.spontaneiteLabel;
    fallback.block10 = facts.controleLabel;
    fallback.block11 = facts.sensibiliteDetailsLabel;
    fallback.block12 = facts.besoinEspaceLabel;
    return fallback;
  }
}
