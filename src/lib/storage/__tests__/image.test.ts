import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { normaliserImage, formatReel, ImageRefusee } from '../image';

// De VRAIES images, produites par scripts/local/images-test (Pillow + libheif/x265) : une scène à
// quatre quadrants — rouge en haut à gauche, bleu en haut à droite, vert en bas à gauche, jaune
// en bas à droite — enregistrée droite, et « tournée » (téléphone tenu debout, orientation 6),
// chacune avec position GPS, modèle d'appareil, date et logiciel dans ses métadonnées.
const D = join(process.cwd(), 'scripts/local/images-test');
const lire = (n: string) => readFileSync(join(D, n));
const coin = async (b: Buffer, ou: 'hg' | 'hd' | 'bg' | 'bd') => {
  const { data, info } = await sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const x = ou[1] === 'g' ? Math.round(info.width * 0.25) : Math.round(info.width * 0.75);
  const y = ou[0] === 'h' ? Math.round(info.height * 0.25) : Math.round(info.height * 0.75);
  const i = (y * info.width + x) * 3; const [r, g, bl] = [data[i], data[i + 1], data[i + 2]];
  return r > 150 && g < 110 && bl < 110 ? 'rouge' : bl > 150 && r < 110 && g < 110 ? 'bleu' : g > 120 && r < 110 && bl < 120 ? 'vert' : r > 170 && g > 150 && bl < 120 ? 'jaune' : `?(${r},${g},${bl})`;
};
const scene = async (b: Buffer) => [await coin(b, 'hg'), await coin(b, 'hd'), await coin(b, 'bg'), await coin(b, 'bd')].join(' ');
const A_L_ENDROIT = 'rouge bleu vert jaune';

describe('une photo d’iPhone (HEIC) est convertie, pas refusée', () => {
  it('les fichiers d’essai sont de vrais HEIC (HEVC)', () => {
    expect(formatReel(lire('droite.heic'))).toBe('heic');
    expect(lire('droite.heic').subarray(4, 12).toString()).toBe('ftypheic');
  });
  it('HEIC droit → JPEG, mêmes dimensions, à l’endroit', async () => {
    const r = await normaliserImage(lire('droite.heic'));
    expect(r.type).toBe('image/jpeg'); expect(r.extension).toBe('jpg'); expect(r.source).toBe('heic');
    expect([r.largeur, r.hauteur]).toEqual([400, 300]);
    expect(formatReel(r.contenu)).toBe('jpeg');
    expect(await scene(r.contenu)).toBe(A_L_ENDROIT);
  }, 30000);
  it('HEIC pris téléphone debout → remis à l’endroit', async () => {
    const r = await normaliserImage(lire('tournee-orientation6.heic'));
    expect([r.largeur, r.hauteur]).toEqual([400, 300]);
    expect(await scene(r.contenu)).toBe(A_L_ENDROIT);
  }, 30000);
});

describe('orientation', () => {
  it('JPEG droit : inchangé', async () => expect(await scene((await normaliserImage(lire('droite.jpg'))).contenu)).toBe(A_L_ENDROIT));
  it('JPEG « orientation 6 » : remis à l’endroit, et l’étiquette d’orientation disparaît', async () => {
    const brut = lire('tournee-orientation6.jpg');
    expect((await sharp(brut).metadata()).orientation).toBe(6);
    expect(await scene(brut)).not.toBe(A_L_ENDROIT);           // tel que stocké, il est couché
    const r = await normaliserImage(brut);
    expect([r.largeur, r.hauteur]).toEqual([400, 300]);
    expect(await scene(r.contenu)).toBe(A_L_ENDROIT);
    expect((await sharp(r.contenu).metadata()).orientation).toBeUndefined();
  });
});

describe('métadonnées : rien ne sort', () => {
  it.each(['droite.jpg', 'tournee-orientation6.jpg', 'droite.heic', 'tournee-orientation6.heic'])('%s — ni GPS, ni appareil, ni date, ni logiciel', async (nom) => {
    const brut = lire(nom);
    expect(brut.includes(Buffer.from('iPhone de test'))).toBe(true);        // (contrôle) l'original les porte bien
    expect(brut.includes(Buffer.from('MARQUEUR-LOGICIEL'))).toBe(true);
    const r = await normaliserImage(brut);
    const m = await sharp(r.contenu).metadata();
    expect(m.exif).toBeUndefined(); expect(m.xmp).toBeUndefined(); expect(m.iptc).toBeUndefined();
    for (const marque of ['iPhone de test', 'Apple', 'MARQUEUR-LOGICIEL', 'MARQUEUR-OBJECTIF', '2026:11:18', 'Exif', 'GPS'])
      expect(r.contenu.includes(Buffer.from(marque))).toBe(false);
  }, 30000);
});

describe('formats', () => {
  it('PNG reste PNG, WebP reste WebP', async () => {
    expect((await normaliserImage(lire('droite.png'))).type).toBe('image/png');
    expect((await normaliserImage(lire('droite.webp'))).type).toBe('image/webp');
  });
  it('le format vient des octets, pas du nom : un SVG nommé .jpg est refusé', async () =>
    await expect(normaliserImage(lire('script-deguise.jpg'))).rejects.toMatchObject({ motif: 'format' }));
  it('un faux HEIC (bonne signature, contenu quelconque) est refusé, sans planter', async () =>
    await expect(normaliserImage(lire('faux.heic'))).rejects.toBeInstanceOf(ImageRefusee), 30000);
  it('GIF, PDF, vide : refusés', async () => {
    for (const b of [Buffer.from('GIF89a....'), Buffer.from('%PDF-1.7'), Buffer.alloc(0)]) await expect(normaliserImage(b)).rejects.toMatchObject({ motif: 'format' });
  });
  it('une grande image est ramenée à 2048 px au plus', async () => {
    const grande = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#888' } }).jpeg().toBuffer();
    const r = await normaliserImage(grande);
    expect(Math.max(r.largeur, r.hauteur)).toBe(2048);
  });
  it('au-delà de 20 Mo : refusée avant tout décodage', async () =>
    await expect(normaliserImage(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(20 * 1024 * 1024 + 1)]))).rejects.toMatchObject({ motif: 'trop_lourde' }));
});
