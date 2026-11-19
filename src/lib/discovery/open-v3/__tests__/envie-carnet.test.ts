import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { enregistrerReponseOuverte } from '../service';
import { envieAProposer, repondreEnvieAuCarnet } from '../envie-carnet';

const U = '00000000-0000-4000-8000-0000000000e5';
async function avecEnvie() {
  const b = fausseBase();
  const { FAIT_ENVIE_CULINAIRE } = await import('../envie-culinaire');
  b.tables.knowledge_facts = [{ id: 'envie-1', user_id: U, about_id: U, fact_type: FAIT_ENVIE_CULINAIRE, value: 'ramen tonkotsu', superseded_at: null, source: 's1' }];
  return b;
}
describe('le geste « ajouter au Carnet d’envies »', () => {
  it('dire son envie n’ajoute rien au Carnet : c’est une proposition', async () => {
    const b = await avecEnvie();
    expect(await envieAProposer(b.client, { userId: U })).toEqual({ id: 'envie-1', titre: 'ramen tonkotsu' });
    expect(b.tables.my_wishlist_items ?? []).toEqual([]);
  });
  it('« ajouter » : un article du Carnet, dans ses mots, provenance déclarée ; la proposition ne revient pas', async () => {
    const b = await avecEnvie();
    expect(await repondreEnvieAuCarnet(b.client, { userId: U, envieId: 'envie-1', ajouter: true })).toEqual({ etat: 'ajoutee' });
    expect(b.tables.my_wishlist_items).toHaveLength(1);
    expect(b.tables.my_wishlist_items[0]).toMatchObject({ user_id: U, title: 'ramen tonkotsu', source_trace: 'declared' });
    expect(await envieAProposer(b.client, { userId: U })).toBeNull();
    await expect(repondreEnvieAuCarnet(b.client, { userId: U, envieId: 'envie-1', ajouter: true })).rejects.toThrow(/plus à proposer/);
    expect(b.tables.my_wishlist_items).toHaveLength(1);
  });
  it('« non merci » : rien au Carnet, et la proposition ne revient pas', async () => {
    const b = await avecEnvie();
    expect(await repondreEnvieAuCarnet(b.client, { userId: U, envieId: 'envie-1', ajouter: false })).toEqual({ etat: 'declinee' });
    expect(b.tables.my_wishlist_items ?? []).toEqual([]);
    expect(await envieAProposer(b.client, { userId: U })).toBeNull();
  });
  it('l’envie d’un autre compte, ou une envie remplacée, ne se propose ni ne s’ajoute', async () => {
    const b = await avecEnvie();
    expect(await envieAProposer(b.client, { userId: 'autre' })).toBeNull();
    await expect(repondreEnvieAuCarnet(b.client, { userId: 'autre', envieId: 'envie-1', ajouter: true })).rejects.toThrow(/plus à proposer/);
    b.tables.knowledge_facts[0].superseded_at = '2026-11-19T10:00:00.000Z';
    expect(await envieAProposer(b.client, { userId: U })).toBeNull();
    expect(b.tables.my_wishlist_items ?? []).toEqual([]);
    void enregistrerReponseOuverte;
  });
  it('si le Carnet refuse l’ajout, la proposition reste ouverte', async () => {
    const b = await avecEnvie();
    b.panne = ({ table, op }) => (table === 'my_wishlist_items' && op === 'insert' ? 'refus' : null);
    await expect(repondreEnvieAuCarnet(b.client, { userId: U, envieId: 'envie-1', ajouter: true })).rejects.toThrow(/Carnet impossible/);
    b.panne = null;
    expect(await envieAProposer(b.client, { userId: U })).toEqual({ id: 'envie-1', titre: 'ramen tonkotsu' });
  });
});
