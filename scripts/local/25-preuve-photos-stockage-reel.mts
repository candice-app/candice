// PREUVE — les photos, sur un VRAI service de stockage local (le serveur Storage de Supabase,
// version libre, fichiers sur disque), avec de vraies images et deux comptes fictifs.
//   lecture autorisée · accès croisé refusé · chemin falsifié · lien signé · après retrait d'accès
import sharp from 'sharp';
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster, APP } from './_session-http.mts';

const { url, anon, admin } = pileLocale();
const v = verificateur();
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const image = (r: number, g: number, b: number) => sharp({ create: { width: 96, height: 96, channels: 3, background: { r, g, b } } }).png().toBuffer();
const md5 = (b: Buffer) => (b === rouge ? 'rouge' : b === bleu ? 'bleu' : b === vert ? 'vert' : '?');   // la teinte attendue d'un fichier d'essai
const complet = { attention_reception: { x: 1 }, temperament_axes: { x: 1 }, lifestyle_axes: { x: 1 }, singularity_answers: { adore_faire: 'lire' } };

// Le stockage répond-il vraiment ? (sinon cette preuve ne prouverait rien)
const etatStockage = await fetch(`${url}/storage/v1/bucket`, { headers: { authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY! } });
const seaux = etatStockage.ok ? (await etatStockage.json()) as { id: string; public: boolean }[] : [];
if (!etatStockage.ok || !seaux.some((s) => s.id === 'avatars') || !seaux.some((s) => s.id === 'contact-photos')) throw new Error('ARRÊT — service de stockage local absent ou dépôts manquants.');
console.log('dépôts :', seaux.map((s) => `${s.id} (${s.public ? 'PUBLIC' : 'privé'})`).join(', '));
v.verifier(seaux.every((s) => !s.public), '0 : les deux dépôts sont privés');

const A = await compteLocal('photo-alice'), V = await compteLocal('photo-victor');
for (const [c, prenom] of [[A, 'Alice'], [V, 'Victor']] as const) await c.client.from('my_profile').upsert({ user_id: c.userId, ...complet, practical_info: { prenom } }, { onConflict: 'user_id' });
const cA = await cookiesDe(A.email, A.motDePasse), cV = await cookiesDe(V.email, V.motDePasse);
const kA = (await A.client.from('contacts').insert({ user_id: A.userId, name: 'Proche d’Alice', relationship: 'friend' }).select('id').single()).data!.id as string;
const kV = (await V.client.from('contacts').insert({ user_id: V.userId, name: 'Proche de Victor', relationship: 'friend' }).select('id').single()).data!.id as string;
const rouge = await image(200, 30, 30), bleu = await image(30, 30, 200), vert = await image(30, 160, 60);
const deposer = async (chemin: string, cookie: string, champs: Record<string, string>, contenu: Buffer, type = 'image/png', nom = 'photo.png') => {
  const fd = new FormData(); for (const [k, val] of Object.entries(champs)) fd.set(k, val);
  fd.set('file', new File([new Uint8Array(contenu)], nom, { type }));
  const r = await fetch(`${APP}${chemin}`, { method: 'POST', headers: { cookie, 'user-agent': UA }, body: fd });
  return { status: r.status, json: await r.json().catch(() => null) as { signedUrl?: string; path?: string } | null };
};
// Le serveur REFAIT chaque image (réencodage, métadonnées retirées) : on ne compare donc pas des
// octets mais l'image elle-même — ici sa couleur, chaque fichier d'essai étant d'une teinte unie.
const teinte = async (b: Buffer | ArrayBuffer) => { try { const { data } = await sharp(Buffer.from(b as ArrayBuffer)).resize(1, 1).removeAlpha().raw().toBuffer({ resolveWithObject: true }); const [r, g, bl] = [data[0], data[1], data[2]]; return r > 150 && g < 90 && bl < 90 ? 'rouge' : bl > 150 && r < 90 ? 'bleu' : g > 110 && r < 90 ? 'vert' : `autre(${r},${g},${bl})`; } catch { return 'illisible'; } };
const ouvrir = async (lien: string | null | undefined) => { if (!lien) return { status: 0, md5: '' }; const r = await fetch(lien); return { status: r.status, md5: r.ok ? await teinte(await r.arrayBuffer()) : '' }; };

console.log('\n══ 1. LECTURE AUTORISÉE — chacun dépose et relit SES fichiers');
const avA = await deposer('/api/profile/avatar', cA, {}, rouge);
let o = await ouvrir(avA.json?.signedUrl);
console.log('  Alice dépose sa photo de profil → HTTP', avA.status, '· chemin', avA.json?.path?.replace(A.userId, '<alice>'), '· relecture par le lien signé → HTTP', o.status);
v.verifier(avA.status === 200 && o.status === 200 && o.md5 === md5(rouge), '1.1 : la photo de profil relue par le lien signé est bien celle déposée');
const phA = await deposer('/api/contacts/upload-photo', cA, { contactId: kA }, vert);
o = await ouvrir(phA.json?.signedUrl);
v.verifier(phA.status === 200 && o.md5 === md5(vert), '1.2 : idem pour la photo d’un proche');
const wlA = await deposer('/api/wishlist/photo', cA, {}, vert);
v.verifier(wlA.status === 200 && (await ouvrir(wlA.json?.signedUrl)).md5 === md5(vert), '1.3 : idem pour une photo d’envie');
const avV = await deposer('/api/profile/avatar', cV, {}, bleu);
v.verifier(avV.status === 200 && avV.json!.path!.startsWith(`${V.userId}/`) && avA.json!.path!.startsWith(`${A.userId}/`), '1.4 : chaque fichier est rangé sous le dossier de son propriétaire');

console.log('\n══ 2. ACCÈS CROISÉ — Victor veut les fichiers d’Alice');
const cheminAvA = avA.json!.path!, cheminPhA = phA.json!.path!, cheminWlA = wlA.json!.path!;
const d1 = await V.client.storage.from('avatars').download(cheminAvA);
const d2 = await V.client.storage.from('contact-photos').download(cheminPhA);
const d3 = await V.client.storage.from('avatars').createSignedUrl(cheminAvA, 60);
const d4 = await V.client.storage.from('avatars').list(A.userId);
console.log('  avec SA session, directement sur le stockage : télécharger →', d1.error ? 'refusé' : 'OUVERT', '· se signer un lien →', d3.error ? 'refusé' : 'OUVERT', '· lister le dossier →', (d4.data ?? []).length, 'fichier(s)');
v.verifier(!!d1.error && !!d2.error && !!d3.error && (d4.data ?? []).length === 0, '2.1 : la session de Victor ne télécharge, ne signe ni ne liste rien chez Alice');
const pub = await fetch(`${url}/storage/v1/object/public/avatars/${cheminAvA}`), brut = await fetch(`${url}/storage/v1/object/avatars/${cheminAvA}`, { headers: { apikey: anon } });
v.verifier(!pub.ok && !brut.ok, '2.2 : sans session, ni l’adresse « publique » ni l’adresse directe n’ouvrent le fichier', `HTTP ${pub.status} ${brut.status}`);
// Par l'application : Victor inscrit le chemin d'Alice dans SES propres colonnes.
const liensVers = (html: string, proprietaire: string) => [...html.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').matchAll(/https?:\/\/[^"'\\ <>]*\/storage\/v1\/object\/sign\/[^"'\\ <>]+/g)].map((x) => x[0]).filter((l) => l.includes(proprietaire));
await V.client.from('my_profile').update({ avatar_path: cheminAvA }).eq('user_id', V.userId);
let page = await poster('/moi', cV, null, 'GET');
v.verifier(page.status === 200 && liensVers(page.texte, A.userId).length === 0, '2.3 : Victor met le chemin de la photo d’Alice dans SON profil → sa page ne reçoit aucun lien vers elle');
await V.client.from('my_wishlist_items').insert({ user_id: V.userId, title: 'Piège', photo_url: cheminWlA });
page = await poster('/moi/wishlist', cV, null, 'GET');
v.verifier(page.status === 200 && liensVers(page.texte, A.userId).length === 0, '2.4 : même tentative par une photo d’envie → aucun lien');
await V.client.from('contacts').update({ photo_url: cheminPhA }).eq('id', kV);
page = await poster(`/contacts/${kV}`, cV, null, 'GET');
v.verifier(page.status === 200 && liensVers(page.texte, A.userId).length === 0, '2.5 : même tentative par la photo d’un proche → aucun lien');
const idf = await poster('/api/carnet/identify', cV, { path: cheminWlA });
v.verifier(idf.status === 400, '2.6 : Victor ne fait pas lire au modèle un fichier d’Alice', `HTTP ${idf.status}`);
// (contrôle) le bon propriétaire, lui, reçoit bien son lien par sa page.
await V.client.from('my_profile').update({ avatar_path: avV.json!.path }).eq('user_id', V.userId);
page = await poster('/moi', cV, null, 'GET');
const sien = liensVers(page.texte, V.userId);
v.verifier(sien.length > 0 && (await ouvrir(sien[0])).md5 === md5(bleu), '2.7 : (contrôle) avec son propre chemin, sa page lui sert sa photo');

console.log('\n══ 3. CHEMIN FALSIFIÉ');
const faux = [`${V.userId}/../${cheminAvA}`, `${V.userId}/./../${cheminAvA}`, `/${cheminAvA}`, `${V.userId}//${cheminAvA}`, cheminAvA.replace(A.userId, `${V.userId}/..%2F${A.userId}`)];
let fuites = 0;
for (const f of faux) {
  await V.client.from('my_profile').update({ avatar_path: f }).eq('user_id', V.userId);
  const p = await poster('/moi', cV, null, 'GET');
  if (/storage\/v1\/object\/sign\/avatars\/[^"'\\ <>]*/.test(p.texte) && liensVers(p.texte, A.userId).length > 0) fuites++;
}
v.verifier(fuites === 0, `3.1 : ${faux.length} chemins fabriqués (remontée de dossier, barre en tête, double barre, encodage) → aucun lien vers Alice`);
// Ce que ferait le stockage LUI-MÊME si l'application signait un tel chemin (elle ne le fait pas).
const brutSigne = await admin.storage.from('avatars').createSignedUrl(`${V.userId}/../${cheminAvA}`, 60);
const viaRemontee = brutSigne.data?.signedUrl ? await ouvrir(brutSigne.data.signedUrl) : { status: 0, md5: '' };
console.log('  (information) si l’on signait « victor/../alice/… » avec les droits serveur : signature', brutSigne.error ? 'refusée' : 'acceptée', '· ouverture → HTTP', viaRemontee.status, viaRemontee.md5 === md5(rouge) ? '— ouvrirait la photo d’Alice : la garde de l’application est NÉCESSAIRE' : '— n’ouvre pas la photo d’Alice');
const dep = await deposer('/api/wishlist/photo', cV, { scope: 'carnet', contactId: `../../${A.userId}/carnet/x` }, bleu);
v.verifier(dep.status === 400, '3.2 : un identifiant de fiche fabriqué ne dépose rien hors de son dossier', `HTTP ${dep.status}`);
const chezAlice = await admin.storage.from('contact-photos').list(`${A.userId}/carnet`);
v.verifier((chezAlice.data ?? []).length === 0, '3.3 : rien n’a été écrit dans le dossier d’Alice');

console.log('\n══ 4. LIEN SIGNÉ');
const lienA = avA.json!.signedUrl!;
const jeton = new URL(lienA).searchParams.get('token')!;
const charge = JSON.parse(Buffer.from(jeton.split('.')[1], 'base64url').toString()) as { exp: number; iat: number; url: string };
console.log('  lien remis à la propriétaire : valable', charge.exp - charge.iat, 's · il désigne', charge.url.replace(A.userId, '<alice>'));
v.verifier(charge.exp - charge.iat === 3600, '4.1 : un lien remis à son propriétaire vaut une heure');
const autreFichier = lienA.replace(cheminAvA, avV.json!.path!);
v.verifier((await ouvrir(autreFichier)).status !== 200, '4.2 : le jeton d’un fichier n’ouvre pas un autre fichier');
const abime = lienA.slice(0, -4) + (lienA.endsWith('AAAA') ? 'BBBB' : 'AAAA');
v.verifier((await ouvrir(abime)).status !== 200, '4.3 : un jeton altéré est refusé');
v.verifier((await ouvrir(lienA.split('?')[0])).status !== 200, '4.4 : sans jeton, rien');
const court = (await admin.storage.from('avatars').createSignedUrl(cheminAvA, 2)).data!.signedUrl;
const avantEcheance = await ouvrir(court); await new Promise((ok) => setTimeout(ok, 3500)); const apresEcheance = await ouvrir(court);
v.verifier(avantEcheance.status === 200 && apresEcheance.status !== 200, '4.5 : à l’échéance, le lien cesse d’ouvrir le fichier (essai avec un lien de 2 s)', `HTTP ${avantEcheance.status} puis ${apresEcheance.status}`);

console.log('\n══ 5. APRÈS UN RETRAIT D’ACCÈS — le sort des liens déjà émis');
// Alice partage sa fiche à Victor : la page de Victor reçoit un lien vers la photo d'Alice.
const { data: dem } = await V.client.from('contact_consents').insert({ pilote_id: A.userId, proche_user_id: V.userId, requested_by: V.userId, status: 'pending', kind: 'profile_view', scope: [] }).select('id').single();
await poster(`/api/profile-view/${dem!.id}/respond`, cA, { action: 'all' });
page = await poster(`/fiche/${dem!.id}`, cV, null, 'GET');
const recu = liensVers(page.texte, A.userId)[0];
const j2 = recu ? JSON.parse(Buffer.from(new URL(recu).searchParams.get('token')!.split('.')[1], 'base64url').toString()) as { exp: number; iat: number } : null;
console.log('  fiche partagée : Victor reçoit un lien vers la photo d’Alice, valable', j2 ? j2.exp - j2.iat : '?', 's');
v.verifier(!!recu && (await ouvrir(recu)).md5 === md5(rouge), '5.1 : (contrôle) pendant le partage, Victor voit la photo d’Alice');
v.verifier(!!j2 && j2.exp - j2.iat === 300 && recu !== lienA, '5.2 : le lien remis à un tiers vaut CINQ MINUTES, et n’est jamais le lien d’une heure de la propriétaire');
await poster(`/api/profile-view/${dem!.id}/revoke`, cA, {});
page = await poster(`/fiche/${dem!.id}`, cV, null, 'GET');
v.verifier(liensVers(page.texte, A.userId).length === 0, '5.3 : partage retiré → la page ne sert plus aucun lien');
const ancien = await ouvrir(recu);
console.log('  le lien DÉJÀ reçu, rouvert juste après le retrait → HTTP', ancien.status, '(un lien signé ne se révoque pas : il vit jusqu’à son échéance, ici 5 min au plus)');
v.verifier(ancien.status === 200, '5.4 : CONSTAT — le lien déjà émis ouvre encore le fichier jusqu’à son échéance (borne : 5 minutes)');
// Ce qui tue un lien avant l'échéance : le fichier remplacé, le fichier supprimé, le compte effacé.
// LIMITE DE CETTE PILE : dans la version du serveur de stockage utilisée ici (fichiers sur disque),
// remplacer ou supprimer un fichier existant échoue côté serveur (erreur interne du stockage, sans
// rapport avec Candice). Si c'est le cas, on le DIT et on ne compte rien : ce n'est pas prouvé.
const remplacement = await deposer('/api/profile/avatar', cA, {}, vert);
if (remplacement.status === 200) {
  const apres = await ouvrir(recu);
  v.verifier(apres.status !== 200 || apres.md5 === md5(vert), '5.5 : photo remplacée → l’ancien lien ne rend plus l’ancienne image', `HTTP ${apres.status}`);
} else console.log('  ? 5.5 NON PROUVÉ ICI : ce stockage local refuse le remplacement d’un fichier (HTTP', remplacement.status, ') — à vérifier sur le stockage de production');
const suppression = await admin.storage.from('avatars').remove([cheminAvA]);
if (!suppression.error) {
  v.verifier((await ouvrir(recu)).status !== 200 && (await ouvrir(lienA)).status !== 200, '5.6 : fichier supprimé → tous les liens déjà émis sont morts, y compris celui d’une heure');
} else console.log('  ? 5.6 NON PROUVÉ ICI : ce stockage local refuse la suppression (', suppression.error.message, ') — à vérifier sur le stockage de production');

console.log('\n══ 6. PHOTOS D’IPHONE (HEIC), ORIENTATION, MÉTADONNÉES — par les vraies routes, de vrais fichiers');
{
  const { readFileSync } = await import('node:fs');
  const lire = (n: string) => readFileSync(new URL(`./images-test/${n}`, import.meta.url));
  const coin = async (b: Buffer, ou: 'hg' | 'hd' | 'bg' | 'bd') => {
    const { data, info } = await sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const x = ou[1] === 'g' ? Math.round(info.width * 0.25) : Math.round(info.width * 0.75), y = ou[0] === 'h' ? Math.round(info.height * 0.25) : Math.round(info.height * 0.75);
    const i = (y * info.width + x) * 3; const [r, g, bl] = [data[i], data[i + 1], data[i + 2]];
    return r > 150 && g < 110 && bl < 110 ? 'rouge' : bl > 150 && r < 110 && g < 110 ? 'bleu' : g > 120 && r < 110 && bl < 120 ? 'vert' : r > 170 && g > 150 && bl < 120 ? 'jaune' : '?';
  };
  const scene = async (b: Buffer) => [await coin(b, 'hg'), await coin(b, 'hd'), await coin(b, 'bg'), await coin(b, 'bd')].join(' ');
  const recuperer = async (lien?: string | null) => Buffer.from(await (await fetch(lien!)).arrayBuffer());
  const porte = (b: Buffer) => ['iPhone de test', 'MARQUEUR-LOGICIEL', 'MARQUEUR-OBJECTIF', 'GPS', 'Exif'].filter((m) => b.includes(Buffer.from(m)));
  const heic = lire('tournee-orientation6.heic');
  console.log('  fichier déposé : HEIC', heic.length, 'octets · métadonnées présentes :', porte(heic).join(', '));
  let d = await deposer('/api/wishlist/photo', cV, {}, heic, 'image/heic', 'IMG_0042.HEIC');
  let rangee = await recuperer(d.json?.signedUrl);
  let meta = await sharp(rangee).metadata();
  console.log('  → HTTP', d.status, '· rangé :', d.json?.path?.split('/').pop()?.replace(/^[0-9-]+/, '…'), '·', meta.format, `${meta.width}×${meta.height}`, '· scène :', await scene(rangee), '· métadonnées restantes :', porte(rangee).length);
  v.verifier(d.status === 200 && d.json!.path!.endsWith('.jpg') && meta.format === 'jpeg', '6.1 : une photo HEIC d’iPhone est ACCEPTÉE et rangée en JPEG');
  v.verifier(meta.width === 400 && meta.height === 300 && (await scene(rangee)) === 'rouge bleu vert jaune', '6.2 : prise téléphone debout, elle est rangée À L’ENDROIT');
  v.verifier(porte(rangee).length === 0 && meta.exif === undefined, '6.3 : ni position GPS, ni appareil, ni date : aucune métadonnée dans le fichier rangé');
  d = await deposer('/api/contacts/upload-photo', cV, { contactId: kV }, lire('tournee-orientation6.jpg'), 'image/jpeg', 'photo.jpg');
  rangee = await recuperer(d.json?.signedUrl); meta = await sharp(rangee).metadata();
  v.verifier(d.status === 200 && (await scene(rangee)) === 'rouge bleu vert jaune' && porte(rangee).length === 0 && meta.orientation === undefined, '6.4 : JPEG « orientation 6 » avec GPS → à l’endroit, sans métadonnées', `HTTP ${d.status}`);
  d = await deposer('/api/profile/avatar', cV, {}, lire('droite.heic'), 'image/heic', 'moi.heic');
  v.verifier(d.status === 200 && d.json!.path!.endsWith('avatar.jpg'), '6.5 : photo de profil en HEIC → acceptée, rangée en JPEG', `HTTP ${d.status}`);
  const f1 = await deposer('/api/wishlist/photo', cV, {}, lire('script-deguise.jpg'), 'image/jpeg', 'photo.jpg');
  const f2 = await deposer('/api/wishlist/photo', cV, {}, lire('faux.heic'), 'image/heic', 'x.heic');
  const f3 = await deposer('/api/wishlist/photo', cV, {}, Buffer.from('GIF89a'), 'image/png', 'x.png');
  console.log('  SVG annoncé comme JPEG, faux HEIC, GIF annoncé comme PNG → HTTP', f1.status, f2.status, f3.status);
  v.verifier(f1.status === 415 && f2.status === 415 && f3.status === 415, '6.6 : le type annoncé ne compte pas — ce qui n’est pas une vraie image admise est refusé');
}
v.bilan();
