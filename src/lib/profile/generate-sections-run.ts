// CÂBLAGE DE PRODUCTION de la génération par section (ligne 4) — côté SERVEUR uniquement (clé Anthropic
// jamais au navigateur). Deux pièces à effets de bord, séparées de la logique pure (generate-sections.ts) :
//   • anthropicSectionCaller : la frontière modèle réelle. Impose le TON (§30.1 : « tu sembles », jamais de
//     score/clinique) et une SORTIE STRUCTURÉE { affirmations: [{id,type,text,treatedKeys}] }. Le modèle
//     n'élit rien : il reçoit la matière déjà choisie+ordonnée et déclare ce qu'il a traité.
//   • storeSelfSections : écrit/réécrit les sections du périmètre SELF dans profile_analysis_sections, avec
//     le TAMPON DE PÉRIMÈTRE `scope='self'` (une section self n'est jamais servie à un autre périmètre) et
//     `source_evidence_ids` = l'union exacte (la CHECK de la migration 97 refuse toute divergence).

import Anthropic from '@anthropic-ai/sdk';
import type { SectionModelCaller, ModelAffirmation, GeneratedSection } from './generate-sections';

const anthropic = new Anthropic();
const MODEL = 'claude-sonnet-4-6'; // aligné sur la prose du projet (non upgradé ici — hors périmètre)

export const SECTION_SYSTEM_PROMPT = `Tu es Candice. Tu rédiges une section d'une fiche portrait personnelle à partir d'une MATIÈRE déjà sélectionnée et ordonnée (tu n'en choisis pas le contenu, tu la mets en mots).

Règles absolues :
- Ton : « tu sembles », « on devine », « quelque chose revient souvent », « chez toi ». Jamais clinique, jamais coach, jamais MBTI/psy. Français, tutoiement.
- Jamais de score, de pourcentage, de « profil », « résultat », « analyse », « fort/faible », « diagnostic ».
- Profondeur PROPORTIONNÉE aux preuves : une seule donnée ne devient pas une certitude. Type d'affirmation : "declaration" (restitution fidèle), "tendance" (convergence), "hypothese" (lecture possible, explicitement), "implication" (conséquence pratique prudente). N'invente jamais une peur, un traumatisme, une motivation.
- Tu ne traites QUE des clés de la matière fournie. Chaque affirmation DÉCLARE dans treatedKeys la ou les clés exactes qu'elle met en mots. N'invente aucune clé : une affirmation sans clé réelle sera retirée.

Tu retournes un JSON valide, sans markdown ni explication, de forme :
{ "affirmations": [ { "id": "a1", "type": "tendance", "text": "…", "treatedKeys": ["CLE_A","CLE_B"] } ] }
Si la matière est vide, retourne { "affirmations": [] }.`;

function buildUserPrompt(req: Parameters<SectionModelCaller>[0]): string {
  const lines = [`Section : ${req.sectionKey} (${req.tier === 'synthesis' ? 'synthèse' : 'détail'}).`, ''];
  if (req.dependencies?.length) {
    lines.push('Textes de détail à synthétiser (clé = section ; cite-les dans treatedKeys) :');
    for (const d of req.dependencies) lines.push(`- ${d.sectionKey} : ${d.text}`);
  } else {
    lines.push('Matière (clé → contenu, confiance) — ordre à respecter :');
    for (const m of req.matter) lines.push(`- ${m.key} : ${m.content}${m.confidence ? ` (confiance ${m.confidence})` : ''}`);
  }
  if (!req.matter.length && !req.dependencies?.length) lines.push('(matière vide)');
  return lines.join('\n');
}

/** La frontière modèle réelle. Erreur modèle / JSON illisible → zéro affirmation (jamais d'invention). */
export const anthropicSectionCaller: SectionModelCaller = async (req) => {
  if (!req.matter.length && !req.dependencies?.length) return [];
  try {
    const message = await anthropic.messages.create({
      model: MODEL, max_tokens: 4096, system: SECTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(req) }],
    });
    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as { affirmations?: ModelAffirmation[] };
    return Array.isArray(parsed.affirmations) ? parsed.affirmations : [];
  } catch {
    return []; // échec modèle → zéro, jamais d'invention
  }
};

/** Client d'écriture des sections (supabase-like minimal), pour testabilité. */
export interface SectionStoreClient {
  from(table: string): {
    delete(): { eq(c: string, v: string): { is(c: string, v: null): { eq(c: string, v: string): Promise<{ error: { message: string } | null }> } } };
    insert(rows: unknown): Promise<{ error: { message: string } | null }>;
  };
}

export class SectionStoreError extends Error {}

function sectionToRow(userId: string, s: GeneratedSection) {
  return {
    user_id: userId,
    contact_id: null,
    scope: 'self', // TAMPON DE PÉRIMÈTRE : jamais servie à un autre périmètre
    section_key: s.key,
    tier: s.tier,
    text: s.text || null,
    affirmations: s.affirmations, // JSONB [{id,type,text,evidence_ids}]
    source_evidence_ids: s.sourceEvidenceIds, // = union exacte (CHECK migration 97)
    depends_on_sections: s.dependsOnSections ?? null,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Écrit/réécrit les sections du périmètre SELF. Par section : suppression de la ligne self existante
 * (contact_id NULL) puis insertion — réécriture atomique par section, compatible régénération paresseuse.
 * Erreur BRUYANTE : une écriture qui échoue ne passe jamais pour un succès silencieux.
 */
export async function storeSelfSections(client: SectionStoreClient, userId: string, sections: readonly GeneratedSection[]): Promise<void> {
  for (const s of sections) {
    const del = await client.from('profile_analysis_sections').delete().eq('user_id', userId).is('contact_id', null).eq('section_key', s.key);
    if (del.error) throw new SectionStoreError(`delete ${s.key}: ${del.error.message}`);
    const ins = await client.from('profile_analysis_sections').insert(sectionToRow(userId, s));
    if (ins.error) throw new SectionStoreError(`insert ${s.key}: ${ins.error.message}`);
  }
}
