import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un moteur d'extraction. À partir d'un texte libre décrivant ce qu'il vaut mieux éviter avec une personne, extrais une liste d'interdits relationnels concis (3 à 6 éléments maximum).

Règles :
- Chaque élément = une formulation courte en français (4-8 mots), à la troisième personne : "les surprises publiques", "les annulations de dernière minute", "le bruit excessif", "être ignoré(e)", "les blagues sur son apparence", etc.
- Ne pas répéter les éléments évidents déjà demandés par les questions précédentes.
- Si le texte est vide, flou ou incompréhensible, renvoie un tableau vide.
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour. Exemple : ["les surprises publiques", "les annulations tardives"]`;

export async function POST(request: NextRequest) {
  const { text } = await request.json() as { text: string };

  if (!text || text.trim().length < 5) {
    return NextResponse.json({ interdits: [] });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Texte : "${text.trim()}"` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";

    let interdits: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        interdits = parsed.filter(s => typeof s === "string").slice(0, 6);
      }
    } catch {
      interdits = [];
    }

    return NextResponse.json({ interdits });
  } catch {
    return NextResponse.json({ interdits: [] });
  }
}
