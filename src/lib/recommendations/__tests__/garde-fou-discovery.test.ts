import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../knowledge/__tests__/fausse-base';
import { lireRejetsDuProche, PORTEE_EXCLUSIONS_RECO } from '../declarations-proche';
import { candidateRejectedBy } from '../rejection-match';

const PILOTE = 'pilote-1', PROCHE = 'proche-1', CONTACT = 'contact-1';
const base = (evidences: Record<string, unknown>[], sources: Record<string, unknown>[]) => fausseBase({
  contacts: [{ id: CONTACT, user_id: PILOTE, proche_user_id: PROCHE }],
  contact_consents: [{ id: 'c1', pilote_id: PILOTE, contact_id: CONTACT, proche_user_id: PROCHE, kind: 'profile_usage', status: 'active', scope: [PORTEE_EXCLUSIONS_RECO], granted_by: PROCHE }],
  knowledge_evidences: evidences.map((e, i) => ({ id: `e${i}`, user_id: PROCHE, about_kind: 'account', superseded_at: null, assertion_status: 'explicit', ...e })),
  knowledge_sources: sources,
});

describe('un garde-fou écrit par le Discovery ne retire pas des idées au hasard', () => {
  const chemin = 'shoe.gift_openness.cadeau_chaussures_refuse';
  it('le défaut : apparié mot à mot, ce chemin technique retirerait toute idée qui dit « cadeau »', () => {
    expect(candidateRejectedBy('Un cadeau pour son anniversaire : un livre de cuisine', [{ label: chemin, family: 'GUARDRAIL', severity: 'SOFT' }])).not.toBeNull();
  });
  it('il n’est donc pas rendu comme rejet, et il est compté ; un garde-fou déclaré ailleurs reste rendu', async () => {
    const b = base(
      [{ source_id: 's-disc', target_family: 'GUARDRAIL', target_construct: chemin, severity: 'SOFT' },
       { source_id: 's-onb', target_family: 'GUARDRAIL', target_construct: 'fleurs coupées', severity: 'SOFT' }],
      [{ id: 's-disc', source_type: 'discovery_closed' }, { id: 's-onb', source_type: 'onboarding_closed' }]);
    const r = await lireRejetsDuProche(b.client, { piloteId: PILOTE, contactId: CONTACT });
    expect(r.autorise).toBe(true);
    expect(r.rejets.map((x) => x.label)).toEqual(['fleurs coupées']);
    expect(r.ecartesSansDeclaration).toEqual({ garde_fou_discovery_sans_objet_appariable: 1 });
  });
});
