// GARNITURE du profil de test SOPHIE — JOURNAL SEUL (knowledge_*), via les VRAIS modules.
// Crée l'user de test, écrit attention/tempérament/lifestyle (produceSocleAnswer), singularité+q17+pratique
// (produceSocleFact VERBATIM d'abord), puis l'extraction §27 (extractFreeText) APRÈS le verbatim.
// Ne touche PAS my_profile (la fiche/comparatif legacy sont hors périmètre — étapes 4-5).
// Usage : npx tsx scripts/sophie-garnish.mts
import { readFileSync } from "node:fs";

// --- charge .env.local (tsx ne le fait pas) ---
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const { produceSocleAnswer, produceSocleFact } = await import("../src/lib/questionnaire/produce-socle.ts");
const { SINGULARITY_FACT_FIELDS, Q17_FACT_FIELD, PRACTICAL_FACT_FIELDS } = await import("../src/lib/questionnaire/socle-facts-fields.ts");
const { extractFreeText } = await import("../src/lib/knowledge-write/extract-free-text.ts");
const { accountAbout, asUserId } = await import("../src/lib/knowledge/identity.ts");

const EMAIL = "sophie.test.journal@candice.app";
const DISPLAY = "Sophie — COMPTE DE TEST";

const admin = createAdminClient();

// --- user de test : repart propre à chaque garniture (delete cascade knowledge_*), puis recrée ---
async function freshUser(): Promise<string> {
  // trouve un éventuel ancien Sophie
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const existing = data.users.find((u) => u.email === EMAIL);
    if (existing) {
      await admin.auth.admin.deleteUser(existing.id); // cascade ON DELETE sur knowledge_*
      console.log(`[garnish] ancien ${EMAIL} supprimé (${existing.id})`);
      break;
    }
    if (data.users.length < 200) break;
    page++;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL, password: crypto.randomUUID(), email_confirm: true,
    user_metadata: { display_name: DISPLAY, test_account: true },
  });
  if (error) throw error;
  console.log(`[garnish] créé ${EMAIL} → ${data.user.id}`);
  return data.user.id;
}

// Réponses FERMÉES de Sophie (optionRefs canoniques). q1 = classé (ordre = rang).
const Q1_RANKED = ["5", "2", "6"]; // moment de qualité > aide concrète sans demander > petits détails
const CLOSED = [
  "8", "12",            // q2 : écouté(e) / simple mais sincère
  "22", "25",           // q4 : petite attention régulière / mot sincère au bon moment
  "33", "29",           // qe (donne) : temps de qualité / dire ce que je ressens  → ÉCART give≠receive
  "36",                 // q5 : besoin de moments seul(e)
  "42", "41",           // q6 : me retirer / garder pour moi faire bonne figure
  "48", "47",           // q7 : évite le conflit / besoin de temps avant d'en parler
  "53", "56",           // q8 : profondeur / respect de mon rythme
  "59", "61",           // q9 : analyser en profondeur / écrire plutôt que parler
  "66", "62",           // q10 : attends que ce soit clair en moi / analyse pour-contre
  "68", "69",           // q11 : quelques personnes de confiance / par les actes
  "97", "101",          // q4a : anticipe et planifie / charge mentale épuise  ⟂ surprise adorée
  "103", "102", "106",  // q4b : simplicité authentique / qualité discrète / sensible à certaines maisons
  "107",                // q4c : j'aime tout savoir à l'avance  ⟂ surprise adorée (CONTRADICTION closed)
  "113",                // q4d : message écrit
  "77",                 // q13 : des expériences
  "82", "83",           // q14 : objet utile bien pensé / montre qu'on m'a écoutée
  "118", "117",         // q18 : déteste surprise qui change le planning / devant du monde  ⟂ surprise adorée
  "124", "127",         // q19 : être envahie/contrôlée / manque de profondeur
];

// Réponses LIBRES (singularité + q17) — les 8 pièges vivent ici.
const FREE: Record<string, string> = {
  adore_faire: "Lire au lit le dimanche matin. Cuisiner des plats qui mijotent quand j'ai le temps. Marcher seule en ville avec un podcast.",
  evite_deteste: "Les dîners où il faut parler fort pour exister. Qu'on me dise \"détends-toi\". Et je suis cœliaque, je ne peux rien manger qui contienne du gluten — donc les repas-surprise au restaurant, c'est souvent compliqué.",
  sujets_stimulants: "Bof. Je sais pas trop, ça dépend des jours.",
  peu_savent: "Que je relis mes mails trois fois avant de les envoyer, même les plus banals. J'ai l'air sûre de moi mais je doute énormément — je crois que c'est pour ça que je fais ce métier, vérifier les mots des autres me rassure plus que d'écrire les miens.",
  plus_beau_cadeau: "Un week-end surprise que Thomas avait organisé dans le Jura. Il avait absolument tout prévu, je n'ai rien eu à décider.",
  detail_compris: "Qu'on se souvienne d'un truc que j'ai dit en passant, des semaines avant.",
  marques_lieux: "Le thé fumé Lapsang Souchong de chez Dammann Frères. Les librairies indépendantes. La papeterie japonaise.",
  cadeaux_non: "Surtout pas de fleurs coupées — ça me déprime de les regarder faner. Et les bijoux, très peu pour moi.",
  envies_reves: "Apprendre à relier des livres à la main. Repartir au Japon, à Kyoto précisément.",
  remarquer: "Je sais pas trop quoi dire ici, j'aime bien plein de choses.",
  sentir_special: "Qu'on prenne soin de moi sans que j'aie à demander.",
};
const Q17_VALUE = "Qu'on change mes plans à la dernière minute. Qu'on décide à ma place \"pour me faire plaisir\".";
// Pratique minimal (verbatim, non extrait) — allergies laissées VIDES exprès (le gluten est dans le libre).
const PRACTICAL: Record<string, string> = { prenom: "Sophie", age: "34", profession: "Éditrice" };

async function main() {
  const userId = await freshUser();
  const client = admin as unknown as Parameters<typeof produceSocleAnswer>[0];
  const ts = new Date().toISOString();

  // 1) FERMÉES → journal
  const n1 = await produceSocleAnswer(client, { userId, selectedOptionRefs: Q1_RANKED, timestamp: ts, ranked: true });
  const n2 = await produceSocleAnswer(client, { userId, selectedOptionRefs: CLOSED, timestamp: ts });
  console.log(`[garnish] fermées : ${n1 + n2} evidences`);

  // 2) VERBATIM d'abord (autorité) : singularité + q17 + pratique
  const singEntries = Object.entries(FREE).map(([k, value]) => ({ spec: SINGULARITY_FACT_FIELDS[k], value }));
  singEntries.push({ spec: Q17_FACT_FIELD, value: Q17_VALUE });
  const pracEntries = Object.entries(PRACTICAL).map(([k, value]) => ({ spec: PRACTICAL_FACT_FIELDS[k], value }));
  const nf = await produceSocleFact(client, { userId, entries: [...singEntries, ...pracEntries], timestamp: ts });
  console.log(`[garnish] verbatim FACTs : ${nf}`);

  // 3) EXTRACTION §27 APRÈS le verbatim — rédactionnels seulement (singularité + q17), jamais la pratique.
  const about = accountAbout(asUserId(userId));
  const ownerId = asUserId(userId);
  const toExtract = [
    ...Object.entries(FREE).map(([k, value]) => ({ fieldContext: SINGULARITY_FACT_FIELDS[k].questionText, value })),
    { fieldContext: Q17_FACT_FIELD.questionText, value: Q17_VALUE },
  ].filter((e) => e.value.trim());
  for (const e of toExtract) {
    try {
      const r = await extractFreeText(client as never, { about, ownerId, rawText: e.value, fieldContext: e.fieldContext, timestamp: new Date().toISOString() });
      console.log(`[extract] ${e.fieldContext.slice(0, 38).padEnd(38)} → ${r.evidences.length} evidence(s), ${r.openKnowledge.length} open`);
    } catch (err) {
      console.error(`[extract] ÉCHEC ${e.fieldContext} :`, (err as Error).message);
    }
  }

  console.log(`\n[garnish] TERMINÉ. userId=${userId}`);
  console.log(JSON.stringify({ userId }));
}

main().catch((e) => { console.error(e); process.exit(1); });
