// TOUTE PHOTO DÉPOSÉE EST REFAITE PAR LE SERVEUR avant d'être rangée.
//
//   1. On ne croit ni le nom ni le type annoncés : le format est lu dans les premiers octets.
//   2. HEIC/HEIF (le format des photos d'iPhone) est DÉCODÉ puis réécrit en JPEG — refuser ce
//      format aurait rendu le dépôt de photo inutilisable sur le téléphone que Candice vise.
//   3. L'image est remise à l'endroit (orientation enregistrée par l'appareil), puis TOUTES ses
//      métadonnées sont retirées : position GPS, modèle d'appareil, date, logiciel. Une photo
//      prise chez soi ne doit pas donner son adresse à qui la reçoit.
//   4. Elle est ramenée à 2048 px au plus et réencodée : ce qui est rangé est toujours une
//      image que NOUS avons écrite, jamais le fichier reçu.
import sharp, { type Sharp } from 'sharp';

export const TAILLE_MAX_DEPOT = 20 * 1024 * 1024;   // ce qu'on accepte de recevoir (une photo d'iPhone pèse 2 à 8 Mo)
const COTE_MAX = 2048;
const PIXELS_MAX = 60_000_000;                      // garde-fou contre une image piégée de très grande surface

export type FormatSource = 'jpeg' | 'png' | 'webp' | 'heic';
export interface ImageNormalisee { contenu: Buffer; type: 'image/jpeg' | 'image/png' | 'image/webp'; extension: 'jpg' | 'png' | 'webp'; source: FormatSource; largeur: number; hauteur: number }

export class ImageRefusee extends Error {
  constructor(readonly motif: 'format' | 'illisible' | 'trop_lourde' | 'trop_grande') { super(motif); this.name = 'ImageRefusee'; }
}

const MARQUES_HEIF = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']);

/** Le format RÉEL, d'après les premiers octets. `null` : ce n'est pas une image que nous acceptons. */
export function formatReel(octets: Uint8Array): FormatSource | null {
  const b = octets;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
  const ascii = (de: number, a: number) => String.fromCharCode(...b.subarray(de, a));
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (b.length >= 12 && ascii(4, 8) === 'ftyp' && MARQUES_HEIF.has(ascii(8, 12))) return 'heic';
  return null;
}

async function decoderHeic(octets: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  // Décodeur HEVC en WebAssembly (libheif) : chargé seulement quand une photo HEIC arrive.
  const { default: decode } = await import('heic-decode');
  const { width, height, data } = await decode({ buffer: octets });
  if (!width || !height || width * height > PIXELS_MAX) throw new ImageRefusee('trop_grande');
  return { data: Buffer.from(data.buffer, data.byteOffset, data.byteLength), width, height };
}

export async function normaliserImage(recu: ArrayBuffer | Buffer): Promise<ImageNormalisee> {
  const octets = Buffer.isBuffer(recu) ? recu : Buffer.from(recu);
  if (octets.length > TAILLE_MAX_DEPOT) throw new ImageRefusee('trop_lourde');
  const source = formatReel(octets);
  if (!source) throw new ImageRefusee('format');
  try {
    let image: Sharp;
    if (source === 'heic') {
      // libheif applique lui-même la rotation enregistrée dans le fichier : les pixels sortent à l'endroit.
      const brut = await decoderHeic(octets);
      image = sharp(brut.data, { raw: { width: brut.width, height: brut.height, channels: 4 } });
    } else {
      // `rotate()` sans argument : remet l'image à l'endroit d'après l'orientation EXIF, puis l'oublie.
      image = sharp(octets, { failOn: 'error', limitInputPixels: PIXELS_MAX }).rotate();
    }
    image = image.resize({ width: COTE_MAX, height: COTE_MAX, fit: 'inside', withoutEnlargement: true });
    // Aucune métadonnée n'est recopiée : sharp n'en écrit que si on le lui demande (withMetadata), et on ne le demande pas.
    const sortie = source === 'png' ? image.png({ compressionLevel: 9 })
      : source === 'webp' ? image.webp({ quality: 86 })
      : image.flatten({ background: '#ffffff' }).jpeg({ quality: 86, mozjpeg: true });
    const { data, info } = await sortie.toBuffer({ resolveWithObject: true });
    const type = source === 'png' ? 'image/png' : source === 'webp' ? 'image/webp' : 'image/jpeg';
    return { contenu: data, type, extension: source === 'png' ? 'png' : source === 'webp' ? 'webp' : 'jpg', source, largeur: info.width, hauteur: info.height };
  } catch (e) {
    if (e instanceof ImageRefusee) throw e;
    throw new ImageRefusee('illisible');
  }
}

/** Le message et le code HTTP à rendre pour un refus. */
export function reponseRefus(e: ImageRefusee): { message: string; status: number } {
  switch (e.motif) {
    case 'trop_lourde': return { message: 'Image trop lourde (20 Mo max).', status: 413 };
    case 'trop_grande': return { message: 'Image trop grande.', status: 413 };
    case 'format': return { message: 'Format non pris en charge (JPEG, PNG, WebP ou HEIC).', status: 415 };
    default: return { message: "Cette image n'a pas pu être lue.", status: 415 };
  }
}
