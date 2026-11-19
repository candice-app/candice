// QUALIFIER UNE IDÉE, SANS RIEN SAVOIR DU PROCHE — décision D1 (19 nov.).
//
// Le modèle reçoit des idées et une TAXONOMIE publique (garde-fous-comparables.json), la même pour
// tout le monde. Il ne reçoit ni le proche, ni ses réponses, ni ses refus : le prompt ne contient
// aucune donnée de personne, et il est identique quels que soient les garde-fous du proche (un
// essai le vérifie). Sa réponse est ensuite VÉRIFIÉE (garde-fous-discovery.ts) : une valeur hors
// liste est ignorée, une description incertaine reste « indéterminée ».
import Anthropic from '@anthropic-ai/sdk';
import type { QualificateurIdees, Taxonomie } from './garde-fous-discovery';

export const MODELE_QUALIFICATION = 'claude-sonnet-4-6';

/** Le texte exact envoyé au modèle. Exporté pour l'essai « aucune donnée de personne ». */
export function consigneDeQualification(idees: readonly { title: string; justification: string; canal: string }[], t: Taxonomie): string {
  const lignes: string[] = [
    'Tu DÉCRIS des idées d’attention (cadeau, sortie, message, service). Tu ne juges pas si elles plaisent.',
    'Pour chaque idée, réponds avec les seules valeurs proposées. Si l’idée ne permet pas de savoir, réponds « indetermine » : ne devine pas.',
    '« etabli » veut dire : l’idée telle qu’elle est écrite le dit, ou c’est impliqué sans ambiguïté par ce qu’elle propose.',
  ];
  if (t.domaines.length > 0) lignes.push(`DOMAINES possibles (plusieurs si l’idée en relève vraiment) : ${t.domaines.join(', ')}.`);
  for (const [id, u] of Object.entries(t.universelles)) lignes.push(`MANIÈRE « ${id} » — ${u.intitule} Valeurs : ${u.valeurs.join(' / ')}.`);
  for (const d of t.dimensions) lignes.push(`DIMENSION « ${d.id} » (${d.domaine}) — ${d.intitule} Valeurs possibles : ${d.valeurs.map((v) => `« ${v} »`).join(', ')}. Si la dimension ne concerne pas l’idée : « non_applicable ».`);
  lignes.push('IDÉES :');
  idees.forEach((i, n) => lignes.push(`${n + 1}. [${i.canal}] ${i.title} — ${i.justification}`));
  return lignes.join('\n');
}

const etat = { type: 'string', enum: ['etabli', 'indetermine'] } as const;
export const qualificateurParModele: QualificateurIdees = async (idees, t) => {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const proprietes: Record<string, unknown> = {};
  if (t.domaines.length > 0) proprietes.domaines = { type: 'object', properties: { valeurs: { type: 'array', items: { type: 'string', enum: [...t.domaines] } }, etat }, required: ['valeurs', 'etat'] };
  if (Object.keys(t.universelles).length > 0) proprietes.universelles = { type: 'object', properties: Object.fromEntries(Object.keys(t.universelles).map((k) => [k, { type: 'object', properties: { valeur: { type: 'string', enum: ['oui', 'non'] }, etat }, required: ['etat'] }])) };
  for (const d of t.dimensions) proprietes[d.id] = { type: 'object', properties: { valeurs: { type: 'array', items: { type: 'string' } }, etat: { type: 'string', enum: ['etabli', 'indetermine', 'non_applicable'] } }, required: ['etat'] };
  const msg = await anthropic.messages.create({
    model: MODELE_QUALIFICATION, max_tokens: 4000,
    system: 'Tu décris des idées selon une taxonomie fermée. Tu ne connais pas la personne à qui elles sont destinées.',
    tools: [{ name: 'descriptions', description: 'Une description par idée, dans l’ordre.', input_schema: { type: 'object' as const,
      properties: { idees: { type: 'array', items: { type: 'object', properties: proprietes } } }, required: ['idees'] } }],
    tool_choice: { type: 'tool', name: 'descriptions' },
    messages: [{ role: 'user', content: consigneDeQualification(idees, t) }],
  });
  const bloc = msg.content.find((b) => b.type === 'tool_use');
  if (!bloc || bloc.type !== 'tool_use') throw new Error('réponse du modèle sans description');
  const sortie = (bloc.input as { idees?: unknown }).idees;
  if (!Array.isArray(sortie) || sortie.length !== idees.length) throw new Error('le modèle n’a pas décrit chaque idée');
  // Étape 1 : la forme rendue est { domaines, universelles } ; étape 2 : { <dimension>: … }.
  return sortie;
};
