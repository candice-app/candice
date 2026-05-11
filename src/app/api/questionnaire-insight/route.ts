import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LABELS: Record<string, Record<string, string>> = {
  love_language: { words: "mots d'affirmation", acts: "actes de service", gifts: "cadeaux", time: "temps de qualité", touch: "toucher physique" },
  communication_style: { direct: "communication directe", emotional: "communication émotionnelle", analytical: "communication analytique", casual: "communication décontractée" },
  stress_response: { withdraws: "se retire", seeks_support: "cherche du soutien", action_oriented: "passe à l'action", internalizes: "intériorise" },
  social_energy: { very_introverted: "très introverti(e)", introverted: "introverti(e)", ambivert: "ambiverti(e)", extroverted: "extraverti(e)", very_extroverted: "très extraverti(e)" },
  appreciation_style: { verbal: "reconnaissance verbale", practical: "aide pratique", gifts: "cadeaux réfléchis", time: "temps dédié", physical: "gestes physiques" },
  conflict_resolution: { direct: "affronte directement", processes_first: "a besoin de temps", avoids: "évite les conflits", humor: "désamorce avec l'humour" },
  decision_making: { logic: "logique et données", intuition: "instinct", consensus: "avis des autres", research: "recherche approfondie" },
  emotional_expression: { openly: "ouvertement", selectively: "sélectivement", through_actions: "par les actes", rarely: "rarement / en privé" },
  core_values: { loyalty: "loyauté et confiance", growth: "croissance personnelle", fun: "fun et expériences", stability: "stabilité et fiabilité" },
  recognition_preference: { public: "reconnaissance publique", private: "reconnaissance privée", personal: "satisfaction personnelle", celebrate: "célébrer ensemble" },
  boundaries: { space: "espace personnel", emotional: "limites émotionnelles", time: "temps et planning", privacy: "vie privée" },
  growth_mindset: { experiences: "nouvelles expériences", structured: "apprentissage structuré", reflective: "réflexion intérieure", community: "apprentissage par les autres" },
  gift_preference: { experiences: "expériences", physical: "cadeaux matériels", both: "les deux" },
};

function humanize(field: string, value: string): string {
  const parts = value.split(",").filter(Boolean);
  return parts.map(v => LABELS[field]?.[v] ?? v).join(", ");
}

export async function POST(request: NextRequest) {
  const { answers, persona, contactName } = await request.json() as {
    answers: Record<string, string>;
    persona: "self" | "contact";
    contactName?: string;
  };

  const filledAnswers = Object.entries(answers)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k} : ${humanize(k, v)}`)
    .join("\n");

  if (!filledAnswers) {
    return NextResponse.json({ insight: "" });
  }

  const subject = persona === "self" ? "cette personne" : (contactName ?? "cette personne");
  const perspective = persona === "self"
    ? "Génère une observation factuelle sur cette personne selon ses réponses."
    : `Génère une observation factuelle sur ${subject} selon ses réponses.`;

  const prompt = `Tu es un expert en psychologie relationnelle. Tu analyses les réponses partielles d'un questionnaire de personnalité.

Réponses renseignées jusqu'ici :
${filledAnswers}

${perspective}

Règles strictes :
- 1 ou 2 phrases maximum, factuel, pas de spéculation émotionnelle
- Commence par "Tu sembles..." ou "${subject.charAt(0).toUpperCase() + subject.slice(1)} semble..." ou "D'après tes réponses..."
- Parle de comportements observables, pas d'émotions supposées
- Réponds uniquement avec le texte de l'insight, sans guillemets ni ponctuation d'encadrement

Exemples du bon registre :
"Tu sembles exprimer ton affection par des gestes concrets plutôt que par les mots."
"Tu as tendance à traiter les conflits en prenant d'abord du recul."
"Tu sembles très sensible à la qualité du temps partagé."`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 120,
    messages: [{ role: "user", content: prompt }],
  });

  const insight = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  return NextResponse.json({ insight });
}
