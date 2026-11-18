// L'appel d'une tâche planifiée se reconnaît à un secret partagé. La comparaison
// `en-tête !== \`Bearer ${process.env.CRON_SECRET}\`` laissait passer « Bearer undefined »
// dès que la variable manquait : sans secret configuré, la route était ouverte à tous.
//
// Règle : pas de secret, ou un secret trop court → personne ne passe. Comparaison à temps constant.
import { timingSafeEqual } from 'node:crypto';

const LONGUEUR_MINIMALE = 16;

export function estAppelPlanifie(req: { headers: { get(nom: string): string | null } }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < LONGUEUR_MINIMALE) return false;
  const recu = req.headers.get('authorization');
  if (!recu) return false;
  const a = Buffer.from(recu, 'utf8');
  const b = Buffer.from(`Bearer ${secret}`, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
