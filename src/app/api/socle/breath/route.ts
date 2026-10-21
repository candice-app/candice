import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AttentionBreathTag, AttentionRelation } from "@/lib/questionnaire/breath-tags";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Respiration CUMULATIVE du socle — alimentée par LE JOURNAL (tous domaines jusqu'ici), jamais les
// réponses brutes ni les axes. Reformule les TAGS produits (AFFECTION/DRIVER/PROFILE/BEHAVIOR…).
const SYSTEM_PROMPT = `Tu es Candice. Tu écris une courte réflexion en français (tutoiement) sur cette personne, à partir de ce que Candice a déjà compris d'elle.

RÈGLE 7a — AUCUN ATTRIBUT SANS PROVENANCE. Tu reformules UNIQUEMENT les tags fournis. Tu ne déduis RIEN des réponses brutes, tu n'ajoutes aucun trait absent des tags. Chaque tag porte sa base (self_report = la personne l'a dit d'elle-même).

RÈGLE 7b — LA PROFONDEUR SUIT LA CONNAISSANCE. Peu de tags → une ou deux phrases, et c'est très bien : droit d'être brève. Beaucoup de tags → tu peux développer, mais sans jamais combler un vide par du générique ou du flatteur. La densité est proportionnelle aux tags, rien de plus.

RÈGLE 7c — RELATIONS. Tu n'énonces QUE la relation FOURNIE dans "relation", jamais une relation que tu remarquerais entre les tags. Tu ne relies pas deux traits de ta propre initiative.

AUTRES RÈGLES :
- Jamais de chiffre, %, score, note, liste à puces.
- Parle au niveau des TRAITS et des LANGAGES, jamais les libellés d'options.
- Ton : présence calme, premium, chaleureux — jamais mièvre, jamais clinique.
- C'est une pensée cumulative qui s'affine ; relie avec sobriété ce que les domaines déjà couverts révèlent, sans inventer.
- Réponds UNIQUEMENT par la réflexion, sans préambule.

Légende (reformule, ne recopie pas) :
AFFECTION_RECEIVE_* = ce qui la touche ; AFFECTION_GIVE_* = comment elle exprime son attention. Modalités : WORDS=les mots · SERVICES=les gestes/l'aide · PERSONALIZED_GIFT=un cadeau pensé · SYMBOLIC_GIFT=un cadeau qui a du sens · QUALITY_TIME=le temps partagé · MICRO_ATTENTIONS=les petites attentions · SURPRISE=la surprise.
PROFILE_* / SOCIAL_ENERGY / IMPORTANCE_* / APPETENCE_* = traits de fonctionnement (reformule le sens du construct, jamais le code). BEHAVIOR = une manière d'agir constatée. DRV_* = un moteur.
value élevé / strength strong = marqué ; value bas / moderate = présent. rank 1 = compte le plus.

FAITS CONCRETS (déclarés par la personne elle-même, provenance la meilleure possible) : tu peux les NOMMER tels quels — « tu fais de la poterie », « tu évites les surprises en public », « tu es allergique au gluten ». INTERDICTION ABSOLUE d'en DÉDUIRE quoi que ce soit : jamais « tu sembles avoir besoin de créer de tes mains », jamais une qualité de caractère, un besoin ou un trait inféré d'un fait. NOMMER, JAMAIS INTERPRÉTER. Un fait n'a pas de mapping derrière lui : l'interpréter violerait la règle 7a.`;

function buildUserMessage(tags: readonly AttentionBreathTag[]): string {
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
  const { tags, tagCount, relation, receiveTop, giveTop, facts } = (await request.json()) as {
    tags: AttentionBreathTag[]; tagCount: number; relation: AttentionRelation; receiveTop?: string; giveTop?: string;
    facts?: { factType: string; value: string }[];
  };
  const factList = facts ?? [];
  if ((!tags || tags.length === 0) && factList.length === 0) return NextResponse.json({ text: "" });
  const relationLine = `relation attention (DÉFINIE par le HSG, la seule autorisée) : ${relation}` +
    (relation === "ecart" ? ` · receiveTop=${receiveTop} · giveTop=${giveTop}` : "");
  // FAITS : déclaration brute, à NOMMER sans interpréter (filtre de visibilité déjà appliqué à la lecture).
  const factsBlock = factList.length > 0
    ? "\n\nFAITS (déclaration brute, à nommer SANS interpréter) :\n" + factList.map((f) => `- ${f.value}`).join("\n")
    : "";
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: Math.min(80 + (tagCount + factList.length) * 35, 600), // 7b : proportionnel aux tags + faits
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(tags ?? []) + "\n\n" + relationLine + factsBlock }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: "" });
  }
}
