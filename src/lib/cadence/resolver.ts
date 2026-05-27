import type { SupabaseClient } from '@supabase/supabase-js';
import type { CadenceLevel } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

export const CADENCE_STEPS: CadenceLevel[] = ['discreet', 'normal', 'sustained', 'intense'];

export const FREQUENCY_DAYS: Record<CadenceLevel, number> = {
  discreet:  30,
  normal:    14,
  sustained:  7,
  intense:    3,
};

export const CADENCE_LABELS: Record<CadenceLevel, { label: string; description: string }> = {
  discreet:  { label: 'Discret',   description: '1 attention par mois' },
  normal:    { label: 'Normal',    description: '1 attention toutes les 2 semaines' },
  sustained: { label: 'Soutenu',  description: '1 attention par semaine' },
  intense:   { label: 'Intense',   description: '1 attention tous les 3 jours' },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CadenceFactors {
  base: CadenceLevel;
  global_preference?: CadenceLevel;
  contact_override?: CadenceLevel;
  difficult_period: boolean;
  active_high_signal: boolean;
}

export interface CadenceResolution {
  cadence: CadenceLevel;
  frequencyDays: number;
  reason: string;
  factors: CadenceFactors;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shiftCadence(base: CadenceLevel, delta: number): CadenceLevel {
  const idx = CADENCE_STEPS.indexOf(base);
  return CADENCE_STEPS[Math.max(0, Math.min(3, idx + delta))] ?? base;
}

const PROXIMITY_BASE: Record<string, CadenceLevel> = {
  inner_circle: 'sustained',
  close:        'normal',
  extended:     'normal',
  distant:      'discreet',
};

const REGISTER_BASE: Record<string, CadenceLevel> = {
  'très_proche_fluide':     'sustained',
  'proche_quotidien':       'sustained',
  'importante_distante':    'normal',
  'compliquée_fragile':     'discreet',
  'formelle_occasionnelle': 'discreet',
  'je_ne_sais_pas':         'discreet',
};

const GLOBAL_PREF_SHIFT: Record<string, number> = {
  discreet:  -1,
  normal:     0,
  sustained:  1,
  intense:    1,
};

// ─── Main export ─────────────────────────────────────────────────────────────

export async function resolveCadenceForContact(
  userId: string,
  contactId: string,
  supabaseAdmin: SupabaseClient
): Promise<CadenceResolution> {
  const today = new Date();

  const [{ data: contact }, { data: myProfile }] = await Promise.all([
    supabaseAdmin
      .from('contacts')
      .select('proximity_level, cadence_override, relationship, last_suggestion_at, relationship_register')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single(),
    supabaseAdmin
      .from('my_profile')
      .select('cadence_preference, pilote_difficult_period_until')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const proximity = (contact?.proximity_level as string | null) ?? 'close';
  const register = (contact?.relationship_register as string | null) ?? null;
  const reasons: string[] = [];
  const factors: CadenceFactors = {
    base: 'normal',
    difficult_period: false,
    active_high_signal: false,
  };

  // Niveau 1 : cadence de base — register primes over proximity_level
  let computed: CadenceLevel;
  if (register && REGISTER_BASE[register]) {
    computed = REGISTER_BASE[register];
    reasons.push(`register:${register}`);
  } else {
    computed = PROXIMITY_BASE[proximity] ?? 'normal';
    reasons.push(`base:${computed}`);
  }
  factors.base = computed;

  // Niveau 2a : modulation par cadence_preference globale du Pilote
  const globalPref = myProfile?.cadence_preference as CadenceLevel | null | undefined;
  if (globalPref && globalPref !== 'normal') {
    const shift = GLOBAL_PREF_SHIFT[globalPref] ?? 0;
    if (shift !== 0) {
      computed = shiftCadence(computed, shift);
      factors.global_preference = globalPref;
      reasons.push(`global_pref:${globalPref}`);
    }
  }

  // Niveau 2b : override spécifique au contact (écrase tout sauf période difficile)
  const override = contact?.cadence_override as CadenceLevel | null | undefined;
  if (override) {
    computed = override;
    factors.contact_override = override;
    reasons.push(`contact_override:${override}`);
  }

  // Niveau 3 : modulation contextuelle
  // 3a — Période difficile du Pilote : force discreet
  const difficultUntil = myProfile?.pilote_difficult_period_until;
  if (difficultUntil && new Date(difficultUntil) > today) {
    computed = 'discreet';
    factors.difficult_period = true;
    reasons.push('pilote_difficult_period');
  } else {
    // 3b — Signal high/urgent actif sur ce contact dans les 7 derniers jours : +1 cran
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const { data: activeSignals } = await supabaseAdmin
      .from('contextual_signals')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .in('priority', ['high', 'urgent'])
      .eq('status', 'active')
      .gte('trigger_date', sevenDaysAgo)
      .limit(1);

    if (activeSignals?.length) {
      computed = shiftCadence(computed, 1);
      factors.active_high_signal = true;
      reasons.push('active_high_signal');
    }
  }

  const reason = reasons.join(', ');

  // Journal de la décision
  await supabaseAdmin.from('cadence_log').insert({
    user_id: userId,
    contact_id: contactId,
    computed_cadence: computed,
    reason,
    factors,
  });

  return {
    cadence: computed,
    frequencyDays: FREQUENCY_DAYS[computed],
    reason,
    factors,
  };
}
