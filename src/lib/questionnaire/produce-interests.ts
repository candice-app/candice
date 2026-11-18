// LES CENTRES D'INTÉRÊT COCHÉS À L'ONBOARDING ENTRENT DANS LE JOURNAL.
//
// CONSTAT DU 18 NOV. L'écran des centres d'intérêt (treize catégories) enregistrait le choix
// dans `my_profile.singularity_answers` et nulle part ailleurs : `produceInterest` existait,
// éprouvé, et aucun chemin ne l'appelait. Le journal ne recevait donc AUCUN intérêt de
// l'onboarding — et le Discovery, qui lit le journal, n'avait rien pour ouvrir une branche.
// Mesuré sur les dix comptes fictifs : 0 branche ouverte, 0 question proposée.
//
// CE QUE CE FICHIER FAIT. Un intérêt par catégorie cochée, écrit sous l'identité du compte.
//   · Le SUJET est l'identifiant de la catégorie (`cuisine`, `voyage`) : stable, il ne
//     change pas si le libellé affiché est retouché. Le libellé voyage à côté, tel qu'affiché.
//   · AUCUN degré : cocher une catégorie ne dit pas à quel point on y tient.
//   · L'identifiant de source est DÉRIVÉ (compte + catégorie) : repasser par l'écran ne
//     réécrit rien. Décocher une catégorie ne retire pas encore l'intérêt — c'est une
//     correction, et les corrections ont leur propre chemin (supersession), pas celui-ci.
import { produceInterest } from '@/lib/knowledge-write/produce';
import { persistKnowledge, type WriteClient } from '@/lib/knowledge-write/persist';
import { evidenceId } from '@/lib/knowledge-write/ids';
import { accountAbout, asUserId } from '@/lib/knowledge/identity';

export interface CategorieCochee { readonly id: string; readonly label: string }

export async function produireInteretsOnboarding(
  client: WriteClient,
  input: { readonly userId: string; readonly categories: readonly CategorieCochee[]; readonly timestamp: string },
): Promise<number> {
  const ownerId = asUserId(input.userId);
  const about = accountAbout(ownerId);
  let ecrits = 0;
  for (const c of input.categories) {
    if (!c.id?.trim() || !c.label?.trim()) continue;
    const sourceId = evidenceId('onboarding-interet', `${input.userId}:${c.id}`);
    const w = produceInterest(
      { about, ownerId, sourceId, sourceType: 'onboarding_closed', timestamp: input.timestamp, confidence: 'high', stability: 'evolving' },
      c.label,
    );
    // Le sujet est l'identifiant de la catégorie, pas le libellé normalisé.
    const evidences = w.evidences.map((e) => ({ ...e, subject: c.id, target_construct: c.id, evidence_id: evidenceId(sourceId, `INTEREST:${c.id}`) }));
    await persistKnowledge(client, { source: w.source, evidences: evidences as never });
    ecrits++;
  }
  return ecrits;
}
