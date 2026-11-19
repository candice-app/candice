// REJEU PERSISTÉ — les décisions qui n'étaient vérifiées que par des tests du moteur (19 nov., 19h56).
//
// « Rejoue avec persistance et relecture les décisions actuellement vérifiées uniquement par tests
// du moteur : D1, D3, D4, D5, esthétique, CRE-11, flowers.2126 et les séries d'entités autres que
// marque. » Pour chacune : des comptes de test SÉPARÉS sur la base locale ; les réponses ÉCRITES par
// le service que la route appelle, sous la session de la personne (RLS) ; puis l'état RELU dans la
// base (lireEtat), et la décision prise sur cet état relu — jamais sur un état construit à la main.
// D1 et les entités passent par les routes HTTP de l'application.
//
// Le modèle est SIMULÉ (faux modèle, derrière le relais observateur) : on éprouve la plomberie et
// les règles, pas la qualité d'une lecture (scripts 34 et 37 en mode réel).
//
// Usage (pile du conteneur) : . /home/claude/pile/env-local.sh; npx tsx scripts/local/39-rejeu-persiste-decisions.mts
import { compteLocal, pileLocale, verificateur, type CompteLocal } from './_compte-local.mts';
import { cookiesDe, poster, obtenirLot, repondre as repondreHttp } from './_session-http.mts';
import { exigerLocal } from './_garde-locale.mts';

const FAUX = 'http://127.0.0.1:8787', RELAIS = process.env.RELAIS_URL ?? 'http://127.0.0.1:8789';
exigerLocal({ nom: 'RELAIS_URL', url: RELAIS, port: 8789 });
const etatRelais = async () => { const r = await fetch(`${RELAIS}/__etat`); if (!r.ok) throw new Error(`relais illisible ${r.status}`); return r.json() as Promise<{ amont: string; recus: { outil: string | null; statut: number | string | null; systeme: string; messages: { contenu: string }[] }[] }>; };
if ((await etatRelais()).amont !== FAUX) throw new Error('ARRÊT — le relais doit transmettre au faux modèle (:8787)');
const raz = async () => { for (const u of [`${FAUX}/__raz`, `${RELAIS}/__raz`]) { const r = await fetch(u, { method: 'POST', body: '{}' }); if (!r.ok) throw new Error(`remise à zéro impossible : ${u}`); } };
const dicter = async (reponses: unknown[]) => { const r = await fetch(`${FAUX}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) }); if (!r.ok) throw new Error('dictée refusée'); };
await raz();
const { admin } = pileLocale();
const v = verificateur();

const svc = await import('../../src/lib/discovery/open-v3/service.ts');
const { lireEtat } = await import('../../src/lib/discovery/open-v3/etat.ts');
const { motifDExclusion } = await import('../../src/lib/discovery/open-v3/selection.ts');
const { question } = await import('../../src/lib/discovery/open-v3/banque.ts');
const { cleOption } = await import('../../src/lib/discovery/open-v3/cle-option.ts');
const { FAIT_PARAMETRE_DE_PROJET } = svc;

const lu = <T,>(r: { data: T | null; error: { message: string } | null }, quoi: string): T => { if (r.error) throw new Error(`lecture impossible (${quoi}) : ${r.error.message}`); return r.data as T; };
const cles = (id: string, ...l: string[]) => l.map((x) => { const o = question(id)!.options.find((y) => y.libelle === x); if (!o) throw new Error(`${id} : option « ${x} » introuvable`); return cleOption(o); });
let n = 0;
const repondre = (c: CompteLocal, id: string, libelles: string[], plus: Record<string, unknown> = {}) =>
  svc.enregistrerReponseFermee(c.client as never, { userId: c.userId, questionId: id, clesOptions: cles(id, ...libelles), acteId: `rejeu-${++n}`, ...plus });
/** L'état RELU dans la base, puis la décision de la sélection sur cet état. */
const motif = async (c: CompteLocal, id: string) => {
  const { etat, manques } = await lireEtat(c.client as never, { userId: c.userId });
  if (manques && manques.length > 0) throw new Error(`état incomplet pour ${c.email} : ${JSON.stringify(manques)}`);
  return motifDExclusion(question(id)!, etat);
};
const sujet = (c: CompteLocal, branche: string) => svc.declarerSujet(c.client as never, { userId: c.userId, branche, choisi: true });
const admissible = async (c: CompteLocal, id: string, attendu: boolean, libelle: string) => {
  const m = await motif(c, id);
  v.verifier(attendu ? m === null : m !== null, `${libelle} → ${id} ${attendu ? 'ADMISSIBLE' : 'fermée'}`, String(m));
};

// ═══ D3 — HÔTELLERIE ═══
console.log('\n═══ D3 — hôtellerie : exploration générale ≠ préparation (relu en base) ═══');
{
  const h1 = await compteLocal('rejeu-d3-dormir'); await sujet(h1, 'travel2');
  await admissible(h1, 'travel2.0915', true, 'D3.1 voyage choisi');
  await repondre(h1, 'travel2.0915', ['Est principalement un endroit où dormir']);
  await admissible(h1, 'travel2.0916', false, 'D3.2 « un endroit où dormir » ne dit pas un goût');
  await admissible(h1, 'travel2.0919', true, 'D3.3 … mais ne dit pas l’absence de besoins pratiques');
  const h2 = await compteLocal('rejeu-d3-gout'); await sujet(h2, 'travel2');
  await repondre(h2, 'travel2.0915', ['Compte beaucoup']);
  await admissible(h2, 'travel2.0916', true, 'D3.4 « Compte beaucoup » : le goût');
  await admissible(h2, 'travel2.0923', false, 'D3.5 goût au niveau A');
  await repondre(h2, 'travel2.0916', ['Maison d’hôtes']); await repondre(h2, 'travel2.0919', ['Le bruit']);
  await admissible(h2, 'travel2.0923', true, 'D3.6 goût au niveau B (3 réponses relues)');
  const h3 = await compteLocal('rejeu-d3-sejour');
  await svc.ouvrirProjet(h3.client as never, { userId: h3.userId, type: 'sejour', branche: 'travel2', objet: 'Trois jours à Porto' });
  await admissible(h3, 'travel2.0919', true, 'D3.7 séjour en préparation : besoin pratique');
  await admissible(h3, 'travel2.0923', false, 'D3.8 séjour en préparation SEUL : un goût général non déclaré reste fermé');
}

// ═══ D4 — CÉRAMIQUE, TALONS ═══
console.log('\n═══ D4 — signal correspondant au présupposé (relu en base) ═══');
{
  const c1 = await compteLocal('rejeu-d4-peinture'); await sujet(c1, 'craft');
  await repondre(c1, 'craft.0615', ['Peinture']);
  await admissible(c1, 'CRE-15', false, 'D4.1 un attrait pour la peinture ne présume pas la céramique');
  const c2 = await compteLocal('rejeu-d4-ceramique'); await sujet(c2, 'craft');
  await repondre(c2, 'craft.0615', ['Céramique ou poterie']);
  await admissible(c2, 'CRE-15', true, 'D4.2 « Céramique ou poterie »');
  await admissible(c2, 'CRE-16', false, 'D4.3 la céramique sans l’envie de pratiquer');
  await repondre(c2, 'craft.0614', ['J’aimerais apprendre ou reprendre une pratique']);
  await admissible(c2, 'CRE-16', true, 'D4.4 céramique ET envie de pratiquer');
  // CHS-13 est de niveau C : la règle générale exige un achat en préparation dans le domaine.
  const achat = (c: CompteLocal) => svc.ouvrirProjet(c.client as never, { userId: c.userId, type: 'achat', branche: question('CHS-13')!.branche, objet: 'Des bottines pour l’hiver' });
  const s1 = await compteLocal('rejeu-d4-plateforme'); await sujet(s1, 'shoes'); await achat(s1);
  await repondre(s1, 'shoes.0341', ['Une plateforme']);
  await admissible(s1, 'CHS-13', false, 'D4.5 achat en préparation, mais « Une plateforme » ne dit pas un talon');
  const s2 = await compteLocal('rejeu-d4-talon'); await sujet(s2, 'shoes');
  await repondre(s2, 'shoes.0341', ['Un talon haut']);
  await admissible(s2, 'CHS-13', false, 'D4.6 « Un talon haut » sans achat en préparation (niveau C)');
  await achat(s2);
  await admissible(s2, 'CHS-13', true, 'D4.7 « Un talon haut » ET un achat en préparation');
}

// ═══ CRE-11 — préférence de lieu, et non plus fait de pratique ═══
console.log('\n═══ CRE-11 — décision 2 (18h54) + D4 (écrit, puis relu en base) ═══');
{
  const r1 = await compteLocal('rejeu-cre11-regarde'); await sujet(r1, 'craft');
  await repondre(r1, 'craft.0614', ['J’aime surtout regarder et découvrir']);
  await admissible(r1, 'CRE-11', false, 'CRE-11.1 « regarder et découvrir » ne présume pas la pratique');
  const r2 = await compteLocal('rejeu-cre11-pratique'); await sujet(r2, 'craft');
  await repondre(r2, 'craft.0614', ['Je pratique moi-même une ou plusieurs activités créatives']);
  await admissible(r2, 'CRE-11', true, 'CRE-11.2 pratique déclarée');
  const avantFaits = (lu(await r2.client.from('knowledge_facts').select('id').eq('user_id', r2.userId), 'faits') as unknown[]).length;
  const rep = await repondre(r2, 'CRE-11', ['Chez moi', 'En extérieur', 'En cours']);
  const ev = lu(await r2.client.from('knowledge_evidences').select('target_family, target_construct, preference_value, polarity, assertion_status').eq('source_id', rep.sourceId), 'preuves de CRE-11') as { target_family: string; target_construct: string; preference_value: string | null; polarity: string | null }[];
  const faits = lu(await r2.client.from('knowledge_facts').select('fact_type').eq('user_id', r2.userId), 'faits') as { fact_type: string }[];
  console.log('     écrit :', JSON.stringify(ev.map((e) => `${e.target_family}:${e.target_construct}=${e.preference_value}`)));
  v.verifier(ev.some((e) => e.target_family === 'PREFERENCE' && /usage_context/.test(e.target_construct) && e.preference_value === 'lieu_de_pratique_prefere=chez_soi') && ev.some((e) => e.preference_value === 'lieu_de_pratique_prefere=en_exterieur'),
    'CRE-11.3 « Chez moi », « En extérieur » : écrits comme PRÉFÉRENCE de lieu (usage_context), relus');
  v.verifier(!ev.some((e) => e.target_family === 'BEHAVIOR') && !faits.slice(avantFaits).some((f) => /practice|pratique/.test(f.fact_type)),
    'CRE-11.4 aucun FAIT ni comportement de pratique n’est écrit');
  v.verifier(ev.some((e) => /facilitator/.test(e.target_construct) && e.preference_value === 'cadre=cours_encadre'), 'CRE-11.5 les autres dimensions restent (accompagnement : « En cours ») — aucun choix unique global');
  await admissible(r2, 'craft.0623', false, 'CRE-11.6 équivalence déclarée : l’ancienne génération n’est pas reposée');
}

// ═══ D5 — ESTHÉTIQUE ═══
console.log('\n═══ D5 — esthétique : après la question approfondie, sur une réponse qui le rend pertinent ═══');
{
  const base = async (nom: string) => { const c = await compteLocal(nom); await sujet(c, 'aesthetic'); return c; };
  const e1 = await base('rejeu-d5-oui');
  await repondre(e1, 'aesthetic.1956', ['Les traces du temps']); await repondre(e1, 'aesthetic.1953', [question('aesthetic.1953')!.options[0].libelle]);
  await repondre(e1, 'aesthetic.1965', ['Oui, énormément']);
  await admissible(e1, 'aesthetic.1966', true, 'D5.1 niveau B relu ET « Oui, énormément »');
  const e2 = await base('rejeu-d5-jamais');
  await repondre(e2, 'aesthetic.1956', ['Les traces du temps']); await repondre(e2, 'aesthetic.1953', [question('aesthetic.1953')!.options[0].libelle]);
  await repondre(e2, 'aesthetic.1965', ['Je n’y ai jamais vraiment pensé']);
  await admissible(e2, 'aesthetic.1966', false, 'D5.2 « jamais pensé » ne rend pas l’approfondissement pertinent');
  const e3 = await base('rejeu-d5-depend');
  await repondre(e3, 'aesthetic.1956', ['Cela dépend de l’histoire de l’objet']); await repondre(e3, 'aesthetic.1953', [question('aesthetic.1953')!.options[0].libelle]);
  await repondre(e3, 'aesthetic.1965', ['Oui, dans l’ensemble']);
  await admissible(e3, 'aesthetic.1968', false, 'D5.3 une condition (« Cela dépend ») n’ouvre pas la suite');
  await admissible(e1, 'aesthetic.1968', true, 'D5.4 « Les traces du temps » l’ouvre');
  const e4 = await base('rejeu-d5-passee');
  await repondre(e4, 'aesthetic.1956', ['Les traces du temps']); await repondre(e4, 'aesthetic.1953', [question('aesthetic.1953')!.options[0].libelle]);
  await repondre(e4, 'aesthetic.1965', ['Oui, énormément']);   // niveau B : aesthetic.1961 devient servable
  // « Passer » : par la route, sur le lot que le serveur propose (les autres questions servies sont passées aussi).
  const ck = await cookiesDe(e4.email, e4.motDePasse);
  let lot = await obtenirLot(ck, 'full'), q = lot?.question, jeton = lot?.jeton, passee = false;
  for (let i = 0; i < 60 && q && !passee; i++) {
    const r = await repondreHttp(ck, { jeton, questionKey: q.question_key, skip: true });
    if (r.status !== 200) throw new Error(`passer ${q.question_key} : HTTP ${r.status} ${r.motif}`);
    passee = q.question_key === 'aesthetic.1961';
    q = r.next?.question; jeton = r.next?.jeton ?? jeton;
    if (!q && !passee) { lot = await obtenirLot(ck, 'full'); q = lot?.question; jeton = lot?.jeton; }
  }
  v.verifier(passee, 'D5.5a aesthetic.1961 servie par le serveur, puis passée par la route (HTTP 200)');
  await admissible(e4, 'aesthetic.1969', false, 'D5.5 une question passée (aucune réponse) n’ouvre rien');
  await repondre(e1, 'aesthetic.1961', [question('aesthetic.1961')!.options[0].libelle]);
  await admissible(e1, 'aesthetic.1969', true, 'D5.6 contre-épreuve : 1961 répondue l’ouvre');
}

// ═══ flowers.2126 — paramètres de la préparation ═══
console.log('\n═══ flowers.2126 — soutien et réconfort : des paramètres de la préparation ═══');
{
  const f = await compteLocal('rejeu-fleurs');
  const { projet } = await svc.ouvrirProjet(f.client as never, { userId: f.userId, type: 'cadeau', branche: 'flowers', objet: 'Des fleurs pour Inès' });
  const rep = await repondre(f, 'flowers.2126', ['Du soutien'], { projet });
  const ev = lu(await f.client.from('knowledge_evidences').select('id').eq('source_id', rep.sourceId), 'preuves') as unknown[];
  const fa = lu(await f.client.from('knowledge_facts').select('fact_type, value, context').eq('source', rep.sourceId), 'faits') as { fact_type: string; value: string; context: string }[];
  console.log('     écrit :', JSON.stringify(fa.map((x) => ({ type: x.fact_type, contexte: x.context }))));
  v.verifier(ev.length === 0, 'F.1 aucune preuve sur la personne (ni besoin, ni émotion)');
  v.verifier(fa.length === 1 && (!FAIT_PARAMETRE_DE_PROJET || fa[0].fact_type === FAIT_PARAMETRE_DE_PROJET) && JSON.parse(fa[0].value).projet === projet.id && JSON.parse(fa[0].value).libelle === 'Du soutien',
    'F.2 un paramètre DU PROJET (« Du soutien »), rattaché à ce projet, relu en base', JSON.stringify(fa));
  const sansProjet = await compteLocal('rejeu-fleurs-sans-projet'); await sujet(sansProjet, 'flowers');
  await admissible(sansProjet, 'flowers.2126', false, 'F.3 sans préparation en cours');
}

// ═══ D1 — les garde-fous qualifient l'idée, par la route, relus en base ═══
console.log('\n═══ D1 — qualification des idées : par la route de génération, relue en base ═══');
{
  const P = await compteLocal('rejeu-d1-pilote'), B = await compteLocal('rejeu-d1-proche');
  const k = lu(await P.client.from('contacts').insert({ user_id: P.userId, name: 'Proche D1', relationship: 'friend', proche_user_id: B.userId }).select('id').single(), 'fiche') as { id: string };
  await repondre(B, 'CHS-01', ['Je préfère qu’on ne m’offre pas de chaussures']);
  const cB = await cookiesDe(B.email, B.motDePasse), cP = await cookiesDe(P.email, P.motDePasse);
  const acc = await poster('/api/consent/exclusions', cB, { contactId: k.id, action: 'autoriser', portee: 'reco_exclusions' });
  v.verifier(acc.status === 200, 'D1.1 B autorise que ses refus écartent des idées (HTTP 200)', `HTTP ${acc.status}`);
  await raz();
  await dicter([
    { __texte: JSON.stringify([
      { title: 'Une paire de baskets en toile', justification: 'Des baskets légères pour l’été.', dim: 'CAD_C', canal: 'cadeau', intensite: 'legere', declencheur: 'x' },
      { title: 'Un livre de cuisine japonaise', justification: 'Un beau livre de recettes.', dim: 'CAD_C', canal: 'cadeau', intensite: 'legere', declencheur: 'x' }]) },
    { idees: [{ domaines: { valeurs: ['shoe'], etat: 'etabli' }, universelles: {} }, { domaines: { valeurs: ['reading'], etat: 'etabli' }, universelles: {} }] },
    { idees: [{}, {}] },
  ]);
  const g = await poster('/api/recommendations/generate', cP, { contactId: k.id });
  v.verifier(g.status === 200, 'D1.2 génération (HTTP 200)', `HTTP ${g.status} ${g.texte.slice(0, 160)}`);
  const recus = (await etatRelais()).recus;
  v.verifier(recus.length >= 2 && recus.every((t) => t.statut === 200), 'D1.3 génération puis qualification parties au modèle, toutes en 200', JSON.stringify(recus.map((t) => [t.outil, t.statut])));
  const qualif = recus.filter((t) => t.outil === 'descriptions');
  v.verifier(qualif.length >= 1 && qualif.every((t) => !/chaussures|offre pas/i.test(t.systeme + t.messages.map((m) => m.contenu).join(' '))), 'D1.4 ce que reçoit le qualificateur ne contient AUCUN refus de B (observé au relais)');
  const r = lu(await P.client.from('contact_recommendations').select('ideas, portees_proche').eq('contact_id', k.id).maybeSingle(), 'recommandation') as { ideas: { title: string; compatibilite?: string }[]; portees_proche: string[] } | null;
  console.log('     relu :', JSON.stringify(r?.ideas.map((i) => [i.title, i.compatibilite])));
  const ib = r?.ideas.findIndex((i) => /baskets/.test(i.title)) ?? -1, il = r?.ideas.findIndex((i) => /livre/.test(i.title)) ?? -1;
  v.verifier(ib > il && il >= 0 && r!.ideas[ib].compatibilite === 'retrogradee' && r!.ideas[il].compatibilite === 'compatible_verifiee',
    'D1.5 relu en base : les baskets RÉTROGRADÉES derrière le livre (refus SOFT), le livre compatible vérifié');
  v.verifier(!!r && r.portees_proche.includes('reco_exclusions'), 'D1.6 la recommandation porte sa provenance (reco_exclusions)');
}

// ═══ D9 — séries d'entités autres que « marque » ═══
console.log('\n═══ D9 — destination, lieu, entité (créateur), activité : relation présumée, persistance par entité ═══');
{
  const recit = async (nom: string, texte: string, unite: Record<string, unknown>) => {
    const c = await compteLocal(nom); const ck = await cookiesDe(c.email, c.motDePasse);
    await raz(); await dicter([{ units: [{ family: 'ENTITY', cible: 'referent', ...unite }] }]);
    const r = await poster('/api/discovery/recit', ck, { texte });
    if (r.status !== 200) throw new Error(`récit refusé : HTTP ${r.status} ${r.texte.slice(0, 160)}`);
    const { etat } = await lireEtat(c.client as never, { userId: c.userId });
    return { c, carte: etat.entiteParQuestion ?? new Map() };
  };
  const a = await recit('rejeu-d9-japon', 'J’aimerais aller au Japon.', { label: 'Japon', entityType: 'destination', relation: 'WANT_TO_VISIT' });
  v.verifier(a.carte.has('destination.0287') && a.carte.has('destination.0286'), 'D9.1 « aller au Japon » (WANT_TO_VISIT) ouvre « tu aimerais y aller pour… » (0287) et « ce qui t’attire » (0286)', JSON.stringify([...a.carte.keys()]));
  const b = await recit('rejeu-d9-lisbonne', 'J’adore Lisbonne.', { label: 'Lisbonne', entityType: 'destination', relation: 'LOVE' });
  v.verifier(b.carte.has('destination.0286') && !b.carte.has('destination.0287'), 'D9.2 aimer Lisbonne n’est pas vouloir y aller : 0286 oui, 0287 non', JSON.stringify([...b.carte.keys()]));
  const c = await recit('rejeu-d9-flore', 'J’adore le Café de Flore.', { label: 'Café de Flore', entityType: 'place', relation: 'LOVE' });
  v.verifier(c.carte.has('place.0273') && !c.carte.has('destination.0287'), 'D9.3 un lieu apprécié ouvre « ce qui t’a plu » (place.0273)', JSON.stringify([...c.carte.keys()]));
  const d = await recit('rejeu-d9-flore-aspect', 'J’adore l’ambiance du Café de Flore.', { label: 'Café de Flore', entityType: 'place', relation: 'LOVE' });
  v.verifier(!d.carte.has('place.0273'), 'D9.4 « l’ambiance du Café de Flore » : aucune relation envers le café, rien ne s’ouvre — même si le modèle dit « referent »', JSON.stringify([...d.carte.keys()]));
  const ok = lu(await d.c.client.from('knowledge_open_knowledge').select('subject_label, relation').eq('user_id', d.c.userId), 'connaissance ouverte') as { subject_label: string; relation: string }[];
  v.verifier(ok.some((o) => /flore/i.test(o.subject_label) && /cible non établie/.test(o.relation)), 'D9.5 … la phrase reste, en connaissance ouverte, marquée « cible non établie »', JSON.stringify(ok));
  const e = await recit('rejeu-d9-ernaux', 'Annie Ernaux m’intrigue.', { label: 'Annie Ernaux', entityType: 'artist', relation: 'CURIOUS' });
  v.verifier(e.carte.has('creator.0279') && !e.carte.has('creator.0277'), 'D9.6 la curiosité pour une autrice ouvre « passion, nostalgie ou découverte » (0279), pas « ce qui te touche » (0277)', JSON.stringify([...e.carte.keys()]));
  const ent = a.carte.get('destination.0287')!;
  const ro = await svc.enregistrerReponseOuverte(a.c.client as never, { userId: a.c.userId, questionId: 'destination.0287', texte: 'Pour les jardins et les onsens.', acteId: `rejeu-${++n}`, entite: ent });
  const src = lu(await a.c.client.from('knowledge_sources').select('branch_id').eq('id', ro.verbatimSourceId).single(), 'source') as { branch_id: string };
  const { etat: apres } = await lireEtat(a.c.client as never, { userId: a.c.userId });
  v.verifier(src.branch_id === `entite:${ent.id}` && !apres.entiteParQuestion?.has('destination.0287') && apres.entiteParQuestion?.has('destination.0286') === true,
    'D9.7 réponse rattachée au Japon ; 0287 n’est plus reposée pour lui ; 0286 reste à poser');
  for (const id of ['activity.0282', 'activity.0283', 'activity.0285']) await admissible(a.c, id, false, `D9.8 fermée par le produit (présume une pratique)`);
}

// ═══ ACTIVITÉS (20 nov.) — référent d'activité typé, dérivé des réponses, jamais une entité ═══
console.log('\n═══ Activités : aimer ≠ pratiquer ; pratiquer ≠ équipement ; aucune entité créée (relu en base) ═══');
{
  const a = await compteLocal('rejeu-activites');
  await repondre(a, 'craft.0615', ['Céramique ou poterie']);
  await repondre(a, 'sportp.0504', ['Escalade']);
  const { etat } = await lireEtat(a.client as never, { userId: a.userId });
  const carte = etat.entiteParQuestion ?? new Map();
  v.verifier(carte.get('activity.0281')?.id === 'activite:creativity:ceramique_ou_poterie', 'ACT.1 « ce que tu aimes le plus dans… » reçoit la céramique (attrait déclaré), pas l’escalade', JSON.stringify(carte.get('activity.0281')));
  v.verifier(['activity.0282', 'activity.0283', 'activity.0284'].every((id) => carte.get(id)?.id === 'activite:sport_practice:escalade'), 'ACT.2 niveau, fréquence, « progresser… ou continuer » reçoivent l’escalade (pratique déclarée), jamais la céramique');
  v.verifier(!carte.has('activity.0285'), 'ACT.3 le matériel reste fermé : pratiquer ne démontre pas un équipement');
  const ent = lu(await a.client.from('knowledge_evidences').select('target_family').eq('user_id', a.userId).eq('target_family', 'ENTITY'), 'entités') as unknown[];
  v.verifier(ent.length === 0, 'ACT.4 aucune entité écrite au journal : le référent est dérivé, pas créé');
  const esc = carte.get('activity.0283')!;
  const ro = await svc.enregistrerReponseOuverte(a.client as never, { userId: a.userId, questionId: 'activity.0283', texte: 'Deux fois par semaine, en salle.', acteId: `rejeu-${++n}`, entite: esc });
  const src = lu(await a.client.from('knowledge_sources').select('branch_id').eq('id', ro.verbatimSourceId).single(), 'source') as { branch_id: string };
  const { etat: apres } = await lireEtat(a.client as never, { userId: a.userId });
  v.verifier(src.branch_id === 'entite:activite:sport_practice:escalade' && !apres.entiteParQuestion?.has('activity.0283'), 'ACT.5 la réponse reste rattachée à l’escalade ; la question n’est plus posée pour elle', src.branch_id);
  const b = await compteLocal('rejeu-activites-regarde');
  await repondre(b, 'sportw.0532', ['Football']);
  const { etat: eb } = await lireEtat(b.client as never, { userId: b.userId });
  v.verifier(eb.entiteParQuestion?.get('activity.0281')?.libelle === 'le football' && !eb.entiteParQuestion?.has('activity.0283'), 'ACT.6 aimer regarder le football : « ce que tu aimes dans le football » oui, « à quelle fréquence le pratiques-tu » non');
}

console.log('\n(faux modèle derrière le relais ; données fictives ; comptes de test séparés)');
v.bilan();
