// LES QUATRE SCÉNARIOS D'EFFACEMENT, SUR COMPTES FICTIFS, EN LOCAL.
//
// ⚠ EN ATTENTE tant que : Docker + CLI Supabase absents, migration 105 non appliquée,
// machine à états non écrite. Le script vérifie ses préalables SANS EFFET DE BORD et refuse
// clairement plutôt que de rendre un faux vert.
//
// AUCUN APPEL À LA ROUTE DU CRON DANS LE CONTRÔLE PRÉALABLE : le premier appel a lieu dans
// un scénario, après préparation du compte fictif. Appeler le cron « pour voir » agirait sur
// tous les comptes échus de la base.
//
//   export SUPABASE_URL=http://127.0.0.1:54321
//   export SUPABASE_SERVICE_ROLE_KEY=… ; export CRON_SECRET=… ; export APP_URL=http://localhost:3000
//   export SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
//   npx tsx scripts/local/03-cron-quatre-scenarios.mts
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { exigerLocal, exigerProcessusLocal } from './_garde-locale.mjs';

const URL = process.env.SUPABASE_URL ?? '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const CRON = process.env.CRON_SECRET ?? '';
const APP = process.env.APP_URL ?? 'http://localhost:3000';
const DB = process.env.SUPABASE_DB_URL ?? '';
if (!KEY || !CRON || !DB) throw new Error('SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET et SUPABASE_DB_URL requis');
exigerLocal({ nom: 'API Supabase', url: URL, port: 54321 });
const appUrl = exigerLocal({ nom: 'application', url: APP });
exigerLocal({ nom: 'base', url: DB.replace(/^postgres(ql)?:/, 'http:'), port: 54322 });

const admin = createClient(URL, KEY, { auth: { persistSession: false } });
const ok = (m: string) => console.log(`    \x1b[32m✓\x1b[0m ${m}`);
const ko: (m: string) => never = (m) => { console.error(`\n\x1b[31mÉCHEC — ${m}\x1b[0m`); process.exit(1); };
const attente = (m: string): never => { console.log(`\n\x1b[33mEN ATTENTE — ${m}\x1b[0m`); process.exit(2); };

/** psql en LECTURE SEULE, forcée par la session elle-même. Toute erreur remonte. */
function lire(sql: string, variables: Record<string, string> = {}): string {
  const args = ['-X', '-tA', '-v', 'ON_ERROR_STOP=1'];
  for (const [k, v] of Object.entries(variables)) args.push('-v', `${k}=${v}`);
  args.push(DB, '-c', sql);
  try {
    return execFileSync('psql', args, {
      encoding: 'utf8',
      env: { ...process.env, PGOPTIONS: '-c default_transaction_read_only=on' },
    }).trim();
  } catch (e) {
    const err = e as { stderr?: Buffer | string };
    return ko(`inventaire : psql a échoué — ${String(err.stderr ?? e)}`);
  }
}

/**
 * INVENTAIRE RATTACHÉ AU COMPTE : fermeture transitive sur les clés étrangères, propagée
 * par la SEULE cascade, puis un compte PAR TABLE pour CET utilisateur. Les tables de la
 * fermeture SANS colonne user_id sont NOMMÉES, jamais ignorées en silence.
 */
const FERMETURE = `
with recursive g as (
  select c.conrelid as tbl, c.confdeltype, array[c.confrelid, c.conrelid] as chemin
  from pg_constraint c where c.contype='f' and c.confrelid='auth.users'::regclass
  union all
  select c.conrelid, c.confdeltype, g.chemin || c.conrelid
  from pg_constraint c join g on c.confrelid = g.tbl
  where c.contype='f' and g.confdeltype='c' and not c.conrelid = any(g.chemin)
)
select distinct tbl::regclass::text as t from g`;

function inventaire(userId: string): Record<string, number> {
  // Deux voies de rattachement au compte :
  //   1. la table porte `user_id` ;
  //   2. elle ne le porte pas mais porte `contact_id` → jointure sur contacts.user_id.
  // Toute table de la fermeture qui ne tombe dans NI l'une NI l'autre fait ÉCHOUER :
  // une table nommée mais non comptée laisse l'inventaire incomplet, et un inventaire
  // incomplet rend ACHEVEMENT_VERIFIE mensonger. La nommer ne suffit pas.
  const sql = `
with f as (${FERMETURE}),
cols as (
  select f.t,
         bool_or(c.column_name = 'user_id')    as a_user_id,
         bool_or(c.column_name = 'contact_id') as a_contact_id
  from f join information_schema.columns c
    on c.table_schema = 'public' and c.table_name = split_part(f.t, '.', 2)
  group by f.t
)
select t,
       case when a_user_id then 'direct' when a_contact_id then 'contact' else 'ORPHELINE' end as voie,
       case
         when a_user_id then (xpath('/row/c/text()', query_to_xml(
           format('select count(*) as c from %s where user_id = %L', t, :'uid'), false, true, '')))[1]::text::bigint
         when a_contact_id then (xpath('/row/c/text()', query_to_xml(
           format('select count(*) as c from %s x join public.contacts k on k.id = x.contact_id where k.user_id = %L', t, :'uid'),
           false, true, '')))[1]::text::bigint
         else null
       end as n
from cols order by t;`;
  const brut = lire(sql, { uid: userId });
  const comptes: Record<string, number> = {};
  const orphelines: string[] = [];
  for (const l of brut.split('\n').filter(Boolean)) {
    const [t, voie, n] = l.split('|');
    if (voie === 'ORPHELINE' || n === '') { orphelines.push(t); continue; }
    comptes[t] = Number(n);
  }
  if (orphelines.length) {
    ko(`inventaire INCOMPLET — ces tables de la fermeture ne se rattachent au compte ni par `
     + `user_id ni par contact_id, leurs lignes ne sont donc pas comptées : ${orphelines.join(', ')}. `
     + `Tant qu'elles ne le sont pas, « zéro résidu » ne veut rien dire.`);
  }
  if (Object.keys(comptes).length === 0) ko("inventaire vide : la fermeture transitive n'a rien rendu");
  return comptes;
}

/** Les trois surfaces. Une ERREUR n'est jamais comptée comme « zéro fichier restant ». */
async function surfaces(userId: string) {
  const { data: u, error: ea } = await admin.auth.admin.getUserById(userId);
  if (ea && !/not.?found/i.test(ea.message)) ko(`lecture Auth : ${ea.message}`);
  const { data: godets, error: eg } = await admin.storage.listBuckets();
  if (eg) ko(`lecture Storage (godets) : ${eg.message}`);
  let objets = 0;
  for (const b of godets ?? []) {
    const { data, error } = await admin.storage.from(b.name).list(userId, { limit: 1000 });
    if (error) ko(`lecture Storage (godet ${b.name}) : ${error.message} — une erreur n'est PAS zéro fichier`);
    objets += (data ?? []).length;
  }
  const { data: trace, error: et } = await admin.from('erasure_manifests')
    .select('status, attempt_no, inventory_before, residue_after').eq('subject_user_id', userId)
    .order('attempt_no', { ascending: true });
  if (et) ko(`lecture de la trace : ${et.message}`);
  return { auth: !!u?.user, objets, trace: trace ?? [], inventaire: inventaire(userId) };
}

async function compteFictif(suffixe: string) {
  const email = `cron-${suffixe}-${Date.now()}@essai.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: crypto.randomUUID(), email_confirm: true,
  });
  if (error || !data.user) return ko(`compte fictif : ${error?.message}`);
  return data.user.id;
}

const lancerCron = async () => {
  const r = await fetch(`${appUrl.origin}/api/cron/lifecycle-check`, {
    method: 'POST', headers: { Authorization: `Bearer ${CRON}` },
  });
  if (r.status === 401) ko('CRON_SECRET refusé par la route');
  if (!r.ok) ko(`route du cron : HTTP ${r.status}`);
  return r.json();
};

async function prealables() {
  console.log('═══ préalables (sans effet de bord) ═══');
  // lsof : une route qui répond sur localhost peut parler à une base DISTANTE.
  exigerProcessusLocal(Number(appUrl.port || 80));
  ok("le processus de l'application n'a aucune connexion hors boucle locale");
  const { error } = await admin.from('erasure_manifests').select('id').limit(1);
  if (error) attente(`table erasure_manifests absente — applique la migration 105 (${error.message})`);
  ok('erasure_manifests présente');
  // Sur un identifiant inexistant : prouve que CHAQUE table de la fermeture est comptable,
  // avant d'avoir le moindre compte fictif à effacer.
  const inv = inventaire('00000000-0000-0000-0000-000000000000');
  ok(`inventaire complet : ${Object.keys(inv).length} tables de la fermeture, toutes comptables`);
}

async function scenario1() {
  console.log('\n═══ 1. demande arrivée à échéance → tout effacé ═══');
  const id = await compteFictif('echue');
  const hier = new Date(Date.now() - 86400e3).toISOString();
  const { error } = await admin.from('my_profile').update({
    subscription_status: 'cancelled', cancelled_at: hier, deletion_scheduled_at: hier,
  }).eq('user_id', id);
  if (error) ko(`préparation : ${error.message}`);
  const avant = inventaire(id);
  ok(`inventaire AVANT : ${Object.values(avant).reduce((a, b) => a + b, 0)} lignes sur ${Object.keys(avant).length} tables`);
  await lancerCron();                       // PREMIER appel à la route, compte préparé
  const r = await surfaces(id);
  if (r.auth) ko('la ligne auth.users survit');
  ok('Auth : compte absent');
  const restantes = Object.entries(r.inventaire).filter(([, n]) => n > 0);
  if (restantes.length) ko(`lignes survivantes : ${restantes.map(([t, n]) => `${t}=${n}`).join(', ')}`);
  ok(`Base : zéro ligne sur ${Object.keys(r.inventaire).length} tables inventoriées`);
  if (r.objets !== 0) ko(`${r.objets} objets survivent dans Storage`);
  ok('Storage : zéro objet, tous godets confondus');
  const t = r.trace.at(-1);
  if (!t) ko('aucune trace écrite');
  if (t.status !== 'ACHEVEMENT_VERIFIE') ko(`trace « ${t.status} » au lieu d'ACHEVEMENT_VERIFIE`);
  if (JSON.stringify(t.residue_after ?? {}) !== '{}') ko(`résidu non vide : ${JSON.stringify(t.residue_after)}`);
  if (!t.inventory_before) ko('inventaire_avant absent de la trace');
  ok('Trace : ACHEVEMENT_VERIFIE, résidu vide, inventaire_avant conservé');
}

async function scenario2() {
  console.log('\n═══ 2. demande encore dans le délai → rien effacé, aucune tentative ═══');
  const id = await compteFictif('delai');
  const maintenant = new Date().toISOString();
  const dans30 = new Date(Date.now() + 30 * 86400e3).toISOString();
  const { error } = await admin.from('my_profile').update({
    subscription_status: 'cancelled', cancelled_at: maintenant, deletion_scheduled_at: dans30,
  }).eq('user_id', id);
  if (error) ko(`préparation : ${error.message}`);
  const avant = inventaire(id);
  await lancerCron();
  const r = await surfaces(id);
  if (!r.auth) ko('le compte a été effacé AVANT son échéance');
  ok('Auth : compte intact');
  const diff = Object.keys(avant).filter((t) => avant[t] !== r.inventaire[t]);
  if (diff.length) ko(`lignes modifiées avant échéance : ${diff.join(', ')}`);
  ok('Base : inventaire identique avant et après');
  const tentatives = r.trace.filter((t) => t.status !== 'DEMANDE');
  if (tentatives.length) ko(`une tentative a été écrite : ${JSON.stringify(tentatives)}`);
  ok('Trace : DEMANDE seule, aucune tentative');
  await admin.auth.admin.deleteUser(id);
}

/** Sème des données et un fichier, pour que « reste intact » veuille dire quelque chose. */
async function semer(userId: string, nbObjets = 3) {
  const { error: ec } = await admin.from('contacts')
    .insert(Array.from({ length: nbObjets }, (_, k) => ({ user_id: userId, first_name: `proche${k}` })));
  if (ec) ko(`semis contacts : ${ec.message}`);
  const { data: contacts, error: el } = await admin.from('contacts').select('id').eq('user_id', userId);
  if (el) ko(`relecture contacts : ${el.message}`);
  for (const c of contacts ?? []) {
    const chemin = `${userId}/${c.id}.txt`;
    const { error } = await admin.storage.from('contact-photos')
      .upload(chemin, new Blob(['x']), { upsert: true });
    if (error) ko(`semis Storage : ${error.message}`);
    await admin.from('contacts').update({ photo_url: chemin }).eq('id', c.id);
  }
  return (contacts ?? []).length;
}

/** Jeton d'accès du compte fictif : la route de suppression exige la personne elle-même. */
async function jeton(email: string, motDePasse: string) {
  const anon = createClient(URL, process.env.SUPABASE_ANON_KEY ?? KEY, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: motDePasse });
  if (error || !data.session) return ko(`connexion du compte fictif : ${error?.message}`);
  return data.session.access_token;
}

// ── 3. ANNULATION PAR LE LIEN REÇU ──────────────────────────────────────────
async function scenario3() {
  console.log('\n═══ 3. annulation PAR LE LIEN REÇU → rien effacé ═══');
  if (process.env.MAIL_TRANSPORT !== 'local') {
    attente("MAIL_TRANSPORT=local requis : sans lui le lien partirait par Resend, pour de vrai");
  }
  const journal = process.env.MAIL_LOCAL_FILE ?? '.local-mail/courriels.jsonl';
  const avantLignes = existsSync(journal) ? readFileSync(journal, 'utf8').split('\n').filter(Boolean).length : 0;

  const motDePasse = crypto.randomUUID();
  const email = `cron-annule-${Date.now()}@essai.local`;
  const { data: u, error: eu } = await admin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (eu || !u.user) return ko(`compte fictif : ${eu?.message}`);
  const id = u.user.id;
  const objets = await semer(id);
  const invAvant = inventaire(id);
  ok(`compte semé : ${Object.values(invAvant).reduce((a, b) => a + b, 0)} lignes, ${objets} objets`);

  // Demande de suppression PAR LA VRAIE ROUTE : c'est elle qui envoie le lien.
  const r = await fetch(`${appUrl.origin}/api/account/delete`, {
    method: 'POST', headers: { Authorization: `Bearer ${await jeton(email, motDePasse)}` },
  });
  if (!r.ok) return ko(`route de suppression : HTTP ${r.status}`);
  ok('demande de suppression enregistrée par la route réelle');

  // Le lien, capturé par le transport local — aucun appel sortant n'a eu lieu.
  if (!existsSync(journal)) return ko(`aucun courriel capturé dans ${journal}`);
  const lignes = readFileSync(journal, 'utf8').split('\n').filter(Boolean).slice(avantLignes);
  const pourLui = lignes.map((l) => JSON.parse(l)).filter((c) => c.to === email);
  if (pourLui.length === 0) return ko(`aucun courriel capturé pour ${email}`);
  // Le courriel est DANS le journal local : preuve, vue de l'extérieur, que la route a bien
  // emprunté le transport local. L'absence d'appel sortant, elle, est assérée dans le test
  // unitaire du transport, qui espionne `fetch` lui-même.
  const lien = pourLui.flatMap((c) => c.liens as string[]).find((l) => /cancel-deletion/.test(l));
  if (!lien) return ko(`aucun lien d'annulation dans le courriel capturé : ${JSON.stringify(pourLui)}`);
  exigerLocal({ nom: "lien d'annulation", url: lien });
  ok(`lien capturé : ${lien.replace(/(=|\/)[^=\/?&]{12,}/g, '$1…')}`);

  // On le SUIT, comme le ferait la personne.
  const ra = await fetch(lien, { redirect: 'follow' });
  if (!ra.ok) return ko(`le lien d'annulation répond HTTP ${ra.status}`);
  ok('lien suivi');

  // Suivre un lien qui répond 200 ne prouve pas qu'il a AGI : on relit l'état.
  const { data: apresAnnul, error: ep } = await admin.from('my_profile')
    .select('subscription_status, cancelled_at, deletion_scheduled_at').eq('user_id', id).single();
  if (ep) return ko(`relecture du profil : ${ep.message}`);
  if (apresAnnul.subscription_status === 'cancelled'
      || apresAnnul.cancelled_at !== null || apresAnnul.deletion_scheduled_at !== null) {
    return ko(`la demande n'est pas annulée : ${JSON.stringify(apresAnnul)}`);
  }
  ok('demande réellement annulée : statut rétabli, les deux horodatages à NULL');

  await lancerCron();

  const s = await surfaces(id);
  if (!s.auth) return ko("le compte a été effacé alors que l'annulation avait été suivie");
  ok('Auth : compte intact');
  const diff = Object.keys(invAvant).filter((t) => invAvant[t] !== s.inventaire[t]);
  if (diff.length) return ko(`lignes modifiées malgré l'annulation : ${diff.join(', ')}`);
  ok('Base : inventaire identique avant et après');
  if (s.objets !== objets) return ko(`${objets} objets avant, ${s.objets} après`);
  ok(`Storage : ${objets} objets intacts`);
  const achevements = s.trace.filter((t) => t.status === 'ACHEVEMENT_VERIFIE');
  if (achevements.length) return ko('un achèvement a été écrit malgré l\'annulation');
  ok('Trace : aucun achèvement');

  // ── 3b. ÉCHÉANCE ORPHELINE ────────────────────────────────────────────────
  // L'annulation a mis les DEUX champs à NULL : il n'y a plus de demande. Poser une
  // échéance au passé sans rétablir cancelled_at fabrique donc un AUTRE cas — celui qu'un
  // chemin futur laisserait en oubliant de nettoyer. La garde doit REFUSER, parce que
  // cancelled_at IS NULL rend l'échéance non interprétable, et JOURNALISER ce refus.
  console.log('\n    ── 3b. échéance orpheline ──');
  const { error: eo } = await admin.from('my_profile')
    .update({ deletion_scheduled_at: new Date(Date.now() - 86400e3).toISOString() })
    .eq('user_id', id);
  if (eo) return ko(`pose de l'échéance orpheline : ${eo.message}`);
  const avantOrphelin = inventaire(id);
  // Marqueur d'exécution : l'assertion portera sur les lignes de cron_runs créées PENDANT
  // ce passage. Sans lui, un refus d'une exécution antérieure ferait passer le test.
  const marqueur = new Date().toISOString();
  const tentativesAvant = (await admin.from('erasure_manifests')
    .select('id').eq('subject_user_id', id)).data?.length ?? 0;
  await lancerCron();
  const o = await surfaces(id);
  if (!o.auth) return ko('compte effacé sur une échéance ORPHELINE — la garde ne lit que la date');
  ok('Auth : compte intact malgré une échéance échue');
  const diffO = Object.keys(avantOrphelin).filter((t) => avantOrphelin[t] !== o.inventaire[t]);
  if (diffO.length) return ko(`lignes modifiées : ${diffO.join(', ')}`);
  if (o.objets !== objets) return ko(`${objets} objets avant, ${o.objets} après`);
  ok(`Base et Storage : ${objets} objets et toutes les lignes intacts`);
  // La garde intervient AVANT toute tentative : erasure_manifests ne doit recevoir AUCUNE
  // nouvelle ligne. Un refus n'est pas une tentative ratée, c'est une tentative qui n'a
  // pas eu lieu.
  const tentativesApres = (await admin.from('erasure_manifests')
    .select('id').eq('subject_user_id', id)).data?.length ?? 0;
  if (tentativesApres !== tentativesAvant) {
    return ko(`${tentativesApres - tentativesAvant} tentative(s) créée(s) sur un refus : `
            + `la garde intervient APRÈS la tentative au lieu d'AVANT`);
  }
  ok('erasure_manifests : aucune tentative créée');

  // Motif EXACT sur le CHAMP de l'entrée correspondante, parmi les exécutions de CE
  // passage. Une recherche de sous-chaîne dans le JSON sérialisé passerait si le motif
  // apparaissait n'importe où : dans un autre champ, sur un autre compte, ou comme
  // fragment d'une valeur plus longue. Ce serait un contrôle qui rassure sans prouver.
  const { data: runs, error: er } = await admin.from('cron_runs')
    .select('created_at, metadata').gte('created_at', marqueur).order('created_at', { ascending: true });
  if (er) return ko(`lecture de cron_runs : ${er.message}`);
  if (!runs || runs.length === 0) return ko('aucune exécution de cron_runs pendant ce passage');

  interface Refus { subject_user_id?: string; reason?: string }
  const refus: Refus[] = runs.flatMap((r) => {
    const m = r.metadata as { refusals?: unknown } | null;
    return Array.isArray(m?.refusals) ? (m.refusals as Refus[]) : [];
  });
  if (refus.length === 0) {
    return ko('aucun refus structuré dans cron_runs.metadata.refusals pendant ce passage — '
            + `trouvé : ${JSON.stringify(runs).slice(0, 400)}`);
  }
  const pourCeCompte = refus.filter((x) => x.subject_user_id === id);
  if (pourCeCompte.length === 0) {
    return ko(`refus présents (${refus.length}) mais aucun rattaché à ${id} : `
            + `${JSON.stringify(refus).slice(0, 300)}`);
  }
  if (pourCeCompte.length !== 1) {
    return ko(`${pourCeCompte.length} refus pour le même compte sur un seul passage`);
  }
  if (pourCeCompte[0].reason !== 'ORPHANED_DELETION_DEADLINE') {
    return ko(`motif « ${pourCeCompte[0].reason} » au lieu de « ORPHANED_DELETION_DEADLINE » `
            + '— comparaison exacte du champ, pas une recherche de sous-chaîne');
  }
  ok('cron_runs : un refus ORPHANED_DELETION_DEADLINE, champ exact, rattaché à ce compte');

  await admin.auth.admin.deleteUser(id);
}

// ── 4. ÉCHEC PARTIEL PUIS REPRISE ───────────────────────────────────────────
async function scenario4(phase: 1 | 2, idRepris?: string) {
  const forme = process.env.ESSAI_STORAGE_FORME === 'erreur' ? 'erreur' : 'exception';
  console.log(`\n═══ 4. échec partiel puis reprise — passage ${phase} · forme « ${forme} » ═══`);
  if (phase === 1) {
    console.log('    Les DEUX formes doivent être jouées : exception, puis { error } sans');
    console.log('    exception. Relance avec ESSAI_STORAGE_FORME=erreur après ce passage —');
    console.log('    c\'est la forme silencieuse qui passerait pour un succès.');
  }
  if (phase === 1) {
    const id = await compteFictif('partiel');
    const objets = await semer(id, 3);
    const invAvant = inventaire(id);
    const hier = new Date(Date.now() - 86400e3).toISOString();
    const { error } = await admin.from('my_profile').update({
      subscription_status: 'cancelled', cancelled_at: hier, deletion_scheduled_at: hier,
    }).eq('user_id', id);
    if (error) return ko(`préparation : ${error.message}`);
    ok(`compte préparé : ${objets} objets, ${Object.values(invAvant).reduce((a, b) => a + b, 0)} lignes`);

    await lancerCron();
    const s = await surfaces(id);
    const t = s.trace.at(-1);
    if (!t) return ko('aucune trace au premier passage');
    if (t.status === 'ACHEVEMENT_VERIFIE') {
      return ko("le premier passage s'est ACHEVÉ : l'injection n'était pas active. "
              + "Redémarre l'application avec ESSAI_PILE_LOCALE=oui ESSAI_COUPER_STORAGE_APRES=1 "
              + `ESSAI_STORAGE_FORME=${forme} et recommence.`);
    }
    if (t.status !== 'ECHEC_PARTIEL') return ko(`trace « ${t.status} » au lieu d'ECHEC_PARTIEL`);
    const residu = t.residue_after ?? {};
    if (JSON.stringify(residu) === '{}') return ko('ECHEC_PARTIEL avec un résidu VIDE : le résidu doit dire ce qui reste');
    ok(`Trace : ECHEC_PARTIEL, résidu ${JSON.stringify(residu)}`);
    // La coupure doit tomber AU MILIEU : au moins un objet effacé, au moins un restant.
    // Zéro effacé prouverait que la coupure est tombée avant la boucle ; zéro restant,
    // qu'elle n'est pas tombée du tout. Ni l'un ni l'autre ne prouve une reprise.
    if (s.objets >= objets) return ko(`aucun objet effacé (${s.objets} sur ${objets}) : la coupure est tombée trop tôt`);
    if (s.objets === 0) return ko('aucun objet restant : la coupure n’a pas eu lieu, il n’y a rien à reprendre');
    ok(`coupure au milieu : ${objets - s.objets} objet(s) effacé(s), ${s.objets} restant(s)`);
    // Le résidu doit correspondre à ce qui reste RÉELLEMENT, pas à un compte approximatif.
    const totalResidu = Object.values(residu as Record<string, number>).reduce((a, b) => a + Number(b), 0);
    if (totalResidu !== s.objets) return ko(`résidu annoncé ${totalResidu}, objets réellement restants ${s.objets}`);
    ok(`résidu conforme au réel : ${s.objets} objets`);
    if (!s.auth) return ko("auth.users a été effacé alors que des fichiers restaient : la reprise est impossible, "
                        + 'les chemins se lisent depuis cette ligne');
    ok('Auth : compte CONSERVÉ — la reprise reste possible');
    console.log(`\n    Passage 1 vérifié. Redémarre l'application SANS ESSAI_COUPER_STORAGE_APRES,`);
    console.log(`    puis : npx tsx scripts/local/03-cron-quatre-scenarios.mts --phase2 ${id}`);
    return id;
  }

  const id = idRepris!;
  const avantReprise = await surfaces(id);
  const premier = avantReprise.trace.find((t) => t.status === 'ECHEC_PARTIEL');
  if (!premier) return ko('aucun ECHEC_PARTIEL à reprendre — relance le passage 1');
  await lancerCron();
  const s = await surfaces(id);
  const t = s.trace.at(-1);
  if (!t) return ko('aucune trace au second passage');
  if (t.attempt_no !== 2) return ko(`attempt_no = ${t.attempt_no} au lieu de 2`);
  ok('attempt_no = 2');
  // LA preuve de la reprise : l'inventaire du second tour est le RÉSIDU du premier,
  // pas l'inventaire initial. Sans ça, un recommencement réussi passerait pour une reprise.
  if (JSON.stringify(t.inventory_before) !== JSON.stringify(premier.residue_after)) {
    return ko(`inventaire de reprise ${JSON.stringify(t.inventory_before)} ≠ résidu du premier `
            + `${JSON.stringify(premier.residue_after)} : c'est un recommencement, pas une reprise`);
  }
  ok('inventaire de reprise = résidu du premier passage');
  if (t.status !== 'ACHEVEMENT_VERIFIE') return ko(`trace « ${t.status} » au lieu d'ACHEVEMENT_VERIFIE`);
  // L'achèvement ne vaut QUE si les trois surfaces sont réellement vides.
  if (s.auth) return ko("ACHEVEMENT_VERIFIE écrit alors que le compte Auth existe encore");
  const restantes = Object.entries(s.inventaire).filter(([, n]) => n > 0);
  if (restantes.length) return ko(`ACHEVEMENT_VERIFIE écrit avec des lignes restantes : ${restantes.map(([t2, n]) => `${t2}=${n}`).join(', ')}`);
  if (s.objets !== 0) return ko(`ACHEVEMENT_VERIFIE écrit avec ${s.objets} objets restants`);
  if (JSON.stringify(t.residue_after ?? {}) !== '{}') return ko(`achèvement avec résidu ${JSON.stringify(t.residue_after)}`);
  ok('Achèvement vérifié APRÈS contrôle d’Auth, de la base et de Storage');
}

const args = process.argv.slice(2);
await prealables();
if (args[0] === '--phase2') {
  await scenario4(2, args[1]);
} else {
  await scenario1();
  await scenario2();
  await scenario3();
  await scenario4(1);
}
