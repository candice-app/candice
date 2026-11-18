#!/usr/bin/env python3
"""Fabrique les images d'essai — de VRAIS fichiers, dont de vrais HEIC (HEVC, encodeur x265).

    pip install pillow pillow-heif piexif
    python3 scripts/local/images-test/fabriquer.py

La scène : quatre quadrants — rouge en haut à gauche, bleu en haut à droite, vert en bas à
gauche, jaune en bas à droite. Chaque photo porte une position GPS, un modèle d'appareil, une
date et deux marqueurs, pour vérifier qu'aucune métadonnée ne survit au dépôt.
« tournee-orientation6 » est ce qu'un téléphone tenu debout enregistre : l'image couchée, et
l'ordre de la redresser.
"""
import os
from PIL import Image, ImageDraw
import pillow_heif, piexif

pillow_heif.register_heif_opener()
os.chdir(os.path.dirname(os.path.abspath(__file__)))
W, H = 400, 300
scene = Image.new('RGB', (W, H)); d = ImageDraw.Draw(scene)
d.rectangle([0, 0, W // 2, H // 2], fill=(220, 30, 30)); d.rectangle([W // 2, 0, W, H // 2], fill=(30, 30, 220))
d.rectangle([0, H // 2, W // 2, H], fill=(30, 170, 60)); d.rectangle([W // 2, H // 2, W, H], fill=(230, 210, 40))

def exif(orientation):
    gps = {piexif.GPSIFD.GPSLatitudeRef: b'N', piexif.GPSIFD.GPSLatitude: ((44, 1), (50, 1), (1600, 100)),
           piexif.GPSIFD.GPSLongitudeRef: b'W', piexif.GPSIFD.GPSLongitude: ((0, 1), (34, 1), (4500, 100))}
    zeroth = {piexif.ImageIFD.Make: b'Apple', piexif.ImageIFD.Model: b'iPhone de test', piexif.ImageIFD.Orientation: orientation, piexif.ImageIFD.Software: b'MARQUEUR-LOGICIEL'}
    return piexif.dump({'0th': zeroth, 'Exif': {piexif.ExifIFD.DateTimeOriginal: b'2026:11:18 12:00:00', piexif.ExifIFD.LensModel: b'MARQUEUR-OBJECTIF'}, 'GPS': gps})

couchee = scene.rotate(90, expand=True)
scene.save('droite.jpg', quality=92, exif=exif(1)); couchee.save('tournee-orientation6.jpg', quality=92, exif=exif(6))
scene.save('droite.heic', quality=90, exif=exif(1)); couchee.save('tournee-orientation6.heic', quality=90, exif=exif(6))
scene.save('droite.png'); scene.save('droite.webp', quality=90)
open('faux.heic', 'wb').write(b'\x00\x00\x00\x18ftypheic' + b'ceci n est pas une image' * 20)
open('script-deguise.jpg', 'wb').write(b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
