#!/usr/bin/env python3
"""Respiration ATTENTION : lecture du journal côté serveur, et suppression des routes legacy.

Trois routes de respiration (`/api/attention/breath`, `/api/temperament/breath`,
`/api/lifestyle/breath`) ne lisent PAS le journal : elles reformulent les AXES calculés
depuis les réponses brutes — la sémantique legacy que `breath-tags.ts` interdit
explicitement comme connaissance. Elles ne sont plus atteintes par le parcours (les
drapeaux de `flags.ts` sont forcés `true`), mais elles restent DÉPLOYÉES et appelables :
un point d'entrée qui fait parler Candice d'une personne sans passer par son journal.
C'est l'ÉTAPE 2 annoncée dans `flags.ts` : on les supprime.

ÉCHOUE FERMÉ : chaque motif attendu exactement une fois, sinon rien n'est écrit.
"""
import pathlib, shutil, sys

R = pathlib.Path.home() / "mnt" / "candice"

# ── 1. attention-breath : la lecture passe côté serveur ──────────────────────
ROUTE = R / "src/app/api/socle/attention-breath/route.ts"

AVANT_IMPORT = '''import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AttentionBreathTag, AttentionRelation } from "@/lib/questionnaire/breath-tags";'''
APRES_IMPORT = '''import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { readAttentionTags, type TagsReadClient } from "@/lib/questionnaire/breath-tags";'''

AVANT_POST = '''export async function POST(request: NextRequest) {
  const { tags, tagCount, relation, receiveTop, giveTop } = (await request.json()) as {
    tags: AttentionBreathTag[]; tagCount: number; relation: AttentionRelation; receiveTop?: string; giveTop?: string;
  };
  if (!tags || tags.length === 0) {
    return NextResponse.json({ text: "" }); // 7b : rien à dire → rien (pas de comblement)
  }'''
APRES_POST = '''export async function POST() {
  // ⚠ LE JOURNAL EST LU ICI, CÔTÉ SERVEUR. Il l'était auparavant dans le navigateur, et le
  // résultat voyageait dans le corps de la requête : un client modifié pouvait faire affirmer
  // à Candice n'importe quoi de la personne, avec le ton de quelqu'un qui sait. Ce que Candice
  // affirme ne peut venir que de ce qu'elle a elle-même écrit dans le journal.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let tags, relation, receiveTop, giveTop;
  try {
    ({ tags, relation, receiveTop, giveTop } =
      await readAttentionTags(supabase as unknown as TagsReadClient, user.id));
  } catch (e) {
    // `readAttentionTags` lève exprès plutôt que de rendre zéro tag en silence : on garde le cri
    // dans les logs, et l'écran se passe de respiration plutôt que d'en inventer une.
    console.error("[socle/attention-breath] lecture du journal impossible :", e);
    return NextResponse.json({ text: "" });
  }
  if (tags.length === 0) {
    return NextResponse.json({ text: "" }); // 7b : rien à dire → rien (pas de comblement)
  }'''

src = ROUTE.read_text(encoding="utf-8")
for avant, apres in ((AVANT_IMPORT, APRES_IMPORT), (AVANT_POST, APRES_POST)):
    if src.count(avant) != 1:
        sys.exit(f"ÉCHEC — motif attendu {src.count(avant)} fois dans attention-breath/route.ts (1 attendue). Rien n'est écrit.")
    src = src.replace(avant, apres, 1)
ROUTE.write_text(src, encoding="utf-8")
print("  · attention-breath : lecture du journal côté serveur")

# ── 2. AttentionStep : le client ne lit ni ne transmet plus ──────────────────
STEP = R / "src/components/questionnaire/AttentionStep.tsx"
AVANT_STEP = '''        try {
          const input = await readAttentionTags(supabase as unknown as TagsReadClient, userId);
          const res = await fetch("/api/socle/attention-breath", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });'''
APRES_STEP = '''        try {
          // Le JOURNAL est lu côté SERVEUR : plus aucun tag ne transite par le client.
          const res = await fetch("/api/socle/attention-breath", { method: "POST" });'''
src = STEP.read_text(encoding="utf-8")
if src.count(AVANT_STEP) != 1:
    sys.exit(f"ÉCHEC — motif AttentionStep attendu {src.count(AVANT_STEP)} fois (1 attendue). Rien d'autre n'est écrit.")
STEP.write_text(src.replace(AVANT_STEP, APRES_STEP, 1), encoding="utf-8")
print("  · AttentionStep : plus aucun tag dans le corps de la requête")

# ── 3. Suppression des trois routes qui ne lisent PAS le journal ─────────────
for rel in ("src/app/api/attention/breath", "src/app/api/temperament/breath", "src/app/api/lifestyle/breath"):
    d = R / rel
    if not d.is_dir():
        sys.exit(f"ÉCHEC — {rel} absent : l'état n'est pas celui attendu.")
    shutil.rmtree(d)
    print(f"  · supprimé : {rel} (reformulait les axes legacy, jamais le journal)")

print("OK — toutes les respiration atteignables lisent le HSG, côté serveur.")
