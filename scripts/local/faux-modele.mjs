// FAUX SERVEUR MODÈLE — pour éprouver la PLOMBERIE, jamais la qualité de lecture.
//
// Il répond à POST /v1/messages comme l'API, avec ce qu'un essai lui a dicté d'avance. Il sert
// à trois choses : vérifier ce que l'application ÉCRIT à partir d'une lecture donnée, vérifier
// qu'elle écarte ce qu'un modèle inventerait, et jouer une PANNE. Il ne dit RIEN de ce qu'un
// vrai modèle lirait dans une vraie phrase : cela ne se juge qu'avec la vraie clé.
//
//   POST /__script   { reponses: [ {…entrée d'outil…}, … ] }   file d'attente des réponses
//   POST /__panne    { active: true|false }                     toutes les requêtes échouent (529)
//   POST /__attente  { ms }                                     chaque réponse attend ms millisecondes
//   GET  /__etat                                                 { appels, pannes, restantes }
// Sans réponse dictée, il échoue (500) : un essai ne passe jamais « par chance ».
import { createServer } from 'node:http';

const PORT = Number(process.env.FAUX_MODELE_PORT ?? 8787);
let file = []; let attente = 0; let panne = false; let appels = 0; let pannes = 0; const recus = [];
const lire = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => ok(b)); });
const json = (res, code, corps) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(corps)); };

createServer(async (req, res) => {
  const corps = req.method === 'POST' ? await lire(req) : '';
  if (req.url === '/__script') { file = JSON.parse(corps).reponses ?? []; return json(res, 200, { restantes: file.length }); }
  if (req.url === '/__attente') { attente = Number(JSON.parse(corps).ms ?? 0); return json(res, 200, { attente }); }
  if (req.url === '/__panne') { panne = !!JSON.parse(corps).active; return json(res, 200, { panne }); }
  if (req.url === '/__etat') return json(res, 200, { appels, pannes, restantes: file.length, panne, recus });
  if (req.url === '/__raz') { file = []; attente = 0; panne = false; appels = 0; pannes = 0; recus.length = 0; return json(res, 200, {}); }
  if (req.method === 'POST' && req.url?.startsWith('/v1/messages')) {
    if (panne) { pannes++; return json(res, 529, { type: 'error', error: { type: 'overloaded_error', message: 'panne simulée' } }); }
    appels++;
    // Réponse retardée à la demande d'un essai : sert à placer un événement PENDANT une génération.
    if (attente > 0) await new Promise((ok) => setTimeout(ok, attente));
    const demande = JSON.parse(corps);
    const outil = demande.tool_choice?.name ?? demande.tools?.[0]?.name;
    // Ce que l'application a RÉELLEMENT envoyé : consigne système et message, en entier.
    recus.push({ outil, systeme: typeof demande.system === 'string' ? demande.system : JSON.stringify(demande.system ?? ''), texte: String(demande.messages?.at(-1)?.content ?? '') });
    // APPELS SANS OUTIL (texte libre) : réponse fixe, reconnaissable. Sert aux routes qui
    // demandent une prose ou un JSON ; un essai n'en tire aucune conclusion sur la qualité.
    if (!outil) {
      // Une prose dictée par l'essai ({ __texte }) passe avant la réponse fixe.
      if (file[0] && typeof file[0].__texte === 'string') {
        const texte = file.shift().__texte;
        return json(res, 200, { id: `msg_faux_${appels}`, type: 'message', role: 'assistant', model: demande.model,
          content: [{ type: 'text', text: texte }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });
      }
      const systeme = typeof demande.system === 'string' ? demande.system : JSON.stringify(demande.system ?? '');
      const texte = /JSON valide/i.test(systeme)
        ? JSON.stringify({ category: 'autre', subcategory: null, tonality: 'neutre', emotional_intensity: 'low', probable_needs: [] })
        : 'Texte du faux modèle.';
      return json(res, 200, { id: `msg_faux_${appels}`, type: 'message', role: 'assistant', model: demande.model,
        content: [{ type: 'text', text: texte }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });
    }
    if (file.length === 0) return json(res, 500, { type: 'error', error: { type: 'api_error', message: 'faux modèle : aucune réponse dictée pour cet appel' } });
    return json(res, 200, {
      id: `msg_faux_${appels}`, type: 'message', role: 'assistant', model: demande.model,
      content: [{ type: 'tool_use', id: `toolu_faux_${appels}`, name: outil, input: file.shift() }],
      stop_reason: 'tool_use', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
    });
  }
  json(res, 404, { error: 'inconnu' });
}).listen(PORT, '127.0.0.1', () => console.log(`faux modèle sur 127.0.0.1:${PORT}`));
