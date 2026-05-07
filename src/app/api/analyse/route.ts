import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { QuestionnaireResponse, MyProfile } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  stress_response: { withdraws: "Se retire", seeks_support: "Cherche du soutien", action_oriented: "Dans l'action", internalizes: "Intériorise" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  conflict_resolution: { direct: "Affronte directement", processes_first: "A besoin de temps", avoids: "Évite", humor: "Humour" },
  decision_making: { logic: "Logique", intuition: "Instinct", consensus: "Avis des autres", research: "Recherche" },
  emotional_expression: { openly: "Ouvertement", selectively: "Sélectivement", through_actions: "Par les actes", rarely: "Rarement" },
  core_values: { loyalty: "Loyauté", growth: "Croissance", fun: "Fun et expériences", stability: "Stabilité" },
  recognition_preference: { public: "Publique", private: "Privée", personal: "Personnelle", celebrate: "Célébrer ensemble" },
  boundaries: { space: "Espace personnel", emotional: "Limites émotionnelles", time: "Temps et planning", privacy: "Vie privée" },
  growth_mindset: { experiences: "Expériences", structured: "Structuré", reflective: "Réflexion", community: "Communauté" },
};

type ProfileLike = Partial<QuestionnaireResponse & MyProfile>;

function describeProfile(p: ProfileLike, role: string): string {
  const lines: string[] = [`PROFIL DE ${role.toUpperCase()} :`];
  const add = (key: keyof ProfileLike, label: string) => {
    const val = p[key] as string | null | undefined;
    if (val) lines.push(`- ${label} : ${LABEL[key as string]?.[val] ?? val}`);
  };
  add("love_language", "Langage d'amour");
  add("communication_style", "Communication");
  add("stress_response", "Réaction au stress");
  add("social_energy", "Énergie sociale");
  add("appreciation_style", "Se sent apprécié(e) par");
  add("conflict_resolution", "Conflits");
  add("decision_making", "Décisions");
  add("emotional_expression", "Émotions");
  add("core_values", "Valeurs");
  add("recognition_preference", "Reconnaissance");
  add("boundaries", "Limites");
  add("growth_mindset", "Croissance");
  if (p.hobbies) lines.push(`- Loisirs : ${p.hobbies}`);
  if (p.things_to_avoid) lines.push(`- À éviter : ${p.things_to_avoid}`);
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await request.json();

  const [{ data: contact }, { data: myProfile }] = await Promise.all([
    supabase
      .from("contacts")
      .select("name, relationship, questionnaire_responses(*)")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("my_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!contact) return NextResponse.json({ error: "Contact introuvable." }, { status: 404 });
  if (!myProfile) return NextResponse.json({ error: "user_profile_missing" }, { status: 400 });

  const contactProfile = contact.questionnaire_responses?.[0];
  if (!contactProfile) return NextResponse.json({ error: "contact_profile_missing" }, { status: 400 });

  const prompt = `Tu es un expert en psychologie relationnelle. Analyse la compatibilité entre deux personnes et génère des conseils actionnables.

${describeProfile(myProfile as ProfileLike, "l'utilisateur")}

${describeProfile(contactProfile as ProfileLike, contact.name)}

Génère une analyse relationnelle complète. Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après :

{
  "compatibility_score": <entier entre 0 et 100>,
  "shared_points": ["<point commun 1>", "<point commun 2>", "<point commun 3>"],
  "difference_zones": [
    { "emoji": "<emoji>", "title": "<titre court>", "description": "<explication actionnable 1-2 phrases>" },
    { "emoji": "<emoji>", "title": "<titre court>", "description": "<explication actionnable 1-2 phrases>" }
  ],
  "communication_tips": ["<conseil 1>", "<conseil 2>", "<conseil 3>"],
  "top_things_to_do": ["<action concrète 1>", "<action concrète 2>", "<action concrète 3>"],
  "things_to_avoid": ["<à éviter 1>", "<à éviter 2>"]
}

Tout en français. Sois concret, bienveillant et actionnable. Le score doit refléter l'alignement réel des valeurs et styles.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "Erreur de génération." }, { status: 500 });

  const analysis = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ analysis, contactName: contact.name });
}
