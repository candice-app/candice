// Dump READ-ONLY des options actives du socle classique (pour choisir les réponses fermées de Sophie).
// Aucune écriture. Usage : npx tsx scripts/sophie-dump-options.mts
import { ONBOARDING_MAPPINGS } from "../src/lib/knowledge/onboarding.ts";

const QUESTIONS = ["q1", "q2", "q4", "qe", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q4a", "q4b", "q4c", "q4d", "q12", "q13", "q14", "q18", "q19"];

for (const qc of QUESTIONS) {
  const opts = ONBOARDING_MAPPINGS.filter((m) => m.questionCode === qc && m.status === "ACTIF");
  if (!opts.length) continue;
  const qText = opts[0].questionText;
  const domain = opts[0].domain;
  console.log(`\n### ${qc} — [${domain}] ${qText}`);
  for (const o of opts) {
    console.log(`  ${o.optionRef.padStart(4)} | ${o.optionText}`);
  }
}
