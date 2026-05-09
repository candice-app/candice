import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { QuestionnaireResponse } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OCCASION_LABELS: Record<string, string> = {
  birthday: "Anniversaire",
  no_reason: "Sans raison particulière — juste pour faire plaisir",
  reconciliation: "Réconciliation",
  congratulations: "Félicitations",
  return_trip: "Retour de voyage",
  illness: "Maladie / convalescence",
  other: "Occasion spéciale",
};

const BUDGET_LABELS: Record<string, string> = {
  free: "Gratuit (0€)",
  under_30: "Moins de 30€",
  under_80: "Moins de 80€",
  over_80: "Plus de 80€",
};

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct", emotional: "Émotionnel", analytical: "Analytique", casual: "Décontracté" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux" },
  gastronomy: { anywhere: "Mange partout", gourmet: "Gourmand(e)", fine_dining: "Aime les belles tables", passion: "Passionné(e) de gastronomie", functional: "Mange pour vivre" },
  accommodation: { destination_only: "La destination prime", comfortable: "Confortable", charming: "Charme et authenticité", luxury: "Luxe", together: "L'important c'est être ensemble" },
  gift_style: { useful: "Utile", listened: "Montre qu'on a écouté", beautiful: "Beau et de qualité", valuable: "Valeur symbolique", experiences: "Préfère les expériences" },
};

function describeProfile(resp: QuestionnaireResponse, name: string): string {
  const lines: string[] = [`Profil de ${name} :`];
  const add = (key: keyof QuestionnaireResponse, label: string) => {
    const val = resp[key] as string | null;
    if (val) lines.push(`- ${label} : ${LABEL[key]?.[val] ?? val}`);
  };
  if (resp.love_language) add("love_language", "Langage d'amour");
  if (resp.hobbies) lines.push(`- Loisirs : ${resp.hobbies}`);
  if (resp.favorite_foods) lines.push(`- Cuisine préférée : ${resp.favorite_foods}`);
  add("gift_preference", "Cadeaux");
  add("gift_style", "Style de cadeau");
  add("gastronomy", "Rapport à la gastronomie");
  add("accommodation", "Hébergement");
  if (resp.conversation_topics) lines.push(`- Adore parler de : ${resp.conversation_topics}`);
  if (resp.things_to_avoid) lines.push(`- À éviter : ${resp.things_to_avoid}`);
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, occasion, budget } = await request.json();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*, questionnaire_responses(*)")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .single();

  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const profile: QuestionnaireResponse | null = contact.questionnaire_responses?.[0] ?? null;

  const occasionLabel = OCCASION_LABELS[occasion] ?? occasion;
  const budgetLabel = BUDGET_LABELS[budget] ?? budget;

  const profileBlock = profile
    ? describeProfile(profile, contact.name)
    : `Profil de ${contact.name} : pas encore renseigné (${contact.relationship}).`;

  const prompt = `Tu es un conseiller en attentions personnalisées. Aide quelqu'un à trouver une idée parfaite pour un proche.

${profileBlock}

Occasion : ${occasionLabel}
Budget : ${budgetLabel}

Génère 3 suggestions d'attention hautement personnalisées, parfaitement adaptées à l'occasion et au budget indiqués. Chaque suggestion doit être concrète, actionnable et unique — jamais générique.

${budget === "free" ? "CONTRAINTE ABSOLUE : toutes les suggestions doivent être entièrement gratuites. Aucun achat." : ""}
${budget === "under_30" ? "CONTRAINTE ABSOLUE : chaque suggestion doit coûter moins de 30€." : ""}
${budget === "under_80" ? "CONTRAINTE ABSOLUE : chaque suggestion doit coûter moins de 80€." : ""}

Réponds uniquement avec un tableau JSON de 3 objets :
[
  {
    "title": "Titre court (max 7 mots)",
    "description": "Description chaleureuse et personnalisée expliquant pourquoi cette idée est parfaite pour cette personne et cette occasion (2-3 phrases)",
    "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
    "estimated_price": "Gratuit" | "X€" | "X-Y€",
    "why": "Une phrase expliquant le lien avec son profil"
  }
]

Toutes les valeurs en français. Varie les catégories.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return NextResponse.json({ error: "Parse error" }, { status: 500 });

  return NextResponse.json({ suggestions: JSON.parse(jsonMatch[0]) });
}
