#!/usr/bin/env python3
"""LA REPRISE DE SESSION DOIT TROUVER LES QUESTIONS OPEN V3.

DÉFAUT INTRODUIT PAR LE BRANCHEMENT PRÉCÉDENT, et trouvé en relisant ce que la route de
réponse renvoie. `getSessionQuestion` résout la question courante d'une session en
interrogeant `discovery_questions` — l'ANCIENNE table. Un identifiant OPEN V3 n'y existe
pas : la lecture rend `null`, et la session renvoie `{ next: null, done: false }`.

Conséquence concrète : la première question d'une session se posait, la réponse s'écrivait
bien dans le journal, et l'écran se retrouvait sans question suivante ni fin de session.
Une session de six questions s'arrêtait après une, sans message.

CE QU'ON FAIT. La banque OPEN V3 est consultée D'ABORD. L'ancienne table reste interrogée
en second, uniquement pour les sessions déjà en cours au moment du basculement : les
abandonner en silence serait perdre le travail de quelqu'un en plein milieu.

ÉCHOUE FERMÉ : motif attendu exactement une fois.
"""
import pathlib, sys

F = pathlib.Path.home() / "mnt" / "candice" / "src/lib/discovery/engine.ts"
src = F.read_text(encoding="utf-8")

AVANT = """  const currentKey = pendingKeys[idx];
  const { data: q } = await supabase
    .from('discovery_questions')
    .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order, locked_text')
    .eq('question_key', currentKey)
    .maybeSingle();

  if (!q) return null;

  const question = q as DiscoveryQuestion;"""

APRES = """  const currentKey = pendingKeys[idx];

  // ── LA BANQUE OPEN V3 D'ABORD. Elle vit dans le code, pas en base : aucune requête.
  //    `discovery_questions` est l'ancienne table, et un identifiant OPEN V3 n'y existe
  //    pas. Sans ce chemin, une session de six questions s'arrêtait après la première,
  //    sans question suivante ni fin de session.
  const qV3 = questionOpenV3(currentKey);
  let question: DiscoveryQuestion;
  if (qV3) {
    const type = qV3.forme === 'open' ? 'text'
      : qV3.forme === 'single' ? 'chips_single' : 'chips_multi';
    question = {
      id: qV3.id,
      question_key: qV3.id,
      dimension: qV3.branche,
      subdimension: null,
      question_text: qV3.enonce,
      question_type: type,
      options: type === 'text' ? null : qV3.options.map((o) => ({ label: o.libelle, value: cleOptionV3(o) })),
      sort_order: 0,
      locked_text: true, // texte du référentiel, revu — JAMAIS reformulé
    };
  } else {
    // Sessions déjà EN COURS au moment du basculement : on ne les abandonne pas en
    // silence, ce serait perdre le travail de quelqu'un en plein milieu.
    const { data: q } = await supabase
      .from('discovery_questions')
      .select('id, question_key, dimension, subdimension, question_text, question_type, options, sort_order, locked_text')
      .eq('question_key', currentKey)
      .maybeSingle();
    if (!q) return null;
    question = q as DiscoveryQuestion;
  }"""

n = src.count(AVANT)
if n != 1:
    sys.exit(f"ÉCHEC — motif attendu {n} fois (1 attendue). Rien n'est écrit.")
src = src.replace(AVANT, APRES, 1)

IMPORT_AVANT = "export interface QuestionOption { label: string; value: string; }"
IMPORT_APRES = ("import { question as questionOpenV3 } from './open-v3/banque';\n"
                "import { cleOption as cleOptionV3 } from './open-v3/service';\n\n"
                "export interface QuestionOption { label: string; value: string; }")
if src.count(IMPORT_AVANT) != 1:
    sys.exit("ÉCHEC — point d'insertion des imports introuvable.")
src = src.replace(IMPORT_AVANT, IMPORT_APRES, 1)

F.write_text(src, encoding="utf-8")
print("OK — la reprise de session trouve les questions OPEN V3.")
