// PREUVE — les situations d'un proche : saisie, droits, cycle de vie, et usage par la
// recommandation. Vraies routes HTTP de l'application locale, pile locale, faux modèle.
//
// Ce qu'on regarde à chaque étape : ce qui est ÉCRIT en base, ce qui est ENVOYÉ au modèle
// (le faux serveur garde la requête entière), et ce qui est RENDU à l'écran.
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const panne = (active: boolean) => fetch(`${MODELE}/__panne`, { method: 'POST', body: JSON.stringify({ active }) });
const etat = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ appels: number; recus: { outil?: string; systeme: string; texte: string }[] }>;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const { admin } = pileLocale();
const v = verificateur();

const P = await compteLocal('situations-pilote'), X = await compteLocal('situations-autre');
const cP = await cookiesDe(P.email, P.motDePasse), cX = await cookiesDe(X.email, X.motDePasse);
const { data: julie } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Julie Martin', relationship: 'friend' }).select('id').single();
const NOTE = 'Julie vient de perdre sa mère.';
const lecture = (p: Record<string, unknown> = {}) => ({ category: 'deuil', subcategory: 'perte d’un parent', tonality: 'fragile', emotional_intensity: 'high', probable_needs: ['présence'], sensitivity_level: 4, certitude: 'constat', reformulation: 'Julie traverse un deuil. À prendre en compte dans tes prochaines attentions.', ...p });
const lignes = async () => (await admin.from('memories').select('id,pilot_id,contact_id,raw_input,sanitized_summary,reformulated_text,status,emotional_intensity,sensitivity_level,source_reliability,category').eq('contact_id', julie!.id)).data ?? [];
const IDEES = (extra = '') => ({ __texte: JSON.stringify([
  { title: 'Un dîner pour l’entourer depuis le décès de sa mère', justification: 'Elle est en deuil.', dim: 'EXP', canal: 'message', intensite: 'forte', declencheur: 'deuil' },
  { title: 'Lui proposer une balade, à son rythme', justification: `Julie traverse une période difficile : un moment simple, sans pression.${extra}`, dim: 'EXP', canal: 'message', intensite: 'legere', declencheur: 'période difficile' },
]) });
const reco = async () => {
  const avant = (await etat()).recus.length;
  const r = await poster('/api/recommendations/generate', cP, { contactId: julie!.id });
  const recus = (await etat()).recus.slice(avant);
  const envoye = recus.map((x) => `${x.systeme}\n${x.texte}`).join('\n');
  return { r, envoye, affiche: JSON.stringify(r.json ?? '') };
};

// ── 0. SANS SITUATION : la recommandation ne parle d'aucune période.
await dicter([IDEES()]);
let x = await reco();
console.log('\n0. recommandation sans situation → HTTP', x.r.status);
v.verifier(x.r.status === 200 && !/SITUATION ACTUELLE/.test(x.envoye), '0 : sans situation, rien n’est transmis au modèle à ce sujet');

// ── 1. AUTRE COMPTE : refusé AVANT tout appel au modèle.
let avant = (await etat()).appels;
let r = await poster('/api/memories/situation', cX, { contactId: julie!.id, rawText: NOTE, contactUserId: P.userId });
console.log('\n1. autre compte → HTTP', r.status, JSON.stringify(r.json));
v.verifier(r.status === 404 && (await etat()).appels === avant && (await lignes()).length === 0, '1 : un autre compte reçoit 404 ; aucun appel au modèle, aucune écriture');
r = await poster('/api/memories/situation', null, { contactId: julie!.id, rawText: NOTE });
v.verifier(r.status === 401, '1 : sans session, 401');

// ── 2. PANNE DU MODÈLE : la note est sauvegardée, protégée par défaut.
await panne(true);
r = await poster('/api/memories/situation', cP, { contactId: julie!.id, rawText: 'Julie a l’air épuisée en ce moment.' });
await panne(false);
let l = await lignes();
console.log('\n2. panne du modèle → HTTP', r.status, JSON.stringify(r.json), '· en base :', l.map((m) => ({ status: m.status, resume: m.sanitized_summary })));
v.verifier(r.status === 200 && (r.json as { enrichie?: boolean }).enrichie === false && l.length === 1, '2 : pendant la panne, la note est enregistrée et la route le dit (enrichie : false)');
v.verifier(l[0].status === 'sensible' && !/épuisée/.test(l[0].sanitized_summary), '2 : non lue, elle est protégée (« sensible ») et son résumé ne reprend pas la note');
x = await reco.call(null).catch(() => null as never) ?? x;
await admin.from('memories').delete().eq('id', l[0].id);          // nettoyage de l'essai (base locale)

// ── 3. UTILISATEUR AUTORISÉ : une situation sensible.
await dicter([lecture()]);
r = await poster('/api/memories/situation', cP, { contactId: julie!.id, rawText: NOTE, contactUserId: X.userId });
l = await lignes();
console.log('\n3. utilisateur autorisé → HTTP', r.status, JSON.stringify(r.json), '\n   relu en base :', l.map((m) => ({ status: m.status, intensite: m.emotional_intensity, sensibilite: m.sensitivity_level, categorie: m.category, resume: m.sanitized_summary })));
v.verifier(r.status === 200 && l.length === 1 && l[0].pilot_id === P.userId, '3 : la note est enregistrée, sous l’identité du pilote');
v.verifier(l[0].status === 'sensible' && l[0].emotional_intensity === 'élevé', '3 : statut « sensible », intensité « élevé » (vocabulaire V26)');
v.verifier(l[0].raw_input === NOTE && l[0].reformulated_text?.startsWith('Julie traverse un deuil'), '3 : la note brute est conservée, la reformulation écrite');
const sitId = l[0].id;
const autres = (await admin.from('processing_log').select('id').eq('pilot_id', X.userId)).data ?? [];
v.verifier(autres.length === 0, '3 : l’identifiant de compte glissé dans la requête ne provoque rien sur ce compte');

// ── 4. LA FICHE PRIVÉE du proche : reformulée, jamais la note brute.
const page = await poster(`/contacts/${julie!.id}`, cP, null, 'GET');
console.log('\n4. fiche privée → HTTP', page.status);
v.verifier(page.status === 200 && page.texte.includes('Julie traverse un deuil'), '4 : la carte « Situation actuelle » affiche la reformulation, y compris pour une situation sensible');
v.verifier(!page.texte.includes('perdre sa mère'), '4 : la note brute n’est pas dans la page envoyée au navigateur');
const pageX = await poster(`/contacts/${julie!.id}`, cX, null, 'GET');
v.verifier(!pageX.texte.includes('Julie traverse un deuil'), '4 : un autre compte ne voit pas cette fiche');

// ── 5. LA RECOMMANDATION : la situation change la proposition, le détail reste confidentiel.
await dicter([IDEES()]);
x = await reco();
console.log('\n5. recommandation avec situation sensible → HTTP', x.r.status);
console.log('   transmis au modèle :', (x.envoye.match(/SITUATION ACTUELLE[^\n]*/) ?? ['(rien)'])[0]);
console.log('   affiché            :', x.affiche.slice(0, 420));
v.verifier(/SITUATION ACTUELLE.*période difficile, privilégier une proposition sans pression/.test(x.envoye), '5 : la consigne générale est transmise au modèle');
v.verifier(/CONFIDENTIALITÉ/.test(x.envoye) && !/deuil|décès|sa mère|perdre|perdu/i.test(x.envoye), '5 : aucun détail (deuil, décès, mère) dans ce qui part au modèle');
v.verifier(x.affiche.includes('à son rythme'), '5 : la proposition adaptée est rendue');
v.verifier(!/décès|deuil|sa mère/i.test(x.affiche), '5 : l’idée qui nommait le décès est retirée de ce qui s’affiche');
const enBase = (await admin.from('contact_recommendations').select('*').eq('contact_id', julie!.id)).data ?? [];
v.verifier(!/décès|deuil|sa mère/i.test(JSON.stringify(enBase)), '5 : ni dans ce qui est conservé en base');

// ── 6. UN AUTRE COMPTE ne peut pas faire évoluer la situation.
r = await poster('/api/memories/situation/action', cX, { id: sitId, action: 'terminee' });
v.verifier(r.status === 404 && (await lignes())[0].status === 'sensible', '6 : un autre compte ne peut ni archiver ni modifier (404, statut inchangé)');

// ── 7. « CE N'EST PLUS D'ACTUALITÉ » → archivé : plus de carte, plus d'influence.
r = await poster('/api/memories/situation/action', cP, { id: sitId, action: 'terminee' });
l = await lignes();
await dicter([IDEES()]);
x = await reco();
const page2 = await poster(`/contacts/${julie!.id}`, cP, null, 'GET');
console.log('\n7. archivée → statut', l[0].status);
v.verifier(r.status === 200 && l[0].status === 'archivé' && l[0].raw_input === NOTE, '7 : statut « archivé », historique conservé');
v.verifier(!/SITUATION ACTUELLE/.test(x.envoye), '7 : une situation archivée n’influence plus la recommandation');
v.verifier(!page2.texte.includes('Julie traverse un deuil'), '7 : elle a quitté la carte « Situation actuelle »');

// ── 8. UNE IMPRESSION : utilisée, mais comme telle.
await dicter([lecture({ category: 'humeur', subcategory: null, tonality: 'tendue', emotional_intensity: 'low', sensitivity_level: 1, certitude: 'impression', reformulation: 'D’après ce que tu as perçu, Julie semble un peu sous tension en ce moment.' })]);
r = await poster('/api/memories/situation', cP, { contactId: julie!.id, rawText: 'J’ai l’impression que Julie est tendue ces temps-ci.' });
const imp = (await lignes()).find((m) => m.id === (r.json as { id: string }).id)!;
await dicter([IDEES()]);
x = await reco();
const page3 = await poster(`/contacts/${julie!.id}`, cP, null, 'GET');
console.log('\n8. impression → statut', imp.status, '· fiabilité', imp.source_reliability, '\n   transmis :', (x.envoye.match(/SITUATION ACTUELLE[^\n]*/) ?? ['(rien)'])[0]);
v.verifier(imp.status === 'incertain' && imp.source_reliability === 'faible', '8 : une impression garde son niveau de certitude (« incertain », fiabilité « faible »)');
v.verifier(/impression non confirmée/.test(x.envoye) && /ne rien tenir pour acquis/.test(x.envoye), '8 : elle est transmise au modèle comme une impression');
v.verifier(/status\\?":\\?"incertain/.test(page3.texte) && /source_reliability\\?":\\?"faible/.test(page3.texte), '8 : la fiche reçoit la situation avec son niveau de certitude (la carte l’affiche « à confirmer »)');

// ── 9. « C'ÉTAIT UNE ERREUR » → invalidé.
r = await poster('/api/memories/situation/action', cP, { id: imp.id, action: 'erreur' });
v.verifier(r.status === 200 && (await lignes()).find((m) => m.id === imp.id)!.status === 'invalidé', '9 : « c’était une erreur » → statut « invalidé »');
await dicter([IDEES()]); x = await reco();
v.verifier(!/SITUATION ACTUELLE/.test(x.envoye), '9 : une situation invalidée n’influence plus rien');
v.bilan();
