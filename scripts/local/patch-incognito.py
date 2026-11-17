#!/usr/bin/env python3
"""Respiration MODE 3 : la lecture du journal du proche passe côté serveur.

Le client ne transmet plus que l'identité du proche. `/api/socle/breath` lit le journal
sous l'identité de la session, avec le filtre `about_id = contactId` : un contactId
étranger ne renvoie rien, plutôt que le journal de quelqu'un d'autre.

ÉCHOUE FERMÉ : motif attendu exactement une fois, sinon rien n'est écrit.
"""
import pathlib

F = pathlib.Path.home() / "mnt" / "candice" / "src/app/contacts/[id]/questionnaire/IncognitoFlowCanonical.tsx"

AVANT = """    try {
      const { readContactTags, readContactFacts } = await import("@/lib/questionnaire/breath-tags");
      const input = await readContactTags(supabase as never, ownerId, contactId);
      const facts = await readContactFacts(supabase as never, ownerId, contactId);
      const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, facts, subject: "other" }) });"""

APRES = """    try {
      // Le journal du PROCHE est lu côté SERVEUR, sous l'identité de la session et avec le
      // filtre about_id obligatoire. Le corps ne porte que l'identité du proche.
      const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: "other", contactId }) });"""

src = F.read_text(encoding="utf-8")
n = src.count(AVANT)
if n != 1:
    raise SystemExit(f"ÉCHEC — motif attendu {n} fois (1 attendue). Rien n'est écrit.")
F.write_text(src.replace(AVANT, APRES, 1), encoding="utf-8")
print("OK — MODE 3 : plus aucune connaissance dans le corps de la requête.")
