// UNE LIGNE « D'AVANT » : un consentement tel qu'il pouvait exister avant les migrations 112 à 116
// — actif, sans preuve d'accord. La garde de la base refuse désormais de l'écrire, par quelque
// chemin que ce soit ; pour prouver qu'une telle ligne N'OUVRE RIEN, il faut pourtant en poser
// une. On le fait ici en suspendant la garde le temps d'UNE insertion, sur la base LOCALE seulement.
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE_LOCALE ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
if (!/@127\.0\.0\.1:54322\//.test(BASE)) throw new Error('ARRÊT — ligne historique : base locale uniquement.');
const UUID = /^[0-9a-f-]{36}$/i;

export function ligneHistorique(l: { kind: 'contact_analysis' | 'profile_view' | 'profile_usage'; piloteId: string; procheId: string; contactId?: string | null; scope: string[] }): string {
  for (const v of [l.piloteId, l.procheId, l.contactId].filter(Boolean)) if (!UUID.test(v as string)) throw new Error('identifiant invalide');
  if (l.scope.some((p) => !/^[a-z0-9_:\-éèàç]+$/i.test(p))) throw new Error('portée invalide');
  const sql = `SET session_replication_role = replica;
    INSERT INTO public.contact_consents (pilote_id, contact_id, proche_user_id, kind, status, scope, responded_at, consented_at)
    VALUES ('${l.piloteId}', ${l.contactId ? `'${l.contactId}'` : 'NULL'}, '${l.procheId}', '${l.kind}', 'active', ARRAY[${l.scope.map((p) => `'${p}'`).join(',')}]::text[], now(), now())
    RETURNING id;`;
  const sortie = execFileSync('psql', [BASE, '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' });
  const id = sortie.split('\n').find((x) => UUID.test(x.trim()));
  if (!id) throw new Error(`ligne historique non créée : ${sortie}`);
  return id.trim();
}
