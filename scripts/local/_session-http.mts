// UNE SESSION HTTP RÉELLE contre l'application locale : les cookies exacts que poserait
// le navigateur, fabriqués par la même bibliothèque que l'application (@supabase/ssr).
import { createServerClient } from '@supabase/ssr';
import { exigerLocal } from './_garde-locale.mts';

export const APP = process.env.APP_LOCALE ?? 'http://127.0.0.1:3100';
exigerLocal({ nom: 'APP_LOCALE', url: APP, port: 3100 });

/** Se connecte avec le compte de test et rend l'en-tête Cookie à joindre aux requêtes. */
export async function cookiesDe(email: string, motDePasse: string): Promise<string> {
  const pot = new Map<string, string>();
  const c = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => [...pot].map(([name, value]) => ({ name, value })), setAll: (l) => { for (const { name, value } of l) pot.set(name, value); } },
  });
  const { error } = await c.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw new Error(`connexion HTTP impossible : ${error.message}`);
  return [...pot].map(([n, v]) => `${n}=${v}`).join('; ');
}

export async function poster(chemin: string, cookie: string | null, corps: unknown, methode = 'POST') {
  const r = await fetch(`${APP}${chemin}`, {
    method: methode, redirect: 'manual',
    // L'application réserve ces écrans au téléphone : on se présente comme un téléphone.
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', ...(cookie ? { cookie } : {}) },
    ...(methode === 'GET' ? {} : { body: JSON.stringify(corps) }),
  });
  let json: unknown = null; const texte = await r.text();
  try { json = JSON.parse(texte); } catch { /* pas du JSON */ }
  return { status: r.status, json, texte };
}
