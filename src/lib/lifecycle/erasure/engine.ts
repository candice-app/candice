// MOTEUR D'EFFACEMENT — machine à états, sur trace append-only (erasure_manifests).
//
//   TENTATIVE → ECHEC_PARTIEL (Storage incomplet : on NE touche PAS à la ligne Auth) | ACHEVEMENT_VERIFIE
//
// Invariants, dans l'ordre :
//   1. Le manifeste TENTATIVE est COMMIS AVANT toute action destructrice et AVANT la suppression Auth.
//   2. STORAGE D'ABORD, vérifié. La ligne auth.users n'est effacée QU'ENSUITE : les chemins restants se relisent
//      depuis cette ligne, l'effacer trop tôt rendrait la reprise impossible.
//   3. L'ACHÈVEMENT ne se déclare JAMAIS sans la passe de vérification des TROIS surfaces : Auth absent, Storage
//      vide, base (fermeture transitive via erasure_inventory) à zéro.
//   4. REPRISE : à l'échec, le résidu est conservé. Le passage suivant repart du RÉSIDU (attempt_no incrémenté,
//      inventory_before = résidu précédent), jamais de zéro.
//
// La garde de validité (parade « échéance orpheline ») vit en amont, dans le cron : ce moteur n'est appelé que pour
// une demande échue ET valide.
import type { SupabaseClient } from '@supabase/supabase-js';
import { effacerStockage, inventaireStorage, StorageInterrompu } from './storage';

export type StatutEffacement = 'ECHEC_PARTIEL' | 'ACHEVEMENT_VERIFIE';

export interface ResultatEffacement {
  readonly status: StatutEffacement;
  readonly attempt_no: number;
  readonly residue_after: Record<string, number>;
}

export interface ContexteEffacement {
  readonly runId: string | null;    // id du run de cron qui exécute cette tentative
  readonly requestedAt: string;     // my_profile.cancelled_at (ISO) — date de la demande
  readonly scheduledFor: string;    // my_profile.deletion_scheduled_at (ISO) — échéance
}

type Compteurs = Record<string, number>;

export async function effacerCompte(
  admin: SupabaseClient,
  userId: string,
  ctx: ContexteEffacement,
): Promise<ResultatEffacement> {
  // 1. REPRISE ? — lire la dernière tentative de ce compte.
  const { data: dernieres, error: eLire } = await admin
    .from('erasure_manifests')
    .select('attempt_no, status, residue_after')
    .eq('subject_user_id', userId)
    .order('attempt_no', { ascending: false })
    .limit(1);
  if (eLire) throw new Error(`[erasure] lecture des tentatives : ${eLire.message}`);
  const precedente = dernieres?.[0];
  const reprise = precedente?.status === 'ECHEC_PARTIEL';
  const attemptNo = reprise ? (precedente!.attempt_no as number) + 1 : 1;

  // inventory_before : à la reprise, EXACTEMENT le résidu précédent — c'est la preuve qu'on reprend et non qu'on
  // recommence. Sinon, l'inventaire Storage courant, juste avant la première action destructrice.
  const inventaireAvant: Compteurs = reprise
    ? ((precedente!.residue_after ?? {}) as Compteurs)
    : await inventaireStorage(admin, userId);

  // 2. MANIFESTE TENTATIVE — commis avant toute destruction et avant toute suppression Auth.
  const maintenant = new Date().toISOString();
  const { data: manifeste, error: eIns } = await admin
    .from('erasure_manifests')
    .insert({
      subject_user_id: userId,
      requested_at: ctx.requestedAt,
      scheduled_for: ctx.scheduledFor,
      attempted_at: maintenant,
      status: 'TENTATIVE',
      attempt_no: attemptNo,
      run_id: ctx.runId,
      inventory_before: inventaireAvant,
    })
    .select('id')
    .single();
  if (eIns || !manifeste) throw new Error(`[erasure] écriture TENTATIVE : ${eIns?.message}`);
  const manifesteId = manifeste.id as string;

  // 3. STORAGE D'ABORD — les deux formes d'échec sont attrapées.
  let interrompu = false;
  try {
    const r = await effacerStockage(admin, userId);
    if (r && r.error) interrompu = true; // forme silencieuse de la coupure (sans exception)
  } catch (e) {
    if (e instanceof StorageInterrompu) interrompu = true;
    else throw e; // un bug réel remonte au cron (run marqué en erreur) plutôt qu'un achèvement menteur
  }

  // 4. RÉSIDU RÉEL, relu depuis Storage (l'oracle, pas un compteur interne).
  const residu = await inventaireStorage(admin, userId);
  if (interrompu || Object.keys(residu).length > 0) {
    await marquer(admin, manifesteId, 'ECHEC_PARTIEL', residu,
      interrompu ? 'interruption pendant l’effacement Storage' : 'objets résiduels après effacement Storage');
    // ON N'APPELLE PAS deleteUser : les chemins restants se relisent depuis la ligne auth.
    return { status: 'ECHEC_PARTIEL', attempt_no: attemptNo, residue_after: residu };
  }

  // 5. Storage vérifié vide → SEULEMENT MAINTENANT la ligne Auth (déclenche les cascades DB).
  const { error: eDel } = await admin.auth.admin.deleteUser(userId);
  if (eDel) {
    await marquer(admin, manifesteId, 'ECHEC_PARTIEL', {}, `deleteUser : ${eDel.message}`);
    return { status: 'ECHEC_PARTIEL', attempt_no: attemptNo, residue_after: {} };
  }

  // 6. PASSE DE VÉRIFICATION — les TROIS surfaces. L'achèvement ne se déclare jamais sans elle.
  const { data: apresAuth } = await admin.auth.admin.getUserById(userId);
  if (apresAuth?.user) throw new Error('[erasure] compte Auth encore présent après deleteUser — invariant rompu');

  const residuApres = await inventaireStorage(admin, userId);
  if (Object.keys(residuApres).length > 0) {
    throw new Error('[erasure] Storage non vide après deleteUser — invariant rompu');
  }

  const { data: inv, error: eInv } = await admin.rpc('erasure_inventory', { p_user_id: userId });
  if (eInv) throw new Error(`[erasure] vérification base (erasure_inventory) : ${eInv.message}`);
  const invCompteurs = (inv ?? {}) as Compteurs;
  const totalBase = Object.values(invCompteurs).reduce((a, b) => a + Number(b), 0);
  if (totalBase !== 0) {
    // La cascade n'a pas tout emporté : surface le résidu base, ne mens pas sur l'achèvement.
    await marquer(admin, manifesteId, 'ECHEC_PARTIEL', invCompteurs, 'lignes résiduelles en base après cascade');
    return { status: 'ECHEC_PARTIEL', attempt_no: attemptNo, residue_after: invCompteurs };
  }

  // 7. Les trois surfaces sont vides → ACHEVEMENT_VERIFIE.
  await marquer(admin, manifesteId, 'ACHEVEMENT_VERIFIE', {}, null);
  return { status: 'ACHEVEMENT_VERIFIE', attempt_no: attemptNo, residue_after: {} };
}

async function marquer(
  admin: SupabaseClient,
  manifesteId: string,
  status: StatutEffacement,
  residu: Compteurs,
  erreur: string | null,
): Promise<void> {
  const { error } = await admin
    .from('erasure_manifests')
    .update({ status, residue_after: residu, error_message: erreur })
    .eq('id', manifesteId);
  if (error) throw new Error(`[erasure] écriture ${status} : ${error.message}`);
}
