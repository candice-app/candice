// UN COMPTE DE TEST SUR LA PILE LOCALE, et un client connecté SOUS SON IDENTITÉ.
//
// Partagé par les scripts de preuve. Toujours un compte SÉPARÉ, créé pour l'essai, marqué
// `candice_test`, sur une URL strictement locale (voir `_garde-locale.mts`).
// La clé de service ne sert qu'à CRÉER et SUPPRIMER le compte ; toutes les écritures et
// toutes les relectures applicatives passent par le client connecté, donc par la RLS.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { exigerLocal } from './_garde-locale.mts';

export const DOMAINE_TEST = 'test.candice.invalid';

export function pileLocale() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  exigerLocal({ nom: 'NEXT_PUBLIC_SUPABASE_URL', url, port: 54321 });
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!service || !anon) throw new Error('ARRÊT — clés locales absentes : `. /home/claude/pile/env-local.sh`.');
  const admin = createClient(url, service, { auth: { persistSession: false } });
  return { url, anon, admin };
}

export interface CompteLocal { userId: string; email: string; client: SupabaseClient; motDePasse: string }

/** Crée (ou recrée) un compte de test et rend un client connecté sous son identité. */
export async function compteLocal(nom: string): Promise<CompteLocal> {
  const { url, anon, admin } = pileLocale();
  const email = `${nom}@${DOMAINE_TEST}`;
  const { data: liste } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of liste?.users ?? []) {
    if (u.email === email) {
      // Un effacement qui échoue n'est pas un détail : il est dit, pas avalé.
      const { error: eSup } = await admin.auth.admin.deleteUser(u.id);
      if (eSup) throw new Error(`suppression de ${email} impossible — ${eSup.message}`);
    }
  }
  const motDePasse = `T!${globalThis.crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: motDePasse, email_confirm: true, user_metadata: { candice_test: true },
  });
  if (error || !data?.user) throw new Error(`création de ${email} impossible — ${error?.message}`);
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error: e2 } = await client.auth.signInWithPassword({ email, password: motDePasse });
  if (e2) throw new Error(`connexion de ${email} impossible — ${e2.message}`);
  return { userId: data.user.id, email, client, motDePasse };
}

/** Petit compteur de vérifications : une preuve qui échoue fait sortir le script en erreur. */
export function verificateur() {
  let ok = 0, ko = 0;
  return {
    verifier(cond: boolean, libelle: string, detail = '') {
      if (cond) { ok++; console.log(`  ✓ ${libelle}`); }
      else { ko++; console.log(`  ✗ ${libelle}${detail ? ' — ' + detail : ''}`); }
    },
    bilan() { console.log(`\n${ok} vérifications passées, ${ko} en échec.`); if (ko) process.exitCode = 1; return ko; },
  };
}
