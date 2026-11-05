"use client";

// EXTRACTION AU CHAMP, PAS À LA PAGE (décision 26 oct). Les réponses libres sont sur une même page ;
// chaque champ, QUAND ON LE QUITTE (blur), (1) ENREGISTRE SON VERBATIM — l'autorité — puis (2) lance son
// extraction §27. Le temps d'arriver au dernier champ, les premiers sont analysés : plus de rafale de 11.
//
// ⚠ RÈGLE VERROUILLÉE (hsg) : le VERBATIM est l'autorité ; une inférence ne peut PAS exister sans lui.
// Donc ici : le verbatim est écrit AVANT que l'extraction parte, ou l'extraction ne part pas. JAMAIS
// d'inférence orpheline — même si on quitte la page en cours de route. Verbatim et extraction sont PAIRÉS
// par (champ, valeur) : une réécriture crée un nouveau couple (les deux superseded ensemble, jamais l'un sans
// l'autre). La supersession des versions relève du lot « correction d'un FACT » (trois sorts).
//
// Chaque champ PORTE SON ÉTAT (à faire / en cours / faite / échouée), visible discrètement. À la validation,
// on attend ce qui reste en cours (un ou deux champs). Ce qui a échoué est rejoué à la visite suivante
// (rattrapage paresseux, comme la régénération des textes) : au montage, on relance les champs non faits.
//
// Le CONTRÔLEUR est pur (aucun React) → testable sans navigateur. Le hook `useFieldExtraction` l'enveloppe.

export type FieldExtractionStatus = 'idle' | 'pending' | 'extracting' | 'done' | 'failed';

/** Séparateur de clé composite IMPRIMABLE (décision Estelle 5 nov) — remplace l'ancien octet NUL (0x00),
 *  qui classait « binaires » les fichiers porteurs et faisait sauter grep/file/diffs en silence. JAMAIS
 *  persisté : la clé ne vit qu'en mémoire, reconstruite des colonnes question_text/raw_text à la reprise.
 *  Doit seulement être ABSENT des opérandes (libellé/valeur) — ce jeton l'est. Source unique du séparateur. */
export const FIELD_KEY_SEP = '__CANDICE_KEYSEP__';

/** Clé d'identité : (libellé du champ, valeur exacte). */
const doneKey = (fieldContext: string, value: string) => `${fieldContext}${FIELD_KEY_SEP}${value}`;

export interface FieldCommitDeps {
  /** VERBATIM (autorité) — écrit la réponse brute telle quelle. DOIT throw si échec → l'extraction ne part PAS. */
  commit: (fieldKey: string, fieldContext: string, rawText: string) => Promise<void>;
  /** INFÉRENCE §27 — ne part QU'APRÈS un commit réussi. Throw si échec (→ 'failed', rejouable). `fieldKey`
   * identifie le champ (→ factType stable côté appelant, pour la supersession). */
  extract: (fieldKey: string, fieldContext: string, rawText: string) => Promise<void>;
  /** Notifié à chaque transition avec la map complète key→statut (alimente le rendu). */
  onChange: (status: Record<string, FieldExtractionStatus>) => void;
}

export class FieldExtractionController {
  private status = new Map<string, FieldExtractionStatus>();
  private inflight = new Map<string, Promise<void>>();
  private sent = new Map<string, string>(); // fieldKey → dernière valeur envoyée (trim)
  private committed = new Set<string>(); // doneKey → verbatim écrit
  private done = new Set<string>(); // doneKey → verbatim + extraction faits

  constructor(private deps: FieldCommitDeps) {}

  /** Alimente le déjà-fait lu du journal : `committed` = verbatim présent, `done` = extraction présente. */
  seed(opts: { committed?: Iterable<string>; done?: Iterable<string> }) {
    if (opts.committed) this.committed = new Set(opts.committed);
    if (opts.done) {
      this.done = new Set(opts.done);
      for (const k of this.done) this.committed.add(k); // une extraction présente implique son verbatim
    }
  }

  statusFor(fieldKey: string): FieldExtractionStatus {
    return this.status.get(fieldKey) ?? 'idle';
  }

  private emit() {
    this.deps.onChange(Object.fromEntries(this.status));
  }

  private set(fieldKey: string, s: FieldExtractionStatus) {
    this.status.set(fieldKey, s);
    this.emit();
  }

  /**
   * Au blur d'un champ (et au montage pour le rattrapage). Idempotent sur une valeur inchangée.
   * ORDRE GARANTI : commit (verbatim) → extract (inférence). Si le commit échoue, l'extraction ne part pas.
   */
  fire(fieldKey: string, fieldContext: string, value: string) {
    const v = value.trim();
    if (!v) return; // rien à écrire
    const k = doneKey(fieldContext, v);
    if (this.done.has(k)) { this.set(fieldKey, 'done'); return; } // verbatim + extraction déjà faits
    if (this.sent.get(fieldKey) === v) return; // même valeur déjà en cours → pas de doublon
    this.sent.set(fieldKey, v);
    this.set(fieldKey, 'extracting');
    // Commit SEULEMENT s'il n'a pas déjà réussi (retry après échec d'extraction ne réécrit pas le verbatim).
    const ensureCommit = this.committed.has(k)
      ? Promise.resolve()
      : this.deps.commit(fieldKey, fieldContext, v).then(() => { this.committed.add(k); });
    const p = ensureCommit
      .then(() => this.deps.extract(fieldKey, fieldContext, v)) // inférence APRÈS verbatim, jamais avant
      .then(() => { this.done.add(k); this.set(fieldKey, 'done'); })
      .catch(() => { this.sent.delete(fieldKey); this.set(fieldKey, 'failed'); }) // rejouable au prochain blur/visite
      .finally(() => { this.inflight.delete(fieldKey); });
    this.inflight.set(fieldKey, p);
  }

  /** Attend la fin de ce qui est EN COURS (validation de page) — jamais rejeté, best-effort. */
  async awaitPending(): Promise<void> {
    await Promise.allSettled([...this.inflight.values()]);
  }

  /** Nombre de champs pas encore 'done' (en cours / en attente / échoués). */
  pendingCount(): number {
    let n = 0;
    for (const s of this.status.values()) if (s !== 'done' && s !== 'idle') n++;
    return n;
  }
}

import { useEffect, useMemo, useState } from 'react';

export interface UseFieldExtractionOpts {
  readonly fields: readonly { key: string; fieldContext: string }[];
  readonly valueOf: (key: string) => string;
  readonly commit: (fieldKey: string, fieldContext: string, rawText: string) => Promise<void>;
  readonly extract: (fieldKey: string, fieldContext: string, rawText: string) => Promise<void>;
  /** Charge le déjà-fait du journal (verbatim / extraction). Omis → rien de pré-fait. */
  readonly loadState?: () => Promise<{ committed?: Iterable<string>; done?: Iterable<string> }>;
}

/**
 * Enveloppe React. Au MONTAGE : charge le déjà-fait (rattrapage) puis relance commit+extract des champs
 * non faits dont la valeur n'est pas vide. Expose `status`, `onFieldBlur` (au blur) et `awaitPending`
 * (avant de valider la page).
 */
export function useFieldExtraction(opts: UseFieldExtractionOpts) {
  const [status, setStatus] = useState<Record<string, FieldExtractionStatus>>({});
  const ctl = useMemo(
    () => new FieldExtractionController({ commit: opts.commit, extract: opts.extract, onChange: setStatus }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (opts.loadState) {
        try { const st = await opts.loadState(); if (!cancelled) ctl.seed(st); } catch { /* journal illisible → tout sera (re)tenté */ }
      }
      if (cancelled) return;
      for (const f of opts.fields) {
        const v = opts.valueOf(f.key);
        if (v.trim()) ctl.fire(f.key, f.fieldContext, v); // rattrapage
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    onFieldBlur: (key: string, fieldContext: string, value: string) => ctl.fire(key, fieldContext, value),
    awaitPending: () => ctl.awaitPending(),
  };
}
