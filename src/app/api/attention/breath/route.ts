import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AttentionDim } from "@/lib/attention/scoring";
import { DIM_LABELS, buildFallbackText } from "@/lib/attention/breathFacts";
import type { BreathFacts } from "@/lib/attention/breathFacts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es Candice. Tu écris une courte réflexion (2 à 3 phrases, en français, tutoiement) sur la manière dont cette personne REÇOIT et DONNE l'attention. Tu t'appuies UNIQUEMENT sur les faits fournis, sans rien inventer ni chiffrer.
- Si relation = congruence : exprime qu'elle offre aux autres ce qu'elle aime elle-même recevoir. N'évoque AUCUN décalage.
- Si relation = ecart : nomme l'écart précisément et avec douceur (elle donne surtout par le langage indiqué dans ecartGive, alors que ce qui la touche le plus c'est le langage indiqué dans ecartNeed). N'écris JAMAIS que "ce décalage est courant".
- Si receptionShape = multi : dis que plusieurs langages comptent presque autant chez elle, nomme-les ; ne force pas un dominant unique.
- Jamais de chiffre, de %, de score, de note. Jamais de liste à puces.
- Ne recopie pas les libellés de réponses du questionnaire ; parle au niveau des langages ("les mots", "le temps partagé"…).
- Ton : présence calme, premium, chaleureux — jamais mièvre, jamais clinique, jamais "voici ton résultat".
- Varie ta formulation : deux personnes au profil proche ne doivent pas obtenir la même phrase. C'est une pensée qui se forme, pas un gabarit.
- Termine par une touche de progression ressentie (ex. "Ton profil se précise.") sans aucun chiffre.
- Réponds UNIQUEMENT par la réflexion, sans préambule.`;

function buildUserMessage(facts: BreathFacts): string {
  const label = (d: AttentionDim) => DIM_LABELS[d];
  const labelList = (dims: AttentionDim[]) => dims.map(label).join(', ');

  const lines: string[] = [
    `receptionShape: ${facts.receptionShape}`,
    `receptionTop (langages de réception, par importance décroissante): ${labelList(facts.receptionTop)}`,
    `fortE (langages d'expression): ${labelList(facts.fortE)}`,
    `relation: ${facts.relation}`,
  ];

  if (facts.relation === 'ecart' && facts.ecart) {
    lines.push(`ecartGive (ce qu'elle donne surtout): ${label(facts.ecart.ecartGive)}`);
    lines.push(`ecartNeed (ce qui la touche le plus): ${label(facts.ecart.ecartNeed)}`);
  }

  if (facts.shared.length > 0) {
    lines.push(`shared (langages communs réception/expression): ${labelList(facts.shared)}`);
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  const { facts } = await request.json() as { facts: BreathFacts };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(facts) }],
    });

    const text =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : buildFallbackText(facts);

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: buildFallbackText(facts) });
  }
}
