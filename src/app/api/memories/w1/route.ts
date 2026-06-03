import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface W1Analysis {
  nature: "positive" | "negative" | "neutre";
  theme: string;
  urgence: "faible" | "modérée" | "haute" | "critique";
  reformulation: string;
  sensitivity_level: 1 | 2 | 3 | 4;
}

const SYSTEM = `Tu es un assistant qui analyse des confidences relationnelles.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après.

Format :
{
  "nature": "positive" | "negative" | "neutre",
  "theme": "travail" | "santé" | "famille" | "amour" | "personnel" | "autre",
  "urgence": "faible" | "modérée" | "haute" | "critique",
  "reformulation": "reformulation sobre en 1-2 phrases (jamais de texte brut, jamais de jugement, jamais de langage festif si négatif)",
  "sensitivity_level": 1 | 2 | 3 | 4
}

Règles sensitivity_level :
1 = normal (positive ou neutre légère)
2 = sensible (difficulté modérée : stress, dispute, perte légère)
3 = critique (deuil, maladie grave, rupture, burn-out, perte importante)
4 = urgence (idées suicidaires, violence, danger physique immédiat)`;

function deterministicAnalysis(text: string): W1Analysis {
  const t = text.toLowerCase();

  let sensitivity_level: 1 | 2 | 3 | 4 = 1;
  if (/suicid|se faire du mal|mourir|me tuer|en danger|danger immédiat/.test(t))
    sensitivity_level = 4;
  else if (/décès|deuil|mort |mourante|cancer|hospitali|maladie grave|rupture amoureuse|accident grave/.test(t))
    sensitivity_level = 3;
  else if (/burnout|burn.out|déprime|dépression|perdu son travail|licenci|s.est sépar|rupture|anxieux|anxiété|conflit grave/.test(t))
    sensitivity_level = 2;

  let nature: "positive" | "negative" | "neutre" = "neutre";
  if (/promu|fiancé|enceinte|bébé|réussi|succès|mariage|gagné|incroyable|formidable/.test(t))
    nature = "positive";
  else if (/mal |difficile|problème|perdu|triste|déprim|sépar|conflit|blessé|grave|souffre|souffrir/.test(t))
    nature = "negative";

  let theme = "personnel";
  if (/travail|boulot|job|promu|licencié|emploi|collègue|patron|bureau/.test(t)) theme = "travail";
  else if (/santé|maladie|hôpital|médecin|cancer|blessure|opération/.test(t)) theme = "santé";
  else if (/famille|parent|enfant|frère|sœur|mamie|papi|mère|père/.test(t)) theme = "famille";
  else if (/amour|couple|sépar|mariage|fiancé|rupture|chéri|petite amie|petit ami/.test(t)) theme = "amour";

  const urgence: "faible" | "modérée" | "haute" | "critique" =
    sensitivity_level === 4 ? "critique"
    : sensitivity_level === 3 ? "haute"
    : sensitivity_level === 2 || nature === "negative" ? "modérée"
    : "faible";

  const reformulation = text.length > 200
    ? text.slice(0, 200).trimEnd() + "…"
    : text;

  return { nature, theme, urgence, reformulation, sensitivity_level };
}

async function llmAnalysis(text: string): Promise<W1Analysis> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SYSTEM,
    messages: [{ role: "user", content: `Confidence : ${text}` }],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no json");

  const parsed = JSON.parse(m[0]) as W1Analysis;

  const validNatures = ["positive", "negative", "neutre"] as const;
  const validUrgences = ["faible", "modérée", "haute", "critique"] as const;
  const validLevels = [1, 2, 3, 4] as const;

  return {
    nature: validNatures.includes(parsed.nature) ? parsed.nature : "neutre",
    theme: typeof parsed.theme === "string" ? parsed.theme : "personnel",
    urgence: validUrgences.includes(parsed.urgence) ? parsed.urgence : "faible",
    reformulation: typeof parsed.reformulation === "string" && parsed.reformulation.trim()
      ? parsed.reformulation.trim()
      : text.slice(0, 200),
    sensitivity_level: validLevels.includes(parsed.sensitivity_level)
      ? parsed.sensitivity_level
      : 1,
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { contactId, text } = body as { contactId: string; text: string };

  if (!contactId || !text?.trim())
    return NextResponse.json({ error: "contactId et text requis" }, { status: 400 });

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!contact)
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });

  let analysis: W1Analysis;
  try {
    analysis = await llmAnalysis(text.trim());
  } catch {
    analysis = deterministicAnalysis(text.trim());
  }

  const statut = analysis.sensitivity_level >= 3 ? "sensible" : "actif";

  const { data: memory, error: memErr } = await supabase
    .from("memories")
    .insert({
      contact_id: contactId,
      pilot_id: user.id,
      raw_input: text.trim(),
      reformulation: analysis.reformulation,
      nature: analysis.nature,
      theme: analysis.theme,
      urgence: analysis.urgence,
      sensitivity_level: analysis.sensitivity_level,
      statut,
      source: "w1",
    })
    .select("id")
    .single();

  if (memErr || !memory)
    return NextResponse.json({ error: memErr?.message ?? "Insert failed" }, { status: 500 });

  return NextResponse.json({
    memoryId: memory.id,
    reformulation: analysis.reformulation,
    nature: analysis.nature,
    theme: analysis.theme,
    urgence: analysis.urgence,
    sensitivity_level: analysis.sensitivity_level,
  });
}
