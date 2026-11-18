// LIRE LA FICHE QU'UNE PERSONNE A PARTAGÉE — un seul passage, côté serveur.
//
// Avant le 18 novembre, deux chemins contournaient le choix section par section :
//   • une politique de base ouvrait TOUTE l'analyse au navigateur dès qu'un partage était actif ;
//   • la page d'un proche affichait le résumé et trois sections sans regarder ce qui avait
//     été accordé.
// Ici, on vérifie l'accord et sa preuve, puis on ne rend que ce que la portée couvre.
import { resolveVisibility, type SectionKey } from '@/lib/profile/visibility';
import { sanitizeScope, SCOPE_BLIND } from '@/lib/profile/share-sections';

interface ClientPrivilegie { from(table: string): any } // eslint-disable-line @typescript-eslint/no-explicit-any

export interface AccordFiche {
  consentId: string;
  titulaireId: string;
  aveugle: boolean;
  sections: SectionKey[];
}

/** Une ligne de partage de fiche autorise-t-elle la lecture ? Active ET accordée par son titulaire. */
export function partageEtabli(ligne: { status?: string | null; pilote_id?: string | null; granted_by?: string | null } | null | undefined): boolean {
  return !!ligne && ligne.status === 'active' && !!ligne.pilote_id && ligne.granted_by === ligne.pilote_id;
}

/**
 * L'accord par lequel `titulaireId` partage sa fiche à `lecteurId`, s'il est établi.
 * Un partage actif sans preuve (ligne ancienne, ligne écrite sans titulaire nommé) ne vaut rien.
 */
export async function accordFiche(
  admin: ClientPrivilegie,
  input: { lecteurId: string; titulaireId?: string; consentId?: string },
): Promise<AccordFiche | null> {
  if (!input.titulaireId && !input.consentId) return null;
  try {
    let q = admin.from('contact_consents')
      .select('id, status, pilote_id, scope, granted_by')
      .eq('kind', 'profile_view').eq('proche_user_id', input.lecteurId).eq('status', 'active');
    if (input.titulaireId) q = q.eq('pilote_id', input.titulaireId);
    if (input.consentId) q = q.eq('id', input.consentId);
    const { data, error } = await q.maybeSingle();
    if (error || !partageEtabli(data)) return null;
    const scope = (data.scope as string[] | null) ?? [];
    return {
      consentId: data.id as string,
      titulaireId: data.pilote_id as string,
      aveugle: scope.includes(SCOPE_BLIND),
      sections: sanitizeScope(scope),
    };
  } catch { return null; }
}

export interface AnalysePartagee {
  summary: string | null;
  sections: Record<string, { text?: string; chips?: string[] }>;
  gender: string | null;
  confidence: number | null;
}

/** Section de l'analyse → case que le titulaire doit avoir cochée pour qu'elle sorte. */
const CASE_DE_LA_SECTION: Record<string, SectionKey> = {
  what_touches: 'deep_touch',
  feels_loved: 'deep_loved',
  gifts: 'deep_pleasure',
  avoid: 'deep_miss',
  restaurants: 'monde_tables',
  travel: 'monde_voyages',
  hobbies: 'monde_passions',
  style: 'monde_gouts',
};

/** Ne garde de l'analyse que ce que la portée couvre. Pure : testable sans base. */
export function filtrerAnalyse(
  brut: { summary?: string | null; sections?: Record<string, { text?: string; chips?: string[] }> | null; gender?: string | null; confidence?: number | null } | null,
  accord: Pick<AccordFiche, 'aveugle' | 'sections'>,
): AnalysePartagee | null {
  if (!brut || accord.aveugle) return null;
  const montre = (s: SectionKey) => resolveVisibility('invite_filtre', s, accord.sections).shown;
  const sections: AnalysePartagee['sections'] = {};
  for (const [cle, valeur] of Object.entries(brut.sections ?? {})) {
    const caseRequise = CASE_DE_LA_SECTION[cle];
    // Une section de l'analyse qui ne correspond à aucune case n'a jamais été proposée au
    // partage : elle ne sort pas.
    if (caseRequise && montre(caseRequise) && valeur) sections[cle] = valeur;
  }
  return {
    summary: montre('summary') ? (brut.summary ?? null) : null,
    sections,
    gender: brut.gender ?? null,
    confidence: null, // une mesure interne, jamais proposée au partage
  };
}

/** L'analyse de `titulaireId`, réduite à ce qu'il partage à `lecteurId`. `null` sans accord établi. */
export async function analysePartagee(
  admin: ClientPrivilegie,
  input: { lecteurId: string; titulaireId: string },
): Promise<AnalysePartagee | null> {
  const accord = await accordFiche(admin, input);
  if (!accord || accord.aveugle) return null;
  try {
    const { data, error } = await admin.from('profile_analysis')
      .select('summary, sections, gender')
      .eq('user_id', input.titulaireId).is('contact_id', null).maybeSingle();
    if (error) return null;
    return filtrerAnalyse(data, accord);
  } catch { return null; }
}
