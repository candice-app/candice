import { fauxClientLecture } from '../../../knowledge/__tests__/faux-client';
import { describe, it, expect, vi } from 'vitest';
import { enregistrerReponseFermee, enregistrerReponseOuverte, cleOption, ReponseInvalideError } from '../service';
import { BANQUE } from '../banque';
import { produireDepuisOption } from '../produire';

// CE QUI PART VRAIMENT DANS LA BASE.
//
// Le client est remplacé par un espion : on vérifie la CHARGE envoyée à `persist_journal`,
// pas le fait que la fonction n'ait pas levé. Un test qui se contente de « ça n'a pas
// explosé » ne dit rien de ce qui a été écrit.

const faux = (tables: Record<string, readonly unknown[]> = {}) => {
  const appels: { fn: string; args: Record<string, unknown> }[] = [];
  return {
    appels,
    client: {
      // Les lectures passent par un faux client qui APPLIQUE les filtres (réponses déjà
      // données à la question) ; les écritures restent espionnées.
      from: fauxClientLecture(tables).from,
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
    // LA MÊME RÉPONSE A LA MÊME SOURCE : l'identité vient de ce qui a été choisi.
    const a = faux(); const ra = await enregistrerReponseFermee(a.client, commun);
    const b = faux(); const rb = await enregistrerReponseFermee(b.client, { ...commun, timestamp: '2026-11-18T09:00:00.000Z' });
    const ids = (x: typeof a) => (x.appels[0].args.p_evidences as Record<string, unknown>[]).map((e) => e.id ?? e.evidence_id);
    expect(ids(a).length).toBeGreaterThan(0);
    expect(rb.sourceId).toBe(ra.sourceId);
    expect(ids(b)).toEqual(ids(a));
    // Et quand elle est déjà au journal, encore vivante : rien n'est réécrit (double envoi).
    const c = faux({
      knowledge_sources: [{ id: ra.sourceId, user_id: commun.userId, source_type: 'discovery_closed', question_code: q.id }],
      knowledge_evidences: [{ id: 'e1', source_id: ra.sourceId, superseded_at: null }],
    });
    const rc = await enregistrerReponseFermee(c.client, commun);
    expect(rc).toMatchObject({ dejaFaite: true, preuvesEcrites: 0, sourceId: ra.sourceId });
    expect(c.appels).toHaveLength(0);
    // La même réponse, mais supersédée entre-temps : un nouveau dernier mot, une nouvelle source.
    const d = faux({
      knowledge_sources: [{ id: ra.sourceId, user_id: commun.userId, source_type: 'discovery_closed', question_code: q.id }],
      knowledge_evidences: [{ id: 'e1', source_id: ra.sourceId, superseded_at: '2026-11-17T13:00:00.000Z' }],
    });
    // (l'écriture de la supersession n'est pas jouée par ce faux client : elle est prouvée sur
    //  la pile locale, script 31.)
    await expect(enregistrerReponseFermee(d.client, commun)).rejects.toThrow();
    expect(d.appels).toHaveLength(1);
    expect((d.appels[0].args.p_source as { id?: string } | undefined)?.id ?? JSON.stringify(d.appels[0].args)).not.toBe(ra.sourceId);
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

describe('une réponse ouverte : le verbatim d’abord, l’extraction ensuite', () => {
  // L'ordre n'est pas interchangeable. Une extraction écrite sans son verbatim est une
  // inférence ORPHELINE : elle affirme quelque chose sans que la phrase dont elle est tirée
  // existe quelque part.
  it('refuse une question ouverte sans inférences interdites', async () => {
    const { client } = faux();
    const ouverteSansBarriere = BANQUE.find((q) => q.forme === 'open' && !q.inferences_interdites
      && !q.options.some((o) => o.inferences_interdites));
    // La banque les écarte à l'import : il ne doit y en avoir AUCUNE.
    expect(ouverteSansBarriere, 'une question ouverte sans barrière est dans la banque').toBeUndefined();
    // Et le service refuserait quand même, si une passait un jour.
    await expect(enregistrerReponseOuverte(client, {
      userId: '00000000-0000-4000-8000-000000000001',
      questionId: 'question-inexistante', texte: 'quelque chose',
    })).rejects.toThrow(ReponseInvalideError);
  });

  it('refuse une réponse vide, et une question fermée', async () => {
    const ouverte = BANQUE.find((q) => q.forme === 'open')!;
    const fermee = questionFermeeProductive();
    const { client } = faux();
    await expect(enregistrerReponseOuverte(client, {
      userId: '00000000-0000-4000-8000-000000000001', questionId: ouverte.id, texte: '   ',
    })).rejects.toThrow(ReponseInvalideError);
    await expect(enregistrerReponseOuverte(client, {
      userId: '00000000-0000-4000-8000-000000000001', questionId: fermee.id, texte: 'du texte',
    })).rejects.toThrow(ReponseInvalideError);
  });
});

// ── AJOUT DU 18 NOV. — une preuve par OPTION, et plus aucun DRIVER dans la banque.
import { BANQUE as BANQUE_R2, question as questionR2 } from '../banque';
import { produireDepuisOption as produireR2 } from '../produire';
import { cleOption as cleR2 } from '../service';
import { evidenceId as evidenceIdR2 } from '@/lib/knowledge-write/ids';

describe('révision 2 — valeurs recherchées', () => {
  const toutes = ((BANQUE_R2 as unknown as { questions?: unknown[] }).questions ?? BANQUE_R2) as
    { id: string; forme: string; options: { famille?: string }[] }[];

  it('la banque active ne contient plus aucune option DRIVER ni NEED', () => {
    const n = toutes.flatMap((q) => q.options).filter((o) => o.famille === 'DRIVER' || o.famille === 'NEED').length;
    expect(n).toBe(0);
  });

  it('« leur fidélité » chez les animaux est une préférence de contexte, avec sa valeur', () => {
    const q = questionR2('animals.2131')!;
    const o = q.options.find((x) => x.libelle === 'Leur fidélité')!;
    const p = produireR2(q, o);
    expect(p.type).toBe('evidence');
    if (p.type !== 'evidence') return;
    expect(p.evidence.target_family).toBe('PREFERENCE');
    expect(p.evidence.target_construct).toBe('PREFERENCE.animals.value_sought');
    expect((p.evidence as { preferenceValue?: string }).preferenceValue).toBe('leur_fidelite');
  });

  it('dans TOUTE la banque, deux options d’une même question n’ont jamais le même identifiant de preuve', () => {
    // Le défaut mesuré le 18 nov. : l'identifiant ne dépendait que de la cible, et 5 390
    // options de 643 questions multiples s'écrasaient entre elles à l'écriture.
    let collisions = 0;
    for (const q of toutes) {
      if (q.forme === 'open') continue;
      const ids = new Set<string>(); let n = 0;
      for (const o of (q as never as { options: never[] }).options) {
        const p = produireR2(q as never, o);
        if (p.type !== 'evidence') continue;
        n++;
        ids.add(evidenceIdR2('s', `${p.evidence.target_family}:${p.evidence.target_construct}:${cleR2(o)}`));
      }
      if (ids.size !== n) collisions++;
    }
    expect(collisions).toBe(0);
  });
});
