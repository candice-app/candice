/**
 * CE QUE LE DISCOVERY A APPRIS, RENDU AU PORTRAIT — et seulement ce qui peut l'être.
 *
 * Les réponses du Discovery s'écrivent dans le journal sous quatre formes :
 *   · des PREUVES (goûts, intérêts, rejets) — le portrait les lit déjà, par `lirePortrait` ;
 *   · des FAITS d'option (`discovery.fait.*`) : « pratique le vélo », « collectionne » — personne
 *     ne les relisait. C'est ce module qui les rend ;
 *   · des réponses DE PROJET (`discovery.reponse_de_projet`) : elles décrivent un achat ou un
 *     séjour précis. Elles ne sont PAS rendues ici : un contexte n'est pas une préférence générale ;
 *   · les VERBATIMS (`discovery.<question>`) : la phrase entière de la personne. Ils ne sont PAS
 *     rendus ici : le portrait n'a pas à recevoir toutes les phrases, seulement ce qui en a été
 *     tiré selon le contrat de la question.
 *
 * Chaque ligne dit d'où elle vient : dite par la personne, ou LUE dans une réponse libre. Deux
 * faits qui se contredisent sont rendus ensemble et marqués — jamais départagés en silence.
 * Le nombre de lignes est borné, et ce qui dépasse est compté, pas tu.
 */
import { question as questionParId } from './banque';
import { PREFIXE_FAIT } from './produire';
import { estContexteDeProjet } from '@/lib/knowledge/read-journal';

export interface FaitLu { readonly factType: string; readonly value: string; readonly assertionStatus: string | null; readonly context?: string | null }
export interface FaitsPourPortrait {
  readonly lignes: readonly string[];
  readonly ecartes: { readonly verbatims: number; readonly reponsesDeProjet: number; readonly illisibles: number; readonly auDelaDuPlafond: number };
}
export const PLAFOND_FAITS_PORTRAIT = 40;
const FAIT_DE_PROJET = 'discovery.reponse_de_projet';
const MOTS_POLARITE: Record<string, string> = {
  factuelle: '', positive: '', rejet: 'écarté — ', condition: 'sous condition — ', absence_de_critere: 'sans préférence — ',
  souhait: 'souhaité, non pratiqué — ', intention: 'envisagé — ',
  mention: 'seulement mentionné, aucune appréciation établie — ', projection: 'projection idéale déclarée, ni habitude ni goût établi — ',
};

export function faitsDiscoveryPourPortrait(faits: readonly FaitLu[]): FaitsPourPortrait {
  let verbatims = 0, reponsesDeProjet = 0, illisibles = 0;
  // Un groupe = une même chose dite (même fait, même valeur). Plusieurs polarités = contradiction.
  const groupes = new Map<string, { enonce: string; libelle: string; polarites: Set<string>; lu: boolean }>();
  for (const f of faits) {
    // Tout ce qui a été dit POUR un projet reste dans le projet : fait structuré ou paramètre d'action.
    if (f.factType === FAIT_DE_PROJET || f.factType === 'discovery.parametre_de_projet' || estContexteDeProjet(f.context)) { reponsesDeProjet++; continue; }
    if (!f.factType.startsWith(PREFIXE_FAIT)) { if (f.factType.startsWith('discovery.')) verbatims++; continue; }
    let v: { valeur?: unknown; polarite?: unknown; question?: unknown; libelle?: unknown; sens?: unknown };
    try { v = JSON.parse(f.value); } catch { illisibles++; continue; }
    const q = typeof v.question === 'string' ? questionParId(v.question) : undefined;
    if (!q || typeof v.valeur !== 'string') { illisibles++; continue; }   // question retirée de la banque : on ne devine pas son sens
    const cle = `${f.factType}|${v.valeur}`;
    const g = groupes.get(cle) ?? { enonce: q.enonce, libelle: typeof v.libelle === 'string' ? v.libelle : v.valeur, polarites: new Set<string>(), lu: false };
    // `sens` vient des destinations conditionnelles : une MENTION n'est pas un goût, une
    // PROJECTION n'est ni une habitude ni une préférence. Le portrait le reçoit écrit en clair.
    g.polarites.add(typeof v.sens === 'string' ? v.sens : typeof v.polarite === 'string' ? v.polarite : 'factuelle');
    if (f.assertionStatus !== 'explicit') g.lu = true;
    groupes.set(cle, g);
  }
  const toutes = [...groupes.values()].map((g) => {
    const provenance = g.lu ? ' [lu dans une réponse libre — non confirmé par la personne]' : ' [dit par la personne]';
    if (g.polarites.size > 1) return `« ${g.enonce} » → ${g.libelle} : DÉCLARATIONS CONTRADICTOIRES (${[...g.polarites].sort().join(' / ')}) — ne rien affirmer${provenance}`;
    const p = [...g.polarites][0];
    return `« ${g.enonce} » → ${MOTS_POLARITE[p] ?? `${p} — `}${g.libelle}${provenance}`;
  });
  return { lignes: toutes.slice(0, PLAFOND_FAITS_PORTRAIT),
    ecartes: { verbatims, reponsesDeProjet, illisibles, auDelaDuPlafond: Math.max(0, toutes.length - PLAFOND_FAITS_PORTRAIT) } };
}
