import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// ── Haiku extraction ──────────────────────────────────────────────────────────

interface SituationExtraction {
  category: string;
  subcategory: string | null;
  tonality: "fragile" | "tendue" | "positive" | "neutre";
  emotional_intensity: "low" | "medium" | "high";
  probable_needs: string[];
}

async function extractSituation(rawText: string): Promise<SituationExtraction> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096, // prose = matière, pas de plafond
    system: `Analyse cette note sur une personne. Retourne uniquement du JSON valide :
{
  "category": "travail|santé|famille|couple|humeur|finances|deuil|autre",
  "subcategory": "string ou null",
  "tonality": "fragile|tendue|positive|neutre",
  "emotional_intensity": "low|medium|high",
  "probable_needs": ["besoin1", "besoin2"]
}
Sois factuel et bienveillant. Pas d'interprétation clinique.`,
    messages: [{ role: "user", content: rawText.slice(0, 500) }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as SituationExtraction;
}

// ── Sonnet reformulation ──────────────────────────────────────────────────────

async function reformulateSituation(
  rawText: string,
  extraction: SituationExtraction,
  contactFirstName: string,
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096, // prose = matière, pas de plafond
    system: `Tu es Candice. Tu reformules une note brute sur un proche en 1-2 phrases douces, jamais alarmistes, jamais médicales, jamais dramatiques.
Ton Candice : bienveillant, humain, nuancé. Utilise le prénom si pertinent. Ne répète pas la note brute.
Retourne uniquement la reformulation (pas de JSON, pas d'explication).`,
    messages: [{
      role: "user",
      content: `Prénom du proche : ${contactFirstName}\nNote : ${rawText}\nTonalité : ${extraction.tonality}\nCatégorie : ${extraction.category}`,
    }],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : rawText;
}

// ── Route ─────────────────────────────────────────────────────────────────────
//
// QUI PEUT PROVOQUER QUOI (correction du 18 nov.).
//   · L'appelant est la personne connectée ; la note est écrite SOUS SON IDENTITÉ, par le
//     client utilisateur, donc sous la RLS (`pilot_id = auth.uid()`).
//   · Le contact visé doit lui APPARTENIR : vérifié en base avant tout appel au modèle. Un
//     identifiant de contact qui n'est pas le sien est traité comme inexistant (404).
//   · La route n'agit sur AUCUN autre compte. Elle acceptait un `contactUserId` venu du
//     navigateur et relançait, avec le client privilégié, la génération de l'analyse de ce
//     compte — sans vérifier le moindre lien. Cette opération est retirée, et pas seulement
//     gardée : la note d'un pilote n'entre pas dans l'analyse que le proche a de lui-même
//     (celle-ci ne lit que les notes dont le proche est l'auteur), elle ne servait donc à
//     rien pour l'utilisateur autorisé. `contactUserId` est ignoré s'il est encore envoyé.
//   · Plus aucun client privilégié dans ce fichier.

/** Borne de la note : au-delà, c'est autre chose qu'une note — et un coût de modèle ouvert. */
const LONGUEUR_MAX = 2000;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { contactId?: unknown; contactFirstName?: unknown; rawText?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "corps illisible" }, { status: 400 }); }

  const contactId = typeof body.contactId === "string" ? body.contactId : "";
  const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";
  if (!contactId || !rawText) {
    return NextResponse.json({ error: "contactId et rawText requis" }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId)) {
    return NextResponse.json({ error: "contactId invalide" }, { status: 400 });
  }
  if (rawText.length > LONGUEUR_MAX) {
    return NextResponse.json({ error: `note trop longue (${LONGUEUR_MAX} caractères au plus)` }, { status: 400 });
  }

  // ── LE LIEN AVEC LA PERSONNE CONCERNÉE, vérifié côté serveur AVANT tout le reste.
  //    Le contact doit appartenir à l'appelant. Le prénom vient de la base, pas du navigateur.
  const { data: contact, error: eContact } = await supabase
    .from("contacts").select("id, name").eq("id", contactId).eq("user_id", user.id).maybeSingle();
  if (eContact) {
    console.error("[memories/situation] lecture du contact impossible", eContact.message);
    return NextResponse.json({ error: "vérification impossible" }, { status: 503 });
  }
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const contactFirstName = String(contact.name ?? "").trim().split(/\s+/)[0] ?? "";

  // Extract (once) then reformulate
  const extraction = await extractSituation(rawText);
  let reformulatedText: string;
  try {
    reformulatedText = await reformulateSituation(rawText, extraction, contactFirstName);
  } catch {
    reformulatedText = rawText;
  }

  const revalidateAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error } = await supabase
    .from("memories")
    .insert({
      pilot_id: user.id,
      contact_id: contactId,
      raw_text: rawText,
      reformulated_text: reformulatedText,
      type: "situation",
      category: extraction.category,
      subcategory: extraction.subcategory ?? null,
      tonality: extraction.tonality,
      emotional_intensity: extraction.emotional_intensity,
      probable_needs: extraction.probable_needs,
      status: "active",
      source: "pilot",
      confidence: 0.8,
      revalidate_at: revalidateAt,
      sanitized_summary: reformulatedText,
      memory_type: "situation",
      sentiment: extraction.tonality,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: inserted?.id });
}
