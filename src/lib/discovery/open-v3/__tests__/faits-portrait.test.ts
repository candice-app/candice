import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { question } from '../banque';
import { cleOption } from '../cle-option';
import { enregistrerReponseFermee, enregistrerReponseOuverte } from '../service';
import { faitsDiscoveryPourPortrait, PLAFOND_FAITS_PORTRAIT } from '../faits-portrait';
import { readSocleFacts } from '../../../questionnaire/breath-tags';

const U = '00000000-0000-4000-8000-0000000000e1';
const fait = (valeur: string, polarite = 'factuelle', statut: string | null = 'explicit') =>
  ({ factType: 'discovery.fait.sport_practice.pratique', assertionStatus: statut, value: JSON.stringify({ valeur, polarite, question: 'sportp.0504', libelle: valeur }) });

describe('les faits du Discovery rendus au portrait', () => {
  it('de bout en bout : la pratique déclarée sort, avec sa question et sa provenance ; la phrase de la réponse ouverte ne sort pas', async () => {
    const b = fausseBase();
    const q = question('sportp.0504')!;
    await enregistrerReponseFermee(b.client, { userId: U, questionId: q.id, clesOptions: [cleOption(q.options.find((o) => o.libelle === 'Vélo')!)], acteId: 'lot-1' });
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie, depuis mon divorce.', acteId: 'lot-2', lecteur: async () => ({ segments: [] }) });
    for (const f of b.tables.knowledge_facts) f.visibility_derived ??= 'restituable';
    const discovery = await readSocleFacts(b.client, U, { discovery: 'seulement' });
    const r = faitsDiscoveryPourPortrait(discovery);
    expect(r.lignes).toEqual([`« ${q.enonce} » → Vélo [dit par la personne]`]);
    expect(r.ecartes.verbatims).toBeGreaterThanOrEqual(1);
    expect(r.lignes.join('\n')).not.toContain('divorce');
    // Et les lecteurs du socle (respirations, sections) ne reçoivent AUCUN fait du Discovery.
    const socle = await readSocleFacts(b.client, U);
    expect(socle.filter((f) => f.factType.startsWith('discovery.'))).toEqual([]);
    expect(JSON.stringify(socle)).not.toContain('divorce');
  });
  it('un fait lu dans une réponse libre est marqué non confirmé', () => {
    expect(faitsDiscoveryPourPortrait([fait('velo', 'factuelle', 'inferred')]).lignes[0]).toMatch(/lu dans une réponse libre — non confirmé/);
  });
  it('deux déclarations opposées sur la même chose : rendues ensemble, marquées, non départagées', () => {
    const r = faitsDiscoveryPourPortrait([fait('velo', 'factuelle'), fait('velo', 'rejet')]);
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes[0]).toMatch(/DÉCLARATIONS CONTRADICTOIRES \(factuelle \/ rejet\) — ne rien affirmer/);
  });
  it('une réponse de projet n’est pas une connaissance générale ; un fait d’une question disparue n’est pas deviné', () => {
    const r = faitsDiscoveryPourPortrait([
      { factType: 'discovery.reponse_de_projet', assertionStatus: 'explicit', value: '{}' },
      { factType: 'discovery.fait.x.y', assertionStatus: 'explicit', value: JSON.stringify({ valeur: 'a', question: 'inconnue.0000' }) },
      { factType: 'discovery.fait.x.z', assertionStatus: 'explicit', value: 'pas du json' },
    ]);
    expect(r.lignes).toEqual([]);
    expect(r.ecartes).toMatchObject({ reponsesDeProjet: 1, illisibles: 2 });
  });
  it('le nombre de lignes est borné, et ce qui dépasse est compté', () => {
    const r = faitsDiscoveryPourPortrait(Array.from({ length: PLAFOND_FAITS_PORTRAIT + 7 }, (_, i) => fait(`sport${i}`)));
    expect(r.lignes).toHaveLength(PLAFOND_FAITS_PORTRAIT);
    expect(r.ecartes.auDelaDuPlafond).toBe(7);
  });
});
