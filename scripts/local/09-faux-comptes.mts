#!/usr/bin/env -S node --experimental-strip-types
/**
 * DIX FAUX COMPTES, ET CE QU'ILS SERVENT À VÉRIFIER.
 *
 * ⚠ À LANCER PAR ESTELLE, DANS SON TERMINAL. Il CRÉE des comptes et ÉCRIT dans le journal :
 * aucun agent ne lance ça. La clé de service ne quitte pas sa machine et n'est jamais
 * affichée. À utiliser sur la pile LOCALE par défaut ; sur la base réelle, seulement en
 * sachant qu'on y ajoute dix comptes (le script les nomme de façon reconnaissable et sait
 * les supprimer, cf. --nettoyer).
 *
 * CE QUE CES COMPTES MESURENT, ET CE QU'ILS NE MESURENT PAS.
 *
 * Ils mesurent si LA MACHINE extrait correctement. Ils ne mesurent pas si quelqu'un veut
 * Candice : dix faux comptes ne disent rien de l'envie de dix personnes. Les deux questions
 * sont réelles, elles ne se remplacent pas, et il vaut mieux ne pas les confondre.
 *
 * DEUX MOITIÉS, PARCE QUE DEUX CHOSES DIFFÉRENTES SONT EN JEU.
 *
 *  · LES QUESTIONS FERMÉES sont un mapping DÉTERMINISTE : une option cochée écrit toujours
 *    la même chose. Ce qui peut rater, c'est la COUVERTURE — une option dont le mapping est
 *    vide ou absent n'écrit rien, et personne ne le voit. Le script répartit donc les
 *    options sur les dix comptes pour exercer les 130 mappings, et signale ceux qui
 *    n'écrivent rien. Dix profils écrits à la main n'en toucheraient qu'une partie.
 *
 *  · LES RÉPONSES LIBRES passent par un MODÈLE. C'est là que la qualité d'extraction se
 *    joue, et c'est pour ça qu'elles sont écrites à la main : dix voix distinctes, avec des
 *    pièges volontaires — une déclaration catégorique à côté d'une préférence tiède, une
 *    chose aimée pour une raison qui n'est pas celle qu'on croit, un refus exprimé sans le
 *    mot « non ».
 *
 * Usage, dans ton terminal :
 *   npx tsx scripts/local/09-faux-comptes.mts            # crée et remplit
 *   npx tsx scripts/local/09-faux-comptes.mts --nettoyer # supprime les dix
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, et ANTHROPIC_API_KEY
 * pour l'extraction des réponses libres.
 */
import { createClient } from '@supabase/supabase-js';
import { ONBOARDING_MAPPINGS } from '../../src/lib/knowledge/onboarding.ts';

const MARQUE = 'candice-test';
const DOMAINE = 'exemple.invalid';   // RFC 2606 : ne peut JAMAIS être un vrai domaine
const NB = 10;

/* ────────────────────────────────────────────────────────────────────────────
 * LES DIX VOIX. Chacune porte des réponses libres écrites à la main, avec les
 * pièges qu'on veut voir l'extracteur manquer ou réussir.
 * ──────────────────────────────────────────────────────────────────────────── */
interface Voix {
  readonly prenom: string;
  /** Réponses libres : le champ, sa question, et ce qu'elle a écrit. */
  readonly libres: readonly { readonly code: string; readonly question: string; readonly texte: string }[];
  /** Ce qu'on ATTEND de l'extraction, en mots. Sert au rapport, pas à un test automatique :
   *  juger si une extraction est juste demande un œil, et le prétendre automatique serait faux. */
  readonly attendu: readonly string[];
}

export const VOIX: readonly Voix[] = [
  {
    prenom: 'Sophie',
    libres: [
      { code: 'singularity.adore_faire', question: 'Ce que j’adore faire',
        texte: 'Lire au lit le dimanche matin. Cuisiner des plats qui mijotent quand j’ai le temps. Marcher seule en ville avec un podcast.' },
      { code: 'singularity.cadeaux_non', question: 'Les cadeaux que je n’aimerais pas recevoir',
        texte: 'Surtout pas de fleurs coupées — ça me déprime de les regarder faner. Et les bijoux, très peu pour moi.' },
      { code: 'singularity.plus_beau_cadeau', question: 'Le plus beau cadeau ou moment qu’on m’ait offert',
        texte: 'Un week-end surprise que Thomas avait organisé dans le Jura. Il avait absolument tout prévu, je n’ai rien eu à décider.' },
    ],
    attendu: [
      '« surtout pas » et « très peu pour moi » ne doivent PAS sortir à la même intensité',
      'le week-end : ce qui a touché, c’est que tout était prévu — pas la surprise',
      'aucun intérêt ne doit recevoir le degré « passion » : elle dit « j’adore faire », pas son niveau',
    ],
  },
  {
    prenom: 'Camille',
    libres: [
      { code: 'singularity.adore_faire', question: 'Ce que j’adore faire',
        texte: 'Le trail en montagne, vraiment sérieusement — je cours trois fois par semaine et je prépare un 50 km. Et accessoirement je bricole un peu le week-end.' },
      { code: 'singularity.cadeaux_non', question: 'Les cadeaux que je n’aimerais pas recevoir',
        texte: 'Du matériel de sport choisi sans me demander. La taille, la marque, le modèle : ça ne marche jamais.' },
    ],
    attendu: [
      'le trail est clairement plus engagé que le bricolage — l’écart doit se voir',
      'le refus porte sur le CHOIX fait sans elle, pas sur le matériel de sport',
    ],
  },
  {
    prenom: 'Inès',
    libres: [
      { code: 'singularity.marques_lieux', question: 'Les marques, objets ou lieux que j’aime',
        texte: 'Les librairies de quartier. Le thé en vrac, pas en sachet. Rien de clinquant.' },
      { code: 'singularity.evite_deteste', question: 'Ce que j’évite ou déteste',
        texte: 'Les restaurants où il faut crier pour s’entendre.' },
    ],
    attendu: [
      '« rien de clinquant » est une orientation de goût, pas une entité',
      'ce qui gêne est le BRUIT, pas les restaurants',
    ],
  },
  {
    prenom: 'Léa',
    libres: [
      { code: 'singularity.envies_reves', question: 'Mes envies ou rêves du moment',
        texte: 'Apprendre la reliure. Retourner à Kyoto, mais hors saison cette fois.' },
      { code: 'singularity.detail_compris', question: 'Le détail qui me ferait me sentir comprise',
        texte: 'Qu’on remarque quand je suis fatiguée sans que j’aie à le dire.' },
    ],
    attendu: [
      'Kyoto = WANT_TO_VISIT, et « hors saison » est une condition, pas un lieu',
      'le détail n’est pas un intérêt : c’est un besoin d’être vue',
    ],
  },
  {
    prenom: 'Manon',
    libres: [
      { code: 'singularity.adore_faire', question: 'Ce que j’adore faire',
        texte: 'Les brocantes. Je ne cherche rien de précis, j’aime juste fouiller.' },
      { code: 'singularity.cadeaux_non', question: 'Les cadeaux que je n’aimerais pas recevoir',
        texte: 'Tout ce qui prend de la place. Mon appartement est petit.' },
    ],
    attendu: [
      '« je ne cherche rien de précis » interdit d’en déduire une collection',
      'la contrainte est l’ENCOMBREMENT, et sa raison est donnée — ne pas la perdre',
    ],
  },
  {
    prenom: 'Clara',
    libres: [
      { code: 'singularity.sujets_stimulants', question: 'Les sujets qui me stimulent',
        texte: 'L’histoire de l’art, surtout le XIXᵉ. Je suis incollable, c’était mon métier.' },
      { code: 'singularity.marques_lieux', question: 'Les marques, objets ou lieux que j’aime',
        texte: 'Le musée d’Orsay. Les papeteries. Une bonne encre.' },
    ],
    attendu: [
      '« incollable, c’était mon métier » établit un niveau d’expertise réel — rare, à ne pas rater',
      'Orsay est un lieu nommé, les papeteries une catégorie : familles différentes',
    ],
  },
  {
    prenom: 'Nour',
    libres: [
      { code: 'singularity.evite_deteste', question: 'Ce que j’évite ou déteste',
        texte: 'Les dîners qui s’éternisent. Pas les dîners, hein — ceux qui s’éternisent.' },
      { code: 'singularity.remarquer', question: 'Ce que j’aimerais qu’on remarque',
        texte: 'Que je dis souvent oui alors que je pense non.' },
    ],
    attendu: [
      'la précision « pas les dîners » est explicite : aucun rejet des dîners ne doit être écrit',
      'la seconde réponse est un comportement, pas une préférence',
    ],
  },
  {
    prenom: 'Alice',
    libres: [
      { code: 'singularity.adore_faire', question: 'Ce que j’adore faire',
        texte: 'Rien de spécial. Je suis assez casanière.' },
    ],
    attendu: [
      'une réponse pauvre doit produire PEU, pas un intérêt inventé pour remplir',
      '« casanière » n’est pas un intérêt',
    ],
  },
  {
    prenom: 'Jeanne',
    libres: [
      { code: 'singularity.plus_beau_cadeau', question: 'Le plus beau cadeau ou moment qu’on m’ait offert',
        texte: 'Une lettre. Quatre pages. Je l’ai encore.' },
      { code: 'singularity.cadeaux_non', question: 'Les cadeaux que je n’aimerais pas recevoir',
        texte: 'Un bon d’achat. C’est gentil mais ça veut dire qu’on n’a pas cherché.' },
    ],
    attendu: [
      'le moteur est le SENS et l’effort, pas l’objet « lettre »',
      'le refus du bon d’achat porte sa raison : l’absence de recherche',
    ],
  },
  {
    prenom: 'Yasmina',
    libres: [
      { code: 'singularity.sentir_special', question: 'Ce qui me fait me sentir spéciale',
        texte: 'Qu’on se souvienne d’un détail que j’ai dit une seule fois, il y a longtemps.' },
      { code: 'singularity.envies_reves', question: 'Mes envies ou rêves du moment',
        texte: 'Rien pour moi. J’aimerais surtout que mes parents voyagent un peu.' },
    ],
    attendu: [
      '« rien pour moi » n’est pas une envie : ne rien écrire comme désir personnel',
      'le souhait porte sur SES PARENTS — ne pas l’enregistrer comme son envie à elle',
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * LES OPTIONS FERMÉES, RÉPARTIES POUR COUVRIR LES 130 MAPPINGS.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Toutes les options ACTIVES, groupées par question. */
function optionsParQuestion(): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const o of ONBOARDING_MAPPINGS) {
    if (o.status !== 'ACTIF') continue;
    const l = m.get(o.questionCode) ?? [];
    l.push(o.optionRef);
    m.set(o.questionCode, l);
  }
  return m;
}

/**
 * Répartit les options sur `NB` comptes de façon DÉTERMINISTE et EXHAUSTIVE : chaque option
 * active est cochée par au moins un compte. Un tirage au hasard laisserait des mappings
 * jamais exercés, et c'est précisément ce qu'on cherche à éprouver.
 */
export function repartir(): string[][] {
  const parQuestion = optionsParQuestion();
  const comptes: string[][] = Array.from({ length: NB }, () => []);
  // UN DÉCALAGE GLOBAL, pas un compteur par question. En repartant de zéro à chaque
  // question, les options de toutes les questions courtes tombaient sur les premiers
  // comptes, et les derniers restaient VIDES — un compte sans aucune réponse n'éprouve
  // rien, et le script aurait prétendu couvrir les dix. Le décalage continue d'une question
  // à la suivante, ce qui remplit tout le monde tout en restant déterministe.
  let curseur = 0;
  for (const [, refs] of [...parQuestion].sort(([a], [b]) => (a < b ? -1 : 1))) {
    for (const ref of refs) {
      comptes[curseur % NB].push(ref);
      curseur++;
    }
  }
  return comptes;
}

/* ────────────────────────────────────────────────────────────────────────── */

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    console.error('Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(2);
  }
  const hote = new URL(url).host;
  const nettoyer = process.argv.includes('--nettoyer');
  console.log(`base : ${hote}`);
  if (!hote.startsWith('127.0.0.1') && !hote.startsWith('localhost')) {
    // On le DIT, on ne refuse pas : c'est sa base, c'est sa décision. Mais elle doit la
    // prendre en le sachant.
    console.log('⚠ ce n’est pas la pile locale. Dix comptes vont être créés ici.');
  }
  const admin = createClient(url, cle, { auth: { persistSession: false } });

  // ── NETTOYAGE : ne supprime QUE les comptes portant la marque et le domaine réservé.
  if (nettoyer) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(`listUsers : ${error.message}`);
    const cibles = data.users.filter((u) =>
      (u.email ?? '').endsWith(`@${DOMAINE}`) && (u.email ?? '').includes(MARQUE));
    console.log(`comptes de test trouvés : ${cibles.length}`);
    for (const u of cibles) {
      const { error: e } = await admin.auth.admin.deleteUser(u.id);
      console.log(`  ${e ? '✗' : '✓'} ${u.email}${e ? ' — ' + e.message : ''}`);
    }
    return;
  }

  const lots = repartir();
  const total = lots.reduce((a, l) => a + l.length, 0);
  console.log(`\n${VOIX.length} voix · ${total} options actives réparties (chacune cochée au moins une fois)\n`);

  const resultats: { prenom: string; email: string; id: string; options: number; libres: number }[] = [];

  for (let i = 0; i < VOIX.length; i++) {
    const v = VOIX[i];
    const email = `${MARQUE}-${v.prenom.toLowerCase()}@${DOMAINE}`;
    // Le mot de passe est généré ici et n'est JAMAIS affiché : ces comptes ne servent pas à
    // se connecter à la main, et un mot de passe dans un journal de sortie est un mot de
    // passe qui traîne.
    const motDePasse = `T!${globalThis.crypto.randomUUID()}`;

    const { data: cree, error: eCreate } = await admin.auth.admin.createUser({
      email, password: motDePasse, email_confirm: true,
      user_metadata: { prenom: v.prenom, candice_test: true },
    });
    if (eCreate || !cree?.user) {
      console.log(`✗ ${v.prenom} : création impossible — ${eCreate?.message ?? 'inconnue'}`);
      continue;
    }
    const userId = cree.user.id;

    // ── LES ÉCRITURES SE FONT SOUS L'IDENTITÉ DU COMPTE, pas avec la clé de service.
    //    `persist_journal` est SECURITY INVOKER : écrire en service_role échouerait, et
    //    surtout on n'éprouverait pas la RLS — donc pas le chemin réel.
    const commeElle = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? cle,
      { auth: { persistSession: false } });
    const { error: eSignIn } = await commeElle.auth.signInWithPassword({ email, password: motDePasse });
    if (eSignIn) {
      console.log(`✗ ${v.prenom} : connexion impossible — ${eSignIn.message}`);
      continue;
    }

    const { produceSocleAnswer } = await import('../../src/lib/questionnaire/produce-socle.ts');
    const ts = new Date().toISOString();
    let options = 0;
    for (const ref of lots[i]) {
      try {
        options += await produceSocleAnswer(commeElle as never, {
          userId, selectedOptionRefs: [ref], timestamp: ts,
        });
      } catch (e) {
        console.log(`  ✗ option ${ref} : ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // ── LES RÉPONSES LIBRES : verbatim D'ABORD (autorité), extraction ensuite. Jamais
    //    l'inverse — une inférence orpheline affirmerait sans que la phrase existe.
    const { produceSocleFact } = await import('../../src/lib/questionnaire/produce-socle.ts');
    const { extractFreeText } = await import('../../src/lib/knowledge-write/extract-free-text.ts');
    let libres = 0;
    for (const l of v.libres) {
      try {
        await produceSocleFact(commeElle as never, {
          userId,
          entries: [{ spec: { factType: l.code, questionText: l.question }, value: l.texte }],
          timestamp: ts,
        } as never);
        await extractFreeText(commeElle as never, {
          ownerId: userId, about: { kind: 'account', id: userId },
          rawText: l.texte, fieldContext: l.question, questionCode: l.code, timestamp: ts,
        } as never);
        libres++;
      } catch (e) {
        console.log(`  ✗ « ${l.question.slice(0, 32)} » : ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    resultats.push({ prenom: v.prenom, email, id: userId, options, libres });
    console.log(`✓ ${v.prenom.padEnd(9)} ${options} preuve(s) fermée(s) · ${libres}/${v.libres.length} réponse(s) libre(s) · ${userId}`);
  }

  console.log('\n── CE QU’IL FAUT REGARDER MAINTENANT ──\n');
  for (const v of VOIX) {
    const r = resultats.find((x) => x.prenom === v.prenom);
    if (!r) continue;
    console.log(`${v.prenom} (${r.id})`);
    for (const a of v.attendu) console.log(`   · ${a}`);
  }
  console.log('\nPuis, compte par compte :');
  for (const r of resultats) {
    console.log(`  npx tsx scripts/local/08-audit-extraction.mts ${r.id}`);
  }
  console.log('\nPour tout supprimer ensuite :');
  console.log('  npx tsx scripts/local/09-faux-comptes.mts --nettoyer');
}

// Ne s'exécute que lancé directement : importer ce module ne doit créer aucun compte.
const lanceDirectement = process.argv[1]
  && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (lanceDirectement) {
  main().catch((e) => {
    console.error('ÉCHEC :', e instanceof Error ? e.message : String(e));
    process.exit(2);
  });
}
