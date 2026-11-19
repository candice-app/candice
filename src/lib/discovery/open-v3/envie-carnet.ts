/**
 * LE GESTE « AJOUTER AU CARNET D'ENVIES » — décision d'Estelle du 18 nov. (n° 5).
 *
 * Dire « j'ai très envie de ramen » au Discovery écrit un fait d'envie actuelle. Cela ne met
 * RIEN dans le Carnet d'envies : le Carnet est ce que la personne choisit d'y mettre, et que ses
 * proches pourront voir. L'ajout demande donc sa demande ou sa confirmation ; le parcours peut
 * le lui proposer, il ne le fait jamais à sa place.
 *
 *   · proposé une seule fois par envie : « ajouter » comme « non merci » ferment la proposition ;
 *   · l'article du Carnet porte ses mots à elle, et la provenance « déclarée » ;
 *   · rien n'est ajouté pour une envie remplacée ou retirée.
 */
import { randomUUID } from 'node:crypto';
import { FAIT_ENVIE_CULINAIRE } from './envie-culinaire';
import { createFact } from '@/lib/knowledge/fact';
import { factId } from '@/lib/knowledge-write/ids';
import { createSourceRecord } from '@/lib/knowledge/sources';
import { persistKnowledge, type WriteClient } from '@/lib/knowledge-write/persist';
import { accountAbout, asUserId } from '@/lib/knowledge/identity';

export const FAIT_ENVIE_AU_CARNET = 'discovery.envie_au_carnet';
export class EnvieInvalideError extends Error {}
interface LigneFait { id: string; fact_type: string; value: string; about_id: string }
async function faits(client: WriteClient, userId: string): Promise<LigneFait[]> {
  const lecture = client as unknown as { from(t: string): { select(c: string): { eq(c: string, v: string): { is(c: string, v: null): Promise<{ data: LigneFait[] | null; error: { message: string } | null }> } } } };
  const { data, error } = await lecture.from('knowledge_facts').select('id, fact_type, value, about_id').eq('user_id', userId).is('superseded_at', null);
  if (error) throw new Error(`lecture des envies impossible : ${error.message}`);
  return (data ?? []).filter((f) => f.about_id === userId);
}

/** L'envie culinaire actuelle qui n'a reçu ni « ajouter » ni « non merci ». */
export async function envieAProposer(client: WriteClient, input: { readonly userId: string }): Promise<{ readonly id: string; readonly titre: string } | null> {
  const tous = await faits(client, input.userId);
  const traitees = new Set(tous.filter((f) => f.fact_type === FAIT_ENVIE_AU_CARNET).map((f) => { try { return String((JSON.parse(f.value) as { envie?: unknown }).envie ?? ''); } catch { return ''; } }));
  const envie = tous.find((f) => f.fact_type === FAIT_ENVIE_CULINAIRE && f.value.trim() && !traitees.has(f.id));
  return envie ? { id: envie.id, titre: envie.value.trim() } : null;
}

/** Sa réponse à la proposition. `ajouter: false` ferme la proposition sans rien mettre au Carnet. */
export async function repondreEnvieAuCarnet(
  client: WriteClient, input: { readonly userId: string; readonly envieId: string; readonly ajouter: boolean; readonly timestamp?: string },
): Promise<{ readonly etat: 'ajoutee' | 'declinee' }> {
  const envie = await envieAProposer(client, { userId: input.userId });
  // L'envie doit être la sienne, vivante, et pas déjà traitée : sinon rien n'est écrit.
  if (!envie || envie.id !== input.envieId) throw new EnvieInvalideError('cette envie n’est plus à proposer');
  const timestamp = input.timestamp ?? new Date().toISOString();
  if (input.ajouter) {
    const carnet = client as unknown as { from(t: string): { insert(v: Record<string, unknown>): Promise<{ error: { message: string } | null }> } };
    const { error } = await carnet.from('my_wishlist_items').insert({ user_id: input.userId, title: envie.titre.slice(0, 200), source_trace: 'declared' });
    if (error) throw new Error(`ajout au Carnet impossible : ${error.message}`);
  }
  const about = accountAbout(asUserId(input.userId)); const sourceId = randomUUID();
  await persistKnowledge(client, {
    source: createSourceRecord({ about, ownerId: asUserId(input.userId), id: sourceId, sourceType: 'user_declaration', questionCode: FAIT_ENVIE_AU_CARNET,
      questionText: 'Ajouter cette envie au Carnet d’envies ?', answerText: input.ajouter ? 'oui' : 'non', timestamp }),
    facts: [createFact({ about, ownerId: asUserId(input.userId), fact_id: factId(sourceId, FAIT_ENVIE_AU_CARNET, envie.id), fact_type: FAIT_ENVIE_AU_CARNET,
      value: JSON.stringify({ envie: envie.id, ajoutee: input.ajouter }), source: sourceId, timestamp, confidence: 'high', user_confirmed: true, assertionStatus: 'explicit' })],
  });
  return { etat: input.ajouter ? 'ajoutee' : 'declinee' };
}
