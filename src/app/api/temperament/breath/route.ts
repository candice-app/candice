import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTemperamentFallbackText } from "@/lib/temperament/breathFacts";
import type { TemperamentBreathFacts } from "@/lib/temperament/breathFacts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Axis pole labels for the prompt
const AXIS_LABELS: Record<string, [string, string]> = {
  energieSociale:      ["introversion", "extraversion"],
  espaceProsimite:     ["besoin d’espace/autonomie", "besoin de proximité"],
  spontaneiteControle: ["spontanéité", "besoin de contrôle"],
  communicationStyle:  ["communication directe", "communication indirecte"],
  expressiviteReserve: ["expressivité émotionnelle", "réserve émotionnelle"],
  stabiliteNouveaute:  ["besoin de stabilité", "goût de la nouveauté"],
  rapportTemps:        ["tolérance à l’imprévu", "besoin d’anticipation"],
};

function describeAxis(key: string, score: number, intensity: number): string | null {
  if (intensity === 0 || Math.abs(score) < 20) return null;
  const [left, right] = AXIS_LABELS[key] ?? [key, ''];
  const pole = score < 0 ? left : right;
  const strength = Math.abs(score) >= 60 ? 'fort' : 'modéré';
  return `${pole} (${strength})`;
}

const SYSTEM_PROMPT = `Tu es Candice. Tu écris une courte lecture (2 à 3 phrases, en français, tutoiement) sur la façon dont cette personne fonctionne dans ses relations — son énergie, sa communication, sa façon de gérer le stress ou les désaccords.

Règles absolues :
- Jamais de score, %, axe chiffré, catégorie figée, MBTI, diagnostic ou verdict.
- Jamais "voici ton profil", "tu es quelqu'un de", "ton type est".
- Quand une contradiction apparaît (extravertiBesoinProfondeur, reserveExpressionActes, maturationDecalage…), nomme-la avec douceur — c'est ça qui crée l'effet "on me comprend".
- Ton : présence calme, premium, chaleureux — jamais mièvre ni clinique. Tutoiement.
- Varie ta formulation. Deux profils similaires ne doivent pas obtenir la même phrase.
- Amorces à privilégier : "Tu sembles…", "On devine…", "Quelque chose revient souvent…", "Chez toi…", "Ce qui semble compter pour toi…"
- Interdits : "fort/faible", jargon psy, listes à puces, répétition des options.
- Termine par "Ton profil relationnel continue de prendre forme." ou une variante douce.
- Réponds UNIQUEMENT par la lecture, sans préambule ni commentaire.`;

function buildUserMessage(facts: TemperamentBreathFacts): string {
  const lines: string[] = [`Étape : ${facts.step}`];

  const axisDescs: string[] = [];
  const axisEntries: [string, { score: number; intensity: number }][] = [
    ['energieSociale', facts.energieSociale],
    ['espaceProsimite', facts.espaceProsimite],
    ['spontaneiteControle', facts.spontaneiteControle],
    ['expressiviteReserve', facts.expressiviteReserve],
    ['stabiliteNouveaute', facts.stabiliteNouveaute],
    ['communicationStyle', facts.communicationStyle],
    ['rapportTemps', facts.rapportTemps],
  ];
  for (const [key, { score, intensity }] of axisEntries) {
    const desc = describeAxis(key, score, intensity);
    if (desc) axisDescs.push(desc);
  }
  if (axisDescs.length > 0) lines.push(`Axes : ${axisDescs.join(' · ')}`);

  const modes: string[] = [];
  if (facts.conflitMode)  modes.push(`conflit=${facts.conflitMode}`);
  if (facts.stressMode)   modes.push(`stress=${facts.stressMode}`);
  if (facts.decisionMode) modes.push(`décision=${facts.decisionMode}`);
  if (facts.canalMode)    modes.push(`canal=${facts.canalMode}`);
  if (modes.length > 0)   lines.push(`Modes : ${modes.join(' · ')}`);

  const flags: string[] = [];
  if (facts.extravertiBesoinProfondeur) flags.push('EXTRAVERTI_BESOIN_PROFONDEUR (extraversion forte + expressivité = besoin de lien profond)');
  if (facts.controleStressConvergent)   flags.push('CONTROLE_CONVERGENT (besoin de contrôle fort + stress par le contrôle)');
  if (facts.evitementStabilite)         flags.push('EVITEMENT_STABILITE (évite les conflits + besoin de stabilité)');
  if (facts.reserveExpressionActes)     flags.push('RESERVE_ACTES (réserve forte, exprime par les actes)');
  if (facts.maturationDecalage)         flags.push('MATURATION_TEMPS (décision par maturation + besoin de temps)');
  if (flags.length > 0) lines.push(`Contradictions / nuances : ${flags.join(' · ')}`);

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  const { facts } = await request.json() as { facts: TemperamentBreathFacts };

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
        : buildTemperamentFallbackText(facts);

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: buildTemperamentFallbackText(facts) });
  }
}
