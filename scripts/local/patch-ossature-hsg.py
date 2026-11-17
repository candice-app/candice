#!/usr/bin/env python3
"""L'ossature de la page d'analyse bascule sur le HSG.

Le radar, les dimensions d'attention et les niveaux « ce qui marche » se calculaient depuis
`my_profile` (temperament_axes, lifestyle_axes, relational_filters, attention_reception) —
la projection legacy, que breath-tags.ts interdit explicitement comme connaissance. Le
journal portait la même matière sous forme canonique. Deux lecteurs, deux vérités possibles
sur le même écran.

Désormais une seule : le portrait. Et une dimension que rien ne fonde vaut `null`, jamais 0 :
l'ancien calcul faisait tomber à zéro ce qu'aucune donnée ne soutenait, donc transformait une
absence en affirmation.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois.
"""
import pathlib, sys

F = pathlib.Path.home() / "mnt" / "candice" / "src/lib/profile/generateProfileAnalysis.ts"
src = F.read_text(encoding="utf-8")


def remplacer(avant, apres, quoi):
    global src
    n = src.count(avant)
    if n != 1:
        sys.exit(f"ÉCHEC — {quoi} : motif présent {n} fois (1 attendue). Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
    print(f"  · {quoi}")


# ── 1. Imports ───────────────────────────────────────────────────────────────
remplacer(
    'import { entitesDuJournal, nbEntites } from "@/lib/profile/entites-du-journal";',
    'import { entitesDuJournal, nbEntites } from "@/lib/profile/entites-du-journal";\n'
    'import { radarDuPortrait, attentionDuPortrait, ceQuiMarcheDuPortrait,\n'
    '         type RadarJournal, type AttentionJournal } from "@/lib/profile/portrait-vers-synthese";',
    "imports du radar journal",
)

# ── 2. Le prompt reçoit le radar du journal, avec ses trous assumés ─────────
remplacer(
    '''  // Style radar (usage interne — informe Claude de la forme du profil sans qu'il l'affiche)
  const r = facts.styleRadar;
  lines.push("── STYLE ATTENTIONNEL (radar 7 axes, usage interne) ──");
  lines.push(`Précision ${r.precision} · Émotion ${r.emotion} · Surprise ${r.surprise} · Esthétique ${r.esthetique} · Utilité ${r.utilite} · Temps ${r.temps} · Discrétion ${r.discretion}`);
  lines.push("");''',
    '''  // STYLE ATTENTIONNEL — dérivé du JOURNAL (usage interne, jamais affiché tel quel).
  // Une dimension ABSENTE n'est PAS un zéro : elle n'est pas déterminée, et le modèle n'a
  // pas le droit d'en parler. C'est la règle 7a appliquée à un nombre plutôt qu'à un mot.
  const etiquettes: Array<[keyof RadarJournal, string]> = [
    ["precision", "Précision"], ["emotion", "Émotion"], ["surprise", "Surprise"],
    ["esthetique", "Esthétique"], ["utilite", "Utilité"], ["temps", "Temps"],
    ["discretion", "Discrétion"],
  ];
  const connues = etiquettes
    .filter(([k]) => radar[k] !== null)
    .map(([k, nom]) => `${nom} ${radar[k]} (${radar.fondeSur[k as keyof typeof radar.fondeSur]} preuve(s))`);
  const inconnues = etiquettes.filter(([k]) => radar[k] === null).map(([, nom]) => nom);
  lines.push("── STYLE ATTENTIONNEL (dérivé du journal, usage interne) ──");
  lines.push(connues.length > 0 ? connues.join(" · ") : "Aucune dimension déterminée.");
  if (inconnues.length > 0) {
    lines.push(`NON DÉTERMINÉES, donc INTERDITES de commentaire (ne rien en dire, ni en bien ni en mal) : ${inconnues.join(", ")}`);
  }
  lines.push("");''',
    "radar du journal dans le prompt",
)

# ── 3. Les dimensions d'attention viennent du journal ───────────────────────
remplacer(
    '''  lines.push("── ATTENTION ──");
  lines.push(`Réception dominante : ${facts.topReceptionDims.join(", ") || "non déterminée"}`);
  lines.push(`Expression naturelle : ${facts.topExpressionDims.join(", ") || "non déterminée"}`);
  lines.push(`Contraste réception/expression : ${facts.hasReceptionExpressionContrast ? "oui" : "non"}`);''',
    '''  lines.push("── ATTENTION (journal) ──");
  lines.push(`Réception dominante : ${attention.recues.join(", ") || "non déterminée"}`);
  lines.push(`Expression naturelle : ${attention.donnees.join(", ") || "non déterminée"}`);
  // `null` = un des deux côtés manque. Répondre « non » affirmerait une congruence qu'on
  // n'a PAS constatée : l'absence de contraste et le contraste absent ne sont pas la même chose.
  lines.push(`Contraste réception/expression : ${attention.contraste === null ? "indéterminable (un côté manque)" : attention.contraste ? "oui" : "non"}`);''',
    "dimensions d'attention depuis le journal",
)

# ── 4. Signature et déstructuration de buildAnalysisPrompt ─────────────────
remplacer(
    "  entities: { brands: string[]; places: string[]; hobbies: string[]; events: string[]; autres: string[]; evites: string[] };\n  gender: Gender;",
    "  entities: { brands: string[]; places: string[]; hobbies: string[]; events: string[]; autres: string[]; evites: string[] };\n"
    "  /** Ossature dérivée du JOURNAL — jamais des axes de my_profile. */\n"
    "  radar: RadarJournal;\n  attention: AttentionJournal;\n  gender: Gender;",
    "signature : radar + attention",
)
remplacer(
    "  const { facts, practicalInfo, singularity, discoveryAnswers, recentMemories, entities, gender } = data;",
    "  const { facts, practicalInfo, singularity, discoveryAnswers, recentMemories, entities, radar, attention, gender } = data;",
    "déstructuration",
)

# ── 5. Lecture unique du portrait, réutilisée partout ──────────────────────
remplacer(
    """  let entities = { brands: [] as string[], places: [] as string[], hobbies: [] as string[],
                   events: [] as string[], autres: [] as string[], evites: [] as string[] };
  let entitiesStatus: "success" | "fallback" = "fallback";
  try {
    const portrait = await lirePortrait(supabase as never, { userId });
    entities = entitesDuJournal(portrait);
    entitiesStatus = "success";""",
    """  let entities = { brands: [] as string[], places: [] as string[], hobbies: [] as string[],
                   events: [] as string[], autres: [] as string[], evites: [] as string[] };
  let entitiesStatus: "success" | "fallback" = "fallback";
  // Une SEULE lecture du portrait pour toute la page : entités, radar, attention, « ce qui
  // marche ». Deux lectures pourraient diverger, et la divergence se verrait à l'écran.
  let radar = radarDuPortrait(PORTRAIT_VIDE);
  let attention = attentionDuPortrait(PORTRAIT_VIDE);
  let ceQuiMarche: ReturnType<typeof ceQuiMarcheDuPortrait> | null = null;
  try {
    const portrait = await lirePortrait(supabase as never, { userId });
    entities = entitesDuJournal(portrait);
    radar = radarDuPortrait(portrait);
    attention = attentionDuPortrait(portrait);
    ceQuiMarche = ceQuiMarcheDuPortrait(portrait);
    entitiesStatus = "success";""",
    "lecture unique du portrait",
)

# ── 6. « Ce qui marche » : du journal, et muet sur ce qu'il ignore ─────────
remplacer(
    """  const worksLevels = computeWorksLevels(
    facts.styleRadar,
    (profile.temperament_axes as Record<string, { score: number; intensity: number }> | null) ?? null,
  );
  const worksLevelsLine = worksLevels
    ? `\\nNIVEAUX « CE QUI MARCHE » (calculés, à respecter tels quels) : ${
        (Object.entries(worksLevels) as Array<[WorksKey, WorksLevel]>)
          .map(([k, v]) => `${k}=${WORKS_LEVEL_LABELS[v]}`).join(" · ")}`
    : "";""",
    """  // NIVEAUX « CE QUI MARCHE » — dérivés du journal. Une clé que rien ne fonde est ABSENTE
  // de la ligne : écrire « faible » pour « on ne sait pas » est précisément la confusion que
  // tout ce lot corrige.
  const etablis = ceQuiMarche
    ? Object.entries(ceQuiMarche).filter(([, v]) => v !== null)
    : [];
  const muettes = ceQuiMarche
    ? Object.entries(ceQuiMarche).filter(([, v]) => v === null).map(([k]) => k)
    : [];
  const worksLevelsLine = etablis.length > 0
    ? `\\nNIVEAUX « CE QUI MARCHE » (dérivés du journal, à respecter tels quels) : ${
        etablis.map(([k, v]) => `${k}=${v}`).join(" · ")}` +
      (muettes.length > 0 ? `\\nNON DÉTERMINÉS, à NE PAS mentionner : ${muettes.join(", ")}` : "")
    : "";""",
    "« ce qui marche » depuis le journal",
)

# ── 7. Passage au prompt ────────────────────────────────────────────────────
remplacer(
    "    recentMemories,\n    entities,\n    gender,\n  }) + worksLevelsLine;",
    "    recentMemories,\n    entities,\n    radar,\n    attention,\n    gender,\n  }) + worksLevelsLine;",
    "passage au prompt",
)

# ── 8. Ce qui est STOCKÉ vient du journal ──────────────────────────────────
remplacer(
    "    style_radar:      facts.styleRadar,",
    "    style_radar:      radar,",
    "style_radar stocké = celui du journal",
)
remplacer(
    """  const dimensionScores: Record<string, number> = {};
  const topDims = [...facts.topReceptionDims, ...facts.topExpressionDims];
  topDims.forEach((dim, i) => {
    dimensionScores[dim] = Math.max(0, 80 - i * 15);
  });""",
    """  // Jauges de la page « Nous » : le classement vient du JOURNAL. Une modalité absente n'y
  // figure pas du tout — elle n'y figure pas à 0, qui se lirait « ça ne lui parle pas ».
  const dimensionScores: Record<string, number> = {};
  [...attention.recues, ...attention.donnees].forEach((dim, i) => {
    dimensionScores[dim] = Math.max(0, 80 - i * 15);
  });""",
    "dimension_scores depuis le journal",
)

# ── 9. Le repli n'invente pas d'ADN d'attention ────────────────────────────
remplacer(
    """      attention_dna: facts.topReceptionDims.slice(0, 3).map((dim, i) => ({
        dimension: dim,
        intensity: i === 0 ? 80 : 50,
        note: "",
      })),""",
    """      attention_dna: attention.recues.slice(0, 3).map((dim, i) => ({
        dimension: dim,
        intensity: i === 0 ? 80 : 50,
        note: "",
      })),""",
    "attention_dna du repli depuis le journal",
)

# ── 10. Un portrait vide nommé, pour l'état « journal illisible » ──────────
remplacer(
    "// ── Main export ────────────────────────────────────────────────────────────────",
    """// Portrait VIDE nommé : l'état d'un journal qu'on n'a pas pu lire. Il rend un radar dont
// toutes les dimensions valent `null` — donc un écran qui se tait, pas un écran qui affirme
// que tout est à zéro. Il n'est JAMAIS un repli sur autre chose que le journal.
const PORTRAIT_VIDE = {
  scope: { about: { kind: "account", id: "" }, ownerId: "" },
  nbPreuves: 0,
  profile: [], interests: [], entities: [], preferences: [], behaviors: [],
  guardrails: [], needs: [], drivers: [], contexts: [],
  affection: {
    receive: Object.fromEntries(AFFECTION_MODALITIES.map((m) => [m, { score: "unknown", evidenceCount: 0, confidence: "none" }])),
    give:    Object.fromEntries(AFFECTION_MODALITIES.map((m) => [m, { score: "unknown", evidenceCount: 0, confidence: "none" }])),
  },
} as never;

// ── Main export ────────────────────────────────────────────────────────────────""",
    "portrait vide nommé",
)
remplacer(
    'import { radarDuPortrait, attentionDuPortrait, ceQuiMarcheDuPortrait,',
    'import { AFFECTION_MODALITIES } from "@/lib/knowledge/vocabulary";\n'
    'import { radarDuPortrait, attentionDuPortrait, ceQuiMarcheDuPortrait,',
    "import des modalités",
)

F.write_text(src, encoding="utf-8")
print("OK — l'ossature de la page d'analyse vient du journal.")
