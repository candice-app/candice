import { describe, it, expect, afterEach } from 'vitest';
import { estAppelPlanifie } from '../auth';

const appel = (v: string | null) => ({ headers: { get: (n: string) => (n.toLowerCase() === 'authorization' ? v : null) } });
const avant = process.env.CRON_SECRET;
afterEach(() => { if (avant === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = avant; });

describe('une tâche planifiée ne s’ouvre qu’avec le secret', () => {
  it('secret absent : « Bearer undefined » ne passe pas', () => {
    delete process.env.CRON_SECRET;
    expect(estAppelPlanifie(appel('Bearer undefined'))).toBe(false);
    expect(estAppelPlanifie(appel('Bearer '))).toBe(false);
    expect(estAppelPlanifie(appel(null))).toBe(false);
  });
  it('secret vide ou trop court : personne ne passe, même avec la bonne valeur', () => {
    process.env.CRON_SECRET = '';
    expect(estAppelPlanifie(appel('Bearer '))).toBe(false);
    process.env.CRON_SECRET = 'court';
    expect(estAppelPlanifie(appel('Bearer court'))).toBe(false);
  });
  it('bon secret : passe ; mauvais, tronqué ou sans préfixe : non', () => {
    process.env.CRON_SECRET = 'un-secret-de-plus-de-seize';
    expect(estAppelPlanifie(appel('Bearer un-secret-de-plus-de-seize'))).toBe(true);
    expect(estAppelPlanifie(appel('Bearer un-secret-de-plus-de-seizE'))).toBe(false);
    expect(estAppelPlanifie(appel('Bearer un-secret-de-plus-de-seiz'))).toBe(false);
    expect(estAppelPlanifie(appel('un-secret-de-plus-de-seize'))).toBe(false);
  });
});
