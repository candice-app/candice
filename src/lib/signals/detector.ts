import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveCadenceForContact } from '@/lib/cadence/resolver';

type ImportantDate = { label: string; date: string; isCustom?: boolean };

// ─── Date utilities (Europe/Paris) ──────────────────────────────────────────

function getTodayParis(): Date {
  const str = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysUntil(target: Date, today: Date): number {
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getNextOccurrence(month: number, day: number, today: Date): Date {
  const year = today.getFullYear();
  let d = new Date(year, month - 1, day);
  if (d < today) d = new Date(year + 1, month - 1, day);
  return d;
}

function parseDateStr(s: string): { month: number; day: number } | null {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { month: parseInt(iso[2]), day: parseInt(iso[3]) };
  const fr = s.match(/^(\d{1,2})\/(\d{1,2})\/\d{4}$/);
  if (fr) return { month: parseInt(fr[2]), day: parseInt(fr[1]) };
  return null;
}

// Last Sunday of May
function getLastSundayOfMay(year: number): Date {
  const d = new Date(year, 4, 31);
  const offset = d.getDay();
  return new Date(year, 4, 31 - (offset === 0 ? 0 : offset));
}

// 3rd Sunday of June
function getThirdSundayOfJune(year: number): Date {
  const first = new Date(year, 5, 1);
  const firstSundayOffset = (7 - first.getDay()) % 7;
  return new Date(year, 5, 1 + firstSundayOffset + 14);
}

function parseImportantDates(raw: string | null): ImportantDate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (d): d is ImportantDate =>
          typeof d === 'object' && d !== null && typeof d.label === 'string' && typeof d.date === 'string' && d.date.length >= 5
      );
    }
  } catch {}
  return [];
}

// ─── Deduplication ───────────────────────────────────────────────────────────

async function signalExists(
  supabaseAdmin: SupabaseClient,
  userId: string,
  contactId: string | null,
  signalType: string,
  triggerDate: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabaseAdmin
    .from('contextual_signals')
    .select('id')
    .eq('user_id', userId)
    .eq('signal_type', signalType)
    .eq('trigger_date', triggerDate)
    .in('status', ['active', 'consumed'])
    .limit(1);
  q = contactId === null ? q.is('contact_id', null) : q.eq('contact_id', contactId);
  const { data } = await q.maybeSingle();
  return !!data;
}

async function tryInsertSignal(
  supabaseAdmin: SupabaseClient,
  signal: {
    user_id: string;
    contact_id: string | null;
    signal_type: string;
    signal_data: Record<string, unknown>;
    trigger_date: string;
    priority: string;
    expires_at: string;
  }
): Promise<boolean> {
  const exists = await signalExists(
    supabaseAdmin,
    signal.user_id,
    signal.contact_id,
    signal.signal_type,
    signal.trigger_date
  );
  if (exists) return false;
  const { error } = await supabaseAdmin.from('contextual_signals').insert(signal);
  if (error) {
    console.error(`[detector] Insert error ${signal.signal_type}:`, error.message);
    return false;
  }
  return true;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function detectSignalsForUser(
  userId: string,
  supabaseAdmin: SupabaseClient
): Promise<{ signals_created: number }> {
  let signals_created = 0;

  const { data: myProfile } = await supabaseAdmin
    .from('my_profile')
    .select('has_children, cadence_preference, important_dates, pilote_difficult_period_until')
    .eq('user_id', userId)
    .maybeSingle();

  const hasChildren = !!myProfile?.has_children;

  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('id, name, relationship, proximity_level, last_suggestion_at, questionnaire_responses(important_dates)')
    .eq('user_id', userId)
    .is('archived_at', null);

  if (!contacts?.length) return { signals_created: 0 };

  const today = getTodayParis();
  const WINDOW = 14;

  for (const contact of contacts) {
    const profile = (contact.questionnaire_responses as { important_dates: string | null }[] | null)?.[0];
    const dates = parseImportantDates(profile?.important_dates ?? null);
    const proximity = (contact.proximity_level as string | null) ?? 'close';
    const relationship = contact.relationship as string;

    // ── A. Anniversaires de naissance ────────────────────────────────────────
    for (const entry of dates) {
      const label = entry.label.toLowerCase();
      const isBirthday =
        (label.includes('anniversaire') || label.includes('naissance') || label.includes('birthday')) &&
        !label.includes('mariage') && !label.includes('couple') && !label.includes('rencontre') && !label.includes('pacs');

      if (isBirthday) {
        const md = parseDateStr(entry.date);
        if (!md) continue;
        const target = getNextOccurrence(md.month, md.day, today);

        const configs = [
          { type: 'birthday_d7',    days: 7, priority: 'normal' },
          { type: 'birthday_d3',    days: 3, priority: 'high' },
          { type: 'birthday_d1',    days: 1, priority: 'high' },
          { type: 'birthday_today', days: 0, priority: 'urgent' },
        ];

        for (const cfg of configs) {
          const trigger = new Date(target);
          trigger.setDate(trigger.getDate() - cfg.days);
          const daysUntilTrigger = getDaysUntil(trigger, today);
          if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

          const expires = new Date(target);
          expires.setDate(expires.getDate() + (cfg.days === 0 ? 1 : 7));

          const ok = await tryInsertSignal(supabaseAdmin, {
            user_id: userId,
            contact_id: contact.id,
            signal_type: cfg.type,
            signal_data: { contact_name: contact.name, date_label: entry.label, birthday_date: dateToStr(target) },
            trigger_date: dateToStr(trigger),
            priority: cfg.priority,
            expires_at: dateToStr(expires),
          });
          if (ok) signals_created++;
        }
      }
    }

    // ── B. Anniversaires couple/mariage ──────────────────────────────────────
    if (relationship === 'partner') {
      for (const entry of dates) {
        const label = entry.label.toLowerCase();
        const isCoupleDate =
          label.includes('rencontre') || label.includes('couple') ||
          label.includes('mariage') || label.includes('pacs');
        if (!isCoupleDate) continue;

        const md = parseDateStr(entry.date);
        if (!md) continue;
        const target = getNextOccurrence(md.month, md.day, today);
        const isWedding = label.includes('mariage') || label.includes('pacs');
        const signalType = isWedding ? 'wedding_anniversary' : 'couple_anniversary';

        for (const cfg of [{ days: 7, priority: 'high' }, { days: 0, priority: 'urgent' }]) {
          const trigger = new Date(target);
          trigger.setDate(trigger.getDate() - cfg.days);
          const daysUntilTrigger = getDaysUntil(trigger, today);
          if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

          const expires = new Date(target);
          expires.setDate(expires.getDate() + 7);

          const ok = await tryInsertSignal(supabaseAdmin, {
            user_id: userId,
            contact_id: contact.id,
            signal_type: signalType,
            signal_data: { contact_name: contact.name, date_label: entry.label },
            trigger_date: dateToStr(trigger),
            priority: cfg.priority,
            expires_at: dateToStr(expires),
          });
          if (ok) signals_created++;
        }
      }
    }

    // ── C. Saint-Valentin ────────────────────────────────────────────────────
    if (relationship === 'partner') {
      const valentines = getNextOccurrence(2, 14, today);
      for (const cfg of [{ days: 7, priority: 'high' }, { days: 0, priority: 'urgent' }]) {
        const trigger = new Date(valentines);
        trigger.setDate(trigger.getDate() - cfg.days);
        const daysUntilTrigger = getDaysUntil(trigger, today);
        if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

        const expires = new Date(valentines);
        expires.setDate(expires.getDate() + 7);

        const ok = await tryInsertSignal(supabaseAdmin, {
          user_id: userId,
          contact_id: contact.id,
          signal_type: 'valentines_day',
          signal_data: { contact_name: contact.name },
          trigger_date: dateToStr(trigger),
          priority: cfg.priority,
          expires_at: dateToStr(expires),
        });
        if (ok) signals_created++;
      }
    }

    // ── D. Fête des mères ────────────────────────────────────────────────────
    if (hasChildren && relationship === 'family') {
      const year = today.getFullYear();
      let mothers = getLastSundayOfMay(year);
      if (mothers < today) mothers = getLastSundayOfMay(year + 1);

      for (const cfg of [{ days: 7, priority: 'normal' }, { days: 0, priority: 'high' }]) {
        const trigger = new Date(mothers);
        trigger.setDate(trigger.getDate() - cfg.days);
        const daysUntilTrigger = getDaysUntil(trigger, today);
        if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

        const expires = new Date(mothers);
        expires.setDate(expires.getDate() + 7);

        const ok = await tryInsertSignal(supabaseAdmin, {
          user_id: userId,
          contact_id: contact.id,
          signal_type: 'mothers_day',
          signal_data: { contact_name: contact.name },
          trigger_date: dateToStr(trigger),
          priority: cfg.priority,
          expires_at: dateToStr(expires),
        });
        if (ok) signals_created++;
      }
    }

    // ── E. Fête des pères ────────────────────────────────────────────────────
    if (hasChildren && relationship === 'family') {
      const year = today.getFullYear();
      let fathers = getThirdSundayOfJune(year);
      if (fathers < today) fathers = getThirdSundayOfJune(year + 1);

      for (const cfg of [{ days: 7, priority: 'normal' }, { days: 0, priority: 'high' }]) {
        const trigger = new Date(fathers);
        trigger.setDate(trigger.getDate() - cfg.days);
        const daysUntilTrigger = getDaysUntil(trigger, today);
        if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

        const expires = new Date(fathers);
        expires.setDate(expires.getDate() + 7);

        const ok = await tryInsertSignal(supabaseAdmin, {
          user_id: userId,
          contact_id: contact.id,
          signal_type: 'fathers_day',
          signal_data: { contact_name: contact.name },
          trigger_date: dateToStr(trigger),
          priority: cfg.priority,
          expires_at: dateToStr(expires),
        });
        if (ok) signals_created++;
      }
    }

    // ── F. Noël ──────────────────────────────────────────────────────────────
    const isNoelEligible = ['partner', 'family'].includes(relationship) || proximity === 'inner_circle';
    if (isNoelEligible) {
      const noel = getNextOccurrence(12, 25, today);
      for (const cfg of [
        { days: 14, priority: 'normal' },
        { days: 7,  priority: 'high' },
        { days: 3,  priority: 'urgent' },
      ]) {
        const trigger = new Date(noel);
        trigger.setDate(trigger.getDate() - cfg.days);
        const daysUntilTrigger = getDaysUntil(trigger, today);
        if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

        const expires = new Date(noel);
        expires.setDate(expires.getDate() + 7);

        const ok = await tryInsertSignal(supabaseAdmin, {
          user_id: userId,
          contact_id: contact.id,
          signal_type: 'christmas',
          signal_data: { contact_name: contact.name },
          trigger_date: dateToStr(trigger),
          priority: cfg.priority,
          expires_at: dateToStr(expires),
        });
        if (ok) signals_created++;
      }
    }

    // ── G. Dates personnalisées ──────────────────────────────────────────────
    for (const entry of dates) {
      const label = entry.label.toLowerCase();
      const isKnown =
        label.includes('anniversaire') || label.includes('naissance') || label.includes('birthday') ||
        label.includes('rencontre') || label.includes('couple') || label.includes('mariage') || label.includes('pacs') ||
        label.includes('fête') || label.includes('fete');
      if (isKnown) continue;

      const md = parseDateStr(entry.date);
      if (!md) continue;
      const target = getNextOccurrence(md.month, md.day, today);

      for (const cfg of [{ days: 7, priority: 'normal' }, { days: 0, priority: 'high' }]) {
        const trigger = new Date(target);
        trigger.setDate(trigger.getDate() - cfg.days);
        const daysUntilTrigger = getDaysUntil(trigger, today);
        if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

        const expires = new Date(target);
        expires.setDate(expires.getDate() + 7);

        const ok = await tryInsertSignal(supabaseAdmin, {
          user_id: userId,
          contact_id: contact.id,
          signal_type: 'custom_date',
          signal_data: { contact_name: contact.name, date_label: entry.label },
          trigger_date: dateToStr(trigger),
          priority: cfg.priority,
          expires_at: dateToStr(expires),
        });
        if (ok) signals_created++;
      }
    }

    // ── H. Silence relationnel ───────────────────────────────────────────────
    const { frequencyDays: thresholdDays } = await resolveCadenceForContact(userId, contact.id, supabaseAdmin);
    const lastSuggestion = contact.last_suggestion_at ? new Date(contact.last_suggestion_at as string) : null;
    const daysSince = lastSuggestion
      ? Math.round((today.getTime() - lastSuggestion.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (daysSince >= thresholdDays) {
      const triggerDate = dateToStr(today);
      const expires = new Date(today);
      expires.setDate(expires.getDate() + 30);

      const ok = await tryInsertSignal(supabaseAdmin, {
        user_id: userId,
        contact_id: contact.id,
        signal_type: 'silence',
        signal_data: { contact_name: contact.name, days_since: daysSince === Infinity ? null : daysSince, proximity_level: proximity },
        trigger_date: triggerDate,
        priority: 'normal',
        expires_at: dateToStr(expires),
      });
      if (ok) signals_created++;
    }
  }

  // ── SIGNAUX PILOTE ────────────────────────────────────────────────────────────

  // ── I. Anniversaire du pilote ────────────────────────────────────────────────
  const piloteDates = parseImportantDates((myProfile as { important_dates?: string | null } | null)?.important_dates ?? null);
  for (const entry of piloteDates) {
    const label = entry.label.toLowerCase();
    const isBirthday =
      (label.includes('anniversaire') || label.includes('naissance') || label.includes('birthday')) &&
      !label.includes('mariage') && !label.includes('couple') && !label.includes('rencontre') && !label.includes('pacs');
    if (!isBirthday) continue;

    const md = parseDateStr(entry.date);
    if (!md) continue;
    const target = getNextOccurrence(md.month, md.day, today);

    for (const cfg of [
      { days: 7, priority: 'normal' },
      { days: 0, priority: 'urgent' },
    ]) {
      const trigger = new Date(target);
      trigger.setDate(trigger.getDate() - cfg.days);
      const daysUntilTrigger = getDaysUntil(trigger, today);
      if (daysUntilTrigger < 0 || daysUntilTrigger > WINDOW) continue;

      const expires = new Date(target);
      expires.setDate(expires.getDate() + 1);

      const ok = await tryInsertSignal(supabaseAdmin, {
        user_id: userId,
        contact_id: null,
        signal_type: 'pilote_birthday',
        signal_data: { date_label: entry.label, birthday_date: dateToStr(target) },
        trigger_date: dateToStr(trigger),
        priority: cfg.priority,
        expires_at: dateToStr(expires),
      });
      if (ok) signals_created++;
    }
  }

  // ── J. Fête des mères / des pères (pour le pilote lui-même) ─────────────────
  if (hasChildren) {
    const year = today.getFullYear();

    // Fête des mères — dernier dimanche de mai
    let mothers = getLastSundayOfMay(year);
    if (mothers < today) mothers = getLastSundayOfMay(year + 1);
    if (getDaysUntil(mothers, today) >= 0 && getDaysUntil(mothers, today) <= WINDOW) {
      const expires = new Date(mothers);
      expires.setDate(expires.getDate() + 1);
      const ok = await tryInsertSignal(supabaseAdmin, {
        user_id: userId,
        contact_id: null,
        signal_type: 'pilote_mothers_day',
        signal_data: {},
        trigger_date: dateToStr(mothers),
        priority: 'high',
        expires_at: dateToStr(expires),
      });
      if (ok) signals_created++;
    }

    // Fête des pères — 3ème dimanche de juin
    let fathers = getThirdSundayOfJune(year);
    if (fathers < today) fathers = getThirdSundayOfJune(year + 1);
    if (getDaysUntil(fathers, today) >= 0 && getDaysUntil(fathers, today) <= WINDOW) {
      const expires = new Date(fathers);
      expires.setDate(expires.getDate() + 1);
      const ok = await tryInsertSignal(supabaseAdmin, {
        user_id: userId,
        contact_id: null,
        signal_type: 'pilote_fathers_day',
        signal_data: {},
        trigger_date: dateToStr(fathers),
        priority: 'high',
        expires_at: dateToStr(expires),
      });
      if (ok) signals_created++;
    }
  }

  // ── K. Période difficile du pilote (cadence hebdomadaire) ────────────────────
  const difficultUntil = (myProfile as { pilote_difficult_period_until?: string | null } | null)?.pilote_difficult_period_until;
  if (difficultUntil) {
    const untilDate = new Date(difficultUntil);
    if (untilDate >= today) {
      const expires = new Date(today);
      expires.setDate(expires.getDate() + 7);
      const ok = await tryInsertSignal(supabaseAdmin, {
        user_id: userId,
        contact_id: null,
        signal_type: 'pilote_difficult_period',
        signal_data: { until: difficultUntil },
        trigger_date: dateToStr(today),
        priority: 'normal',
        expires_at: dateToStr(expires),
      });
      if (ok) signals_created++;
    }
  }

  return { signals_created };
}
