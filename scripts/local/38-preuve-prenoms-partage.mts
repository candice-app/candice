// PREUVE LOCALE — migration 122 : les prénoms de « Partager ma fiche » sans client privilégié.
// Périmètre : l'appelant connecté, le prénom seul, l'autre partie de SES partages de fiche (en attente
// ou actifs). On prouve aussi les REFUS : la personne avec qui l'on partage, un tiers, un anonyme.
import { createClient } from '@supabase/supabase-js';
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const { admin } = pileLocale();
const v = verificateur();
const P = await compteLocal('prenoms-titulaire'), B = await compteLocal('prenoms-destinataire'), X = await compteLocal('prenoms-tiers');
await admin.auth.admin.updateUserById(B.userId, { user_metadata: { full_name: 'Bérénice Testeuse' } });
await admin.auth.admin.updateUserById(P.userId, { user_metadata: { full_name: 'Paul Titulaire' } });
const { data: k, error } = await P.client.from('contact_consents').insert({ pilote_id: P.userId, proche_user_id: B.userId, kind: 'profile_view', status: 'active', scope: ['socle'] }).select('id').single();
if (error) throw new Error(`partage de test impossible : ${error.message}`);
type R = { data: { consent_id: string; prenom: string | null }[] | null; error: { message: string } | null };
const rpc = (c: { rpc(f: string): unknown }) => c.rpc('prenoms_de_mes_partages') as Promise<R>;

const rP = await rpc(P.client as never);
v.verifier(!rP.error && rP.data?.length === 1 && rP.data[0].consent_id === k!.id && rP.data[0].prenom === 'Bérénice', 'le titulaire lit le PRÉNOM seul de la personne avec qui il partage', JSON.stringify(rP));
v.verifier(!JSON.stringify(rP.data).includes('Testeuse') && !JSON.stringify(rP.data).includes('@'), 'ni nom complet, ni courriel');
const rB = await rpc(B.client as never);
v.verifier(!rB.error && (rB.data ?? []).length === 0, 'la destinataire ne lit pas le prénom du titulaire par cette fonction (elle n’est pas titulaire)');
const rX = await rpc(X.client as never);
v.verifier(!rX.error && (rX.data ?? []).length === 0, 'un tiers ne lit rien');
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
const rA = await rpc(anon as never);
v.verifier(!!rA.error || (rA.data ?? []).length === 0, 'un anonyme ne peut pas l’exécuter', rA.error?.message ?? 'sans erreur');
await P.client.from('contact_consents').update({ status: 'revoked', scope: [] }).eq('id', k!.id);
const rP2 = await rpc(P.client as never);
v.verifier((rP2.data ?? []).length === 0, 'un partage retiré ne rend plus de prénom');
const { data: k2 } = await P.client.from('contact_consents').insert({ pilote_id: P.userId, proche_user_id: B.userId, kind: 'profile_view', status: 'active', scope: ['socle'] }).select('id').single();
const page = await poster('/moi/partage', await cookiesDe(P.email, P.motDePasse), null, 'GET');
v.verifier(page.status === 200 && page.texte.includes('Bérénice'), 'la page /moi/partage affiche le prénom, servie sans client privilégié', `statut ${page.status} ${k2?.id ?? ''}`);
v.bilan();
