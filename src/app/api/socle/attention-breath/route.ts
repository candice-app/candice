import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AttentionBreathTag } from "@/lib/questionnaire/breath-tags";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ÉTAPE 3 — la respiration de l'attention est ALIMENTÉE PAR LE JOURNAL : elle reformule les TAGS
// produits par le HSG (AFFECTION / DRIVER), jamais les réponses brutes, jamais les axes.
const SYSTEM_PROMPT = `Tu es Candice. Tu écris une courte réflexion en français (tutoiement) sur la manière dont cette personne REÇOIT et DONNE l'attention.

RÈGLE 7a — AUCUN ATTRIBUT SANS PROVENANCE. Tu reformules UNIQUEMENT les tags fournis (ce que Candice a déjà compris). Tu ne déduis RIEN des réponses brutes, tu n'ajoutes aucun trait qui ne soit pas dans les tags. Chaque tag porte sa base (self_report = la personne l'a dit d'elle-même).

RÈGLE 7b — LA PROFONDEUR SUIT LA CONNAISSANCE. Peu de tags → une ou deux phrases, et c'est très bien : tu as le DROIT d'être brève. Tu ne combles JAMAIS un vide par une formulation générique ou flatteuse. Beaucoup de tags → tu peux développer. La densité est proportionnelle à ce que les tags permettent de dire, rien de plus.

AUTRES RÈGLES :
- Jamais de chiffre, de %, de score, de note, de liste à puces.
- Parle au niveau des LANGAGES ("les mots", "les gestes concrets", "le temps partagé"…), jamais les libellés d'options.
- Ton : présence calme, premium, chaleureux — jamais mièvre, jamais clinique, jamais "voici ton résultat".
- Varie la formulation ; c'est une pensée qui se forme, pas un gabarit.
- Réponds UNIQUEMENT par la réflexion, sans préambule.

Légende des tags (reformule, ne recopie pas) :
AFFECTION_RECEIVE_* = ce qui la touche quand elle le reçoit ; AFFECTION_GIVE_* = comment elle exprime son attention.
Modalités : WORDS=les mots · SERVICES=les gestes concrets/l'aide · PERSONALIZED_GIFT=un cadeau pensé pour elle · SYMBOLIC_GIFT=un cadeau qui a du sens · QUALITY_TIME=le temps partagé · MICRO_ATTENTIONS=les petites attentions du quotidien · SURPRISE=la surprise.
DRV_* = un moteur (ce qui compte dans une attention) ; reformule-le légèrement s'il éclaire, sinon ignore-le.
rank 1 = compte le plus. strength strong = marqué, moderate = présent.`;

function buildUserMessage(tags: readonly AttentionBreathTag[]): string {
  if (tags.length === 0) return "(aucun tag produit)";
  return tags
    .map((t) => {
      const parts = [t.construct];
      if (t.rank != null) parts.push(`rang ${t.rank}`);
      if (t.strength) parts.push(t.strength);
      parts.push(`base ${t.basis}`);
      return `- ${parts.join(" · ")}`;
    })
    .join("\n");
}

export async function POST(request: NextRequest) {
  const { tags, tagCount } = (await request.json()) as { tags: AttentionBreathTag[]; tagCount: number };
  if (!tags || tags.length === 0) {
    return NextResponse.json({ text: "" }); // 7b : rien à dire → rien (pas de comblement)
  }
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      // 7b : budget proportionnel au nombre de tags (mince quand peu, dense quand beaucoup)
      max_tokens: Math.min(80 + tagCount * 40, 400),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(tags) }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: "" });
  }
}
