import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import {
  readSocleTags, readSocleFacts, readContactTags, readContactFacts,
  type AttentionBreathTag, type AttentionRelation, type SocleFact,
  type TagsReadClient, type ContactTagsReadClient,
} from "@/lib/questionnaire/breath-tags";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Respiration CUMULATIVE du socle — alimentée par LE JOURNAL (tous domaines jusqu'ici), jamais les
// réponses brutes ni les axes. Reformule les TAGS produits (AFFECTION/DRIVER/PROFILE/BEHAVIOR…).
//
// ⚠ LA LECTURE DU JOURNAL SE FAIT ICI, CÔTÉ SERVEUR. Elle se faisait auparavant dans le navigateur,
// et le résultat voyageait dans le corps de la requête. Le journal était donc bien lu — mais un
// client modifié pouvait envoyer n'importe quels tags, et Candice affirmait n'importe quoi de la
// personne, avec le ton de quelqu'un qui sait. C'est la même faille que le fil de conversation, où
// le récit venait du client et vidait de son sens la vérification des segments. Ce que Candice
// affirme d'une personne ne peut venir que de ce qu'elle a elle-même écrit dans le journal.
//
// Le corps de la requête ne porte plus que le CADRAGE : de qui on parle, et sous quelle forme.
// Aucune donnée de connaissance n'y transite, dans aucun sens.
const SYSTEM_PROMPT = `Tu es Candice. Tu écris une courte réflexion en français (tutoiement) sur cette personne, à partir de ce que Candice a déjà compris d'elle.

RÈGLE 7a — AUCUN ATTRIBUT SANS PROVENANCE. Tu reformules UNIQUEMENT les tags fournis. Tu ne déduis RIEN des réponses brutes, tu n'ajoutes aucun trait absent des tags. Chaque tag porte sa base (self_report = la personne l'a dit d'elle-même).

RÈGLE 7b — LA PROFONDEUR SUIT LA CONNAISSANCE. Peu de tags → une ou deux phrases, et c'est très bien : droit d'être brève. Beaucoup de tags → tu peux développer, mais sans jamais combler un vide par du générique ou du flatteur. La densité est proportionnelle aux tags, rien de plus.

RÈGLE 7c — RELATIONS. Tu n'énonces QUE la relation FOURNIE dans "relation", jamais une relation que tu remarquerais entre les tags. Tu ne relies pas deux traits de ta propre initiative.

AUTRES RÈGLES :
- Jamais de chiffre, %, score, note, liste à puces.
- Parle au niveau des TRAITS et des LANGAGES, jamais les libellés d'options.
- Ton : présence calme, premium, chaleureux — jamais mièvre, jamais clinique.
- C'est une pensée cumulative qui s'affine ; relie avec sobriété ce que les domaines déjà couverts révèlent, sans inventer.
- Réponds UNIQUEMENT par la réflexion, sans préambule.

Légende (reformule, ne recopie pas) :
AFFECTION_RECEIVE_* = ce qui la touche ; AFFECTION_GIVE_* = comment elle exprime son attention. Modalités : WORDS=les mots · SERVICES=les gestes/l'aide · PERSONALIZED_GIFT=un cadeau pensé · SYMBOLIC_GIFT=un cadeau qui a du sens · QUALITY_TIME=le temps partagé · MICRO_ATTENTIONS=les petites attentions · SURPRISE=la surprise.
PROFILE_* / SOCIAL_ENERGY / IMPORTANCE_* / APPETENCE_* = traits de fonctionnement (reformule le sens du construct, jamais le code). BEHAVIOR = une manière d'agir constatée. DRV_* = un moteur.
value élevé / strength strong = marqué ; value bas / moderate = présent. rank 1 = compte le plus.

FAITS CONCRETS (déclarés par la personne elle-même, provenance la meilleure possible) : tu peux les NOMMER tels quels — « tu fais de la poterie », « tu évites les surprises en public ». INTERDICTION ABSOLUE d'en DÉDUIRE quoi que ce soit : jamais « tu sembles avoir besoin de créer de tes mains », jamais une qualité de caractère, un besoin ou un trait inféré d'un fait. NOMMER, JAMAIS INTERPRÉTER. Un fait n'a pas de mapping derrière lui : l'interpréter violerait la règle 7a.

INFORMATION SENSIBLE — INTERDICTION ABSOLUE DE LA NOMMER : santé, maladie, allergie, intolérance, situation médicale, grossesse, adresse. Même si une telle information t'était fournie, tu ne l'écris JAMAIS dans ta réflexion. Candice la connaît pour agir (écarter un restaurant, par ex.), mais ne la DIT jamais dans un texte : elle ne vit que dans le bloc d'infos pratiques, sous cadenas. (Ces infos sont normalement déjà filtrées en amont ; cette règle est une sécurité de plus.)`;

function buildUserMessage(tags: readonly AttentionBreathTag[]): string {
  return tags
    .map((t) => {
      const parts = [t.construct];
      if (t.rank != null) parts.push(`rang ${t.rank}`);
      if (t.strength) parts.push(t.strength);
      parts.push(`base ${t.basis}`);
      return `- ${parts.join(" · ")}`;
    })
    .join("\n");
}

// MODE 3 (incognito, subject='other') — règle 7d : PERCEPTION, pas vérité, et ne jamais combler les trous.
const MODE3_PROMPT = `\n\nTU PARLES D'UN TIERS, PAS DU PILOTE (règle 7d). Ce sont des PERCEPTIONS rapportées par un proche, pas des vérités. Formule TOUJOURS depuis le point de vue du pilote : « d'après ce que tu sais d'elle », « il te semble que… », « tu la décris comme… ». JAMAIS « elle est », « il a besoin de », aucune affirmation directe sur le tiers. Ne comble JAMAIS un trou : s'il manque quelque chose, « tu ne sais pas encore » est acceptable — n'invente rien pour remplir.`;

// FORME « LIGNES » (fiche, form A) — reformule les tags en courtes lignes thématiques plutôt qu'en prose.
// Mêmes règles 7a–7d ; aucune ligne pour une famille sans tag ; aucun code brut.
const LINES_FORMAT = `\n\nFORMAT : au lieu d'un paragraphe, écris de COURTES LIGNES thématiques, une par thème présent, sous la forme « Thème — reformulation courte des tags ». Exemples de thèmes selon les tags : ce qui la touche, comment elle fonctionne, ce qui compte dans ses choix, ses besoins, sous stress, à éviter, ses préférences, ses centres d'intérêt. Une ligne par thème qui a des tags, jamais de thème vide, jamais de code. Reformule, n'énumère pas les libellés d'options.`;

/** Cadrage reçu du client. AUCUNE connaissance : de qui on parle, et sous quelle forme. */
interface CorpsCadrage {
  readonly subject?: 'self' | 'other';
  readonly contactId?: string;
  readonly format?: 'narrative' | 'lines';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let cadrage: CorpsCadrage = {};
  try { cadrage = (await request.json()) as CorpsCadrage; } catch { cadrage = {}; }
  const { subject, contactId, format } = cadrage;

  // MODE 3 exige un proche NOMMÉ : sans lui, on lirait le journal du pilote en le présentant comme
  // celui d'un tiers — une confusion d'identité, pas une donnée manquante.
  if (subject === 'other' && !contactId) {
    return NextResponse.json({ error: "contactId requis pour subject=other" }, { status: 400 });
  }

  // ── LECTURE DU JOURNAL, CÔTÉ SERVEUR, SOUS L'IDENTITÉ DE LA SESSION.
  //    `readContactTags` filtre sur user_id = session ET about_id = contactId : un contactId
  //    étranger ne renvoie rien plutôt que le journal de quelqu'un d'autre. Le filtre `about` est
  //    obligatoire — sans lui, les traits du pilote et du proche se mélangeraient sous le même user_id.
  let tags: readonly AttentionBreathTag[];
  let relation: AttentionRelation;
  let receiveTop: string | undefined;
  let giveTop: string | undefined;
  let factList: readonly SocleFact[];
  try {
    if (subject === 'other' && contactId) {
      const input = await readContactTags(supabase as unknown as ContactTagsReadClient, user.id, contactId);
      ({ tags, relation, receiveTop, giveTop } = input);
      factList = await readContactFacts(supabase as unknown as ContactTagsReadClient, user.id, contactId);
    } else {
      const input = await readSocleTags(supabase as unknown as TagsReadClient, user.id);
      ({ tags, relation, receiveTop, giveTop } = input);
      factList = await readSocleFacts(supabase as unknown as TagsReadClient, user.id);
    }
  } catch (e) {
    // Journal illisible → pas de respiration. JAMAIS de repli sur les réponses brutes ou les axes :
    // un écran sans respiration est honnête, un écran nourri d'autre chose que le journal ne l'est pas.
    // L'erreur est BRUYANTE dans les logs : `readSocleFacts`/`readSocleTags` lèvent exprès plutôt que
    // de rendre zéro ligne, et avaler ce cri en silence reviendrait à rendre le défaut invisible.
    console.error("[socle/breath] lecture du journal impossible :", e);
    return NextResponse.json({ text: "" });
  }

  if (tags.length === 0 && factList.length === 0) return NextResponse.json({ text: "" });

  const systemPrompt = (subject === 'other' ? SYSTEM_PROMPT + MODE3_PROMPT : SYSTEM_PROMPT) + (format === 'lines' ? LINES_FORMAT : "");
  const relationLine = `relation attention (DÉFINIE par le HSG, la seule autorisée) : ${relation}` +
    (relation === "ecart" ? ` · receiveTop=${receiveTop} · giveTop=${giveTop}` : "");
  // FAITS : déclaration brute, à NOMMER sans interpréter (filtre de visibilité appliqué à la lecture).
  const factsBlock = factList.length > 0
    ? "\n\nFAITS (déclaration brute, à nommer SANS interpréter) :\n" + factList.map((f) => `- ${f.value}`).join("\n")
    : "";
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      // PAS DE PLAFOND DE LONGUEUR (règle verrouillée) : la longueur est une conséquence de la matière, pas
      // un réglage. La profondeur « proportionnelle aux tags » (7b) est portée par le PROMPT, pas par une
      // coupe de jetons. Ceiling large et NON contraignant (l'API exige un max_tokens) — jamais atteint par
      // une réflexion naturelle, donc ne tronque jamais la conclusion.
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: buildUserMessage(tags) + "\n\n" + relationLine + factsBlock }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: "" });
  }
}
