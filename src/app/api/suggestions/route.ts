import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { QuestionnaireResponse } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  stress_response: { withdraws: "Se retire, a besoin d'espace", seeks_support: "Cherche du soutien", action_oriented: "Devient dans l'action", internalizes: "Intériorise ses émotions" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  conflict_resolution: { direct: "Affronte directement", processes_first: "A besoin de temps", avoids: "Évite les conflits", humor: "Utilise l'humour" },
  decision_making: { logic: "Logique et données", intuition: "Instinct", consensus: "Avis des autres", research: "Recherche approfondie" },
  emotional_expression: { openly: "Très ouvertement", selectively: "Sélectivement", through_actions: "Par les actes", rarely: "Rarement / en privé" },
  core_values: { loyalty: "Loyauté et confiance", growth: "Croissance et apprentissage", fun: "Fun et expériences partagées", stability: "Stabilité et fiabilité" },
  recognition_preference: { public: "Reconnaissance publique", private: "Reconnaissance privée", personal: "Satisfaction personnelle", celebrate: "Célébrer ensemble" },
  boundaries: { space: "Espace personnel et solitude", emotional: "Limites émotionnelles", time: "Temps et planning", privacy: "Vie privée" },
  growth_mindset: { experiences: "Nouvelles expériences", structured: "Apprentissage structuré", reflective: "Réflexion intérieure", community: "Apprentissage par les autres" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux également" },
  best_contact_method: { text: "SMS", call: "Appel téléphonique", email: "E-mail", in_person: "En personne" },
  standing: {
    any_sincere: "Touché(e) par n'importe quelle attention sincère",
    well_chosen: "Préfère quelque chose de bien choisi, même simple",
    quality: "Attend un certain niveau de qualité",
    high_standards: "Standards élevés — remarque tout",
    no_preference: "Pas de préférence particulière",
  },
  gastronomy: {
    anywhere: "Aime manger partout, du kebab à l'étoilé",
    gourmet: "Gourmand(e) — bonne cuisine peu importe le standing",
    fine_dining: "Apprécie les belles tables — cadre et service comptent",
    passion: "La gastronomie est une passion — connaît les chefs et les guides",
    functional: "Mange pour vivre — la nourriture n'est pas un plaisir particulier",
  },
  accommodation: {
    destination_only: "La destination compte, l'hôtel c'est juste pour dormir",
    comfortable: "Hôtel confortable et bien situé — 3-4 étoiles",
    charming: "Charme et authenticité — boutique hôtel, lieu unique",
    luxury: "Luxe et service — 5 étoiles, palace, rien ne doit manquer",
    together: "Pas de préférence — l'important c'est d'être ensemble",
  },
  gift_style: {
    useful: "Objet utile et bien pensé — fonctionnel avant tout",
    listened: "Quelque chose de précis qui montre qu'on l'a écouté(e)",
    beautiful: "Objet beau et de qualité — matières, marques",
    valuable: "Objet de valeur symbolique — bijou, montre, quelque chose qui dure",
    experiences: "Préfère les expériences aux objets",
  },
};

function describe(resp: QuestionnaireResponse): string {
  const lines: string[] = [];
  const add = (key: keyof QuestionnaireResponse, label: string) => {
    const val = resp[key] as string | null;
    if (val) lines.push(`- ${label} : ${LABEL[key]?.[val] ?? val}`);
  };

  lines.push("PROFIL PSYCHOLOGIQUE :");
  add("love_language", "Langage d'amour");
  add("communication_style", "Style de communication");
  add("stress_response", "Réaction au stress");
  add("social_energy", "Énergie sociale");
  add("appreciation_style", "Se sent apprécié(e) par");
  add("conflict_resolution", "Gestion des conflits");
  add("decision_making", "Prise de décision");
  add("emotional_expression", "Expression émotionnelle");
  add("core_values", "Valeurs fondamentales");
  add("recognition_preference", "Préférence de reconnaissance");
  add("boundaries", "Limites importantes");
  add("growth_mindset", "Développement personnel");

  lines.push("\nPRÉFÉRENCES :");
  if (resp.hobbies) lines.push(`- Loisirs : ${resp.hobbies}`);
  if (resp.favorite_foods) lines.push(`- Plats préférés : ${resp.favorite_foods}`);
  add("gift_preference", "Préférence cadeaux (général)");
  add("gift_style", "Style de cadeau matériel");
  add("standing", "Standards / attentes");
  add("gastronomy", "Rapport à la gastronomie");
  add("accommodation", "Préférence hébergement");
  if (resp.conversation_topics) lines.push(`- Adore parler de : ${resp.conversation_topics}`);
  if (resp.things_to_avoid) lines.push(`- À éviter : ${resp.things_to_avoid}`);
  add("best_contact_method", "Meilleur contact via");
  if (resp.important_dates) lines.push(`- Dates importantes : ${resp.important_dates}`);
  if (resp.additional_notes) lines.push(`- Notes : ${resp.additional_notes}`);

  return lines.join("\n");
}

function getQualityConstraints(resp: QuestionnaireResponse): string {
  const rules: string[] = [];

  // Standing → venue quality floor
  if (resp.standing === "high_standards") {
    rules.push("- LIEUX & COMMERCES : uniquement des établissements notés 4,5/5 minimum sur Google. Aucune chaîne, aucune franchise. Propose des adresses indépendantes avec une vraie identité.");
  } else if (resp.standing === "quality") {
    rules.push("- LIEUX & COMMERCES : privilégie des établissements notés 4,5/5 minimum, avec un cadre soigné et un bon service. Évite les chaînes génériques.");
  } else if (resp.standing === "well_chosen") {
    rules.push("- LIEUX & COMMERCES : même simple, l'endroit doit avoir été choisi avec soin — un caractère, une histoire, quelque chose qui montre que tu as réfléchi.");
  }

  // Gastronomy → restaurant tier
  if (resp.gastronomy === "passion") {
    rules.push("- RESTAURANTS : tables gastronomiques ou bistrots de référence uniquement. Chefs reconnus, établissements cités dans les guides (Michelin, Le Fooding, 50 Best). Pas de restaurant ordinaire.");
  } else if (resp.gastronomy === "fine_dining") {
    rules.push("- RESTAURANTS : beaux cadres où le service et le décor comptent autant que l'assiette — restaurants gastronomiques, brasseries premium, terrasses avec vue, lieux architecturalement remarquables.");
  } else if (resp.gastronomy === "anywhere" || resp.gastronomy === "gourmet") {
    rules.push("- RESTAURANTS : tu peux suggérer des adresses décontractées (brasserie, bistrot, street food, ramen) à condition qu'elles soient bien notées : 4,4/5 minimum avec 100+ avis Google.");
  } else if (resp.gastronomy === "functional") {
    rules.push("- RESTAURANTS : garde les suggestions culinaires pratiques et accessibles — la nourriture n'est pas un plaisir central pour cette personne, n'en fais pas le point focal.");
  }

  // Accommodation → hotel tier
  if (resp.accommodation === "luxury") {
    rules.push("- HÉBERGEMENT : uniquement des hôtels 5 étoiles officiels, palaces ou propriétés de prestige reconnues. Rien en dessous du 5 étoiles. Mentionne les services exclusifs si pertinent.");
  } else if (resp.accommodation === "charming") {
    rules.push("- HÉBERGEMENT : boutique hôtels, maisons d'hôtes haut de gamme, lieux avec une histoire ou une architecture remarquable. Évite les grandes chaînes standardisées.");
  } else if (resp.accommodation === "comfortable") {
    rules.push("- HÉBERGEMENT : un bon 3-4 étoiles bien situé convient parfaitement. Privilégie l'emplacement et le confort sur le luxe.");
  }

  // Gift style → physical gift calibration
  if (resp.gift_style === "valuable") {
    rules.push("- CADEAUX MATÉRIELS : oriente vers des objets de valeur durable — bijoux, montre, maroquinerie de qualité, objets signés. L'objet doit avoir une symbolique et se garder longtemps.");
  } else if (resp.gift_style === "beautiful") {
    rules.push("- CADEAUX MATÉRIELS : des objets beaux et bien fabriqués — belles matières, design soigné, marques reconnues pour leur qualité. L'esthétique et le soin de fabrication comptent.");
  } else if (resp.gift_style === "listened") {
    rules.push("- CADEAUX MATÉRIELS : l'objet doit prouver que tu as retenu quelque chose de très précis — une marque qu'il/elle a mentionnée, un produit qu'il/elle regardait, quelque chose d'ultra-spécifique à ses goûts.");
  } else if (resp.gift_style === "useful") {
    rules.push("- CADEAUX MATÉRIELS : fonctionnel et bien pensé — quelque chose qui améliore son quotidien de façon concrète. La praticité prime sur l'esthétique.");
  } else if (resp.gift_style === "experiences") {
    rules.push("- CADEAUX : cette personne préfère nettement les expériences aux objets. Si tu proposes un cadeau matériel, justifie-le fortement. Privilégie les activités, sorties, voyages.");
  }

  if (rules.length === 0) return "";
  return "\n\nCONTRAINTES DE QUALITÉ — à respecter impérativement dans chaque suggestion :\n" + rules.join("\n");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await request.json();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*, questionnaire_responses(*)")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .single();

  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const profile = contact.questionnaire_responses?.[0];
  if (!profile) return NextResponse.json({ error: "No profile data" }, { status: 400 });

  const prompt = `Tu es un conseiller en relations humaines, aidant quelqu'un à montrer une attention sincère et significative à une personne qui lui est chère.

Voici le profil complet de ${contact.name} (${contact.relationship}) :

${describe(profile)}
${getQualityConstraints(profile)}

Génère 6 suggestions d'attention hautement personnalisées pour cette personne. Chaque suggestion doit sembler entièrement sur-mesure — jamais générique. Respecte scrupuleusement les contraintes de qualité ci-dessus si elles sont présentes.

Réponds avec un tableau JSON de exactement 6 objets :
[
  {
    "title": "Titre court de l'action (max 8 mots)",
    "description": "Explication chaleureuse et spécifique expliquant pourquoi cela lui correspond (2-3 phrases)",
    "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
    "timing": "Quand / à quelle fréquence (ex. 'La semaine prochaine', 'Chaque mois', 'Quand il/elle semble stressé(e)')"
  }
]

Toutes les valeurs en français. Suggestions concrètes, actionnables, profondément personnelles. Varie les catégories.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return NextResponse.json({ error: "Failed to parse suggestions" }, { status: 500 });

  const suggestions = JSON.parse(jsonMatch[0]);

  await supabase.from("suggestions").upsert({
    contact_id: contactId,
    user_id: user.id,
    content: suggestions,
    generated_at: new Date().toISOString(),
  }, { onConflict: "contact_id" });

  return NextResponse.json({ suggestions });
}
