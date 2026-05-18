import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContextualSignal, QuestionnaireResponse, MyProfile } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Label maps (mirrors /api/suggestions/route.ts — intentionally kept local) ──

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  stress_response: { withdraws: "Se retire, a besoin d'espace", seeks_support: "Cherche du soutien", action_oriented: "Devient dans l'action", internalizes: "Intériorise" },
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

function describeContact(resp: QuestionnaireResponse): string {
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
  add("gift_preference", "Préférence cadeaux");
  add("gift_style", "Style de cadeau matériel");
  add("standing", "Standards / attentes");
  add("gastronomy", "Rapport à la gastronomie");
  add("accommodation", "Préférence hébergement");
  if (resp.conversation_topics) lines.push(`- Adore parler de : ${resp.conversation_topics}`);
  if (resp.things_to_avoid) lines.push(`- À éviter : ${resp.things_to_avoid}`);
  add("best_contact_method", "Meilleur contact via");

  return lines.join("\n");
}

function getQualityConstraints(resp: QuestionnaireResponse): string {
  const rules: string[] = [];

  if (resp.standing === "high_standards") {
    rules.push("- LIEUX & COMMERCES : uniquement des établissements notés 4,5/5 minimum sur Google. Aucune chaîne, aucune franchise.");
  } else if (resp.standing === "quality") {
    rules.push("- LIEUX & COMMERCES : privilégie des établissements notés 4,5/5 minimum, cadre soigné. Évite les chaînes génériques.");
  } else if (resp.standing === "well_chosen") {
    rules.push("- LIEUX & COMMERCES : l'endroit doit avoir été choisi avec soin — un caractère, une histoire.");
  }

  if (resp.gastronomy === "passion") {
    rules.push("- RESTAURANTS : tables gastronomiques ou bistrots de référence uniquement. Chefs reconnus, guides Michelin ou Fooding.");
  } else if (resp.gastronomy === "fine_dining") {
    rules.push("- RESTAURANTS : beaux cadres où le service et le décor comptent autant que l'assiette.");
  } else if (resp.gastronomy === "anywhere" || resp.gastronomy === "gourmet") {
    rules.push("- RESTAURANTS : adresses décontractées acceptées si 4,4/5 minimum avec 100+ avis Google.");
  } else if (resp.gastronomy === "functional") {
    rules.push("- RESTAURANTS : pratiques et accessibles — la nourriture n'est pas un plaisir central.");
  }

  if (resp.accommodation === "luxury") {
    rules.push("- HÉBERGEMENT : uniquement hôtels 5 étoiles officiels, palaces ou propriétés de prestige.");
  } else if (resp.accommodation === "charming") {
    rules.push("- HÉBERGEMENT : boutique hôtels, maisons d'hôtes haut de gamme, lieux avec une histoire.");
  } else if (resp.accommodation === "comfortable") {
    rules.push("- HÉBERGEMENT : un bon 3-4 étoiles bien situé convient parfaitement.");
  }

  if (resp.gift_style === "valuable") {
    rules.push("- CADEAUX : objets de valeur durable — bijoux, montre, maroquinerie de qualité.");
  } else if (resp.gift_style === "beautiful") {
    rules.push("- CADEAUX : objets beaux et bien fabriqués — belles matières, design soigné, marques reconnues.");
  } else if (resp.gift_style === "listened") {
    rules.push("- CADEAUX : l'objet doit prouver que tu as retenu quelque chose de très précis.");
  } else if (resp.gift_style === "useful") {
    rules.push("- CADEAUX : fonctionnel et bien pensé — quelque chose qui améliore son quotidien.");
  } else if (resp.gift_style === "experiences") {
    rules.push("- CADEAUX : préfère nettement les expériences aux objets. Justifie fortement tout cadeau matériel.");
  }

  if (rules.length === 0) return "";
  return "\n\nCONTRAINTES DE QUALITÉ — respecter impérativement :\n" + rules.join("\n");
}

function getSignalContext(signal: ContextualSignal): string {
  const name = (signal.signal_data.contact_name as string) ?? 'ce proche';
  const dateLabel = signal.signal_data.date_label as string | undefined;
  const daysSince = signal.signal_data.days_since as number | null | undefined;

  const map: Record<string, string> = {
    birthday_d7:        `l'anniversaire de ${name} est dans 7 jours`,
    birthday_d3:        `l'anniversaire de ${name} est dans 3 jours`,
    birthday_d1:        `l'anniversaire de ${name} est demain`,
    birthday_today:     `c'est l'anniversaire de ${name} aujourd'hui`,
    couple_anniversary: `c'est l'anniversaire de votre relation avec ${name}`,
    wedding_anniversary:`c'est votre anniversaire de mariage avec ${name}`,
    mothers_day:        `la Fête des mères approche — l'occasion de faire attention à ${name}`,
    fathers_day:        `la Fête des pères approche — l'occasion de faire attention à ${name}`,
    valentines_day:     `la Saint-Valentin approche avec ${name}`,
    christmas:          `Noël approche — c'est le moment de penser à ${name}`,
    custom_date:        `une date importante pour ${name} approche${dateLabel ? ` : ${dateLabel}` : ''}`,
    silence:            daysSince
      ? `${name} et toi ne vous êtes pas vraiment connectés depuis ${daysSince} jours — c'est le bon moment`
      : `${name} et toi ne vous êtes pas vraiment connectés depuis un moment`,
  };

  return map[signal.signal_type] ?? `une attention pour ${name} est recommandée`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateSuggestionForSignal(
  signal: ContextualSignal,
  supabaseAdmin: SupabaseClient
): Promise<boolean> {
  if (!signal.contact_id) return false;

  const [{ data: contact }, { data: profile }, { data: myProfile }] = await Promise.all([
    supabaseAdmin
      .from('contacts')
      .select('name, relationship')
      .eq('id', signal.contact_id)
      .single(),
    supabaseAdmin
      .from('questionnaire_responses')
      .select('*')
      .eq('contact_id', signal.contact_id)
      .maybeSingle(),
    supabaseAdmin
      .from('my_profile')
      .select('love_language, communication_style, recognition_preference')
      .eq('user_id', signal.user_id)
      .maybeSingle(),
  ]);

  if (!contact) return false;

  const contactDesc = profile ? describeContact(profile as QuestionnaireResponse) : "Profil non encore renseigné.";
  const qualityConstraints = profile ? getQualityConstraints(profile as QuestionnaireResponse) : "";

  const piloteDesc = myProfile
    ? [
        myProfile.love_language ? `- Langage d'amour : ${LABEL.love_language?.[myProfile.love_language] ?? myProfile.love_language}` : null,
        myProfile.communication_style ? `- Style de communication : ${LABEL.communication_style?.[myProfile.communication_style] ?? myProfile.communication_style}` : null,
        myProfile.recognition_preference ? `- Préférence de reconnaissance : ${LABEL.recognition_preference?.[myProfile.recognition_preference] ?? myProfile.recognition_preference}` : null,
      ].filter(Boolean).join("\n")
    : "Non renseigné.";

  const contextLabel = getSignalContext(signal);

  const prompt = `Tu es Candice — un service de conciergerie relationnelle, sobre et adulte. Tu aides quelqu'un à faire attention à ses proches au bon moment.

CONTEXTE : ${contextLabel}.

PROFIL DE ${contact.name} (${contact.relationship}) :
${contactDesc}${qualityConstraints}

PROFIL DU PILOTE (la personne qui offre) :
${piloteDesc}

Génère UNE suggestion d'attention parfaitement adaptée au contexte ci-dessus. Spécifique, actionnelle, mémorisant des détails précis du profil.

Réponds UNIQUEMENT avec ce JSON, sans texte avant ni après :
{
  "title": "Titre court (max 8 mots)",
  "description": "Suggestion concrète et personnalisée (2-3 phrases)",
  "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
  "reasoning": "Une phrase qui commence par 'Parce que' expliquant pourquoi maintenant",
  "estimated_price": "Gratuit" | "X€" | "X-Y€",
  "partner_hint": "Nom du lieu ou prestataire recommandé si pertinent, sinon null"
}

Ton strict : premium, sobre, adulte. Pas de 'petit', 'doux', 'tendre' en excès. Pas de leçon. Inspiré conciergerie.`;

  let parsed: {
    title: string;
    description: string;
    category: string;
    reasoning: string;
    estimated_price: string;
    partner_hint: string | null;
  };

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`[generator] Claude error for signal ${signal.id}:`, err);
    return false;
  }

  const expiresAt = signal.expires_at
    ? signal.expires_at
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString();
      })();

  const { error: insertError } = await supabaseAdmin.from('proactive_suggestions').insert({
    user_id: signal.user_id,
    contact_id: signal.contact_id,
    signal_id: signal.id,
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    reasoning: parsed.reasoning ?? null,
    estimated_price: parsed.estimated_price ?? null,
    partner_hint: parsed.partner_hint ?? null,
    priority: signal.priority,
    status: 'pending',
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error(`[generator] Insert error for signal ${signal.id}:`, insertError.message);
    return false;
  }

  await supabaseAdmin
    .from('contextual_signals')
    .update({ status: 'consumed', consumed_at: new Date().toISOString() })
    .eq('id', signal.id);

  return true;
}
