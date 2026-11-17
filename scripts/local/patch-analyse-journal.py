#!/usr/bin/env python3
"""La page d'analyse finale lit le JOURNAL pour ses entités, au lieu de les ré-extraire.

Supprime le second appel modèle (Haiku) qui relisait les mêmes phrases que l'extraction du
journal, avec un autre schéma, en tronquant à 800 caractères, et sans la polarité — donc en
pouvant afficher parmi les goûts une chose que la personne refuse.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois, sinon rien n'est écrit.
"""
import pathlib, sys, re

F = pathlib.Path.home() / "mnt" / "candice" / "src/lib/profile/generateProfileAnalysis.ts"
src = F.read_text(encoding="utf-8")


def remplacer(avant: str, apres: str, quoi: str):
    global src
    n = src.count(avant)
    if n != 1:
        sys.exit(f"ÉCHEC — {quoi} : motif présent {n} fois (1 attendue). Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
    print(f"  · {quoi}")


# ── 1. Import du lecteur de journal ──────────────────────────────────────────
remplacer(
    'import type { SupabaseClient } from "@supabase/supabase-js";',
    'import type { SupabaseClient } from "@supabase/supabase-js";\n'
    'import { lirePortrait } from "@/lib/knowledge/portrait";\n'
    'import { entitesDuJournal, nbEntites } from "@/lib/profile/entites-du-journal";',
    "import du portrait",
)

# ── 2. Suppression de l'extraction Haiku ─────────────────────────────────────
debut = "// ── Entity extraction via Haiku ───────────────────────────────────────────────"
fin = "// ── Build user message for Sonnet ─────────────────────────────────────────────"
i, j = src.find(debut), src.find(fin)
if i == -1 or j == -1 or j <= i:
    sys.exit("ÉCHEC — bloc extractEntities introuvable. Rien n'est écrit.")
src = src[:i] + """// L'EXTRACTION HAIKU A ÉTÉ SUPPRIMÉE. Elle relisait les champs de singularité que
// l'extraction du journal avait déjà lus — deux modèles, deux schémas, un seul écran. Elle
// tronquait à 800 caractères sans le dire, et nommait les entités sans leur relation : une
// chose refusée pouvait s'afficher parmi les goûts. Les entités viennent désormais du
// journal (src/lib/profile/entites-du-journal.ts), avec leur polarité.

""" + src[j:]
print("  · extraction Haiku supprimée")

# ── 3. L'étape 4 lit le portrait ─────────────────────────────────────────────
remplacer(
    """  // ── 4. Extract entities (Haiku, non-blocking) ─────────────────────────────

  const t4 = Date.now();
  const singularity = (profile.singularity_answers as Record<string, string> | null) ?? null;
  const textFields = singularity
    ? [
        singularity.marques_lieux ?? "",
        singularity.adore_faire ?? "",
        singularity.sujets_stimulants ?? "",
        singularity.envies_reves ?? "",
      ]
    : [];

  const { entities, status: entitiesStatus } = await extractEntities(textFields, correlationId);
  await logStep("entity_extraction", "success", Date.now() - t4, undefined, { count: Object.values(entities).flat().length });""",
    """  // ── 4. Entités : LUES DANS LE JOURNAL, jamais ré-extraites ────────────────

  const t4 = Date.now();
  const singularity = (profile.singularity_answers as Record<string, string> | null) ?? null;

  let entities = { brands: [] as string[], places: [] as string[], hobbies: [] as string[],
                   events: [] as string[], autres: [] as string[], evites: [] as string[] };
  let entitiesStatus: "success" | "fallback" = "fallback";
  try {
    const portrait = await lirePortrait(supabase as never, { userId });
    entities = entitesDuJournal(portrait);
    entitiesStatus = "success";
    await logStep("entity_extraction", "success", Date.now() - t4, undefined,
      { count: nbEntites(entities), evites: entities.evites.length, preuves: portrait.nbPreuves });
  } catch (e) {
    // Journal illisible → aucune entité, et on le DIT. Jamais de repli sur une seconde
    // extraction : une fiche sans puces est honnête, une fiche nourrie d'ailleurs ne l'est pas.
    console.error("[analyse] lecture du journal impossible", correlationId, e);
    await logStep("entity_extraction", "error", Date.now() - t4,
      e instanceof Error ? e.message : String(e));
  }""",
    "étape 4 : entités depuis le journal",
)

# ── 4. La méta ne ment plus sur le modèle utilisé ────────────────────────────
remplacer(
    '      entity_extraction: { status: entitiesStatus, model: "claude-haiku-4-5-20251001" },',
    '      entity_extraction: { status: entitiesStatus, source: "journal", model: null },',
    "méta : plus de modèle pour les entités",
)

F.write_text(src, encoding="utf-8")
print("OK — la page d'analyse ne ré-extrait plus ; elle lit le journal.")
