// RELAIS OBSERVATEUR — voir ce que l'application envoie RÉELLEMENT au modèle (19 nov., 19h56).
//
// « L'absence du mot "céramique" dans la réponse ne prouve pas l'absence de transmission au
// modèle. » Ce relais se place entre l'application locale et le modèle : il transmet chaque
// requête telle quelle, rend la réponse telle quelle, et garde en mémoire CE QUI A ÉTÉ ENVOYÉ
// (consigne système, messages, nom de l'outil), LE STATUT HTTP rendu par le modèle, et l'entrée
// de l'outil qu'il a rendue (tool_use) — pour qu'un résultat vide se lise à sa cause.
//
//   L'application est lancée avec ANTHROPIC_BASE_URL=http://127.0.0.1:8789 ; le relais transmet à
//   RELAIS_AMONT (par défaut https://api.anthropic.com ; en essai simulé, le faux modèle :8787).
//
//   GET  /__etat   { amont, appels, recus: [{ n, outil, modele, statut, systeme, messages, reponse }] }
//                  reponse : l'entrée de l'outil rendue par le modèle (tool_use), jamais un en-tête
//   POST /__raz    vide la mémoire
//
// SÉCURITÉ, structurelle :
//   · il n'écoute QUE sur 127.0.0.1 ;
//   · il ne lit, ne garde, n'affiche et ne renvoie AUCUN en-tête : la clé passe dans l'en-tête
//     x-api-key de la requête de l'application, et ressort telle quelle vers l'amont, sans jamais
//     être copiée ailleurs. /__etat ne contient que le CORPS des requêtes (données fictives) ;
//   · il ne transmet que POST /v1/messages ; tout autre chemin est refusé ;
//   · l'amont doit être https://api.anthropic.com, ou une adresse de boucle locale (essai simulé).
import { createServer } from 'node:http';

const PORT = Number(process.env.RELAIS_PORT ?? 8789);
const AMONT = new URL(process.env.RELAIS_AMONT ?? 'https://api.anthropic.com');
const amontAdmis = (AMONT.protocol === 'https:' && AMONT.hostname === 'api.anthropic.com' && !AMONT.port)
  || (AMONT.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(AMONT.hostname));
if (!amontAdmis) { console.error(`ARRÊT — amont refusé : ${AMONT.origin}`); process.exit(2); }

const recus = []; let appels = 0;
const lire = (req) => new Promise((ok, ko) => { const b = []; req.on('data', (c) => b.push(c)); req.on('end', () => ok(Buffer.concat(b))); req.on('error', ko); });
const json = (res, code, corps) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(corps)); };
// Les en-têtes qui ne se transmettent pas d'un saut à l'autre ; tous les autres passent intacts.
const SAUT = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'accept-encoding']);
// La seule pièce d'identité que l'application doit envoyer est x-api-key. Un en-tête Authorization ne
// pourrait venir que d'une variable ANTHROPIC_AUTH_TOKEN héritée d'ailleurs : il n'est jamais transmis.
const RETIRES = new Set(['authorization']);

createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/__etat') return json(res, 200, { amont: AMONT.origin, appels, recus });
    if (req.method === 'POST' && req.url === '/__raz') { recus.length = 0; appels = 0; return json(res, 200, {}); }
    if (req.method !== 'POST' || !req.url?.startsWith('/v1/messages')) return json(res, 404, { error: 'chemin non relayé' });
    const corps = await lire(req);
    const n = ++appels;
    let demande = null;
    try { demande = JSON.parse(corps.toString('utf8')); } catch { /* corps illisible : transmis quand même, noté tel quel */ }
    const trace = { n, outil: demande?.tool_choice?.name ?? demande?.tools?.[0]?.name ?? null, modele: demande?.model ?? null, statut: null,
      systeme: typeof demande?.system === 'string' ? demande.system : JSON.stringify(demande?.system ?? ''),
      messages: (demande?.messages ?? []).map((m) => ({ role: m.role, contenu: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })) };
    recus.push(trace);
    const entetes = {};
    for (const [k, v] of Object.entries(req.headers)) if (!SAUT.has(k.toLowerCase()) && !RETIRES.has(k.toLowerCase()) && v !== undefined) entetes[k] = v;
    const amont = await fetch(new URL(req.url, AMONT), { method: 'POST', headers: entetes, body: corps });
    trace.statut = amont.status;
    const retour = Buffer.from(await amont.arrayBuffer());
    // Ce que le modèle a RENDU (20 nov.) : seulement l'entrée de son outil (données fictives) ; aucun en-tête.
    try {
      const r = JSON.parse(retour.toString('utf8'));
      const outils = (r?.content ?? []).filter((b) => b?.type === 'tool_use').map((b) => ({ nom: b.name, entree: b.input }));
      trace.reponse = outils.length ? outils : (r?.type === 'error' ? { erreur: r?.error?.type ?? 'erreur' } : null);
    } catch { trace.reponse = 'réponse illisible (non JSON)'; }
    const sortie = {};
    amont.headers.forEach((v, k) => { if (!SAUT.has(k.toLowerCase()) && k.toLowerCase() !== 'content-encoding') sortie[k] = v; });
    res.writeHead(amont.status, sortie); res.end(retour);
  } catch (e) {
    // Une panne du relais ou de l'amont est une PANNE, rendue comme telle : jamais une réponse vide.
    const n = recus.at(-1); if (n && n.statut === null) n.statut = 'erreur_relais';
    json(res, 502, { type: 'error', error: { type: 'api_error', message: `relais : ${e instanceof Error ? e.message : 'erreur'}` } });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`relais observateur sur 127.0.0.1:${PORT} → ${AMONT.origin}`));
