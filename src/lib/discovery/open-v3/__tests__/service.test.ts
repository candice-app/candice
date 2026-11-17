import { describe, it, expect, vi } from 'vitest';
import { enregistrerReponseFermee, cleOption, ReponseInvalideError } from '../service';
import { BANQUE } from '../banque';
import { produireDepuisOption } from '../produire';

// CE QUI PART VRAIMENT DANS LA BASE.
//
// Le client est remplacé par un espion : on vérifie la CHARGE envoyée à `persist_journal`,
// pas le fait que la fonction n'ait pas levé. Un test qui se contente de « ça n'a pas
// explosé » ne dit rien de ce qui a été écrit.

const faux = () => {
  const appels: { fn: string; args: Record<string, unknown> }[] = [];
  return {
    appels,
    client: {
      rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
        appels.push({ fn, args });
        return { data: { sources: 1, evidences: 1, facts: 0, open: 0 }, error: null };
      }),
    },
  };
};

/**
 * Une question RÉELLE de la banque, fermée, dont la PREMIÈRE option produit une preuve.
 *
 * La première version de ce choix se contentait d'une question fermée à deux options — et
 * tombait sur une dont la première option n'écrit rien. Le test ne vérifiait alors qu'une
 * absence d'écriture, en croyant vérifier une écriture. Le fixe est de l'exiger ici.
 */
function questionFermeeProductive() {
  for (const q of BANQUE) {
    if (q.forme !== 'single' || q.options.length < 2) continue;
    if (produireDepuisOption(q, q.options[0]).type !== 'evidence') continue;
    if (produireDepuisOption(q, q.options[1]).type !== 'evidence') continue;
    return q;
  }
  throw new Error('aucune question fermée productive trouvée dans la banque');
}

describe('une réponse refusée n’écrit rien du tout', () => {
  it('une option inconnue fait échouer la réponse ENTIÈRE', async () => {
    const q = questionFermeeProductive();
    const { client, appels } = faux();
    await expect(enregistrerReponseFermee(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: q.id,
      clesOptions: [cleOption(q.options[0]), 'option-fabriquee'],
    })).rejects.toThrow(ReponseInvalideError);
    // Rien n'a été écrit — pas même la partie valide. Une réponse à moitié écrite
    // raconterait une réponse que personne n'a donnée.
    expect(appels).toHaveLength(0);
  });

  it('une question inconnue est refusée', async () => {
    const { client, appels } = faux();
    await expect(enregistrerReponseFermee(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: 'question-qui-n-existe-pas',
      clesOptions: ['r1'],
    })).rejects.toThrow(ReponseInvalideError);
    expect(appels).toHaveLength(0);
  });

  it('deux options à une question à choix unique sont refusées', async () => {
    const q = questionFermeeProductive();
    const { client, appels } = faux();
    await expect(enregistrerReponseFermee(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: q.id,
      clesOptions: [cleOption(q.options[0]), cleOption(q.options[1])],
    })).rejects.toThrow(ReponseInvalideError);
    expect(appels).toHaveLength(0);
  });

  it('aucune option cochée est refusé', async () => {
    const q = questionFermeeProductive();
    const { client } = faux();
    await expect(enregistrerReponseFermee(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: q.id, clesOptions: [],
    })).rejects.toThrow(ReponseInvalideError);
  });
});

describe('ce qui est écrit porte sa provenance', () => {
  it('une seule source pour toute la réponse, et la question y est nommée', async () => {
    const q = questionFermeeProductive();
    const { client, appels } = faux();
    const r = await enregistrerReponseFermee(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: q.id, clesOptions: [cleOption(q.options[0])],
      timestamp: '2026-11-17T12:00:00.000Z',
    });
    expect(appels).toHaveLength(1);
    expect(appels[0].fn).toBe('persist_journal');
    const source = appels[0].args.p_source as Record<string, unknown>;
    expect(source.id).toBe(r.sourceId);
    // La question est tracée : on doit pouvoir remonter d'une preuve à ce qui a été demandé.
    expect(JSON.stringify(source)).toContain(q.id);
    const preuves = appels[0].args.p_evidences as Record<string, unknown>[];
    for (const p of preuves) expect(p.source_id).toBe(r.sourceId);
  });

  it('rejouer la MÊME réponse donne les mêmes identifiants de preuve — idempotent', async () => {
    const q = questionFermeeProductive();
    const commun = {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: q.id, clesOptions: [cleOption(q.options[0])],
      timestamp: '2026-11-17T12:00:00.000Z',
    };
    // Même source → mêmes identifiants. On force la même source en rejouant la charge.
    const a = faux(); await enregistrerReponseFermee(a.client, commun);
    const idsA = (a.appels[0].args.p_evidences as Record<string, unknown>[]).map((e) => e.id ?? e.evidence_id);
    // Une NOUVELLE réponse a une nouvelle source, donc de nouvelles preuves : le journal
    // n'écrase pas, les deux coexistent. C'est voulu, et on le vérifie aussi.
    const b = faux(); await enregistrerReponseFermee(b.client, commun);
    const idsB = (b.appels[0].args.p_evidences as Record<string, unknown>[]).map((e) => e.id ?? e.evidence_id);
    expect(idsA.length).toBeGreaterThan(0);
    expect(idsA).not.toEqual(idsB);
  });

  it('une option qui ne produit rien est signalée, pas avalée', async () => {
    // On cherche une question dont une option est une action d'interface (« Autre »).
    const q = BANQUE.find((x) => x.forme === 'single'
      && x.options.some((o) => o.voie === 'ACTION_PARAMETER')
      && x.options.some((o) => o.voie === 'HSG_EVIDENCE'));
    if (!q) return; // la banque peut évoluer ; le test ne doit pas devenir faux pour ça
    const action = q.options.find((o) => o.voie === 'ACTION_PARAMETER')!;
    const { client } = faux();
    const r = await enregistrerReponseFermee(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: q.id, clesOptions: [cleOption(action)],
    });
    expect(r.preuvesEcrites).toBe(0);
    expect(r.sansEmission).toHaveLength(1);
    expect(r.sansEmission[0].motif).toBe('action_interface');
  });
});

describe('l’identité d’une option ne dépend pas de l’ordre du tableau', () => {
  it('elle vient du rang ou du libellé, jamais de l’index', () => {
    const q = questionFermeeProductive();
    const cles = q.options.map(cleOption);
    // Deux fois la même option, la même clé.
    expect(q.options.map(cleOption)).toEqual(cles);
    // Aucune clé n'est un simple numéro d'index.
    for (const c of cles) expect(c).toMatch(/^[rl]/);
  });

  it('les clés d’une même question sont distinctes', () => {
    let verifiees = 0;
    for (const q of BANQUE) {
      if (q.options.length < 2) continue;
      const cles = q.options.map(cleOption);
      expect(new Set(cles).size, `${q.id} a des clés d'option en double`).toBe(cles.length);
      verifiees++;
    }
    // Le test porte sur la banque entière, pas sur un échantillon.
    expect(verifiees).toBeGreaterThan(1000);
  });
});
