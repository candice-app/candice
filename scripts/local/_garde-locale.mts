// GARDE DE CIBLAGE LOCAL — une seule vérité, partagée par les scripts d'intégration.
//
// Chercher « localhost » n'importe où dans une URL ne garantit RIEN :
// https://localhost.attaquant.example et http://127.0.0.1.evil.test passent ce test.
// On analyse donc l'URL, et on exige le nom d'hôte EXACT, le protocole et le port.
import { execFileSync } from 'node:child_process';

const HOTES_LOCAUX = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export interface AttenduLocal { nom: string; url: string; port?: number }

/** Lève si l'URL n'est pas strictement locale. Rend l'URL analysée. */
export function exigerLocal({ nom, url, port }: AttenduLocal): URL {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error(`ARRÊT — ${nom} : « ${url} » n'est pas une URL.`); }
  if (u.protocol !== 'http:') {
    throw new Error(`ARRÊT — ${nom} : protocole « ${u.protocol} » ; une pile locale sert en http.`);
  }
  if (!HOTES_LOCAUX.has(u.hostname)) {
    throw new Error(`ARRÊT — ${nom} : hôte « ${u.hostname} » n'est pas la boucle locale.`);
  }
  if (port !== undefined && u.port !== String(port)) {
    throw new Error(`ARRÊT — ${nom} : port ${u.port || '(défaut)'} au lieu de ${port}.`);
  }
  if (u.username || u.password) {
    throw new Error(`ARRÊT — ${nom} : l'URL porte des identifiants ; ils n'ont rien à faire là.`);
  }
  return u;
}

/**
 * Une route qui RÉPOND sur localhost peut parler à une base DISTANTE. On regarde donc où le
 * processus qui sert cette application est réellement connecté. Toute pair non bouclée
 * arrête l'essai : mieux vaut refuser que d'écrire sur la mauvaise base.
 * Sans effet de bord — aucune requête n'est envoyée à l'application.
 */
export function exigerProcessusLocal(port: number): void {
  const lsof = (args: string[]) => {
    try { return execFileSync('lsof', args, { encoding: 'utf8' }); }
    catch { return ''; }
  };
  const ecoute = lsof(['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']).trim();
  if (!ecoute) {
    throw new Error(`ARRÊT — aucun processus n'écoute sur :${port}. Lance l'application d'abord.`);
  }
  const pids = [...new Set(ecoute.split('\n').filter(Boolean))];
  const distantes: string[] = [];
  for (const pid of pids) {
    const etablies = lsof(['-nP', '-iTCP', '-sTCP:ESTABLISHED', '-a', '-p', pid]);
    for (const ligne of etablies.split('\n').slice(1)) {
      const m = ligne.match(/->(\[?[0-9a-fA-F.:]+\]?):(\d+)/);
      if (!m) continue;
      const hote = m[1].replace(/^\[|\]$/g, '');
      if (!HOTES_LOCAUX.has(hote)) distantes.push(`${hote}:${m[2]}`);
    }
  }
  if (distantes.length) {
    throw new Error(
      `ARRÊT — le processus de l'application est connecté hors de la boucle locale : ` +
      `${[...new Set(distantes)].join(', ')}. Une route locale peut servir une base distante.`,
    );
  }
  if (!lsof(['-v'])) {
    throw new Error("ARRÊT — `lsof` indisponible : impossible de prouver où l'application se connecte.");
  }
}
