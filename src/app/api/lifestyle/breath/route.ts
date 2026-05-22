import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildLifestyleFallbackText } from "@/lib/lifestyle/breathFacts";
import type { LifestyleBreathFacts } from "@/lib/lifestyle/breathFacts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_STEP4 = `Tu es Candice. Tu écris une courte lecture (2 à 3 phrases, en français, tutoiement) sur ce que cette personne aime vivre — ses goûts, son rapport au standing, à la nourriture, aux expériences.

Règles absolues :
- Jamais de score, %, axe chiffré, catégorie figée, MBTI, diagnostic ou verdict.
- Jamais "voici ton profil", "tu es quelqu'un de", "ton type est".
- Ton : présence calme, premium, chaleureux — jamais mièvre ni clinique. Tutoiement.
- Varie ta formulation. Deux profils similaires ne doivent pas obtenir la même phrase.
- Amorces à privilégier : "Ce qui compte pour toi…", "On devine…", "Quelque chose revient…", "Chez toi…"
- Interdits : jargon, listes à puces, répétition des options.
- Termine par "Ton profil relationnel continue de prendre forme." ou une variante douce.
- Réponds UNIQUEMENT par la lecture, sans préambule ni commentaire.`;

const SYSTEM_PROMPT_STEP5 = `Tu es Candice. Tu écris une courte lecture (2 à 3 phrases, en français, tutoiement) sur ce que cette personne a partagé comme interdits et sensibilités relationnelles. Le ton doit être doux, empathique — cette étape demande du courage.

Règles absolues :
- Jamais de score, %, axe chiffré, catégorie figée, MBTI, diagnostic ou verdict.
- Jamais "voici ton profil", "tu es quelqu'un de", "ton type est".
- Si besoin d'air : nommer que ce n'est pas de la froideur, c'est de l'équilibre.
- Si peur d'être oublié : nommer le besoin de compter vraiment.
- Si anti-surprise : nommer que les bonnes intentions peuvent blesser quand elles tombent à côté.
- Ton : présence calme, chaleureux — jamais mièvre ni clinique. Tutoiement.
- Termine par "Ton portrait relationnel est presque complet." ou une variante douce.
- Réponds UNIQUEMENT par la lecture, sans préambule ni commentaire.`;

const AXIS_LABELS: Record<string, [string, string]> = {
  foodie:                ["faible intérêt alimentaire", "foodie"],
  premiumSimplicite:     ["simplicité", "premium"],
  experienceObjet:       ["objet", "expérience"],
  esthetiqueFonctionnel: ["fonctionnel", "esthétique"],
  aventureConfort:       ["confort", "aventure"],
  authenticiteLuxe:      ["luxe", "authenticité"],
};

function describeAxis(key: string, score: number, intensity: number): string | null {
  if (intensity === 0 || Math.abs(score) < 20) return null;
  const [left, right] = AXIS_LABELS[key] ?? [key, ""];
  const pole = score < 0 ? left : right;
  const strength = Math.abs(score) >= 60 ? "fort" : "modéré";
  return `${pole} (${strength})`;
}

function buildUserMessage(facts: LifestyleBreathFacts): string {
  const lines: string[] = [`Étape : ${facts.step}`];

  const axisDescs: string[] = [];
  const axisEntries: [string, { score: number; intensity: number }][] = [
    ["foodie", facts.foodie],
    ["premiumSimplicite", facts.premiumSimplicite],
    ["experienceObjet", facts.experienceObjet],
    ["esthetiqueFonctionnel", facts.esthetiqueFonctionnel],
    ["aventureConfort", facts.aventureConfort],
    ["authenticiteLuxe", facts.authenticiteLuxe],
  ];
  for (const [key, { score, intensity }] of axisEntries) {
    const desc = describeAxis(key, score, intensity);
    if (desc) axisDescs.push(desc);
  }
  if (axisDescs.length > 0) lines.push(`Goûts : ${axisDescs.join(" · ")}`);

  if (facts.step === 4) {
    const flags: string[] = [];
    if (facts.sensibleMaisFacile) flags.push("PREMIUM_MODERE (exigent mais pas ostentatoire)");
    if (facts.aventureAuthentique) flags.push("AVENTURE_AUTHENTIQUE (exploration + authenticité)");
    if (flags.length > 0) lines.push(`Nuances : ${flags.join(" · ")}`);
  }

  if (facts.step === 5) {
    const filters: string[] = [];
    if (facts.antiSurprisePublique) filters.push("anti-surprise-publique");
    if (facts.antiSurprisePlanning) filters.push("anti-surprise-planning");
    if (facts.antiSurpriseIntime) filters.push("anti-surprise-intime");
    if (facts.exigenceExecution) filters.push("exigence-execution");
    if (facts.ouvertSurprise) filters.push("ouvert-surprise");
    if (facts.besoinEcoute) filters.push("besoin-ecoute");
    if (facts.peurOubli) filters.push("peur-oubli");
    if (facts.besoinAir) filters.push("besoin-air");
    if (facts.sensibiliteCritique) filters.push("sensibilite-critique");
    if (facts.besoinFiabilite) filters.push("besoin-fiabilite");
    if (facts.besoinProfondeur) filters.push("besoin-profondeur");
    if (facts.sensibiliteChargeMetale) filters.push("charge-mentale");
    if (filters.length > 0) lines.push(`Interdits / sensibilités : ${filters.join(" · ")}`);

    const contradictions: string[] = [];
    if (facts.besoinAirEtEcoute) contradictions.push("BESOIN_AIR_ET_ECOUTE (autonomie + besoin de reconnaissance)");
    if (contradictions.length > 0) lines.push(`Contradictions : ${contradictions.join(" · ")}`);

    if (facts.q17Text) lines.push(`Q17 texte libre : "${facts.q17Text.slice(0, 200)}"`);
    if (facts.q17Interdits.length > 0) lines.push(`Interdits extraits : ${facts.q17Interdits.join(", ")}`);
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const { facts } = await request.json() as { facts: LifestyleBreathFacts };

  const systemPrompt = facts.step === 4 ? SYSTEM_PROMPT_STEP4 : SYSTEM_PROMPT_STEP5;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: buildUserMessage(facts) }],
    });

    const text =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : buildLifestyleFallbackText(facts);

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: buildLifestyleFallbackText(facts) });
  }
}
